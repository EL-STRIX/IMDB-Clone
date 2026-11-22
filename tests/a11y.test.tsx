import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import axe from "axe-core";
import TrailerCarousel from "@/components/movie/TrailerCarousel";
import Credits from "@/components/movie/Credits";
import Reviews from "@/components/movie/Reviews";
import RelatedMovies from "@/components/movie/RelatedMovies";
import { Trailer, CastMember, Review, Movie } from "@/lib/api/types";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "image"} />;
  },
}));

// Mock next/navigation
const mockPrefetch = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    prefetch: mockPrefetch,
  }),
}));

// Mock @tanstack/react-query
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    prefetchQuery: vi.fn(),
  }),
}));

const mockTrailers: Trailer[] = [
  {
    id: "trailer-1",
    name: "Main Official Trailer",
    key: "abc123xyz",
    site: "YouTube",
    type: "Trailer",
    thumbnailUrl: "https://img.youtube.com/vi/abc123xyz/hqdefault.jpg",
  },
  {
    id: "trailer-2",
    name: "Official Teaser",
    key: "def456uvw",
    site: "YouTube",
    type: "Teaser",
    thumbnailUrl: "https://img.youtube.com/vi/def456uvw/hqdefault.jpg",
  },
];

const mockCast: CastMember[] = [
  {
    id: "cast-1",
    name: "Cillian Murphy",
    character: "J. Robert Oppenheimer",
    profileUrl: "https://image.tmdb.org/t/p/w185/cillian.jpg",
  },
  {
    id: "cast-2",
    name: "Emily Blunt",
    character: "Katherine Oppenheimer",
    profileUrl: "https://image.tmdb.org/t/p/w185/emily.jpg",
  },
];

const mockReviews: Review[] = [
  {
    id: "rev-1",
    author: "FilmCritic99",
    content: "A masterclass in tension and cinematography.",
    rating: 9,
    createdAt: "2026-07-20T10:00:00Z",
  },
];

const mockRelated: Movie[] = [
  {
    id: "rel-1",
    title: "Interstellar",
    posterUrl: "https://image.tmdb.org/t/p/w500/interstellar.jpg",
    rating: 8.7,
    year: "2014",
  },
];

describe("Automated Accessibility Suite (axe-core)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TrailerCarousel has zero axe accessibility violations", async () => {
    const { container } = render(
      <main>
        <TrailerCarousel trailers={mockTrailers} movieTitle="Oppenheimer" />
      </main>
    );

    const results = await axe.run(container, {
      rules: {
        // In jsdom environment, landmark and color-contrast rules can produce synthetic false positives
        "color-contrast": { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it("Credits section has zero axe accessibility violations", async () => {
    const Component = await Credits({ promise: Promise.resolve(mockCast) });
    const { container } = render(<main>{Component}</main>);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it("Reviews section has zero axe accessibility violations", async () => {
    const Component = await Reviews({ promise: Promise.resolve(mockReviews) });
    const { container } = render(<main>{Component}</main>);

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it("RelatedMovies section has zero axe accessibility violations", async () => {
    const { container } = render(
      <main>
        <RelatedMovies movies={mockRelated} />
      </main>
    );

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe("Keyboard Navigation Workflow (Tab, Arrow keys, Escape)", () => {
  it("navigates through carousel slides with arrow keys and manages focus on dialog with Escape", () => {
    render(<TrailerCarousel trailers={mockTrailers} movieTitle="Oppenheimer" />);

    // 1. Tab to the tablist and use arrow keys for roving tabindex
    const tablist = screen.getByRole("tablist");
    const tabs = screen.getAllByRole("tab");

    // Initially tab 0 is active
    expect(tabs[0].getAttribute("tabindex")).toBe("0");
    expect(tabs[1].getAttribute("tabindex")).toBe("-1");

    // ArrowRight advances to tab 1
    fireEvent.keyDown(tablist, { key: "ArrowRight" });
    expect(tabs[0].getAttribute("tabindex")).toBe("-1");
    expect(tabs[1].getAttribute("tabindex")).toBe("0");

    // ArrowLeft returns to tab 0
    fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    expect(tabs[0].getAttribute("tabindex")).toBe("0");
    expect(tabs[1].getAttribute("tabindex")).toBe("-1");

    // 2. Open trailer dialog
    const playBtn = screen.getByLabelText("Play trailer: Main Official Trailer");
    fireEvent.click(playBtn);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    // 3. Close with Escape key
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
