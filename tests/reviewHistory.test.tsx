import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextRequest } from "next/server";
import { reviewsStore } from "@/lib/reviews/store";
import { createSessionToken, SESSION_COOKIE_NAME, DEMO_USERS } from "@/lib/auth/session";
import { PATCH as patchReview, DELETE as deleteReview } from "@/app/api/reviews/[id]/route";
import { POST as restoreReview } from "@/app/api/reviews/[id]/restore/route";
import { GET as getReviewHistory } from "@/app/api/reviews/[id]/history/route";
import MovieReviewsSection from "@/components/reviews/MovieReviewsSection";
import { ToastContainer, clearToasts } from "@/components/watchlist/Toast";
import * as sessionModule from "@/components/auth/SessionProvider";
import { Review } from "@/lib/reviews/schema";

describe("Review Soft-Delete, Timed Undo & Revision History (Day 46)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearToasts();
    reviewsStore.seedDefaults();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.spyOn(sessionModule, "useSession").mockReturnValue({
      user: DEMO_USERS.critic,
      status: "authenticated",
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    });
  });

  afterEach(() => {
    clearToasts();
  });

  function renderWithProviders(ui: React.ReactElement) {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
        <ToastContainer />
      </QueryClientProvider>
    );
  }

  describe("API Revision History & Soft-Delete Operations", () => {
    it("preserves previous version in revision history upon editing a review", async () => {
      const token = await createSessionToken(DEMO_USERS.critic);

      // 1. Initial review: title is "A mesmerizing descent into psychological anarchy", rating 9
      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          rating: 10,
          title: "Revised: Perfect psychological anarchy",
          content: "Updated comprehensive analysis after rewatching in IMAX 4K.",
        }),
      });

      const res = await patchReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(200);

      // 2. Fetch history endpoint
      const histReq = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1/history", {
        method: "GET",
      });
      const histRes = await getReviewHistory(histReq, {
        params: Promise.resolve({ id: "rev-sample-1" }),
      });
      expect(histRes.status).toBe(200);

      const histData = await histRes.json();
      expect(histData.revisions.length).toBe(1);
      expect(histData.revisions[0].rating).toBe(9);
      expect(histData.revisions[0].title).toBe("A mesmerizing descent into psychological anarchy");
      expect(histData.current.rating).toBe(10);
      expect(histData.current.title).toBe("Revised: Perfect psychological anarchy");
    });

    it("soft-deletes review and allows restoration via restore endpoint", async () => {
      const token = await createSessionToken(DEMO_USERS.critic);

      // 1. Soft-delete review
      const delReq = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1", {
        method: "DELETE",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });
      const delRes = await deleteReview(delReq, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(delRes.status).toBe(200);

      // 2. Confirm it is hidden from movie reviews list
      const listAfterDelete = reviewsStore.listByMovie("550");
      expect(listAfterDelete.find((r) => r.id === "rev-sample-1")).toBeUndefined();

      // 3. Restore review
      const restReq = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1/restore", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });
      const restRes = await restoreReview(restReq, {
        params: Promise.resolve({ id: "rev-sample-1" }),
      });
      expect(restRes.status).toBe(200);

      const restData = await restRes.json();
      expect(restData.success).toBe(true);

      // 4. Confirm it is back in movie reviews list
      const listAfterRestore = reviewsStore.listByMovie("550");
      expect(listAfterRestore.find((r) => r.id === "rev-sample-1")).toBeDefined();
    });

    it("prevents unauthorized users from restoring deleted review", async () => {
      // First soft-delete the review by author (critic)
      reviewsStore.delete("rev-sample-1", DEMO_USERS.critic);

      // Cinephile user attempting to restore critic's review
      const token = await createSessionToken(DEMO_USERS.cinephile);

      const req = new NextRequest("http://localhost:3000/api/reviews/rev-sample-1/restore", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });

      const res = await restoreReview(req, { params: Promise.resolve({ id: "rev-sample-1" }) });
      expect(res.status).toBe(403);
    });
  });

  describe("UI Component Integration: Delete with Undo Toast & Edit History Modal", () => {
    const sampleEditedReview: Review = {
      id: "rev-test-edited",
      movieId: "550",
      authorId: DEMO_USERS.critic.id,
      authorName: DEMO_USERS.critic.name,
      authorRole: "critic",
      rating: 10,
      title: "Updated Title",
      content: "Current review content.",
      spoiler: false,
      createdAt: "2026-01-01T10:00:00.000Z",
      updatedAt: "2026-01-02T12:00:00.000Z",
      helpfulVotes: 5,
      totalVotes: 5,
      upvotes: 5,
      downvotes: 0,
      deletedAt: null,
      revisions: [
        {
          id: "hist-1",
          timestamp: "2026-01-01T10:00:00.000Z",
          rating: 8,
          title: "Initial Title",
          content: "Original text before edit.",
          spoiler: false,
        },
      ],
    };

    it("displays (edited) button when revisions exist and opens history modal on click", async () => {
      queryClient.setQueryData<Review[]>(["movie-reviews", "550"], [sampleEditedReview]);

      renderWithProviders(<MovieReviewsSection movieId="550" />);

      // Find (edited) button
      const editedBtn = await screen.findByRole("button", { name: /\(edited\)/i });
      expect(editedBtn).toBeDefined();

      // Click to open history modal
      fireEvent.click(editedBtn);

      expect(await screen.findByRole("dialog")).toBeDefined();
      expect(screen.getByText(/Current Version/i)).toBeDefined();
      expect(screen.getByText("Version 1")).toBeDefined();
      expect(screen.getByText("Initial Title")).toBeDefined();
      expect(screen.getByText("Original text before edit.")).toBeDefined();

      // Close modal
      const closeBtn = screen.getByRole("button", { name: "Close" });
      fireEvent.click(closeBtn);
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    });

    it("soft-deletes review with timed Undo toast and restores when Undo is clicked", async () => {
      let currentReviews: Review[] = [sampleEditedReview];
      queryClient.setQueryData<Review[]>(["movie-reviews", "550"], currentReviews);

      // Mock DELETE and POST /restore endpoints
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        const u = typeof url === "string" ? url : url.toString();

        if (u.includes("/api/reviews/rev-test-edited/restore") && init?.method === "POST") {
          currentReviews = [sampleEditedReview];
          return new Response(JSON.stringify({ success: true, review: sampleEditedReview }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (u.includes("/api/reviews/rev-test-edited") && init?.method === "DELETE") {
          currentReviews = [];
          return new Response(JSON.stringify({ success: true, review: sampleEditedReview }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (u.includes("/api/movies/550/reviews")) {
          return new Response(JSON.stringify({ reviews: currentReviews }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(null, { status: 404 });
      });

      renderWithProviders(<MovieReviewsSection movieId="550" />);

      expect(await screen.findByText("Updated Title")).toBeDefined();

      // Click delete button
      const deleteBtn = screen.getByRole("button", { name: /Delete review "Updated Title"/i });
      fireEvent.click(deleteBtn);

      // Toast appears with Undo button
      await waitFor(() => {
        expect(screen.getByText(/Deleted "Updated Title"/i)).toBeDefined();
        expect(screen.getByRole("button", { name: "Undo" })).toBeDefined();
      });

      // Review was optimistically removed from UI
      await waitFor(() => {
        expect(screen.queryByText("Updated Title")).toBeNull();
      });

      // Click Undo
      const undoBtn = screen.getByRole("button", { name: "Undo" });
      fireEvent.click(undoBtn);

      await waitFor(() => {
        expect(screen.getByText("Review restored successfully!")).toBeDefined();
      });
    });
  });
});
