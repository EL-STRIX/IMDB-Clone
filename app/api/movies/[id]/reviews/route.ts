import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { CreateReviewSchema } from "@/lib/reviews/schema";
import { reviewsStore } from "@/lib/reviews/store";
import { reviewRateLimiter } from "@/lib/reviews/rateLimiter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/movies/[id]/reviews
 * Public endpoint to list all active reviews for a movie.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: movieId } = await params;
  const reviews = reviewsStore.listByMovie(movieId);

  return NextResponse.json({
    movieId,
    total: reviews.length,
    reviews,
  });
}

/**
 * POST /api/movies/[id]/reviews
 * Protected endpoint to submit a new review.
 * Protected by authentication, rate limiting (5 req/min), and input validation.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  // 1. Authentication check
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  // 2. Per-user rate limiting check
  const rateLimit = reviewRateLimiter.check(auth.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "You have submitted too many reviews recently. Please wait before posting again.",
        retryAfter: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.resetInSeconds.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const { id: movieId } = await params;

  // 3. Request body parsing & Zod schema validation
  try {
    const rawBody = await req.json();
    const parseResult = CreateReviewSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Review submission contains invalid fields.",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    // 4. Create review with idempotency
    const { review, isDuplicate } = reviewsStore.create(movieId, auth.user, parseResult.data);

    return NextResponse.json(
      {
        success: true,
        message: isDuplicate
          ? "Duplicate submission detected. Returning existing review."
          : "Review created successfully.",
        review,
      },
      {
        status: isDuplicate ? 200 : 201,
        headers: {
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Malformed JSON payload provided.";
    return NextResponse.json(
      {
        error: "Bad Request",
        message,
      },
      { status: 400 }
    );
  }
}
