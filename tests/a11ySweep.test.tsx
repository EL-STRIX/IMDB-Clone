import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import WatchlistView from "@/components/watchlist/WatchlistView";
import MovieReviewsSection from "@/components/reviews/MovieReviewsSection";
import * as sessionModule from "@/components/auth/SessionProvider";
import { ToastContainer } from "@/components/watchlist/Toast";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "image"} />;
  },
}));

describe("Comprehensive Full-App Accessibility & Responsiveness Sweep (Day 49)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
    vi.spyOn(sessionModule, "useSession").mockReturnValue({
      user: { id: "test-user-1", name: "Cinephile User", email: "user@example.com", role: "user" },
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

  it("Navbar has zero accessibility violations", async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialTheme="dark">
          <Navbar />
        </ThemeProvider>
      </QueryClientProvider>
    );

    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("WatchlistView has zero accessibility violations and compliant aria-labels", async () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider initialTheme="dark">
          <WatchlistView />
          <ToastContainer />
        </ThemeProvider>
      </QueryClientProvider>
    );

    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("MovieReviewsSection and ReviewForm have zero accessibility violations", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        movieId: "550",
        reviews: [
          {
            id: "rev-a11y-1",
            movieId: "550",
            authorId: "usr-1",
            authorName: "A11y Reviewer",
            authorRole: "critic",
            rating: 9,
            title: "Accessible and Engaging Cinema",
            content: "Phenomenal cinematography and exceptional sound editing.",
            spoiler: false,
            createdAt: "2026-01-01T10:00:00Z",
            updatedAt: "2026-01-01T10:00:00Z",
            upvotes: 10,
            downvotes: 1,
            helpfulVotes: 10,
            totalVotes: 11,
            revisions: [],
            deletedAt: null,
          },
        ],
      }),
    } as Response);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <main>
          <MovieReviewsSection movieId="550" />
        </main>
        <ToastContainer />
      </QueryClientProvider>
    );

    // Ensure review content is rendered
    expect(await screen.findByText("Accessible and Engaging Cinema")).toBeDefined();

    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
