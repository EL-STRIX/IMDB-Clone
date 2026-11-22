import { NextRequest, NextResponse } from "next/server";
import { movieProvider } from "@/lib/api/provider";
import { defaultCoalescer, generateETag } from "@/lib/resilience/coalesce";

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
  try {
    const cacheKey = `popular-api:${cursor || "1"}`;
    const result = await defaultCoalescer.coalesce(cacheKey, () =>
      movieProvider.getPopular(cursor)
    );

    const body = JSON.stringify(result);
    const etag = generateETag(body);
    const ifNoneMatch = request.headers.get("if-none-match");

    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      "ETag": etag,
    };

    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`)) {
      return new NextResponse(null, {
        status: 304,
        headers,
      });
    }

    return new NextResponse(body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Failed to load popular movies:", error);
    return NextResponse.json({ error: "Failed to load movies" }, { status: 500 });
  }
}
