import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequestCoalescer, generateETag } from "@/lib/resilience/coalesce";
import { GET } from "@/app/api/movies/[id]/route";
import { NextRequest } from "next/server";
import { movieProvider } from "@/lib/api/provider";

describe("Request Coalescing (lib/resilience/coalesce.ts)", () => {
  let coalescer: RequestCoalescer;

  beforeEach(() => {
    coalescer = new RequestCoalescer();
  });

  it("coalesces multiple concurrent calls with the same key into one execution", async () => {
    let callCount = 0;
    const slowFn = vi.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { result: "success" };
    });

    const [res1, res2, res3] = await Promise.all([
      coalescer.coalesce("key-1", slowFn),
      coalescer.coalesce("key-1", slowFn),
      coalescer.coalesce("key-1", slowFn),
    ]);

    expect(callCount).toBe(1);
    expect(res1).toEqual({ result: "success" });
    expect(res2).toEqual({ result: "success" });
    expect(res3).toEqual({ result: "success" });
    expect(coalescer.size).toBe(0);
  });

  it("triggers a new execution after the previous in-flight promise resolves", async () => {
    let callCount = 0;
    const fn = vi.fn().mockImplementation(async () => {
      callCount++;
      return { count: callCount };
    });

    const first = await coalescer.coalesce<{ count: number }>("key-2", fn);
    expect(first.count).toBe(1);
    expect(callCount).toBe(1);

    const second = await coalescer.coalesce<{ count: number }>("key-2", fn);
    expect(second.count).toBe(2);
    expect(callCount).toBe(2);
  });

  it("cleans up in-flight map when an operation fails", async () => {
    const failingFn = vi.fn().mockRejectedValue(new Error("Operation failed"));

    await expect(coalescer.coalesce("fail-key", failingFn)).rejects.toThrow(
      "Operation failed"
    );
    expect(coalescer.size).toBe(0);
  });
});

describe("ETag Generation & HTTP Caching", () => {
  it("generates deterministic entity tags", () => {
    const data = JSON.stringify({ id: "123", title: "Test" });
    const etag1 = generateETag(data);
    const etag2 = generateETag(data);

    expect(etag1).toBe(etag2);
    expect(etag1.startsWith('"')).toBe(true);
    expect(etag1.endsWith('"')).toBe(true);
  });

  it("movie API route returns Cache-Control, ETag and handles 304 Not Modified", async () => {
    vi.spyOn(movieProvider, "getMovie").mockResolvedValue({
      id: "999",
      title: "Coalesced Movie",
      posterUrl: null,
      overview: "Description",
      releaseDate: "2026-01-01",
      genres: ["Action"],
      runtime: 120,
      rating: 8.5,
    });

    // 1. First request -> 200 OK with ETag and Cache-Control
    const req1 = new NextRequest("http://localhost:3000/api/movies/999");
    const res1 = await GET(req1, { params: Promise.resolve({ id: "999" }) });

    expect(res1.status).toBe(200);
    expect(res1.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=3600"
    );
    const etag = res1.headers.get("ETag");
    expect(etag).toBeDefined();

    // 2. Second request with If-None-Match matching ETag -> 304 Not Modified
    const req2 = new NextRequest("http://localhost:3000/api/movies/999", {
      headers: {
        "if-none-match": etag!,
      },
    });
    const res2 = await GET(req2, { params: Promise.resolve({ id: "999" }) });

    expect(res2.status).toBe(304);
    expect(res2.headers.get("ETag")).toBe(etag);
    expect(res2.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=3600"
    );
  });
});
