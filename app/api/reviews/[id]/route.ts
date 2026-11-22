import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { UpdateReviewSchema } from "@/lib/reviews/schema";
import { reviewsStore } from "@/lib/reviews/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/reviews/[id]
 * Public endpoint to fetch single review.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: reviewId } = await params;
  const review = reviewsStore.getById(reviewId);

  if (!review) {
    return NextResponse.json(
      { error: "Not Found", message: "Review not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ review });
}

/**
 * PATCH /api/reviews/[id]
 * Protected endpoint to edit an existing review.
 * Only the review author (or an admin) can perform edits.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  const { id: reviewId } = await params;

  try {
    const rawBody = await req.json();
    const parseResult = UpdateReviewSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Invalid review update payload",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = reviewsStore.update(reviewId, auth.user, parseResult.data);

    if (result.status === "not_found") {
      return NextResponse.json(
        { error: "Not Found", message: "Review does not exist or has been deleted." },
        { status: 404 }
      );
    }

    if (result.status === "forbidden") {
      return NextResponse.json(
        { error: "Forbidden", message: "You are not authorized to edit this review." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
      review: result.review,
    });
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 * Protected endpoint to delete a review.
 * Only the review author (or an admin) can delete their review.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  const { id: reviewId } = await params;
  const result = reviewsStore.delete(reviewId, auth.user);

  if (result.status === "not_found") {
    return NextResponse.json(
      { error: "Not Found", message: "Review does not exist or was already deleted." },
      { status: 404 }
    );
  }

  if (result.status === "forbidden") {
    return NextResponse.json(
      { error: "Forbidden", message: "You are not authorized to delete this review." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Review deleted successfully",
    review: result.review,
  });
}
