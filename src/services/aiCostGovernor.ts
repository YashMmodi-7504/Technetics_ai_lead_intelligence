// In-memory per-user AI call rate limiter and token budget tracker.
// Resets on server restart. Swap for Redis in Phase 4.

interface UserBudget {
  callsThisMinute: number;
  tokensThisHour: number;
  minuteWindowStart: number;
  hourWindowStart: number;
}

const budgets = new Map<number, UserBudget>();

const MAX_CALLS_PER_MINUTE =
  Number(process.env.AI_MAX_CALLS_PER_MINUTE) || 10;
const MAX_TOKENS_PER_HOUR =
  Number(process.env.AI_MAX_TOKENS_PER_HOUR) || 50_000;

// Bound memory: periodically evict budgets whose windows have fully reset and
// carry no usage, so the Map can't grow without limit on a long-running server.
const EVICT_AFTER_MS = 2 * 3_600_000; // 2 hours idle
const evictionTimer = setInterval(() => {
  const now = Date.now();
  for (const [userId, b] of budgets) {
    const idle = now - b.hourWindowStart > EVICT_AFTER_MS;
    if (idle && b.callsThisMinute === 0 && b.tokensThisHour === 0) {
      budgets.delete(userId);
    }
  }
}, 3_600_000);
// Don't keep the event loop alive solely for this housekeeping timer.
if (typeof evictionTimer.unref === "function") evictionTimer.unref();

function getBudget(userId: number): UserBudget {
  const now = Date.now();
  let b = budgets.get(userId);
  if (!b) {
    b = {
      callsThisMinute: 0,
      tokensThisHour: 0,
      minuteWindowStart: now,
      hourWindowStart: now,
    };
    budgets.set(userId, b);
  }
  if (now - b.minuteWindowStart > 60_000) {
    b.callsThisMinute = 0;
    b.minuteWindowStart = now;
  }
  if (now - b.hourWindowStart > 3_600_000) {
    b.tokensThisHour = 0;
    b.hourWindowStart = now;
  }
  return b;
}

export function checkAiBudget(
  userId: number,
): { allowed: boolean; reason?: string } {
  const b = getBudget(userId);
  if (b.callsThisMinute >= MAX_CALLS_PER_MINUTE) {
    return {
      allowed: false,
      reason: "AI rate limit exceeded. Please wait before making another request.",
    };
  }
  if (b.tokensThisHour >= MAX_TOKENS_PER_HOUR) {
    return {
      allowed: false,
      reason: "AI token budget exceeded for this hour.",
    };
  }
  return { allowed: true };
}

export function recordAiUsage(userId: number, tokens: number): void {
  const b = getBudget(userId);
  b.callsThisMinute++;
  b.tokensThisHour += tokens;
}

export function getUserBudgetStatus(userId: number): {
  callsThisMinute: number;
  maxCallsPerMinute: number;
  tokensThisHour: number;
  maxTokensPerHour: number;
} {
  const b = getBudget(userId);
  return {
    callsThisMinute: b.callsThisMinute,
    maxCallsPerMinute: MAX_CALLS_PER_MINUTE,
    tokensThisHour: b.tokensThisHour,
    maxTokensPerHour: MAX_TOKENS_PER_HOUR,
  };
}
