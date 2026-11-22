import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { reviewsStore } from "@/lib/reviews/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/reviews/[id]/vote
 * Protected endpoint to cast, switch, or toggle upvotes/downvotes on a review.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  const { id: reviewId } = await params;

  try {
    const body = await req.json();
    const { vote } = body;

    if (!vote || !["up", "down", "none"].includes(vote)) {
      return NextResponse.json(
        { error: "Validation Error", message: "Vote must be 'up', 'down', or 'none'" },
        { status: 400 }
      );
    }

    const result = reviewsStore.vote(reviewId, auth.user.id, vote);

    if (result.status === "not_found") {
      return NextResponse.json(
        { error: "Not Found", message: "Review not found or deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: result.review,
      userVote: result.userVote,
    });
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid request payload" },
      { status: 400 }
    );
  }
}
