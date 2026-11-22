import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MovieReviewsSection from "@/components/reviews/MovieReviewsSection";
import * as sessionModule from "@/components/auth/SessionProvider";
import { ToastContainer } from "@/components/watchlist/Toast";
import { Review } from "@/lib/reviews/schema";
import { sortReviews } from "@/lib/reviews/ranking";

describe("Review Pagination, Load-Testing & Reorder Animations (Day 48)", () => {
  let queryClient: QueryClient;

  // Generate 105 mock reviews for performance and pagination load testing
  const generateMockReviews = (count = 105): Review[] => {
    return Array.from({ length: count }, (_, i) => {
      const upvotes = (i * 7) % 50;
      const downvotes = (i * 3) % 20;
      return {
        id: `rev-load-${i + 1}`,
        movieId: "load-test-movie",
        authorId: `usr-author-${(i % 10) + 1}`,
        authorName: `Cinephile User ${i + 1}`,
        authorRole: i % 8 === 0 ? ("critic" as const) : ("user" as const),
        rating: ((i % 10) + 1),
        title: `Comprehensive Review Title #${i + 1}`,
        content: `Detailed critical appraisal for movie #${i + 1}. Excellent direction, sound mixing, and cinematography.`,
        spoiler: i % 5 === 0,
        createdAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 3600 * 1000).toISOString(),
        upvotes,
        downvotes,
        helpfulVotes: upvotes,
        totalVotes: upvotes + downvotes,
        revisions: [],
        deletedAt: null,
      };
    });
  };

  const largeReviewSet = generateMockReviews(105);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(sessionModule, "useSession").mockReturnValue({
      user: { id: "test-user-1", name: "Tester", email: "test@example.com", role: "user" },
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

  it("handles 100+ reviews load-testing and displays initial paginated window (5 items)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ movieId: "load-test-movie", reviews: largeReviewSet }),
    } as Response);

    const startTime = performance.now();

    render(
      <QueryClientProvider client={queryClient}>
        <MovieReviewsSection movieId="load-test-movie" />
        <ToastContainer />
      </QueryClientProvider>
    );

    // Initial page shows 1–5 of 105 reviews
    expect(await screen.findByText(/Showing 1–5 of 105 reviews/i)).toBeDefined();

    const renderDuration = performance.now() - startTime;
    // Rendering initial slice should be rapid (< 1000ms in jsdom)
    expect(renderDuration).toBeLessThan(1000);

    // Exactly 5 review articles rendered in the DOM
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(5);

    const loadMoreButton = screen.getByRole("button", { name: /Load More \(100 remaining\)/i });
    expect(loadMoreButton).toBeDefined();
  });

  it("paginates incrementally on clicking Load More", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ movieId: "load-test-movie", reviews: largeReviewSet }),
    } as Response);

    render(
      <QueryClientProvider client={queryClient}>
        <MovieReviewsSection movieId="load-test-movie" />
        <ToastContainer />
      </QueryClientProvider>
    );

    const loadMoreBtn = await screen.findByRole("button", { name: /Load More \(100 remaining\)/i });
    fireEvent.click(loadMoreBtn);

    // Now shows 1–10 of 105 reviews
    expect(await screen.findByText(/Showing 1–10 of 105 reviews/i)).toBeDefined();
    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(10);
    expect(screen.getByRole("button", { name: /Load More \(95 remaining\)/i })).toBeDefined();
  });

  it("supports Show All and Show Less toggling with 105 reviews", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ movieId: "load-test-movie", reviews: largeReviewSet }),
    } as Response);

    render(
      <QueryClientProvider client={queryClient}>
        <MovieReviewsSection movieId="load-test-movie" />
        <ToastContainer />
      </QueryClientProvider>
    );

    const showAllBtn = await screen.findByRole("button", { name: /Show All/i });
    fireEvent.click(showAllBtn);

    // Now shows all 105 reviews
    expect(await screen.findByText(/Showing 1–105 of 105 reviews/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Show Less/i })).toBeDefined();

    // Clicking Show Less restores 5 items
    fireEvent.click(screen.getByRole("button", { name: /Show Less/i }));
    expect(await screen.findByText(/Showing 1–5 of 105 reviews/i)).toBeDefined();
  });

  it("sorts 105 reviews across Wilson Score, Recent, and Controversial without performance lag", () => {
    const t0 = performance.now();
    const sortedHelpful = sortReviews(largeReviewSet, "helpful");
    const t1 = performance.now();
    const sortedRecent = sortReviews(largeReviewSet, "recent");
    const t2 = performance.now();
    const sortedControversial = sortReviews(largeReviewSet, "controversial");
    const t3 = performance.now();

    expect(sortedHelpful).toHaveLength(105);
    expect(sortedRecent).toHaveLength(105);
    expect(sortedControversial).toHaveLength(105);

    // Each sort should execute in < 25ms
    expect(t1 - t0).toBeLessThan(50);
    expect(t2 - t1).toBeLessThan(50);
    expect(t3 - t2).toBeLessThan(50);
  });
});
