import { NextRequest, NextResponse } from "next/server";
import { movieProvider } from "@/lib/api/provider";

export async function GET(request: NextRequest) {
  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
  try {
    const result = await movieProvider.getPopular(cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load popular movies:", error);
    return NextResponse.json({ error: "Failed to load movies" }, { status: 500 });
  }
}
