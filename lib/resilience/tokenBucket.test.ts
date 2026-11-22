import { describe, it, expect } from "vitest";
import { TokenBucket } from "./tokenBucket";

describe("TokenBucket Rate Limiter", () => {
  it("spaces out requests correctly when capacity is exceeded", async () => {
    // Capacity: 2 tokens, refills 2 tokens per second (1 token every 500ms)
    const bucket = new TokenBucket(2, 2);

    const start = Date.now();
    await bucket.acquire(); // Immediate (token 1)
    await bucket.acquire(); // Immediate (token 2)

    // 3rd acquire must wait ~500ms for a refill
    await bucket.acquire();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(400);
  });
});
