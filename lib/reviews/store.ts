import { Review, CreateReviewInput, UpdateReviewInput } from "./schema";
import { User } from "@/lib/auth/types";

class ReviewsStore {
  private reviews = new Map<string, Review>();
  private processedIdempotencyKeys = new Map<string, Review>();
  private userVotes = new Map<string, "up" | "down">(); // key: `${reviewId}_${userId}`

  constructor() {
    this.seedDefaults();
  }

  seedDefaults(): void {
    this.reviews.clear();
    this.processedIdempotencyKeys.clear();
    this.userVotes.clear();

    const sampleReview: Review = {
      id: "rev-sample-1",
      movieId: "550",
      authorId: "usr-critic-101",
      authorName: "Eleanor Vance (Top Critic)",
      authorRole: "critic",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
      rating: 9,
      title: "A mesmerizing descent into psychological anarchy",
      content: "David Fincher directs with surgical precision. The narrative momentum is unyielding and Norton and Pitt deliver career-defining performances.",
      spoiler: false,
      createdAt: "2026-01-15T14:30:00.000Z",
      updatedAt: "2026-01-15T14:30:00.000Z",
      upvotes: 42,
      downvotes: 3,
      helpfulVotes: 42,
      totalVotes: 45,
      deletedAt: null,
    };

    this.reviews.set(sampleReview.id, sampleReview);
  }

  /**
   * Retrieves all non-deleted reviews for a given movie, optionally injecting current user's vote.
   */
  listByMovie(movieId: string, currentUserId?: string): Review[] {
    return Array.from(this.reviews.values())
      .filter((r) => r.movieId === movieId && !r.deletedAt)
      .map((r) => {
        if (!currentUserId) return r;
        const userVote = this.getUserVote(r.id, currentUserId);
        return { ...r, userVote };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Retrieves a single review by ID.
   */
  getById(reviewId: string, currentUserId?: string): Review | null {
    const review = this.reviews.get(reviewId);
    if (!review || review.deletedAt) {
      return null;
    }
    if (!currentUserId) return review;
    return { ...review, userVote: this.getUserVote(reviewId, currentUserId) };
  }

  /**
   * Gets an existing user vote on a review.
   */
  getUserVote(reviewId: string, userId: string): "up" | "down" | null {
    return this.userVotes.get(`${reviewId}_${userId}`) || null;
  }

  /**
   * Casts, switches, or toggles an upvote/downvote on a review.
   */
  vote(
    reviewId: string,
    userId: string,
    targetVote: "up" | "down" | "none"
  ): { status: "success"; review: Review; userVote: "up" | "down" | null } | { status: "not_found" } {
    const existing = this.reviews.get(reviewId);
    if (!existing || existing.deletedAt) {
      return { status: "not_found" };
    }

    const voteKey = `${reviewId}_${userId}`;
    const previousVote = this.userVotes.get(voteKey) || null;

    let upvotes = existing.upvotes ?? existing.helpfulVotes ?? 0;
    let downvotes = existing.downvotes ?? 0;
    let newVote: "up" | "down" | null = null;

    // Toggle off if same vote clicked or "none" requested
    if (targetVote === previousVote || targetVote === "none") {
      if (previousVote === "up") upvotes -= 1;
      if (previousVote === "down") downvotes -= 1;
      this.userVotes.delete(voteKey);
      newVote = null;
    } else if (targetVote === "up") {
      if (previousVote === "down") downvotes -= 1;
      upvotes += 1;
      this.userVotes.set(voteKey, "up");
      newVote = "up";
    } else if (targetVote === "down") {
      if (previousVote === "up") upvotes -= 1;
      downvotes += 1;
      this.userVotes.set(voteKey, "down");
      newVote = "down";
    }

    upvotes = Math.max(0, upvotes);
    downvotes = Math.max(0, downvotes);

    const updated: Review = {
      ...existing,
      upvotes,
      downvotes,
      helpfulVotes: upvotes,
      totalVotes: upvotes + downvotes,
      userVote: newVote,
      updatedAt: new Date().toISOString(),
    };

    this.reviews.set(reviewId, updated);
    return { status: "success", review: updated, userVote: newVote };
  }

  /**
   * Creates a new review with author and idempotency protection.
   */
  create(movieId: string, author: User, input: CreateReviewInput): { review: Review; isDuplicate: boolean } {
    if (input.idempotencyKey && this.processedIdempotencyKeys.has(input.idempotencyKey)) {
      return {
        review: this.processedIdempotencyKeys.get(input.idempotencyKey)!,
        isDuplicate: true,
      };
    }

    const now = new Date().toISOString();
    const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const review: Review = {
      id,
      movieId,
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role,
      authorAvatar: author.image,
      rating: input.rating,
      title: input.title,
      content: input.content,
      spoiler: !!input.spoiler,
      createdAt: now,
      updatedAt: now,
      upvotes: 0,
      downvotes: 0,
      helpfulVotes: 0,
      totalVotes: 0,
      deletedAt: null,
    };

    this.reviews.set(id, review);

    if (input.idempotencyKey) {
      this.processedIdempotencyKeys.set(input.idempotencyKey, review);
    }

    return { review, isDuplicate: false };
  }

  /**
   * Updates an existing review if requester is author or admin.
   */
  update(
    reviewId: string,
    author: User,
    patch: UpdateReviewInput
  ): { status: "success"; review: Review } | { status: "not_found" } | { status: "forbidden" } {
    const existing = this.reviews.get(reviewId);
    if (!existing || existing.deletedAt) {
      return { status: "not_found" };
    }

    if (existing.authorId !== author.id && author.role !== "admin") {
      return { status: "forbidden" };
    }

    const updated: Review = {
      ...existing,
      rating: patch.rating !== undefined ? patch.rating : existing.rating,
      title: patch.title !== undefined ? patch.title : existing.title,
      content: patch.content !== undefined ? patch.content : existing.content,
      spoiler: patch.spoiler !== undefined ? patch.spoiler : existing.spoiler,
      updatedAt: new Date().toISOString(),
    };

    this.reviews.set(reviewId, updated);
    return { status: "success", review: updated };
  }

  /**
   * Soft-deletes a review if requester is author or admin.
   */
  delete(
    reviewId: string,
    author: User
  ): { status: "success"; review: Review } | { status: "not_found" } | { status: "forbidden" } {
    const existing = this.reviews.get(reviewId);
    if (!existing || existing.deletedAt) {
      return { status: "not_found" };
    }

    if (existing.authorId !== author.id && author.role !== "admin") {
      return { status: "forbidden" };
    }

    const softDeleted: Review = {
      ...existing,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reviews.set(reviewId, softDeleted);
    return { status: "success", review: softDeleted };
  }

  /**
   * Restores a soft-deleted review (used for Undo).
   */
  restore(reviewId: string, author: User): boolean {
    const existing = this.reviews.get(reviewId);
    if (!existing || !existing.deletedAt) return false;
    if (existing.authorId !== author.id && author.role !== "admin") return false;

    this.reviews.set(reviewId, {
      ...existing,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  clear(): void {
    this.reviews.clear();
    this.processedIdempotencyKeys.clear();
    this.userVotes.clear();
  }
}

export const reviewsStore = new ReviewsStore();
