import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE_NAME, DEMO_USERS } from "@/lib/auth/session";
import { reviewsStore } from "@/lib/reviews/store";
import { reviewRateLimiter } from "@/lib/reviews/rateLimiter";
import { GET as getMovieReviews, POST as postMovieReview } from "@/app/api/movies/[id]/reviews/route";
import {
  GET as getReviewById,
  PATCH as patchReview,
  DELETE as deleteReview,
} from "@/app/api/reviews/[id]/route";

describe("Review CRUD API & Rate Limiting (Day 42)", () => {
  beforeEach(() => {
    reviewsStore.seedDefaults();
    reviewRateLimiter.reset();
  });

  describe("POST /api/movies/[id]/reviews (Create)", () => {
    it("returns 401 Unauthorized when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: 8,
          title: "Great psychological thriller",
          content: "Enjoyed every minute of this iconic film.",
        }),
      });

      const res = await postMovieReview(req, { params: Promise.resolve({ id: "550" }) });
      expect(res.status).toBe(401);
    });

    it("returns 400 Validation Error on invalid rating (> 10 or < 1)", async () => {
      const user = DEMO_USERS.critic;
      const token = await createSessionToken(user);

      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          rating: 15, // Invalid rating
          title: "Superb movie",
          content: "Valid length content that is long enough.",
        }),
      });

      const res = await postMovieReview(req, { params: Promise.resolve({ id: "550" }) });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBe("Validation Error");
      expect(data.details.rating).toBeDefined();
    });

    it("returns 400 Validation Error on content shorter than 10 characters", async () => {
      const user = DEMO_USERS.critic;
      const token = await createSessionToken(user);

      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          rating: 8,
          title: "Good title",
          content: "Too short", // < 10 chars
        }),
      });

      const res = await postMovieReview(req, { params: Promise.resolve({ id: "550" }) });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.details.content).toBeDefined();
    });

    it("successfully creates a review and returns 201 Created", async () => {
      const user = DEMO_USERS.critic;
      const token = await createSessionToken(user);

      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          rating: 9,
          title: "Fincher at his absolute best",
          content: "A masterclass in modern editing, dark narrative flow, and iconic cinematography.",
          spoiler: true,
        }),
      });

      const res = await postMovieReview(req, { params: Promise.resolve({ id: "550" }) });
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.review.authorId).toBe(user.id);
      expect(data.review.authorName).toBe(user.name);
      expect(data.review.rating).toBe(9);
      expect(data.review.spoiler).toBe(true);
    });

    it("deduplicates submissions with identical idempotencyKey", async () => {
      const user = DEMO_USERS.cinephile;
      const token = await createSessionToken(user);
      const idempotencyKey = "uuid-idempotency-12345";

      const makeRequest = () =>
        new NextRequest("http://localhost:3000/api/movies/550/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `${SESSION_COOKIE_NAME}=${token}`,
          },
          body: JSON.stringify({
            rating: 8,
            title: "Idempotent review test",
            content: "Checking that double submissions return existing review.",
            idempotencyKey,
          }),
        });

      const res1 = await postMovieReview(makeRequest(), { params: Promise.resolve({ id: "550" }) });
      expect(res1.status).toBe(201);
      const data1 = await res1.json();

      const res2 = await postMovieReview(makeRequest(), { params: Promise.resolve({ id: "550" }) });
      expect(res2.status).toBe(200); // Idempotent 200
      const data2 = await res2.json();

      expect(data2.review.id).toBe(data1.review.id);
    });

    it("enforces per-user rate limit (returns 429 Too Many Requests after 5 submissions)", async () => {
      const user = DEMO_USERS.critic;
      const token = await createSessionToken(user);

      // Submit 5 reviews to exhaust quota
      for (let i = 0; i < 5; i++) {
        const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `${SESSION_COOKIE_NAME}=${token}`,
          },
          body: JSON.stringify({
            rating: 8,
            title: `Review ${i + 1}`,
            content: "Solid performance and thrilling story throughout.",
          }),
        });
        const res = await postMovieReview(req, { params: Promise.resolve({ id: "550" }) });
        expect(res.status).toBe(201);
      }

      // 6th submission should trigger 429 rate limit
      const blockedReq = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          rating: 8,
          title: "6th review attempt",
          content: "This request should be throttled by rate limiter.",
        }),
      });

      const blockedRes = await postMovieReview(blockedReq, { params: Promise.resolve({ id: "550" }) });
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("Retry-After")).toBeDefined();

      const blockedData = await blockedRes.json();
      expect(blockedData.error).toBe("Too Many Requests");
    });
  });

  describe("GET /api/movies/[id]/reviews (List)", () => {
    it("publicly lists reviews for a movie", async () => {
      const req = new NextRequest("http://localhost:3000/api/movies/550/reviews", {
        method: "GET",
      });

      const res = await getMovieReviews(req, { params: Promise.resolve({ id: "550" }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.movieId).toBe("550");
      expect(data.reviews.length).toBeGreaterThanOrEqual(1);
      expect(data.reviews[0].id).toBe("rev-sample-1");
    });
  });

  describe("PATCH /api/reviews/[id] (Edit)", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Title" }),
      });

      const res = await patchReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(401);
    });

    it("returns 403 Forbidden when user is not the author", async () => {
      // rev-sample-1 author is DEMO_USERS.critic (usr-critic-101)
      // Try editing with DEMO_USERS.cinephile (usr-cinephile-202)
      const token = await createSessionToken(DEMO_USERS.cinephile);

      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({ title: "Unauthorized Edit Attempt" }),
      });

      const res = await patchReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(403);
    });

    it("returns 404 when review does not exist", async () => {
      const token = await createSessionToken(DEMO_USERS.critic);

      const req = new NextRequest("http://localhost:3000/api/reviews/non-existent-rev", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({ title: "Updated Title" }),
      });

      const res = await patchReview(req, { params: Promise.resolve({ id: "non-existent-rev" }) });
      expect(res.status).toBe(404);
    });

    it("allows the author to update title, rating, and content", async () => {
      const token = await createSessionToken(DEMO_USERS.critic);

      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          rating: 10,
          title: "Revised: Absolute 10/10 Masterpiece",
        }),
      });

      const res = await patchReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.review.rating).toBe(10);
      expect(data.review.title).toBe("Revised: Absolute 10/10 Masterpiece");
    });
  });

  describe("DELETE /api/reviews/[id] (Delete)", () => {
    it("returns 403 Forbidden when user is not the author", async () => {
      const token = await createSessionToken(DEMO_USERS.cinephile);

      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1", {
        method: "DELETE",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const res = await deleteReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(403);
    });

    it("allows author to delete review and removes it from listByMovie", async () => {
      const token = await createSessionToken(DEMO_USERS.critic);

      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1", {
        method: "DELETE",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const res = await deleteReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(200);

      // Verify it's no longer returned in listByMovie
      const remaining = reviewsStore.listByMovie("550");
      expect(remaining.find((r) => r.id === "rev-sample-1")).toBeUndefined();
    });
  });
});
