/**
 * AgentBox API Server
 * 
 * Provides:
 * 1. /api/files/* - File operations per user workspace
 * 2. /api/sandbox/run - Code execution in sandboxed environment
 * 3. /api/workspace/* - Workspace management
 * 4. /api/credentials/* - User credentials management (encrypted)
 * 
 * Auth: Supabase JWT verification on all endpoints
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const execAsync = promisify(exec);

// ============================================================
// Config
// ============================================================
const PORT = parseInt(process.env.AGENTBOX_API_PORT || '18790');
const USERS_BASE = process.env.AGENTBOX_USERS_BASE || '/home/agentbox/users';
const SANDBOX_TMP = '/home/agentbox/sandbox-tmp';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_EXEC_TIME = 30_000; // 30s
const ALLOWED_ORIGINS = [
  'https://agentbox-deploy.vercel.app',
  'https://agentbox.pixel-drop.com',
  'http://localhost:3000',
];

// Supabase for JWT verification
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dzjpcbyozghefwzurgta.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || '';

// Gateway token for internal calls (from Clawdbot gateway)
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || 'FiqqVnVF--ZU7Ubej663Xzjh4uuu0YMqwF12-z_xWSM';

// Encryption for credentials
const CRED_ENCRYPTION_KEY = process.env.CRED_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

const supabase = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// ============================================================
// Auth middleware
// ============================================================

/**
 * Verify the request's auth and return the user_id.
 * Supports:
 *   - Bearer <supabase_jwt> (from frontend)
 *   - Bearer <gateway_token> + X-User-Id header (from gateway/agent)
 */
async function authenticateRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  
  if (!token) {
    return { error: 'Missing authorization header', status: 401 };
  }

  // Check if it's the gateway internal token
  if (token === GATEWAY_TOKEN) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return { error: 'X-User-Id required for gateway auth', status: 400 };
    }
    return { userId };
  }

  // Otherwise, verify Supabase JWT
  if (!supabase) {
    return { error: 'Supabase not configured', status: 500 };
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { error: 'Invalid token', status: 401 };
    }
    return { userId: user.id };
  } catch (err) {
    return { error: 'Auth verification failed', status: 401 };
  }
}

// ============================================================
// User workspace helpers
// ============================================================

function getUserWorkspace(userId) {
  // Sanitize userId (should be a UUID)
  const safeId = userId.replace(/[^a-zA-Z0-9-]/g, '');
  return path.join(USERS_BASE, safeId);
}

function ensureUserWorkspace(userId) {
  const workspace = getUserWorkspace(userId);
  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace, { recursive: true });
    // Create default structure
    fs.mkdirSync(path.join(workspace, 'files'), { recursive: true });
    fs.mkdirSync(path.join(workspace, 'code'), { recursive: true });
    fs.mkdirSync(path.join(workspace, 'output'), { recursive: true });
    fs.mkdirSync(path.join(workspace, '.credentials'), { recursive: true, mode: 0o700 });
    
    // Default readme
    fs.writeFileSync(path.join(workspace, 'README.md'), 
      `# Your AgentBox Workspace\n\nThis is your private workspace. Your agent can read/write files here.\n\n- \`files/\` - Your uploaded files\n- \`code/\` - Code projects\n- \`output/\` - Agent-generated outputs\n`
    );
  }
  return workspace;
}

/**
 * Resolve a relative path within the workspace, preventing path traversal
 */
function resolveWorkspacePath(workspace, relativePath) {
  const resolved = path.resolve(workspace, relativePath || '');
  if (!resolved.startsWith(workspace)) {
    return null; // Path traversal attempt
  }
  return resolved;
}

// ============================================================
// Encryption helpers for credentials
// ============================================================

function encrypt(text) {
  const keyBuf = Buffer.from(CRED_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuf, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encrypted) {
  const keyBuf = Buffer.from(CRED_ENCRYPTION_KEY, 'hex');
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ============================================================
// Request body parser
// ============================================================

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_FILE_SIZE) {
        reject(new Error('Request body too large'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({ _raw: body });
      }
    });
    req.on('error', reject);
  });
}

