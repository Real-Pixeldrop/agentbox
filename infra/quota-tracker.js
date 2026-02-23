/**
 * AgentBox - Token & Storage Quota Tracker
 * Tracks per-user, per-agent token consumption and storage usage.
 *
 * Storage: /data/usage/{userId}/usage-{YYYY-MM}.json
 *
 * Features:
 *   - Track input/output tokens per agent
 *   - Calculate cost based on model pricing
 *   - Track storage usage per user
 *   - Alert at 80% quota threshold
 *   - Check quota BEFORE each LLM request
 *
 * Usage:
 *   const quota = require('./quota-tracker');
 *   
 *   // Before LLM call
 *   const check = quota.checkQuota('user123');
 *   if (!check.allowed) { reject(check.reason); }
 *   
 *   // After LLM call
 *   quota.trackTokens('user123', 'agent1', { input: 500, output: 200, model: 'claude-sonnet-4' });
 */

const fs = require('fs');
const path = require('path');

// --- Config ---
const DATA_ROOT = process.env.DATA_ROOT || '/data';
const USAGE_DIR = path.join(DATA_ROOT, 'usage');
const USERS_DIR = path.join(DATA_ROOT, 'users');

// Monthly quotas per plan (in USD)
const PLAN_QUOTAS = {
  free: {
    monthlyCostLimit: 5.0,      // $5/month max
    storageLimit: 1073741824,    // 1 GB
    monthlyTokenLimit: 5000000   // 5M tokens
  },
  pro: {
    monthlyCostLimit: 50.0,     // $50/month
    storageLimit: 10737418240,   // 10 GB
    monthlyTokenLimit: 50000000  // 50M tokens
  },
  enterprise: {
    monthlyCostLimit: 500.0,    // $500/month
    storageLimit: 107374182400,  // 100 GB
    monthlyTokenLimit: 500000000 // 500M tokens
  }
};

// Model pricing (per 1M tokens)
const MODEL_PRICING = {
  'claude-sonnet-4': { input: 3.0, output: 15.0 },
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-haiku-3.5': { input: 0.80, output: 4.0 },
  'claude-opus-4': { input: 15.0, output: 75.0 },
  'default': { input: 3.0, output: 15.0 }
};

// --- Helpers ---

function getUsageFile(userId, month) {
  return path.join(USAGE_DIR, userId, `usage-${month}.json`);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function loadUsage(userId, month) {
  const file = getUsageFile(userId, month || getCurrentMonth());
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    const data = {
      userId,
      month: month || getCurrentMonth(),
      agents: {},
      totalCost: 0.0,
      storageBytes: 0
    };
    saveUsage(userId, data);
    return data;
  }
}

function saveUsage(userId, data) {
  const dir = path.join(USAGE_DIR, userId);
  fs.mkdirSync(dir, { recursive: true });
  const file = getUsageFile(userId, data.month);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function calculateCost(inputTokens, outputTokens, model) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1000000;
}

function getUserPlan(userId) {
  const rateLimitFile = path.join(DATA_ROOT, 'rate-limits', `${userId}.json`);
  try {
    const data = JSON.parse(fs.readFileSync(rateLimitFile, 'utf8'));
    return data.plan || 'free';
  } catch {
    return 'free';
  }
}

function getStorageBytes(userId) {
  const userDir = path.join(USERS_DIR, userId);
  if (!fs.existsSync(userDir)) return 0;
  
  // Quick size calculation using du-like approach
  let totalSize = 0;
  function walkDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile()) {
          try {
            totalSize += fs.statSync(fullPath).size;
          } catch {}
        } else if (entry.isDirectory()) {
          walkDir(fullPath);
        }
      }
    } catch {}
  }
  walkDir(userDir);
  return totalSize;
}

// --- Public API ---

/**
 * Check if user has quota remaining BEFORE an LLM request.
 * @param {string} userId
 * @param {number} estimatedTokens - Estimated tokens for this request
 * @returns {{ allowed: boolean, reason?: string, usage: object, alerts: string[] }}
 */
