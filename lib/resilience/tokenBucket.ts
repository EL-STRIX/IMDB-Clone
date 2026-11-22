export class TokenBucket {
  private capacity: number;
  private refillPerSecond: number;
  private tokens: number;
  private lastRefill: number;

  constructor(capacity = 20, refillPerSecond = 10) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    this.tokens = capacity;
    this.lastRefill = typeof performance !== "undefined" ? performance.now() : Date.now();
  }

  private refill(): void {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillPerSecond);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const missingTokens = 1 - this.tokens;
    const waitTimeMs = Math.ceil((missingTokens / this.refillPerSecond) * 1000);
    await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
    return this.acquire();
  }
}

export const defaultRateLimiter = new TokenBucket(30, 10);