// ============================================================
// CORS
// ============================================================

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function error(res, message, status = 400) {
  json(res, { ok: false, error: message }, status);
}

// ============================================================
// Route: FILES
// ============================================================

async function handleFiles(req, res, userId, subPath) {
  const workspace = ensureUserWorkspace(userId);

  if (req.method === 'GET') {
    // GET /api/files?path=xxx - Read file or list directory
    const url = new URL(req.url, `http://${req.headers.host}`);
    const filePath = url.searchParams.get('path') || subPath || '';
    const resolved = resolveWorkspacePath(workspace, filePath);
    
    if (!resolved) {
      return error(res, 'Invalid path', 403);
    }

    if (!fs.existsSync(resolved)) {
      return error(res, 'Not found', 404);
    }

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      // List directory
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const files = entries.map(e => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
        size: e.isFile() ? fs.statSync(path.join(resolved, e.name)).size : undefined,
        modified: fs.statSync(path.join(resolved, e.name)).mtime.toISOString(),
      }));
      return json(res, { ok: true, path: filePath || '/', files });
    } else {
      // Read file
      const content = fs.readFileSync(resolved, 'utf-8');
      return json(res, { 
        ok: true, 
        path: filePath, 
        content,
        size: stat.size,
        modified: stat.mtime.toISOString(),
      });
    }
  }

  if (req.method === 'PUT') {
    // PUT /api/files - Write file
    const body = await parseBody(req);
    const filePath = body.path;
    if (!filePath) {
      return error(res, 'path is required');
    }
    const resolved = resolveWorkspacePath(workspace, filePath);
    if (!resolved) {
      return error(res, 'Invalid path', 403);
    }

    // Create parent directories
    const dir = path.dirname(resolved);
    fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(resolved, body.content || '');
    return json(res, { ok: true, path: filePath, size: (body.content || '').length });
  }

  if (req.method === 'DELETE') {
    const body = await parseBody(req);
    const filePath = body.path;
    if (!filePath) {
      return error(res, 'path is required');
    }
    const resolved = resolveWorkspacePath(workspace, filePath);
    if (!resolved) {
      return error(res, 'Invalid path', 403);
    }
    if (!fs.existsSync(resolved)) {
      return error(res, 'Not found', 404);
    }

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      fs.rmSync(resolved, { recursive: true });
    } else {
      fs.unlinkSync(resolved);
    }
    return json(res, { ok: true, deleted: filePath });
  }

  error(res, 'Method not allowed', 405);
}

// ============================================================
// Route: DOWNLOAD (public files via token)
// ============================================================

async function handleDownload(req, res, pathParts) {
  // /api/download/:userId/:filePath... ?token=xxx
  // Token is a signed short-lived URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return error(res, 'Token required', 401);
  }

  try {
    // Verify download token (simple HMAC-based)
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token');
    
    const [payloadB64, expB64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', CRED_ENCRYPTION_KEY)
      .update(payloadB64 + '.' + expB64)
      .digest('hex')
      .slice(0, 16);
    
    if (sig !== expectedSig) throw new Error('Invalid signature');
    
    const expiry = parseInt(Buffer.from(expB64, 'base64url').toString());
    if (Date.now() > expiry) throw new Error('Token expired');
    
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const { userId, filePath } = payload;
    
    const workspace = getUserWorkspace(userId);
    const resolved = resolveWorkspacePath(workspace, filePath);
    
    if (!resolved || !fs.existsSync(resolved)) {
      return error(res, 'File not found', 404);
    }

    const stat = fs.statSync(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.py': 'text/x-python',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.csv': 'text/csv',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const fileName = path.basename(resolved);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Cache-Control': 'private, max-age=3600',
    });

    const stream = fs.createReadStream(resolved);
    stream.pipe(res);
  } catch (err) {
    error(res, err.message || 'Invalid token', 401);
  }
}

