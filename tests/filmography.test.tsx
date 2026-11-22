import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FilmographyExplorer from "@/components/actor/FilmographyExplorer";
import ActorPage from "@/app/actor/[id]/page";
import { FilmographyCredit, Genre } from "@/lib/api/types";
import * as cachedModule from "@/lib/api/cached";

// Mock next/navigation
let mockSearchParams = new URLSearchParams();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/actor/123",
  notFound: vi.fn(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "image"} />;
  },
}));

const mockGenres: Genre[] = [
  { id: 28, name: "Action" },
  { id: 18, name: "Drama" },
  { id: 878, name: "Sci-Fi" },
];

const mockCredits: FilmographyCredit[] = [
  {
    id: "m-1",
    title: "Inception",
    role: "Dom Cobb",
    department: "Cast",
    year: "2010",
    genreIds: [28, 878],
    popularity: 90,
    posterUrl: "https://image.tmdb.org/t/p/w185/inception.jpg",
    rating: 8.8,
  },
  {
    id: "m-2",
    title: "Titanic",
    role: "Jack Dawson",
    department: "Cast",
    year: "1997",
    genreIds: [18],
    popularity: 85,
    posterUrl: "https://image.tmdb.org/t/p/w185/titanic.jpg",
    rating: 7.9,
  },
  {
    id: "m-3",
    title: "The Aviator (Producer)",
    role: "Executive Producer",
    department: "Production",
    year: "2004",
    genreIds: [18],
    popularity: 50,
    posterUrl: "https://image.tmdb.org/t/p/w185/aviator.jpg",
    rating: 7.5,
  },
];

describe("FilmographyExplorer Virtualized Component with Filters and Sort", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
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
    render(<FilmographyExplorer credits={[]} genres={mockGenres} />);
    expect(screen.getByText("No filmography records found for this person.")).toBeDefined();
  });

  it("renders virtualized filmography title count and rows with title, role and year", () => {
    render(<FilmographyExplorer credits={mockCredits} genres={mockGenres} actorId="123" />);

    expect(screen.getByText("Filmography")).toBeDefined();
    expect(screen.getByText(/Showing 3 of 3 credits/i)).toBeDefined();
    expect(screen.getByText("Inception")).toBeDefined();
    expect(screen.getByText("Dom Cobb")).toBeDefined();
    expect(screen.getAllByText("2010").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Titanic")).toBeDefined();
    expect(screen.getByText("The Aviator (Producer)")).toBeDefined();
  });

  it("filters credits by role (cast vs crew) and updates URL", () => {
    render(<FilmographyExplorer credits={mockCredits} genres={mockGenres} actorId="123" />);

    // Click "crew" role filter
    const crewButton = screen.getByRole("button", { name: /^crew$/i });
    fireEvent.click(crewButton);

    expect(screen.getByText(/Showing 1 of 3 credits/i)).toBeDefined();
    expect(screen.getByText("The Aviator (Producer)")).toBeDefined();
    expect(screen.queryByText("Inception")).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/actor/123?role=crew", { scroll: false });

    // Click "cast" role filter
    const castButton = screen.getByRole("button", { name: /^cast$/i });
    fireEvent.click(castButton);

    expect(screen.getByText(/Showing 2 of 3 credits/i)).toBeDefined();
    expect(screen.getByText("Inception")).toBeDefined();
    expect(screen.getByText("Titanic")).toBeDefined();
    expect(screen.queryByText("The Aviator (Producer)")).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/actor/123?role=cast", { scroll: false });
  });

  it("filters credits by year dropdown and updates URL", () => {
    render(<FilmographyExplorer credits={mockCredits} genres={mockGenres} actorId="123" />);

    const yearSelect = screen.getByLabelText("Filter by Year");
    fireEvent.change(yearSelect, { target: { value: "1997" } });

    expect(screen.getByText(/Showing 1 of 3 credits/i)).toBeDefined();
    expect(screen.getByText("Titanic")).toBeDefined();
    expect(screen.queryByText("Inception")).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/actor/123?year=1997", { scroll: false });
  });

  it("filters credits by genre chips multi-select and updates URL", () => {
    render(<FilmographyExplorer credits={mockCredits} genres={mockGenres} actorId="123" />);

    // Click "Action" chip (matches Inception: genreIds [28, 878])
    const actionChip = screen.getByRole("button", { name: "Action" });
    fireEvent.click(actionChip);

    expect(screen.getByText(/Showing 1 of 3 credits/i)).toBeDefined();
    expect(screen.getByText("Inception")).toBeDefined();
    expect(screen.queryByText("Titanic")).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/actor/123?genres=28", { scroll: false });
  });

  it("sorts credits and updates URL", () => {
    render(<FilmographyExplorer credits={mockCredits} genres={mockGenres} actorId="123" />);

    const sortSelect = screen.getByLabelText("Sort credits");
    fireEvent.change(sortSelect, { target: { value: "year_asc" } });

    expect(mockReplace).toHaveBeenCalledWith("/actor/123?sort=year_asc", { scroll: false });
  });

  it("resets all active filters when clicking the Reset button", () => {
    render(<FilmographyExplorer credits={mockCredits} genres={mockGenres} actorId="123" />);

    // Apply role filter
    const crewButton = screen.getByRole("button", { name: /^crew$/i });
    fireEvent.click(crewButton);

    // Reset button should now be visible
    const resetButton = screen.getByRole("button", { name: /reset/i });
    expect(resetButton).toBeDefined();

    fireEvent.click(resetButton);

    expect(screen.getByText(/Showing 3 of 3 credits/i)).toBeDefined();
    expect(mockReplace).toHaveBeenCalledWith("/actor/123", { scroll: false });
  });

  it("links filmography items to the correct movie detail path", () => {
    render(<FilmographyExplorer credits={mockCredits} genres={mockGenres} actorId="123" />);

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
    vi.spyOn(cachedModule, "getCachedGenres").mockResolvedValue(mockGenres);
    vi.spyOn(cachedModule, "getCachedPersonExternalIds").mockResolvedValue({});

    const PageJSX = await ActorPage({ params: Promise.resolve({ id: "789" }) });
    render(PageJSX);

    expect(screen.getByText("Leonardo DiCaprio")).toBeDefined();
    expect(await screen.findByText("Filmography")).toBeDefined();
    expect(await screen.findByText("Inception")).toBeDefined();
  });
});
