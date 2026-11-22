export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export class UserRateLimiter {
  private userRequests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 5, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  /**
   * Evaluates if a given user has exceeded their rate limit quota.
   */
  check(userId: string): RateLimitResult {
    const now = Date.now();
    const timestamps = this.userRequests.get(userId) || [];

    // Filter out timestamps outside the active rolling window
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      const oldest = validTimestamps[0];
      const resetInSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
      };
    }

    // Record this request
    validTimestamps.push(now);
    this.userRequests.set(userId, validTimestamps);

    return {
      allowed: true,
      remaining: this.maxRequests - validTimestamps.length,
      resetInSeconds: Math.ceil(this.windowMs / 1000),
    };
  }

  /**
   * Resets rate limiter memory (useful for tests)
   */
  reset(): void {
    this.userRequests.clear();
  }
}

// Global review creation rate limiter: 5 submissions per 60s per user
export const reviewRateLimiter = new UserRateLimiter(5, 60);
