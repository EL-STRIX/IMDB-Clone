import assert from "node:assert";
import { TokenBucket } from "./tokenBucket";

async function testTokenBucketSpacing() {
  // Capacity: 2 tokens, refills 2 tokens per second (1 token every 500ms)
  const bucket = new TokenBucket(2, 2);

  const start = Date.now();
  await bucket.acquire(); // Immediate (token 1)
  await bucket.acquire(); // Immediate (token 2)

  // 3rd acquire must wait ~500ms for a refill
  await bucket.acquire();
  const elapsed = Date.now() - start;

  assert(
    elapsed >= 400,
    `Expected elapsed time to be >= 400ms, but was ${elapsed}ms`
  );
  console.log(`✓ TokenBucket test passed: 3 tokens spaced over ${elapsed}ms (>= 400ms target)`);
}

testTokenBucketSpacing().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
