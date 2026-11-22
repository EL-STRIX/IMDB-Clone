import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { FlagReviewSchema } from "@/lib/reviews/schema";
import { reviewsStore } from "@/lib/reviews/store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/reviews/[id]/flag
 * Protected endpoint to report/flag a review for moderation review.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  const { id: reviewId } = await params;

  let reason = "inappropriate";
  try {
    const rawBody = await req.json();
    const parsed = FlagReviewSchema.safeParse(rawBody);
    if (parsed.success && parsed.data.reason) {
      reason = parsed.data.reason;
    }
  } catch {
    // Body is optional; fallback to default reason
  }

  const result = reviewsStore.flag(reviewId, auth.user.id, reason);

  if (result.status === "not_found") {
    return NextResponse.json(
      { error: "Not Found", message: "Review not found or has been deleted." },
      { status: 404 }
    );
  }

  if (result.status === "forbidden") {
    return NextResponse.json(
      { error: "Bad Request", message: result.message },
      { status: 400 }
    );
  }

  if (result.status === "conflict") {
    return NextResponse.json(
      { error: "Conflict", message: result.message },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Review reported for moderation. Thank you for helping keep the community safe.",
    flagCount: result.flagCount,
    isFlagged: result.isFlagged,
  });
}
