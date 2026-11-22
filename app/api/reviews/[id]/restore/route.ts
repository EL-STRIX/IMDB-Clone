import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { reviewsStore } from "@/lib/reviews/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/reviews/[id]/restore
 * Protected endpoint to restore a soft-deleted review (Undo action).
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  const { id: reviewId } = await params;
  const result = reviewsStore.restore(reviewId, auth.user);

  if (result.status === "not_found") {
    return NextResponse.json(
      { error: "Not Found", message: "Review not found or is not deleted" },
      { status: 404 }
    );
  }

  if (result.status === "forbidden") {
    return NextResponse.json(
      { error: "Forbidden", message: "You are not authorized to restore this review" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Review restored successfully",
    review: result.review,
  });
}