function checkQuota(userId, estimatedTokens = 0) {
  const plan = getUserPlan(userId);
  const quotas = PLAN_QUOTAS[plan] || PLAN_QUOTAS.free;
  const usage = loadUsage(userId);
  const alerts = [];

  // Calculate total tokens used this month
  let totalTokens = 0;
  for (const agent of Object.values(usage.agents)) {
    totalTokens += (agent.inputTokens || 0) + (agent.outputTokens || 0);
  }

  // Check cost limit
  if (usage.totalCost >= quotas.monthlyCostLimit) {
    return {
      allowed: false,
      reason: `Monthly cost limit reached ($${usage.totalCost.toFixed(2)} / $${quotas.monthlyCostLimit})`,
      usage,
      alerts: [`BLOCKED: Cost limit reached`]
    };
  }

  // Check token limit
  if (totalTokens + estimatedTokens > quotas.monthlyTokenLimit) {
    return {
      allowed: false,
      reason: `Monthly token limit reached (${totalTokens} / ${quotas.monthlyTokenLimit})`,
      usage,
      alerts: [`BLOCKED: Token limit reached`]
    };
  }

  // Check storage limit
  const storageBytes = getStorageBytes(userId);
  usage.storageBytes = storageBytes;
  if (storageBytes > quotas.storageLimit) {
    return {
      allowed: false,
      reason: `Storage limit reached (${(storageBytes / 1073741824).toFixed(2)}GB / ${(quotas.storageLimit / 1073741824).toFixed(2)}GB)`,
      usage,
      alerts: [`BLOCKED: Storage limit reached`]
    };
  }

  // 80% threshold alerts
  if (usage.totalCost >= quotas.monthlyCostLimit * 0.8) {
    alerts.push(`⚠️ Cost at ${((usage.totalCost / quotas.monthlyCostLimit) * 100).toFixed(0)}% ($${usage.totalCost.toFixed(2)} / $${quotas.monthlyCostLimit})`);
  }
  if (totalTokens >= quotas.monthlyTokenLimit * 0.8) {
    alerts.push(`⚠️ Tokens at ${((totalTokens / quotas.monthlyTokenLimit) * 100).toFixed(0)}%`);
  }
  if (storageBytes >= quotas.storageLimit * 0.8) {
    alerts.push(`⚠️ Storage at ${((storageBytes / quotas.storageLimit) * 100).toFixed(0)}%`);
  }

  saveUsage(userId, usage);

  return {
    allowed: true,
    usage,
    alerts
  };
}

/**
 * Track token usage after a successful LLM call.
 * @param {string} userId
 * @param {string} agentId
 * @param {{ input: number, output: number, model?: string }} tokens
 * @returns {{ cost: number, alerts: string[] }}
 */
function trackTokens(userId, agentId, tokens) {
  const usage = loadUsage(userId);
  const model = tokens.model || 'default';
  const cost = calculateCost(tokens.input, tokens.output, model);

  // Initialize agent entry if needed
  if (!usage.agents[agentId]) {
    usage.agents[agentId] = {
      inputTokens: 0,
      outputTokens: 0,
      cost: 0.0
    };
  }

  // Update counters
  usage.agents[agentId].inputTokens += tokens.input;
  usage.agents[agentId].outputTokens += tokens.output;
  usage.agents[agentId].cost += cost;
  usage.totalCost += cost;

  // Update storage
  usage.storageBytes = getStorageBytes(userId);

  saveUsage(userId, usage);

  // Check thresholds
  const plan = getUserPlan(userId);
  const quotas = PLAN_QUOTAS[plan] || PLAN_QUOTAS.free;
  const alerts = [];

  if (usage.totalCost >= quotas.monthlyCostLimit * 0.8) {
    alerts.push(`⚠️ Monthly cost at ${((usage.totalCost / quotas.monthlyCostLimit) * 100).toFixed(0)}%`);
  }

  return { cost, totalCost: usage.totalCost, alerts };
}

/**
 * Get usage summary for a user.
 * @param {string} userId
 * @param {string} [month] - defaults to current month
 * @returns {object}
 */
function getUsage(userId, month) {
  return loadUsage(userId, month);
}

/**
 * Update storage tracking for a user.
 * @param {string} userId
 * @returns {{ storageBytes: number }}
 */
function updateStorageTracking(userId) {
  const usage = loadUsage(userId);
  usage.storageBytes = getStorageBytes(userId);
  saveUsage(userId, usage);
  return { storageBytes: usage.storageBytes };
}

module.exports = {
  checkQuota,
  trackTokens,
  getUsage,
  updateStorageTracking,
  PLAN_QUOTAS,
  MODEL_PRICING
};