/**
 * Generate a signed download URL for a file
 */
function generateDownloadUrl(userId, filePath, expiresInMs = 3600_000) {
  const payload = Buffer.from(JSON.stringify({ userId, filePath })).toString('base64url');
  const expiry = Buffer.from(String(Date.now() + expiresInMs)).toString('base64url');
  const sig = crypto.createHmac('sha256', CRED_ENCRYPTION_KEY)
    .update(payload + '.' + expiry)
    .digest('hex')
    .slice(0, 16);
  
  const token = `${payload}.${expiry}.${sig}`;
  return `https://gateway.pixel-drop.com/files/download?token=${token}`;
}

// ============================================================
// Route: SANDBOX (code execution)
// ============================================================

async function handleSandbox(req, res, userId) {
  if (req.method !== 'POST') {
    return error(res, 'POST required', 405);
  }

  const body = await parseBody(req);
  const { language, code, filename } = body;

  if (!language || !code) {
    return error(res, 'language and code are required');
  }

  const supported = ['python', 'javascript', 'nodejs', 'bash', 'sh'];
  if (!supported.includes(language.toLowerCase())) {
    return error(res, `Unsupported language: ${language}. Supported: ${supported.join(', ')}`);
  }

  const workspace = ensureUserWorkspace(userId);
  const execId = crypto.randomUUID();
  const sandboxDir = path.join(SANDBOX_TMP, execId);
  fs.mkdirSync(sandboxDir, { recursive: true });

  // Write code to a temp file
  const lang = language.toLowerCase();
  let ext, cmd;
  switch (lang) {
    case 'python':
      ext = '.py';
      cmd = 'python3';
      break;
    case 'javascript':
    case 'nodejs':
      ext = '.js';
      cmd = 'node';
      break;
    case 'bash':
    case 'sh':
      ext = '.sh';
      cmd = 'bash';
      break;
  }

  const codeFile = path.join(sandboxDir, `main${ext}`);
  fs.writeFileSync(codeFile, code);

  // If user has files, create a symlink to their workspace
  const userFilesLink = path.join(sandboxDir, 'workspace');
  try {
    fs.symlinkSync(workspace, userFilesLink);
  } catch {}

  try {
    // Run in firejail sandbox
    const firejailCmd = [
      'firejail',
      '--noprofile',
      '--quiet',
      '--noroot',
      '--nosound',
      '--no3d',
      '--nodvd',
      '--notv',
      '--novideo',
      `--whitelist=${sandboxDir}`,
      `--whitelist=${workspace}`,
      '--net=none',                    // No network access
      `--rlimit-as=1073741824`,         // 1GB RAM limit (V8 needs ~700MB)
      `--timeout=00:00:30`,            // 30s timeout
      cmd,
      codeFile,
    ];

    const result = await new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      
      const proc = spawn(firejailCmd[0], firejailCmd.slice(1), {
        cwd: sandboxDir,
        timeout: MAX_EXEC_TIME,
        env: {
          HOME: sandboxDir,
          PATH: '/usr/local/bin:/usr/bin:/bin',
          WORKSPACE: workspace,
        },
      });

      proc.stdout.on('data', d => { stdout += d; if (stdout.length > 100_000) proc.kill(); });
      proc.stderr.on('data', d => { stderr += d; if (stderr.length > 100_000) proc.kill(); });

      proc.on('close', (exitCode) => {
        resolve({ stdout, stderr, exitCode });
      });

      proc.on('error', (err) => {
        resolve({ stdout, stderr: err.message, exitCode: -1 });
      });
    });

    // Check if code generated output files
    const outputFiles = [];
    const outputDir = path.join(workspace, 'output');
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      for (const f of files) {
        const fstat = fs.statSync(path.join(outputDir, f));
        if (fstat.mtime.getTime() > Date.now() - 60_000) { // Created in last 60s
          outputFiles.push({
            name: f,
            size: fstat.size,
            downloadUrl: generateDownloadUrl(userId, `output/${f}`),
          });
        }
      }
    }

    // Also check sandbox dir for generated files
    const sandboxFiles = fs.readdirSync(sandboxDir).filter(f => f !== `main${ext}` && f !== 'workspace');
    for (const f of sandboxFiles) {
      const fpath = path.join(sandboxDir, f);
      const fstat = fs.statSync(fpath);
      if (fstat.isFile() && fstat.size > 0) {
        // Copy to user output
        const outPath = path.join(workspace, 'output', f);
        fs.copyFileSync(fpath, outPath);
        outputFiles.push({
          name: f,
          size: fstat.size,
          downloadUrl: generateDownloadUrl(userId, `output/${f}`),
        });
      }
    }

    // Cleanup sandbox temp
    fs.rmSync(sandboxDir, { recursive: true, force: true });

    return json(res, {
      ok: true,
      execId,
      stdout: result.stdout.slice(0, 50_000),
      stderr: result.stderr.slice(0, 50_000),
      exitCode: result.exitCode,
      outputFiles,
    });

  } catch (err) {
    // Cleanup on error
    fs.rmSync(sandboxDir, { recursive: true, force: true });
    return error(res, `Execution failed: ${err.message}`, 500);
  }
}

