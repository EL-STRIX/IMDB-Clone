import { NextRequest, NextResponse } from "next/server";
import { reviewsStore } from "@/lib/reviews/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reviews/[id]/history
 * Public endpoint to fetch full revision history and diff snapshots for a review.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: reviewId } = await params;
  const history = reviewsStore.getHistory(reviewId);

  if (!history) {
    return NextResponse.json(
      { error: "Not Found", message: "Review not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    reviewId,
    current: {
      rating: history.current.rating,
      title: history.current.title,
      content: history.current.content,
      spoiler: history.current.spoiler,
      updatedAt: history.current.updatedAt,
    },
    revisions: history.revisions,
  });
}
