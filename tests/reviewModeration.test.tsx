import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  containsProfanity,
  findProfanities,
  censorProfanity,
  validateReviewText,
} from "@/lib/reviews/profanityFilter";
import { reviewsStore } from "@/lib/reviews/store";
import { reviewEventBus } from "@/lib/reviews/events";
import { POST as flagRoute } from "@/app/api/reviews/[id]/flag/route";
import { GET as streamRoute } from "@/app/api/movies/[id]/reviews/stream/route";
import MovieReviewsSection from "@/components/reviews/MovieReviewsSection";
import * as sessionModule from "@/components/auth/SessionProvider";
import { ToastContainer } from "@/components/watchlist/Toast";
import { User } from "@/lib/auth/types";
import { NextRequest } from "next/server";

// Mock auth module
vi.mock("@/lib/auth/guards", () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from "@/lib/auth/guards";

describe("Review Content Moderation, Abuse Flagging & SSE Live Updates (Day 47)", () => {
  describe("1. Profanity Filter & Content Moderation Unit Tests", () => {
    it("detects basic vulgarity and slurs", () => {
      expect(containsProfanity("This movie was complete bullshit")).toBe(true);
      expect(containsProfanity("The director is a fucking genius")).toBe(true);
      expect(containsProfanity("What a stupid asshole character")).toBe(true);
    });

    it("detects leetspeak and common obfuscations", () => {
      expect(containsProfanity("b!tch")).toBe(true);
      expect(containsProfanity("@sshole")).toBe(true);
      expect(containsProfanity("f4ck")).toBe(true);
      expect(containsProfanity("sh1t")).toBe(true);
    });

    it("avoids Scunthorpe problem false positives on legitimate cinema discourse", () => {
      expect(containsProfanity("A timeless classic with passionate acting")).toBe(false);
      expect(containsProfanity("The assassin delivered a thrilling climax")).toBe(false);
      expect(containsProfanity("The bass line in the soundtrack was exceptional")).toBe(false);
      expect(containsProfanity("An adaptation of Charles Dickens")).toBe(false);
    });

    it("finds and lists all prohibited words in a text", () => {
      const words = findProfanities("Such a bullshit script by a dumbass director");
      expect(words).toContain("bullshit");
      expect(words).toContain("dumbass");
    });

    it("masks profanities with asterisks", () => {
      const censored = censorProfanity("That was bullshit");
      expect(censored).toContain("b******t");
    });

    it("validates combined review title and content", () => {
      const invalid = validateReviewText("Great movie", "Actually it was total shit");
      expect(invalid.isValid).toBe(false);
      expect(invalid.flaggedWords).toContain("shit");
      expect(invalid.message).toMatch(/inappropriate or abusive language/i);

      const valid = validateReviewText("Mesmerizing thriller", "Brilliant directing and score.");
      expect(valid.isValid).toBe(true);
      expect(valid.flaggedWords).toHaveLength(0);
    });
  });

  describe("2. Abuse Flagging API & Store Integration", () => {
    const authorUser: User = {
      id: "usr-author-1",
      email: "author@example.com",
      name: "Author User",
      role: "user",
    };

    const reviewerUser: User = {
      id: "usr-reviewer-2",
      email: "reviewer@example.com",
      name: "Reviewer Two",
      role: "user",
    };

    const mockMovieId = "1001";
    let testReviewId: string;

    beforeEach(() => {
      reviewsStore.clear();
      const { review } = reviewsStore.create(mockMovieId, authorUser, {
        rating: 8,
        title: "Clean Review Title",
        content: "Engaging and emotional narrative from beginning to end.",
        spoiler: false,
      });
      testReviewId = review.id;
    });

    it("rejects unauthorized flag requests with 401", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        authenticated: false,
        response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) as any,
      });

      const req = new NextRequest("http://localhost/api/reviews/test/flag", { method: "POST" });
      const res = await flagRoute(req, { params: Promise.resolve({ id: testReviewId }) });
      expect(res.status).toBe(401);
    });

    it("prevents authors from reporting their own reviews with 400", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        authenticated: true,
        user: authorUser,
        session: { user: authorUser, expiresAt: Date.now() + 10000 },
      } as any);

      const req = new NextRequest("http://localhost/api/reviews/test/flag", {
        method: "POST",
        body: JSON.stringify({ reason: "spam" }),
      });
      const res = await flagRoute(req, { params: Promise.resolve({ id: testReviewId }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.message).toMatch(/cannot report your own review/i);
    });

    it("allows another user to flag a review and increments flagCount", async () => {
      vi.mocked(requireAuth).mockResolvedValueOnce({
        authenticated: true,
        user: reviewerUser,
        session: { user: reviewerUser, expiresAt: Date.now() + 10000 },
      } as any);

      const req = new NextRequest("http://localhost/api/reviews/test/flag", {
        method: "POST",
        body: JSON.stringify({ reason: "inappropriate" }),
      });
      const res = await flagRoute(req, { params: Promise.resolve({ id: testReviewId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.flagCount).toBe(1);
      expect(data.isFlagged).toBe(false);
    });

    it("prevents duplicate reporting by the same user with 409 Conflict", async () => {
      // First flag succeeds
      reviewsStore.flag(testReviewId, reviewerUser.id, "spam");

      vi.mocked(requireAuth).mockResolvedValueOnce({
        authenticated: true,
        user: reviewerUser,
        session: { user: reviewerUser, expiresAt: Date.now() + 10000 },
      } as any);

      const req = new NextRequest("http://localhost/api/reviews/test/flag", {
        method: "POST",
        body: JSON.stringify({ reason: "spam" }),
      });
      const res = await flagRoute(req, { params: Promise.resolve({ id: testReviewId }) });
      expect(res.status).toBe(409);
    });

    it("automatically sets isFlagged: true when 3 unique users report the review", () => {
      const u1 = "user-flag-1";
      const u2 = "user-flag-2";
      const u3 = "user-flag-3";

      const res1 = reviewsStore.flag(testReviewId, u1);
      expect(res1.status).toBe("success");
      if (res1.status === "success") {
        expect(res1.flagCount).toBe(1);
        expect(res1.isFlagged).toBe(false);
      }

      const res2 = reviewsStore.flag(testReviewId, u2);
      expect(res2.status).toBe("success");
      if (res2.status === "success") {
        expect(res2.flagCount).toBe(2);
        expect(res2.isFlagged).toBe(false);
      }

      const res3 = reviewsStore.flag(testReviewId, u3);
      expect(res3.status).toBe("success");
      if (res3.status === "success") {
        expect(res3.flagCount).toBe(3);
        expect(res3.isFlagged).toBe(true);
      }
    });
  });

  describe("3. Server-Sent Events (SSE) Route & Event Bus", () => {
    it("subscribes and receives broadcast events through reviewEventBus", () => {
      const movieId = "sse-test-movie";
      const eventsReceived: any[] = [];

      const unsubscribe = reviewEventBus.subscribe(movieId, (event) => {
        eventsReceived.push(event);
      });

      reviewEventBus.emit(movieId, {
        type: "create",
        reviewId: "rev-new",
        data: { title: "SSE Works" },
      });

      expect(eventsReceived).toHaveLength(1);
      expect(eventsReceived[0].type).toBe("create");
      expect(eventsReceived[0].movieId).toBe(movieId);

      unsubscribe();
      reviewEventBus.emit(movieId, {
        type: "vote",
        reviewId: "rev-new",
      });
      // Listener should not receive after unsubscribe
      expect(eventsReceived).toHaveLength(1);
    });

    it("returns text/event-stream headers from SSE stream route handler", async () => {
      const req = new NextRequest("http://localhost/api/movies/200/reviews/stream");
      const res = await streamRoute(req, { params: Promise.resolve({ id: "200" }) });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);
      expect(res.headers.get("cache-control")).toMatch(/no-cache/);
    });
  });

  describe("4. UI Integration: Flagging & Moderation Content Warning", () => {
    let queryClient: QueryClient;

    const currentUser: User = {
      id: "usr-viewer-99",
      email: "viewer@example.com",
      name: "Viewer Cinephile",
      role: "user",
    };

    const flaggedReview = {
      id: "rev-flagged-1",
      movieId: "550",
      authorId: "usr-other-22",
      authorName: "Questionable User",
      authorRole: "user" as const,
      rating: 2,
      title: "Highly Inappropriate Title",
      content: "This content was flagged by multiple community members.",
      spoiler: false,
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
      upvotes: 0,
      downvotes: 12,
      helpfulVotes: 0,
      totalVotes: 12,
      revisions: [],
      flagCount: 3,
      isFlagged: true,
      deletedAt: null,
    };

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      vi.stubGlobal("fetch", vi.fn());
      vi.spyOn(sessionModule, "useSession").mockReturnValue({
        user: currentUser,
        status: "authenticated",
        isAuthenticated: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
        refreshSession: vi.fn(),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("renders moderation warning overlay for reviews with isFlagged: true", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ movieId: "550", reviews: [flaggedReview] }),
      } as Response);

      render(
        <QueryClientProvider client={queryClient}>
          <MovieReviewsSection movieId="550" />
          <ToastContainer />
        </QueryClientProvider>
      );

      // Moderation warning should be visible
      expect(await screen.findByText(/Flagged for moderation/i)).toBeDefined();
      expect(screen.getByText(/Multiple community members reported this review/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /Show Review/i })).toBeDefined();

      // Title & Content should be hidden initially behind warning
      expect(screen.queryByText("Highly Inappropriate Title")).toBeNull();

      // Clicking "Show Review" reveals the content
      fireEvent.click(screen.getByRole("button", { name: /Show Review/i }));

      expect(screen.getByText("Highly Inappropriate Title")).toBeDefined();
      expect(screen.getByText(/This content was flagged by multiple community members/i)).toBeDefined();
      expect(screen.getByRole("button", { name: /Hide Review/i })).toBeDefined();

      // Clicking "Hide Review" re-collapses the warning
      fireEvent.click(screen.getByRole("button", { name: /Hide Review/i }));
      expect(screen.queryByText("Highly Inappropriate Title")).toBeNull();
    });

    it("shows report button for non-author reviews and triggers flag mutation", async () => {
      const normalReview = {
        ...flaggedReview,
        id: "rev-normal-2",
        title: "Clean Public Review",
        content: "Decent acting and direction.",
        flagCount: 0,
        isFlagged: false,
      };

      vi.mocked(fetch).mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes("/api/movies/550/reviews")) {
          return {
            ok: true,
            json: async () => ({ movieId: "550", reviews: [normalReview] }),
          } as Response;
        }
        if (urlStr.includes("/api/reviews/rev-normal-2/flag")) {
          return {
            ok: true,
            json: async () => ({ success: true, flagCount: 1, isFlagged: false }),
          } as Response;
        }
        return { ok: false } as Response;
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MovieReviewsSection movieId="550" />
          <ToastContainer />
        </QueryClientProvider>
      );

      // Report button should be visible for non-author
      const reportButton = await screen.findByRole("button", {
        name: /Report review by Questionable User/i,
      });
      expect(reportButton).toBeDefined();

      fireEvent.click(reportButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/reviews/rev-normal-2/flag"),
          expect.objectContaining({ method: "POST" })
        );
      });
    });
  });
});
