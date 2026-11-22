import { NextRequest, NextResponse } from "next/server";
import { movieProvider } from "@/lib/api/provider";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const movie = await movieProvider.getMovie(id);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    return NextResponse.json(movie);
  } catch (error) {
    console.error("Failed to load movie details:", error);
    return NextResponse.json(
      { error: "Failed to load movie details" },
      { status: 500 }
    );
  }
}
