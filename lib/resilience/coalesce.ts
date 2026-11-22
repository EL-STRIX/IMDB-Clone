import crypto from "crypto";

/**
 * Request coalescing: deduplicates simultaneous identical in-flight promises
 * so multiple concurrent callers share a single network/server operation.
 */
export class RequestCoalescer {
  private inFlight = new Map<string, Promise<any>>();

  async coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = (async () => {
      try {
        return await fn();
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  has(key: string): boolean {
    return this.inFlight.has(key);
  }

  get size(): number {
    return this.inFlight.size;
  }

  clear(): void {
    this.inFlight.clear();
  }
}

export const defaultCoalescer = new RequestCoalescer();

/**
 * Generates an HTTP entity tag (ETag) from stringified response body content.
 */
export function generateETag(content: string): string {
  return `"${crypto.createHash("md5").update(content).digest("hex")}"`;
}
