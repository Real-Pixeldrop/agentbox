/**
 * AgentBox - Internal Message Broker
 * Handles inter-agent communication within the same user's scope.
 *
 * Endpoint: POST /internal/message
 * Body: { fromAgent, toAgent, userId, message }
 *
 * Security:
 *   - fromAgent and toAgent MUST belong to the same userId
 *   - Cross-user communication is FORBIDDEN
 *   - All messages are logged (hash only) to audit
 *
 * Usage:
 *   Can be mounted as Express middleware or run standalone:
 *   node message-broker.js              # standalone on port 18793
 *   require('./message-broker').router   # as Express router
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// --- Config ---
const PORT = parseInt(process.env.BROKER_PORT || '18793');
const DATA_ROOT = process.env.DATA_ROOT || '/data';
const AUDIT_DIR = path.join(DATA_ROOT, 'audit');
const USERS_DIR = path.join(DATA_ROOT, 'users');

// In-memory agent registry: { userId: { agentId: callback } }
const agentRegistry = new Map();

// --- Helpers ---

function hashMessage(msg) {
  return crypto.createHash('sha256').update(JSON.stringify(msg)).digest('hex').slice(0, 16);
}

function writeAuditLog(userId, entry) {
  const dir = path.join(AUDIT_DIR, userId);
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(dir, `audit-${date}.jsonl`);

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(file, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error(`[audit] Failed to write: ${err.message}`);
  }
}

function getAgentsForUser(userId) {
  // Check which agents exist for this user based on container labels or config
  const userDir = path.join(USERS_DIR, userId);
  if (!fs.existsSync(userDir)) return [];

  // Read agent list from user config or scan directories
  const configPath = path.join(userDir, 'config', 'agents.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.agents || ['main'];
    } catch {
      return ['main'];
    }
  }
  return ['main'];
}

function validateRequest(body) {
  const { fromAgent, toAgent, userId, message } = body;

  if (!fromAgent || typeof fromAgent !== 'string') {
    return { ok: false, error: 'Missing or invalid fromAgent' };
  }
  if (!toAgent || typeof toAgent !== 'string') {
    return { ok: false, error: 'Missing or invalid toAgent' };
  }
  if (!userId || typeof userId !== 'string') {
    return { ok: false, error: 'Missing or invalid userId' };
  }
  if (!message || typeof message !== 'string') {
    return { ok: false, error: 'Missing or invalid message' };
  }
  if (fromAgent === toAgent) {
    return { ok: false, error: 'Agent cannot message itself' };
  }

  // Sanitize userId
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return { ok: false, error: 'Invalid userId format' };
  }

  // Verify both agents belong to the same user
  const userAgents = getAgentsForUser(userId);
  if (!userAgents.includes(fromAgent)) {
    return { ok: false, error: `Agent '${fromAgent}' not found for user '${userId}'` };
  }
  if (!userAgents.includes(toAgent)) {
    return { ok: false, error: `Agent '${toAgent}' not found for user '${userId}'` };
  }

  return { ok: true };
}

// --- Message Queue (per agent) ---
// Simple in-memory queue with file persistence for durability

const messageQueues = new Map(); // userId:agentId -> [{...}]

function getQueueKey(userId, agentId) {
  return `${userId}:${agentId}`;
}

function enqueueMessage(userId, toAgent, envelope) {
  const key = getQueueKey(userId, toAgent);
  if (!messageQueues.has(key)) {
    messageQueues.set(key, []);
  }
  messageQueues.get(key).push(envelope);

  // Persist to disk for durability
  const queueDir = path.join(DATA_ROOT, 'queues', userId);
  fs.mkdirSync(queueDir, { recursive: true });
  const queueFile = path.join(queueDir, `${toAgent}.jsonl`);
  fs.appendFileSync(queueFile, JSON.stringify(envelope) + '\n');
}

function dequeueMessages(userId, agentId, limit = 50) {
  const key = getQueueKey(userId, agentId);
  const queue = messageQueues.get(key) || [];
  const messages = queue.splice(0, limit);

  // Clear persisted queue if empty
  if (queue.length === 0) {
    const queueFile = path.join(DATA_ROOT, 'queues', userId, `${agentId}.jsonl`);
    try { fs.writeFileSync(queueFile, ''); } catch {}
  }

  return messages;
}

// --- HTTP Handler ---

function handleRequest(req, res) {
  // CORS headers for internal use
  res.setHeader('Content-Type', 'application/json');

  // POST /internal/message - Send a message between agents
  if (req.method === 'POST' && req.url === '/internal/message') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const validation = validateRequest(data);

        if (!validation.ok) {
          // Log unauthorized attempts
          if (data.userId) {
            writeAuditLog(data.userId, {
              ts: Math.floor(Date.now() / 1000),
              userId: data.userId,
              agentId: data.fromAgent || 'unknown',
              action: 'message.rejected',
              meta: { reason: validation.error, toAgent: data.toAgent }
            });
          }
          res.writeHead(400);
          res.end(JSON.stringify({ error: validation.error }));
          return;
        }

        const { fromAgent, toAgent, userId, message } = data;
        const msgHash = hashMessage(message);
        const timestamp = Math.floor(Date.now() / 1000);

        const envelope = {
          id: crypto.randomUUID(),
          fromAgent,
          toAgent,
          userId,
          messageHash: msgHash,
          timestamp,
          delivered: false
        };

        // Enqueue for the target agent
        enqueueMessage(userId, toAgent, {
          ...envelope,
          message // Include actual message in queue
        });

        // Audit log (hash only, never the content)
        writeAuditLog(userId, {
          ts: timestamp,
          userId,
          agentId: fromAgent,
          action: 'message.send',
          meta: {
            messageHash: msgHash,
            toAgent,
            messageId: envelope.id
          }
        });

        console.log(`[broker] ${userId}/${fromAgent} → ${userId}/${toAgent} (${msgHash})`);

        res.writeHead(200);
        res.end(JSON.stringify({
          ok: true,
          messageId: envelope.id,
          queued: true
        }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // GET /internal/messages?userId=X&agentId=Y - Poll for messages
  if (req.method === 'GET' && req.url?.startsWith('/internal/messages')) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const userId = url.searchParams.get('userId');
    const agentId = url.searchParams.get('agentId');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (!userId || !agentId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Missing userId or agentId' }));
      return;
    }

    // Verify agent belongs to user
    const userAgents = getAgentsForUser(userId);
    if (!userAgents.includes(agentId)) {
      writeAuditLog(userId, {
        ts: Math.floor(Date.now() / 1000),
        userId,
        agentId,
        action: 'message.unauthorized_poll',
        meta: {}
      });
      res.writeHead(403);
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    const messages = dequeueMessages(userId, agentId, limit);
    // Strip internal fields, return clean messages
    const cleaned = messages.map(m => ({
      id: m.id,
      fromAgent: m.fromAgent,
      message: m.message,
      timestamp: m.timestamp
    }));

    res.writeHead(200);
    res.end(JSON.stringify({ messages: cleaned }));
    return;
  }

  // GET /internal/health
  if (req.method === 'GET' && req.url === '/internal/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', queues: messageQueues.size }));
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

// --- Start server (standalone mode) ---
if (require.main === module) {
  const server = http.createServer(handleRequest);
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[broker] AgentBox Message Broker listening on 127.0.0.1:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[broker] Shutting down...');
    server.close(() => process.exit(0));
  });
}

module.exports = { handleRequest, validateRequest, enqueueMessage, dequeueMessages };
