/**
 * AgentBox - Rate Limiter
 * Per-user rate limiting with configurable plans.
 *
 * Limits (default free tier):
 *   - 100 messages/day
 *   - 50,000 tokens/day
 *   - 10 requests/minute (burst)
 *
 * Plans:
 *   free:       100 msg/day, 50k tok/day, 10 req/min
 *   pro:        1000 msg/day, 500k tok/day, 60 req/min
 *   enterprise: 10000 msg/day, 5M tok/day, 200 req/min
 *
 * Storage: JSON files in /data/rate-limits/{userId}.json
 *
 * Usage:
 *   const { checkRateLimit, recordUsage } = require('./rate-limiter');
 *   const result = checkRateLimit('user123');
 *   if (!result.allowed) { /* reject */ }
 *   recordUsage('user123', { messages: 1, tokens: 150 });
 */

const fs = require('fs');
const path = require('path');

// --- Config ---
const DATA_ROOT = process.env.DATA_ROOT || '/data';
const RATE_LIMITS_DIR = path.join(DATA_ROOT, 'rate-limits');

// Plan definitions
const PLANS = {
  free: {
    messagesPerDay: 100,
    tokensPerDay: 50000,
    requestsPerMinute: 10
  },
  pro: {
    messagesPerDay: 1000,
    tokensPerDay: 500000,
    requestsPerMinute: 60
  },
  enterprise: {
    messagesPerDay: 10000,
    tokensPerDay: 5000000,
    requestsPerMinute: 200
  }
};

// --- Helpers ---

function getRateLimitFile(userId) {
  return path.join(RATE_LIMITS_DIR, `${userId}.json`);
}

function loadRateLimit(userId) {
  const file = getRateLimitFile(userId);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    // Initialize default
    const data = {
      userId,
      plan: 'free',
      limits: { ...PLANS.free },
      counters: {
        date: new Date().toISOString().slice(0, 10),
        messagesUsed: 0,
        tokensUsed: 0,
        minuteWindow: {
          start: 0,
          count: 0
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveRateLimit(userId, data);
    return data;
  }
}

function saveRateLimit(userId, data) {
  const file = getRateLimitFile(userId);
  fs.mkdirSync(RATE_LIMITS_DIR, { recursive: true });
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function resetDailyCountersIfNeeded(data) {
  const today = new Date().toISOString().slice(0, 10);
  if (data.counters.date !== today) {
    data.counters.date = today;
    data.counters.messagesUsed = 0;
    data.counters.tokensUsed = 0;
    data.counters.minuteWindow = { start: 0, count: 0 };
  }
  return data;
}

// --- Public API ---

/**
 * Check if a user is within their rate limits.
 * @param {string} userId
 * @returns {{ allowed: boolean, reason?: string, remaining: object }}
 */
function checkRateLimit(userId) {
  let data = loadRateLimit(userId);
  data = resetDailyCountersIfNeeded(data);

  const limits = data.limits;
  const counters = data.counters;
  const now = Math.floor(Date.now() / 1000);

  // Check daily message limit
  if (counters.messagesUsed >= limits.messagesPerDay) {
    return {
      allowed: false,
      reason: `Daily message limit reached (${limits.messagesPerDay}/day)`,
      remaining: {
        messages: 0,
        tokens: Math.max(0, limits.tokensPerDay - counters.tokensUsed),
        minuteRequests: limits.requestsPerMinute
      },
      retryAfter: 'tomorrow'
    };
  }

  // Check daily token limit
  if (counters.tokensUsed >= limits.tokensPerDay) {
    return {
      allowed: false,
      reason: `Daily token limit reached (${limits.tokensPerDay}/day)`,
      remaining: {
        messages: Math.max(0, limits.messagesPerDay - counters.messagesUsed),
        tokens: 0,
        minuteRequests: limits.requestsPerMinute
      },
      retryAfter: 'tomorrow'
    };
  }

  // Check minute burst limit
  const minuteStart = counters.minuteWindow.start;
  if (now - minuteStart < 60) {
    if (counters.minuteWindow.count >= limits.requestsPerMinute) {
      const retryIn = 60 - (now - minuteStart);
      return {
        allowed: false,
        reason: `Rate limit exceeded (${limits.requestsPerMinute} req/min)`,
        remaining: {
          messages: Math.max(0, limits.messagesPerDay - counters.messagesUsed),
          tokens: Math.max(0, limits.tokensPerDay - counters.tokensUsed),
          minuteRequests: 0
        },
        retryAfter: `${retryIn}s`
      };
    }
  }

  // All checks passed
  saveRateLimit(userId, data);

  return {
    allowed: true,
    remaining: {
      messages: limits.messagesPerDay - counters.messagesUsed,
      tokens: limits.tokensPerDay - counters.tokensUsed,
      minuteRequests: limits.requestsPerMinute - (
        now - minuteStart < 60 ? counters.minuteWindow.count : 0
      )
    }
  };
}

/**
 * Record usage for a user (call AFTER a successful request).
 * @param {string} userId
 * @param {{ messages?: number, tokens?: number }} usage
 */
function recordUsage(userId, usage = {}) {
  let data = loadRateLimit(userId);
  data = resetDailyCountersIfNeeded(data);

  const now = Math.floor(Date.now() / 1000);

  // Update daily counters
  if (usage.messages) {
    data.counters.messagesUsed += usage.messages;
  }
  if (usage.tokens) {
    data.counters.tokensUsed += usage.tokens;
  }

  // Update minute window
  if (now - data.counters.minuteWindow.start >= 60) {
    data.counters.minuteWindow = { start: now, count: 1 };
  } else {
    data.counters.minuteWindow.count += 1;
  }

  saveRateLimit(userId, data);

  // Check 80% threshold for alerts
  const limits = data.limits;
  const alerts = [];
  if (data.counters.messagesUsed >= limits.messagesPerDay * 0.8) {
    alerts.push(`Messages: ${data.counters.messagesUsed}/${limits.messagesPerDay} (80%+ used)`);
  }
  if (data.counters.tokensUsed >= limits.tokensPerDay * 0.8) {
    alerts.push(`Tokens: ${data.counters.tokensUsed}/${limits.tokensPerDay} (80%+ used)`);
  }

  return { alerts };
}

/**
 * Update a user's plan.
 * @param {string} userId
 * @param {string} planName - 'free', 'pro', or 'enterprise'
 */
function updatePlan(userId, planName) {
  if (!PLANS[planName]) {
    throw new Error(`Unknown plan: ${planName}. Valid: ${Object.keys(PLANS).join(', ')}`);
  }

  let data = loadRateLimit(userId);
  data.plan = planName;
  data.limits = { ...PLANS[planName] };
  saveRateLimit(userId, data);

  return { plan: planName, limits: data.limits };
}

/**
 * Get current rate limit status for a user.
 * @param {string} userId
 * @returns {object}
 */
function getStatus(userId) {
  let data = loadRateLimit(userId);
  data = resetDailyCountersIfNeeded(data);
  return data;
}

module.exports = {
  checkRateLimit,
  recordUsage,
  updatePlan,
  getStatus,
  PLANS
};
