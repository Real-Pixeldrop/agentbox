/**
 * AgentBox - Audit Logger
 * Logs all sensitive actions in JSON Lines format.
 *
 * Storage: /data/audit/{userId}/audit-{YYYY-MM-DD}.jsonl
 *
 * Logged actions:
 *   - agent.create / agent.delete
 *   - chat.send (message hash, not content)
 *   - config.update
 *   - file.access / file.write / file.delete
 *   - auth.login / auth.failure
 *   - user.provision / user.teardown
 *   - message.send / message.rejected
 *   - quota.exceeded / quota.warning
 *
 * Rotation:
 *   - Keep 90 days
 *   - Compress (gzip) after 30 days
 *   - Delete after 90 days
 *
 * Usage:
 *   const audit = require('./audit-logger');
 *   audit.log('user123', 'main', 'chat.send', { messageHash: 'abc123' });
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// --- Config ---
const DATA_ROOT = process.env.DATA_ROOT || '/data';
const AUDIT_DIR = path.join(DATA_ROOT, 'audit');
const RETENTION_DAYS = 90;
const COMPRESS_AFTER_DAYS = 30;

// --- Helpers ---

function getAuditDir(userId) {
  return path.join(AUDIT_DIR, userId);
}

function getAuditFile(userId, date) {
  return path.join(getAuditDir(userId), `audit-${date}.jsonl`);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// --- Public API ---

/**
 * Write an audit log entry.
 * @param {string} userId
 * @param {string} agentId
 * @param {string} action - Action type (e.g., 'chat.send', 'agent.create')
 * @param {object} meta - Additional metadata (no sensitive content!)
 */
function log(userId, agentId, action, meta = {}) {
  const dir = getAuditDir(userId);
  fs.mkdirSync(dir, { recursive: true });

  const entry = {
    ts: Math.floor(Date.now() / 1000),
    userId,
    agentId: agentId || 'system',
    action,
    meta
  };

  const file = getAuditFile(userId, today());
  fs.appendFileSync(file, JSON.stringify(entry) + '\n');
}

/**
 * Log a chat message (hashes the content automatically).
 * @param {string} userId
 * @param {string} agentId
 * @param {string} message - The actual message (will be hashed, NOT stored)
 * @param {object} extra - Additional metadata
 */
function logMessage(userId, agentId, message, extra = {}) {
  const messageHash = crypto
    .createHash('sha256')
    .update(typeof message === 'string' ? message : JSON.stringify(message))
    .digest('hex')
    .slice(0, 16);

  log(userId, agentId, 'chat.send', {
    messageHash,
    ...extra
  });
}

/**
 * Log a file access event.
 * @param {string} userId
 * @param {string} agentId
 * @param {string} action - 'file.read', 'file.write', 'file.delete'
 * @param {string} filePath - Relative path within user workspace
 */
function logFileAccess(userId, agentId, action, filePath) {
  log(userId, agentId, action, {
    path: filePath,
    // Hash the filename for privacy
    pathHash: crypto.createHash('sha256').update(filePath).digest('hex').slice(0, 12)
  });
}

/**
 * Log an unauthorized access attempt.
 * @param {string} userId
 * @param {string} agentId
 * @param {string} resource - What was being accessed
 * @param {string} reason - Why it was denied
 */
function logUnauthorized(userId, agentId, resource, reason) {
  log(userId, agentId || 'unknown', 'auth.unauthorized', {
    resource,
    reason,
    severity: 'high'
  });
}

/**
 * Rotate audit logs: compress old files, delete expired ones.
 * Should be called daily (e.g., via cron).
 */
function rotate() {
  const now = new Date();
  const compressThreshold = new Date(now - COMPRESS_AFTER_DAYS * 86400000);
  const deleteThreshold = new Date(now - RETENTION_DAYS * 86400000);

  let compressed = 0;
  let deleted = 0;
  let errors = 0;

  // Scan all user audit directories
  let userDirs;
  try {
    userDirs = fs.readdirSync(AUDIT_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch {
    return { compressed: 0, deleted: 0, errors: 0 };
  }

  for (const userId of userDirs) {
    const dir = path.join(AUDIT_DIR, userId);
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }

    for (const file of files) {
      // Parse date from filename: audit-YYYY-MM-DD.jsonl
      const match = file.match(/^audit-(\d{4}-\d{2}-\d{2})\.jsonl$/);
      if (!match) continue;

      const fileDate = new Date(match[1] + 'T00:00:00Z');
      const filePath = path.join(dir, file);

      // Delete if older than retention period
      if (fileDate < deleteThreshold) {
        try {
          fs.unlinkSync(filePath);
          // Also delete .gz version if exists
          try { fs.unlinkSync(filePath + '.gz'); } catch {}
          deleted++;
        } catch (err) {
          console.error(`[audit-rotate] Failed to delete ${filePath}: ${err.message}`);
          errors++;
        }
        continue;
      }

      // Compress if older than compress threshold
      if (fileDate < compressThreshold) {
        const gzPath = filePath + '.gz';
        if (!fs.existsSync(gzPath)) {
          try {
            execSync(`gzip -k "${filePath}"`);
            fs.unlinkSync(filePath); // Remove uncompressed after successful gzip
            compressed++;
          } catch (err) {
            console.error(`[audit-rotate] Failed to compress ${filePath}: ${err.message}`);
            errors++;
          }
        }
      }
    }
  }

  console.log(`[audit-rotate] Compressed: ${compressed}, Deleted: ${deleted}, Errors: ${errors}`);
  return { compressed, deleted, errors };
}

/**
 * Search audit logs for a user.
 * @param {string} userId
 * @param {object} options - { from, to, action, agentId, limit }
 * @returns {object[]} Matching audit entries
 */
function search(userId, options = {}) {
  const dir = getAuditDir(userId);
  if (!fs.existsSync(dir)) return [];

  const from = options.from || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const to = options.to || today();
  const limit = options.limit || 1000;

  const results = [];
  const files = fs.readdirSync(dir).sort();

  for (const file of files) {
    if (results.length >= limit) break;

    const match = file.match(/^audit-(\d{4}-\d{2}-\d{2})\.jsonl(\.gz)?$/);
    if (!match) continue;

    const fileDate = match[1];
    if (fileDate < from || fileDate > to) continue;

    let content;
    const filePath = path.join(dir, file);

    if (file.endsWith('.gz')) {
      try {
        content = execSync(`zcat "${filePath}"`).toString();
      } catch {
        continue;
      }
    } else {
      try {
        content = fs.readFileSync(filePath, 'utf8');
      } catch {
        continue;
      }
    }

    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      if (results.length >= limit) break;

      try {
        const entry = JSON.parse(line);
        
        // Apply filters
        if (options.action && entry.action !== options.action) continue;
        if (options.agentId && entry.agentId !== options.agentId) continue;
        
        results.push(entry);
      } catch {
        continue;
      }
    }
  }

  return results;
}

module.exports = {
  log,
  logMessage,
  logFileAccess,
  logUnauthorized,
  rotate,
  search,
  RETENTION_DAYS,
  COMPRESS_AFTER_DAYS
};
