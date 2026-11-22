import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import FilmographyExplorer from "@/components/actor/FilmographyExplorer";
import ActorPage from "@/app/actor/[id]/page";
import { FilmographyCredit } from "@/lib/api/types";
import * as cachedModule from "@/lib/api/cached";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "image"} />;
  },
}));

const mockCredits: FilmographyCredit[] = [
  {
    id: "m-1",
    title: "Inception",
    role: "Dom Cobb",
    department: "Cast",
    year: "2010",
    posterUrl: "https://image.tmdb.org/t/p/w185/inception.jpg",
    rating: 8.8,
  },
  {
    id: "m-2",
    title: "Titanic",
    role: "Jack Dawson",
    department: "Cast",
    year: "1997",
    posterUrl: "https://image.tmdb.org/t/p/w185/titanic.jpg",
    rating: 7.9,
  },
];

describe("FilmographyExplorer Virtualized Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 500,
    });
    HTMLElement.prototype.getBoundingClientRect = () =>
      ({
        width: 800,
        height: 500,
        top: 0,
        left: 0,
        bottom: 500,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect);
  });

  it("renders empty state message when no credits exist", () => {
    render(<FilmographyExplorer credits={[]} />);
    expect(screen.getByText("No filmography records found for this person.")).toBeDefined();
  });

  it("renders virtualized filmography title count and rows with title, role and year", () => {
    render(<FilmographyExplorer credits={mockCredits} />);

    expect(screen.getByText("Filmography")).toBeDefined();
    expect(screen.getByText("2 titles")).toBeDefined();
    expect(screen.getByText("Inception")).toBeDefined();
    expect(screen.getByText("Dom Cobb")).toBeDefined();
    expect(screen.getByText("2010")).toBeDefined();
  });

  it("links filmography items to the correct movie detail path", () => {
    render(<FilmographyExplorer credits={mockCredits} />);

    const link = screen.getByText("Inception").closest("a");
    expect(link?.getAttribute("href")).toBe("/movie/m-1");
  });

  it("renders both actor profile and filmography inside ActorPage", async () => {
    vi.spyOn(cachedModule, "getCachedPerson").mockResolvedValue({
      id: "789",
      name: "Leonardo DiCaprio",
      profileUrl: null,
      knownFor: "Acting",
      biography: "Acclaimed actor.",
    });
    vi.spyOn(cachedModule, "getCachedPersonCredits").mockResolvedValue(mockCredits);

    const PageJSX = await ActorPage({ params: Promise.resolve({ id: "789" }) });
    render(PageJSX);

    expect(screen.getByText("Leonardo DiCaprio")).toBeDefined();
    expect(screen.getByText("Filmography")).toBeDefined();
    expect(screen.getByText("Inception")).toBeDefined();
  });
});
