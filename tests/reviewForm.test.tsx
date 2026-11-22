import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReviewForm from "@/components/reviews/ReviewForm";
import MovieReviewsSection from "@/components/reviews/MovieReviewsSection";
import { ToastContainer, clearToasts } from "@/components/watchlist/Toast";
import * as sessionModule from "@/components/auth/SessionProvider";
import { DEMO_USERS } from "@/lib/auth/session";
import { Review } from "@/lib/reviews/schema";

describe("ReviewForm & Optimistic Submission (Day 43)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearToasts();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
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

  it("renders sign-in callout when user is unauthenticated", () => {
    vi.spyOn(sessionModule, "useSession").mockReturnValue({
      user: null,
      status: "unauthenticated",
      isAuthenticated: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    });

    renderWithProviders(<ReviewForm movieId="550" />);

    expect(screen.getByText("Share your verdict")).toBeDefined();
    expect(screen.getByText("Sign in via Navbar to write a review")).toBeDefined();
  });

  it("opens review form when authenticated user clicks Write a Review", () => {
    vi.spyOn(sessionModule, "useSession").mockReturnValue({
      user: DEMO_USERS.critic,
      status: "authenticated",
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    });

    renderWithProviders(<ReviewForm movieId="550" />);

    const openBtn = screen.getByRole("button", {
      name: /Write a Review as Eleanor Vance/i,
    });
    fireEvent.click(openBtn);

    expect(screen.getByRole("form", { name: "Write a movie review" })).toBeDefined();
    expect(screen.getByLabelText(/Headline/i)).toBeDefined();
    expect(screen.getByLabelText(/Review Content/i)).toBeDefined();
    expect(screen.getByRole("button", { name: "Submit Review" })).toBeDefined();
  });

  it("validates form fields and displays error on empty title or short content", () => {
    vi.spyOn(sessionModule, "useSession").mockReturnValue({
      user: DEMO_USERS.critic,
      status: "authenticated",
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    });

    renderWithProviders(<ReviewForm movieId="550" />);

    fireEvent.click(screen.getByRole("button", { name: /Write a Review/i }));

    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Title must be at least 3 characters")).toBeDefined();
    expect(screen.getByText("Review content must be at least 10 characters")).toBeDefined();
  });

  it("optimistically adds review to cache and includes UUID idempotency key", async () => {
    const user = DEMO_USERS.critic;
    vi.spyOn(sessionModule, "useSession").mockReturnValue({
      user,
      status: "authenticated",
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    });

    let postedBody: any = null;

    // Set initial reviews cache
    queryClient.setQueryData<Review[]>(["movie-reviews", "550"], []);

    // Mock network call
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      if (typeof url === "string" && url.includes("/api/movies/550/reviews")) {
        postedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            success: true,
            review: {
              id: "server-rev-999",
              movieId: "550",
              authorId: user.id,
              authorName: user.name,
              authorRole: user.role,
              rating: postedBody.rating,
              title: postedBody.title,
              content: postedBody.content,
              spoiler: postedBody.spoiler,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              helpfulVotes: 0,
              totalVotes: 0,
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(null, { status: 404 });
    });

    renderWithProviders(
      <div>
        <MovieReviewsSection movieId="550" />
      </div>
    );

    // Open form
    const writeBtn = await screen.findByRole("button", { name: /Write a Review/i });
    fireEvent.click(writeBtn);

    // Fill inputs
    const titleInput = screen.getByLabelText(/Headline/i);
    const contentInput = screen.getByLabelText(/Review Content/i);

    fireEvent.change(titleInput, { target: { value: "A visually staggering odyssey" } });
    fireEvent.change(contentInput, {
      target: { value: "One of the most impressive films made this decade with stellar sound design." },
    });

    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    fireEvent.click(submitBtn);

    // Assert that idempotencyKey was generated and sent in body
    await waitFor(() => {
      expect(postedBody).not.toBeNull();
      expect(postedBody.idempotencyKey).toBeDefined();
      expect(typeof postedBody.idempotencyKey).toBe("string");
    });

    // Reconciles and shows confirmation
    await waitFor(() => {
      expect(screen.getByText("A visually staggering odyssey")).toBeDefined();
      expect(screen.getByText("Review posted successfully!")).toBeDefined();
    });
  });

  it("rolls back optimistic update when submission fails", async () => {
    const user = DEMO_USERS.cinephile;
    vi.spyOn(sessionModule, "useSession").mockReturnValue({
      user,
      status: "authenticated",
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    });

    const initialReview: Review = {
      id: "initial-rev-1",
      movieId: "550",
      authorId: "usr-1",
      authorName: "Alice",
      authorRole: "user",
      rating: 8,
      title: "Existing Review",
      content: "This is an existing review that must remain.",
      spoiler: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      helpfulVotes: 0,
      totalVotes: 0,
      upvotes: 0,
      downvotes: 0,
      deletedAt: null,
    };

    queryClient.setQueryData<Review[]>(["movie-reviews", "550"], [initialReview]);

    // Mock GET success with initialReview, and fail POST with 500
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const u = typeof url === "string" ? url : url.toString();
      if (u.includes("/api/movies/550/reviews") && init?.method === "POST") {
        return new Response(
          JSON.stringify({ error: "Server Error", message: "Database temporarily offline" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      if (u.includes("/api/movies/550/reviews")) {
        return new Response(JSON.stringify({ reviews: [initialReview] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(null, { status: 404 });
    });

    renderWithProviders(
      <div>
        <MovieReviewsSection movieId="550" />
      </div>
    );

    expect(await screen.findByText("Existing Review")).toBeDefined();

    const writeBtn = screen.getByRole("button", { name: /Write a Review/i });
    fireEvent.click(writeBtn);

    const titleInput = screen.getByLabelText(/Headline/i);
    const contentInput = screen.getByLabelText(/Review Content/i);

    fireEvent.change(titleInput, { target: { value: "Failing Review" } });
    fireEvent.change(contentInput, {
      target: { value: "This review submission is intended to fail and rollback." },
    });

    const submitBtn = screen.getByRole("button", { name: "Submit Review" });
    fireEvent.click(submitBtn);

    // Rollback error toast is triggered
    await waitFor(() => {
      expect(screen.getByText(/Database temporarily offline|Failed to submit review/i)).toBeDefined();
    });

    // Failing review is rolled back and removed from UI; initial review remains
    expect(screen.queryByText("Failing Review")).toBeNull();
    expect(screen.getByText("Existing Review")).toBeDefined();
  });
});
