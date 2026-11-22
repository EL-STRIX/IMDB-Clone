import fallbackMovies from "../fallback/movies.json";
import { Movie, CursorResult } from "../api/types";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private nextAttempt = 0;
  private lastSuccessfulResponse = new Map<string, any>();

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.cooldownMs = options.cooldownMs ?? 30000;

    // Seed initial fallback cache for popular movies
    this.lastSuccessfulResponse.set("popular", {
      items: fallbackMovies as Movie[],
      totalResults: fallbackMovies.length,
    });
  }

  getState(): CircuitState {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.state === "OPEN" && now >= this.nextAttempt) {
      this.state = "HALF_OPEN";
    }
    return this.state;
  }

  setCache(key: string, data: any): void {
    this.lastSuccessfulResponse.set(key, data);
  }

  getCache<T>(key: string): T | undefined {
    return this.lastSuccessfulResponse.get(key);
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  private onFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      this.nextAttempt = now + this.cooldownMs;
    }
  }

  async execute<T>(
    operation: () => Promise<T>,
    fallbackKey?: string,
    customFallback?: () => T | Promise<T>
  ): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      if (fallbackKey && this.lastSuccessfulResponse.has(fallbackKey)) {
        return this.lastSuccessfulResponse.get(fallbackKey) as T;
      }
      if (customFallback) {
        return customFallback();
      }
      throw new Error("Circuit breaker is OPEN and no fallback available.");
    }

    try {
      const result = await operation();
      this.onSuccess();
      if (fallbackKey) {
        this.setCache(fallbackKey, result);
      }
      return result;
    } catch (error) {
      this.onFailure();
      if (fallbackKey && this.lastSuccessfulResponse.has(fallbackKey)) {
        return this.lastSuccessfulResponse.get(fallbackKey) as T;
      }
      if (customFallback) {
        return customFallback();
      }
      throw error;
    }
  }
}

export const defaultCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownMs: 30000,
});
