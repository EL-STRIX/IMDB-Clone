import { NextRequest, NextResponse } from "next/server";
import { movieProvider } from "@/lib/api/provider";
import { defaultCoalescer, generateETag } from "@/lib/resilience/coalesce";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Request coalescing ensures simultaneous identical requests share one network call
    const movie = await defaultCoalescer.coalesce(`movie-api:${id}`, () =>
      movieProvider.getMovie(id)
    );

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const body = JSON.stringify(movie);
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
    console.error("Failed to load movie details:", error);
    return NextResponse.json(
      { error: "Failed to load movie details" },
      { status: 500 }
    );
  }
}
