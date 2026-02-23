/**
 * AgentBox - API Server
 * HTTP API for the frontend to interact with user agent workspaces.
 * 
 * Endpoints:
 *   POST /api/users/:userId/provision     - Provision a new user container
 *   DELETE /api/users/:userId              - Teardown user container
 *   
 *   GET  /api/agents/:agentId/files       - List files in agent workspace
 *   GET  /api/agents/:agentId/files/*path  - Read a file
 *   PUT  /api/agents/:agentId/files/*path  - Write a file  
 *   DELETE /api/agents/:agentId/files/*path - Delete a file
 *   
 *   POST /api/agents/:agentId/chat        - Send a message to the agent
 *   GET  /api/agents/:agentId/status       - Get agent status
 *
 * Auth: Bearer token in Authorization header
 * CORS: Configured for agentbox frontend origins
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const crypto = require('crypto');

// --- Config ---
const PORT = parseInt(process.env.API_PORT || '3100');
const API_TOKEN = process.env.API_TOKEN || crypto.randomBytes(32).toString('hex');
const DATA_ROOT = process.env.DATA_ROOT || '/data';
const USERS_DIR = path.join(DATA_ROOT, 'users');
const ALLOWED_ORIGINS = [
  'https://agentbox.pixel-drop.com',
  'https://agentbox.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

// --- Helpers ---

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function setCORS(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return false;
  return auth.slice(7) === API_TOKEN;
}

// Resolve agent workspace path safely (prevent path traversal)
function resolveAgentPath(agentId, filePath) {
  const safeAgentId = agentId.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Try multiple workspace locations in priority order
  const candidateDirs = [
    path.join(USERS_DIR, safeAgentId, 'workspace'),
    path.join('/root', 'clawd-' + safeAgentId),
    path.join('/root/agentbox-workspace', safeAgentId),
  ];
  
  let baseDir = candidateDirs[0];
  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      baseDir = dir;
      break;
    }
  }
  
  if (!filePath) return baseDir;
  
  const safePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, '');
  const resolved = path.join(baseDir, safePath);
  
  if (!resolved.startsWith(baseDir)) {
    return null;
  }
  return resolved;
}

// --- Route handlers ---

async function handleListFiles(req, res, agentId, prefix) {
  const baseDir = resolveAgentPath(agentId, '');
  if (!baseDir) return sendError(res, 400, 'Invalid agent ID');
  
  if (!fs.existsSync(baseDir)) {
    return sendJSON(res, 200, { files: [] });
  }
  
  const files = [];
  
  function scanDir(dir, relativeBase) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const relativePath = path.join(relativeBase, entry.name);
        if (prefix && !relativePath.startsWith(prefix)) continue;
        
        if (entry.isFile()) {
          const stat = fs.statSync(path.join(dir, entry.name));
          files.push({
            name: entry.name,
            path: relativePath,
            size: stat.size,
            updated_at: stat.mtime.toISOString(),
          });
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
          scanDir(path.join(dir, entry.name), relativePath);
        }
      }
    } catch (e) {
      // Directory not readable
    }
  }
  
  scanDir(baseDir, '');
  
  // Special case: when looking for skills/ but none found,
  // also scan root-level directories for SKILL.md files.
  // Agents often create skills at workspace root (e.g. text-analyzer/SKILL.md)
  // instead of skills/text-analyzer/SKILL.md
  if (prefix === 'skills/' && files.length === 0) {
    try {
      const rootEntries = fs.readdirSync(baseDir, { withFileTypes: true });
      for (const entry of rootEntries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && 
            !["memory", "node_modules", ".git"].includes(entry.name)) {
          const skillMd = path.join(baseDir, entry.name, 'SKILL.md');
          if (fs.existsSync(skillMd)) {
            const stat = fs.statSync(skillMd);
            files.push({
              name: 'SKILL.md',
              path: 'skills/' + entry.name + '/SKILL.md',
              size: stat.size,
              updated_at: stat.mtime.toISOString(),
              _realPath: entry.name + '/SKILL.md',
            });
          }
        }
      }
    } catch (e) {
      // Non-critical
    }
  }
  
  sendJSON(res, 200, { files });
}

async function handleReadFile(req, res, agentId, filePath) {
  let resolved = resolveAgentPath(agentId, filePath);
  if (!resolved) return sendError(res, 400, 'Invalid path');
  
  // If file not found and path starts with skills/, try without the skills/ prefix
  // (agents often write skills at workspace root instead of skills/ subdirectory)
  if (!fs.existsSync(resolved) && filePath.startsWith('skills/')) {
    const altPath = filePath.replace(/^skills\//, '');
    const altResolved = resolveAgentPath(agentId, altPath);
    if (altResolved && fs.existsSync(altResolved)) {
      resolved = altResolved;
    }
  }
  
  if (!fs.existsSync(resolved)) {
    return sendError(res, 404, 'File not found');
  }
  
  try {
    const content = fs.readFileSync(resolved, 'utf-8');
    const stat = fs.statSync(resolved);
    sendJSON(res, 200, { 
      path: filePath, 
      content,
      size: stat.size,
      updated_at: stat.mtime.toISOString(),
    });
  } catch (e) {
    sendError(res, 500, `Failed to read file: ${e.message}`);
  }
}

async function handleWriteFile(req, res, agentId, filePath) {
  const resolved = resolveAgentPath(agentId, filePath);
  if (!resolved) return sendError(res, 400, 'Invalid path');
  
  const body = await parseBody(req);
  if (typeof body.content !== 'string') {
    return sendError(res, 400, 'Missing "content" in body');
  }
  
  try {
    const dir = path.dirname(resolved);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolved, body.content, 'utf-8');
    sendJSON(res, 200, { path: filePath, size: body.content.length, ok: true });
  } catch (e) {
    sendError(res, 500, `Failed to write file: ${e.message}`);
  }
}

async function handleDeleteFile(req, res, agentId, filePath) {
  const resolved = resolveAgentPath(agentId, filePath);
  if (!resolved) return sendError(res, 400, 'Invalid path');
  
  if (!fs.existsSync(resolved)) {
    return sendError(res, 404, 'File not found');
  }
  
  try {
    fs.unlinkSync(resolved);
    sendJSON(res, 200, { ok: true });
  } catch (e) {
    sendError(res, 500, `Failed to delete file: ${e.message}`);
  }
}

async function handleProvisionUser(req, res, userId) {
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  const userDir = path.join(USERS_DIR, safeUserId, 'workspace');
  
  try {
    // Create workspace directory structure
    fs.mkdirSync(userDir, { recursive: true });
    fs.mkdirSync(path.join(userDir, 'memory'), { recursive: true });
    fs.mkdirSync(path.join(userDir, 'skills'), { recursive: true });
    
    log(`Provisioned user workspace: ${safeUserId}`);
    sendJSON(res, 200, { ok: true, userId: safeUserId, workspace: userDir });
  } catch (e) {
    sendError(res, 500, `Failed to provision: ${e.message}`);
  }
}

async function handleAgentStatus(req, res, agentId) {
  const baseDir = resolveAgentPath(agentId, '');
  const exists = baseDir && fs.existsSync(baseDir);
  
  sendJSON(res, 200, {
    agentId,
    provisioned: exists,
    workspace: baseDir,
    files: exists ? fs.readdirSync(baseDir).length : 0,
  });
}

// --- Router ---

async function handleRequest(req, res) {
  setCORS(req, res);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // Health check (no auth needed)
  if (pathname === '/health') {
    return sendJSON(res, 200, { status: 'ok', uptime: process.uptime() });
  }
  
  // Auth check for all /api routes
  if (pathname.startsWith('/api/')) {
    if (!checkAuth(req)) {
      return sendError(res, 401, 'Unauthorized');
    }
  }
  
  try {
    // POST /api/users/:userId/provision
    const provisionMatch = pathname.match(/^\/api\/users\/([^/]+)\/provision$/);
    if (provisionMatch && req.method === 'POST') {
      return await handleProvisionUser(req, res, provisionMatch[1]);
    }
    
    // GET /api/agents/:agentId/status
    const statusMatch = pathname.match(/^\/api\/agents\/([^/]+)\/status$/);
    if (statusMatch && req.method === 'GET') {
      return await handleAgentStatus(req, res, statusMatch[1]);
    }
    
    // GET /api/agents/:agentId/files (list)
    const listMatch = pathname.match(/^\/api\/agents\/([^/]+)\/files$/);
    if (listMatch && req.method === 'GET') {
      const prefix = url.searchParams.get('prefix') || '';
      return await handleListFiles(req, res, listMatch[1], prefix);
    }
    
    // GET/PUT/DELETE /api/agents/:agentId/files/{path}
    const fileMatch = pathname.match(/^\/api\/agents\/([^/]+)\/files\/(.+)$/);
    if (fileMatch) {
      const [, agentId, filePath] = fileMatch;
      
      if (req.method === 'GET') {
        return await handleReadFile(req, res, agentId, decodeURIComponent(filePath));
      }
      if (req.method === 'PUT') {
        return await handleWriteFile(req, res, agentId, decodeURIComponent(filePath));
      }
      if (req.method === 'DELETE') {
        return await handleDeleteFile(req, res, agentId, decodeURIComponent(filePath));
      }
    }
    
    sendError(res, 404, 'Not found');
  } catch (e) {
    log(`Error: ${e.message}`);
    sendError(res, 500, e.message);
  }
}

// --- Start server ---

const server = http.createServer(handleRequest);

server.listen(PORT, '0.0.0.0', () => {
  log(`AgentBox API Server running on port ${PORT}`);
  log(`API Token: ${API_TOKEN.slice(0, 8)}...`);
  log(`Data root: ${DATA_ROOT}`);
  log(`CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
