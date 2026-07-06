/**
 * Rate limiting architecture — in-memory store for development/single-instance.
 * Replace with Redis/Upstash in production multi-instance deployments.
 */

export type RateLimitConfig = {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

/** Predefined rate limit profiles */
export const RATE_LIMITS = {
  /** Auth endpoints: login, register, password reset */
  auth: { limit: 10, windowMs: 60_000 },
  /** General API routes */
  api: { limit: 60, windowMs: 60_000 },
  /** Financial operations */
  financial: { limit: 20, windowMs: 60_000 },
  /** Contact / public forms */
  publicForm: { limit: 5, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

/**
 * Checks and increments a rate limit bucket.
 * Key should combine route identifier + client IP (or user id when authenticated).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt,
    };
  }

  if (bucket.count >= config.limit) {
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetAt: bucket.resetAt,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/**
 * Builds a rate-limit response with standard headers.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

/**
 * Convenience helper for API route handlers.
 */
export function enforceRateLimit(
  identifier: string,
  profile: keyof typeof RATE_LIMITS,
): RateLimitResult {
  return checkRateLimit(identifier, RATE_LIMITS[profile]);
}