// ============================================================
// Route: CREDENTIALS
// ============================================================

async function handleCredentials(req, res, userId) {
  const workspace = ensureUserWorkspace(userId);
  const credFile = path.join(workspace, '.credentials', 'credentials.json');

  // Ensure credentials file exists
  if (!fs.existsSync(credFile)) {
    fs.writeFileSync(credFile, JSON.stringify({}), { mode: 0o600 });
  }

  if (req.method === 'GET') {
    // Return credential keys (not values) for display
    try {
      const raw = fs.readFileSync(credFile, 'utf-8');
      const creds = JSON.parse(raw);
      const masked = {};
      for (const [key, val] of Object.entries(creds)) {
        const meta = typeof val === 'object' && val !== null ? val : {};
        masked[key] = {
          type: meta.type || 'unknown',
          set: true,
          updatedAt: meta.updatedAt || null,
        };
      }
      return json(res, { ok: true, credentials: masked });
    } catch {
      return json(res, { ok: true, credentials: {} });
    }
  }

  if (req.method === 'PUT') {
    // Set a credential
    const body = await parseBody(req);
    const { key, value, type } = body;
    
    if (!key || !value) {
      return error(res, 'key and value are required');
    }

    try {
      const raw = fs.readFileSync(credFile, 'utf-8');
      const creds = JSON.parse(raw);
      creds[key] = {
        type: type || 'api_key',
        value: encrypt(value),
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(credFile, JSON.stringify(creds, null, 2), { mode: 0o600 });
      return json(res, { ok: true, key, type: type || 'api_key' });
    } catch (err) {
      return error(res, `Failed to save: ${err.message}`, 500);
    }
  }

  if (req.method === 'DELETE') {
    const body = await parseBody(req);
    const { key } = body;
    
    if (!key) {
      return error(res, 'key is required');
    }

    try {
      const raw = fs.readFileSync(credFile, 'utf-8');
      const creds = JSON.parse(raw);
      delete creds[key];
      fs.writeFileSync(credFile, JSON.stringify(creds, null, 2), { mode: 0o600 });
      return json(res, { ok: true, deleted: key });
    } catch (err) {
      return error(res, `Failed to delete: ${err.message}`, 500);
    }
  }

  error(res, 'Method not allowed', 405);
}

/**
 * Get a decrypted credential value (for internal use by agents)
 */
async function handleCredentialGet(req, res, userId) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const key = url.searchParams.get('key');
  
  if (!key) {
    return error(res, 'key query param required');
  }

  // Only gateway token can read actual values
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token !== GATEWAY_TOKEN) {
    return error(res, 'Only internal gateway calls can read credential values', 403);
  }

  const workspace = getUserWorkspace(userId);
  const credFile = path.join(workspace, '.credentials', 'credentials.json');
  
  if (!fs.existsSync(credFile)) {
    return error(res, 'No credentials configured', 404);
  }

  try {
    const raw = fs.readFileSync(credFile, 'utf-8');
    const creds = JSON.parse(raw);
    const cred = creds[key];
    
    if (!cred) {
      return error(res, `Credential '${key}' not found`, 404);
    }

    const decrypted = decrypt(cred.value);
    return json(res, { ok: true, key, value: decrypted, type: cred.type });
  } catch (err) {
    return error(res, `Failed to read credential: ${err.message}`, 500);
  }
}

