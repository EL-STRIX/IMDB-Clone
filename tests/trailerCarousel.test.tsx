import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TrailerCarousel from "@/components/movie/TrailerCarousel";
import { Trailer } from "@/lib/api/types";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "image"} />;
  },
}));

const mockTrailers: Trailer[] = [
  {
    id: "trailer-1",
    name: "Official Trailer 1",
    key: "xyz123",
    site: "YouTube",
    type: "Trailer",
    thumbnailUrl: "https://img.youtube.com/vi/xyz123/hqdefault.jpg",
  },
  {
    id: "trailer-2",
    name: "Teaser Trailer",
    key: "abc456",
    site: "YouTube",
    type: "Teaser",
    thumbnailUrl: "https://img.youtube.com/vi/abc456/hqdefault.jpg",
  },
];

describe("TrailerCarousel Component", () => {
  it("renders empty/fallback state when no trailers are provided, with retry button", () => {
    render(<TrailerCarousel trailers={[]} />);
    expect(screen.getByText("Trailer unavailable")).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
  });

  it("renders the active trailer information and controls", () => {
    render(<TrailerCarousel trailers={mockTrailers} movieTitle="Test Movie" />);
    
    expect(screen.getByText("Videos & Trailers")).toBeDefined();
    expect(screen.getByText("1 of 2")).toBeDefined();
    expect(screen.getByText("Official Trailer 1")).toBeDefined();
    expect(screen.getByLabelText("Play trailer: Official Trailer 1")).toBeDefined();
    expect(screen.getByLabelText("Previous trailer")).toBeDefined();
    expect(screen.getByLabelText("Next trailer")).toBeDefined();
  });

  it("advances slide on clicking Next button", () => {
    render(<TrailerCarousel trailers={mockTrailers} movieTitle="Test Movie" />);
    
    const nextBtn = screen.getByLabelText("Next trailer");
    fireEvent.click(nextBtn);

    expect(screen.getByText("2 of 2")).toBeDefined();
    expect(screen.getByText("Teaser Trailer")).toBeDefined();
  });

  it("switches slide when clicking dot indicator", () => {
    render(<TrailerCarousel trailers={mockTrailers} movieTitle="Test Movie" />);
    
    const secondDot = screen.getByLabelText("Go to slide 2");
    fireEvent.click(secondDot);

    expect(screen.getByText("2 of 2")).toBeDefined();
    expect(screen.getByText("Teaser Trailer")).toBeDefined();
  });

  it("toggles manual autoplay pause and play button", () => {
    render(<TrailerCarousel trailers={mockTrailers} movieTitle="Test Movie" />);

    const pauseBtn = screen.getByLabelText("Pause autoplay");
    expect(pauseBtn).toBeDefined();

    fireEvent.click(pauseBtn);
    expect(screen.getByLabelText("Resume autoplay")).toBeDefined();

    fireEvent.click(screen.getByLabelText("Resume autoplay"));
    expect(screen.getByLabelText("Pause autoplay")).toBeDefined();
  });
});
