import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { withRetry } from "@/lib/resilience/retry";
import { CircuitBreaker } from "@/lib/resilience/circuitBreaker";
import GlobalError from "@/app/error";

describe("Resilience Layer Tests", () => {
  it("burst of 429s then success (retry works)", async () => {
    let attempts = 0;
    const rateLimitedOperation = vi.fn(async () => {
      attempts++;
      if (attempts < 3) {
        const err: any = new Error("Rate limit exceeded");
        err.status = 429;
        throw err;
      }
      return { success: true };
    });

    const result = await withRetry(rateLimitedOperation, {
      maxRetries: 4,
      initialDelayMs: 10,
    });

    expect(result).toEqual({ success: true });
    expect(attempts).toBe(3);
  });

  it("five consecutive 500s (circuit opens and fallback data returns without a network call)", async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 5,
      cooldownMs: 10000,
    });

    let networkCalls = 0;
    const failingServerOp = vi.fn(async (): Promise<{ items: any[] }> => {
      networkCalls++;
      const err: any = new Error("Internal Server Error");
      err.status = 500;
      throw err;
    });

    // 5 consecutive 500 errors
    for (let i = 0; i < 5; i++) {
      const res = await breaker.execute(failingServerOp, "popular");
      expect(res.items).toBeDefined();
    }

    expect(breaker.getState()).toBe("OPEN");
    expect(networkCalls).toBe(5);

    // 6th call while breaker is OPEN: should serve fallback data without executing network call
    const fallbackRes = await breaker.execute(failingServerOp, "popular");

    expect(networkCalls).toBe(5); // No new network call was made!
    expect(fallbackRes.items.length).toBeGreaterThan(0);
    expect(fallbackRes.items[0].title).toBe("The Shawshank Redemption");
  });

  it("component test confirming the UI shows a friendly fallback instead of crashing", () => {
    const resetMock = vi.fn();
    render(
      <GlobalError
        error={new Error("Simulated client crash")}
        reset={resetMock}
      />
    );

    expect(screen.getByText("Something went wrong")).toBeDefined();
    expect(
      screen.getByText("Could not load the movie list. Please try again.")
    ).toBeDefined();

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainButton).toBeDefined();
    tryAgainButton.click();
    expect(resetMock).toHaveBeenCalledOnce();
  });
});