// ============================================================
// Route: WORKSPACE INFO
// ============================================================

async function handleWorkspaceInfo(req, res, userId) {
  const workspace = ensureUserWorkspace(userId);
  
  // Calculate total size
  let totalSize = 0;
  let fileCount = 0;
  
  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.name === '.credentials') continue; // skip counting credentials
        if (entry.isDirectory()) {
          walkDir(full);
        } else {
          totalSize += fs.statSync(full).size;
          fileCount++;
        }
      }
    } catch {}
  }
  
  walkDir(workspace);

  return json(res, {
    ok: true,
    workspace: {
      userId,
      path: workspace,
      totalSize,
      fileCount,
      maxSize: 500 * 1024 * 1024, // 500MB per user
      createdAt: fs.statSync(workspace).birthtime.toISOString(),
    },
  });
}

// ============================================================
// Route: GENERATE DOWNLOAD URL (for chat integration)
// ============================================================

async function handleGenerateDownloadUrl(req, res, userId) {
  if (req.method !== 'POST') return error(res, 'POST required', 405);
  
  const body = await parseBody(req);
  const { filePath, expiresInMs } = body;
  
  if (!filePath) return error(res, 'filePath required');
  
  const workspace = getUserWorkspace(userId);
  const resolved = resolveWorkspacePath(workspace, filePath);
  
  if (!resolved || !fs.existsSync(resolved)) {
    return error(res, 'File not found', 404);
  }
  
  const url = generateDownloadUrl(userId, filePath, expiresInMs || 3600_000);
  return json(res, { ok: true, url, expiresAt: new Date(Date.now() + (expiresInMs || 3600_000)).toISOString() });
}

// ============================================================
// Main Router
// ============================================================

const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Health check (no auth)
  if (pathname === '/api/health') {
    return json(res, { ok: true, service: 'agentbox-api', uptime: process.uptime() });
  }

  // Download endpoint (auth via token in query string)
  if (pathname === '/api/download' || pathname.startsWith('/api/download/')) {
    return handleDownload(req, res, pathname.split('/').slice(3));
  }

  // All other routes require auth
  const auth = await authenticateRequest(req);
  if (auth.error) {
    return error(res, auth.error, auth.status);
  }
  const userId = auth.userId;

  // Route matching
  if (pathname === '/api/files' || pathname.startsWith('/api/files/')) {
    const subPath = pathname.replace('/api/files', '').replace(/^\//, '');
    return handleFiles(req, res, userId, subPath);
  }

  if (pathname === '/api/sandbox/run') {
    return handleSandbox(req, res, userId);
  }

  if (pathname === '/api/credentials') {
    return handleCredentials(req, res, userId);
  }

  if (pathname === '/api/credentials/get') {
    return handleCredentialGet(req, res, userId);
  }

  if (pathname === '/api/workspace') {
    return handleWorkspaceInfo(req, res, userId);
  }

  if (pathname === '/api/download-url') {
    return handleGenerateDownloadUrl(req, res, userId);
  }

  error(res, 'Not found', 404);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[agentbox-api] Listening on 127.0.0.1:${PORT}`);
  console.log(`[agentbox-api] Users base: ${USERS_BASE}`);
  console.log(`[agentbox-api] Sandbox tmp: ${SANDBOX_TMP}`);
});
