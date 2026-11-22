import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  calculateWilsonScore,
  calculateControversyScore,
  sortReviews,
} from "@/lib/reviews/ranking";
import { Review } from "@/lib/reviews/schema";
import { reviewsStore } from "@/lib/reviews/store";
import { createSessionToken, SESSION_COOKIE_NAME, DEMO_USERS } from "@/lib/auth/session";
import { POST as voteReview } from "@/app/api/reviews/[id]/vote/route";

describe("Review Voting, Wilson Score & Ranking (Day 45)", () => {
  describe("Wilson Score Lower Bound", () => {
    it("returns 0 when there are no votes", () => {
      expect(calculateWilsonScore(0, 0)).toBe(0);
    });

    it("ranks statistically confident positive reviews above single-vote reviews (e.g. 95/100 vs 1/1)", () => {
      // 1 upvote, 0 downvotes (100% positive, but low statistical confidence)
      const singleVoteScore = calculateWilsonScore(1, 0);

      // 95 upvotes, 5 downvotes (95% positive, but high statistical confidence)
      const highVolumeScore = calculateWilsonScore(95, 5);

      // Wilson lower bound correctly elevates the high confidence item
      expect(highVolumeScore).toBeGreaterThan(singleVoteScore);
    });

    it("ranks 100 positive votes higher than 10 positive votes", () => {
      const score10 = calculateWilsonScore(10, 0);
      const score100 = calculateWilsonScore(100, 0);
      expect(score100).toBeGreaterThan(score10);
    });
  });

  describe("Controversy Score Calculation", () => {
    it("assigns higher controversy to reviews with close up/down splits and high volume", () => {
      // 50 upvotes, 50 downvotes -> equally split, high controversy
      const splitScore = calculateControversyScore(50, 50);

      // 95 upvotes, 5 downvotes -> consensus, low controversy
      const consensusScore = calculateControversyScore(95, 5);

      expect(splitScore).toBeGreaterThan(consensusScore);
    });

    it("scores 0 or near-0 for reviews with fewer than 2 votes", () => {
      expect(calculateControversyScore(1, 0)).toBe(0);
      expect(calculateControversyScore(0, 0)).toBe(0);
    });
  });

  describe("sortReviews Functionality", () => {
    const mockReviews: Review[] = [
      {
        id: "r-recent",
        movieId: "550",
        authorId: "u1",
        authorName: "Recent Author",
        authorRole: "user",
        rating: 8,
        title: "Recent Review",
        content: "Just posted a moment ago.",
        spoiler: false,
        createdAt: "2026-03-01T15:00:00.000Z",
        updatedAt: "2026-03-01T15:00:00.000Z",
        upvotes: 2,
        downvotes: 0,
        helpfulVotes: 2,
        totalVotes: 2,
      },
      {
        id: "r-helpful",
        movieId: "550",
        authorId: "u2",
        authorName: "Top Critic",
        authorRole: "critic",
        rating: 9,
        title: "Very Helpful Review",
        content: "Extensive breakdown praised by everyone.",
        spoiler: false,
        createdAt: "2026-01-01T10:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
        upvotes: 150,
        downvotes: 4,
        helpfulVotes: 150,
        totalVotes: 154,
      },
      {
        id: "r-controversial",
        movieId: "550",
        authorId: "u3",
        authorName: "Controversial Reviewer",
        authorRole: "user",
        rating: 5,
        title: "Divisive Perspective",
        content: "Polarizing thoughts that split the audience.",
        spoiler: false,
        createdAt: "2026-02-01T10:00:00.000Z",
        updatedAt: "2026-02-01T10:00:00.000Z",
        upvotes: 50,
        downvotes: 48,
        helpfulVotes: 50,
        totalVotes: 98,
      },
    ];

    it("sorts by helpfulness (Wilson score) putting highly validated reviews first", () => {
      const sorted = sortReviews(mockReviews, "helpful");
      expect(sorted[0].id).toBe("r-helpful");
    });

    it("sorts by most recent first", () => {
      const sorted = sortReviews(mockReviews, "recent");
      expect(sorted[0].id).toBe("r-recent");
      expect(sorted[1].id).toBe("r-controversial");
      expect(sorted[2].id).toBe("r-helpful");
    });

    it("sorts by controversy putting evenly split polarized reviews first", () => {
      const sorted = sortReviews(mockReviews, "controversial");
      expect(sorted[0].id).toBe("r-controversial");
    });
  });

  describe("POST /api/reviews/[id]/vote (Voting API)", () => {
    beforeEach(() => {
      reviewsStore.seedDefaults();
    });

    it("returns 401 Unauthorized when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: "up" }),
      });

      const res = await voteReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 400 when invalid vote payload is provided", async () => {
      const user = DEMO_USERS.cinephile;
      const token = await createSessionToken(user);

      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({ vote: "invalid_vote_type" }),
      });

      const res = await voteReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(400);
    });

    it("successfully casts an upvote and increments upvotes counter", async () => {
      const user = DEMO_USERS.cinephile;
      const token = await createSessionToken(user);

      const initial = reviewsStore.getById("rev-sample-1");
      const initialUp = initial?.upvotes || 0;

      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({ vote: "up" }),
      });

      const res = await voteReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.userVote).toBe("up");
      expect(data.review.upvotes).toBe(initialUp + 1);
    });

    it("toggles off vote when voting the same option twice", async () => {
      const user = DEMO_USERS.cinephile;
      const token = await createSessionToken(user);

      const initial = reviewsStore.getById("rev-sample-1");
      const initialUp = initial?.upvotes || 0;

      const makeVoteReq = (vote: string) =>
        new NextRequest("http://localhost:3000/api/reviews/rev-sample-1/vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `${SESSION_COOKIE_NAME}=${token}`,
          },
          body: JSON.stringify({ vote }),
        });

      // Vote 1: Up
      await voteReview(makeVoteReq("up"), { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(reviewsStore.getById("rev-sample-1")?.upvotes).toBe(initialUp + 1);

      // Vote 2: Up again (toggle off)
      const res2 = await voteReview(makeVoteReq("up"), {
        params: Promise.resolve({ id: "rev-sample-1" }),
      });
      const data2 = await res2.json();
      expect(data2.userVote).toBeNull();
      expect(data2.review.upvotes).toBe(initialUp);
    });

    it("switches vote from up to down correctly adjusting counters", async () => {
      const user = DEMO_USERS.cinephile;
      const token = await createSessionToken(user);

      const initial = reviewsStore.getById("rev-sample-1");
      const initialUp = initial?.upvotes || 0;
      const initialDown = initial?.downvotes || 0;

      const makeVoteReq = (vote: string) =>
        new NextRequest("http://localhost:3000/api/reviews/rev-sample-1/vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `${SESSION_COOKIE_NAME}=${token}`,
          },
          body: JSON.stringify({ vote }),
        });

      // 1. Vote up
      await voteReview(makeVoteReq("up"), { params: Promise.resolve({ id: "rev-sample-1" }) });

      // 2. Switch directly to down
      const res = await voteReview(makeVoteReq("down"), {
        params: Promise.resolve({ id: "rev-sample-1" }),
      });
      const data = await res.json();

      expect(data.userVote).toBe("down");
      expect(data.review.upvotes).toBe(initialUp); // removed previous upvote
      expect(data.review.downvotes).toBe(initialDown + 1); // added downvote
    });
  });
});
