import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RelatedMovies from "@/components/movie/RelatedMovies";
import { Movie } from "@/lib/api/types";

// Mock next/navigation
const mockPrefetch = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    prefetch: mockPrefetch,
  }),
}));

// Mock @tanstack/react-query
const mockPrefetchQuery = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    prefetchQuery: mockPrefetchQuery,
  }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "image"} />;
  },
}));

const mockMovies: Movie[] = [
  {
    id: "101",
    title: "Interstellar",
    posterUrl: "https://image.tmdb.org/t/p/w500/interstellar.jpg",
    rating: 8.7,
    year: "2014",
  },
  {
    id: "102",
    title: "Inception",
    posterUrl: "https://image.tmdb.org/t/p/w500/inception.jpg",
    rating: 8.8,
    year: "2010",
  },
];

describe("RelatedMovies Component Prefetching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders related movie list and headers", () => {
    render(<RelatedMovies movies={mockMovies} />);
    expect(screen.getByText("More Like This")).toBeDefined();
    expect(screen.getByText("Interstellar")).toBeDefined();
    expect(screen.getByText("Inception")).toBeDefined();
  });

  it("prefetches route and query data on hover, and only once per movie id", () => {
    render(<RelatedMovies movies={mockMovies} />);

    const firstCard = screen.getByText("Interstellar").closest(".group");
    expect(firstCard).toBeDefined();

    // First hover
    fireEvent.mouseEnter(firstCard!);
    expect(mockPrefetch).toHaveBeenCalledTimes(1);
    expect(mockPrefetch).toHaveBeenCalledWith("/movie/101");
    expect(mockPrefetchQuery).toHaveBeenCalledTimes(1);

    // Second hover on the same movie - must NOT trigger additional prefetch calls
    fireEvent.mouseEnter(firstCard!);
    expect(mockPrefetch).toHaveBeenCalledTimes(1);
    expect(mockPrefetchQuery).toHaveBeenCalledTimes(1);

    // Hover on second movie - triggers prefetch for movie 102
    const secondCard = screen.getByText("Inception").closest(".group");
    fireEvent.mouseEnter(secondCard!);
    expect(mockPrefetch).toHaveBeenCalledTimes(2);
    expect(mockPrefetch).toHaveBeenCalledWith("/movie/102");
    expect(mockPrefetchQuery).toHaveBeenCalledTimes(2);
  });
});
