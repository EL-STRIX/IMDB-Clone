import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// In-memory mock reviews store for movie reviews
interface ReviewRecord {
  id: string;
  movieId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  rating: number; // 1 to 10
  title: string;
  content: string;
  createdAt: string;
}

const mockReviewsStore: ReviewRecord[] = [
  {
    id: "rev-sample-1",
    movieId: "550",
    authorId: "usr-critic-101",
    authorName: "Eleanor Vance (Top Critic)",
    authorRole: "critic",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    rating: 9,
    title: "A mesmerizing descent into psychological anarchy",
    content: "David Fincher directs with surgical precision. The narrative momentum is unyielding and Norton and Pitt deliver career-defining performances.",
    createdAt: "2026-01-15T14:30:00.000Z",
  },
];

/**
 * GET: Publicly read reviews for a movie
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const reviews = mockReviewsStore.filter((r) => r.movieId === id);

  return NextResponse.json({
    movieId: id,
    total: reviews.length,
    reviews,
  });
}

/**
 * POST: Write a review (Strictly protected by authentication)
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  // 1. Guard check: Require authentication
  const auth = await requireAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  const { id: movieId } = await params;

  try {
    const body = await req.json();
    const { rating, title, content } = body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: "Validation Error", message: "Rating must be a number between 1 and 10." },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation Error", message: "Review headline/title is required." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Validation Error", message: "Review content must be at least 10 characters." },
        { status: 400 }
      );
    }

    const newReview: ReviewRecord = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      movieId,
      authorId: auth.user.id,
      authorName: auth.user.name,
      authorRole: auth.user.role,
      authorAvatar: auth.user.image,
      rating,
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    mockReviewsStore.unshift(newReview);

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully.",
        review: newReview,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid review request payload." },
      { status: 400 }
    );
  }
}
