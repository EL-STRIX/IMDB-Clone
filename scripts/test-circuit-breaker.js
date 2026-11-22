const fallbackMovies = require("../lib/fallback/movies.json");

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownMs = options.cooldownMs || 5000;
    this.state = "CLOSED";
    this.failureCount = 0;
    this.nextAttempt = 0;
    this.lastSuccessfulResponse = new Map();
    this.lastSuccessfulResponse.set("popular", {
      items: fallbackMovies,
      totalResults: fallbackMovies.length,
    });
  }

  getState() {
    if (this.state === "OPEN" && Date.now() >= this.nextAttempt) {
      this.state = "HALF_OPEN";
    }
    return this.state;
  }

  async execute(operation, fallbackKey) {
    if (this.getState() === "OPEN") {
      return this.lastSuccessfulResponse.get(fallbackKey);
    }
    try {
      const res = await operation();
      this.failureCount = 0;
      this.state = "CLOSED";
      return res;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
        this.nextAttempt = Date.now() + this.cooldownMs;
      }
      return this.lastSuccessfulResponse.get(fallbackKey);
    }
  }
}

async function run() {
  const breaker = new CircuitBreaker();
  let calls = 0;
  const failingOp = async () => {
    calls++;
    throw new Error("Simulated API failure 500");
  };

  // Force fail 3 times
  for (let i = 0; i < 3; i++) {
    const res = await breaker.execute(failingOp, "popular");
    if (!res || !res.items.length) throw new Error("Fallback missing");
  }

  if (breaker.getState() !== "OPEN") throw new Error("Breaker should be OPEN");

  const callsWhenOpen = calls;
  const fallback = await breaker.execute(failingOp, "popular");
  if (calls !== callsWhenOpen) throw new Error("Should not call failing op when OPEN");
  if (!fallback || fallback.items.length !== 4) throw new Error("Expected 4 fallback items");

  console.log("✓ Force-fail test passed: Served fallback items correctly when circuit opened!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
