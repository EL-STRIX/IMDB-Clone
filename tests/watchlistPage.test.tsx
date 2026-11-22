import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WatchlistView from "@/components/watchlist/WatchlistView";
import { ToastContainer, clearToasts } from "@/components/watchlist/Toast";
import * as repoModule from "@/lib/watchlist/repository";
import { InMemoryWatchlistRepository } from "@/lib/watchlist/repository";
import { WatchlistItem } from "@/lib/watchlist/schema";

describe("WatchlistView Component (Day 39)", () => {
  let queryClient: QueryClient;
  let inMemoryRepo: InMemoryWatchlistRepository;

  const mockMovies: WatchlistItem[] = [
    {
      id: "m-101",
      title: "Inception",
      poster: "https://image.tmdb.org/t/p/w500/inception.jpg",
      year: "2010",
      rating: 8.8,
      addedAt: "2026-01-01T10:00:00.000Z",
      watched: false,
    },
    {
      id: "m-102",
      title: "Interstellar",
      poster: "https://image.tmdb.org/t/p/w500/interstellar.jpg",
      year: "2014",
      rating: 8.7,
      addedAt: "2026-01-02T10:00:00.000Z",
      watched: true,
    },
    {
      id: "m-103",
      title: "The Dark Knight",
      poster: "https://image.tmdb.org/t/p/w500/darkknight.jpg",
      year: "2008",
      rating: 9.0,
      addedAt: "2026-01-03T10:00:00.000Z",
      watched: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    clearToasts();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    inMemoryRepo = new InMemoryWatchlistRepository();
    vi.spyOn(repoModule, "getWatchlistRepository").mockReturnValue(inMemoryRepo);
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

  it("renders empty state with call to action when watchlist has no movies", async () => {
    renderWithProviders(<WatchlistView />);

    expect(await screen.findByText("Your Watchlist is empty")).toBeDefined();
    expect(
      screen.getByText(/Explore movies and click the bookmark icon on any movie to save titles/i)
    ).toBeDefined();

    const ctaLink = screen.getByRole("link", { name: /Browse Popular Movies/i });
    expect(ctaLink.getAttribute("href")).toBe("/");
  });

  it("renders list of movies with title, year, and rating", async () => {
    for (const movie of mockMovies) {
      await inMemoryRepo.add(movie);
    }

    renderWithProviders(<WatchlistView />);

    expect(await screen.findByText("Inception")).toBeDefined();
    expect(screen.getByText("Interstellar")).toBeDefined();
    expect(screen.getByText("The Dark Knight")).toBeDefined();

    expect(screen.getByText("2010")).toBeDefined();
    expect(screen.getByText("2014")).toBeDefined();
    expect(screen.getByText("2008")).toBeDefined();

    expect(screen.getByText("★ 8.8")).toBeDefined();
    expect(screen.getByText("★ 8.7")).toBeDefined();
    expect(screen.getByText("★ 9.0")).toBeDefined();
  });

  it("filters items between All, Unwatched, and Watched", async () => {
    for (const movie of mockMovies) {
      await inMemoryRepo.add(movie);
    }

    renderWithProviders(<WatchlistView />);

    // Initially "all" (3 items)
    expect(await screen.findByText("Inception")).toBeDefined();
    expect(screen.getByText("Interstellar")).toBeDefined();
    expect(screen.getByText("The Dark Knight")).toBeDefined();

    // Click Unwatched filter tab
    const unwatchedTab = screen.getByRole("button", { name: /Unwatched \(2\)/i });
    fireEvent.click(unwatchedTab);

    expect(screen.getByText("Inception")).toBeDefined();
    expect(screen.getByText("The Dark Knight")).toBeDefined();
    expect(screen.queryByText("Interstellar")).toBeNull();

    // Click Watched filter tab
    const watchedTab = screen.getByRole("button", { name: /Watched \(1\)/i });
    fireEvent.click(watchedTab);

    expect(screen.getByText("Interstellar")).toBeDefined();
    expect(screen.queryByText("Inception")).toBeNull();
    expect(screen.queryByText("The Dark Knight")).toBeNull();

    // Click All filter tab
    const allTab = screen.getByRole("button", { name: /All \(3\)/i });
    fireEvent.click(allTab);

    expect(screen.getByText("Inception")).toBeDefined();
    expect(screen.getByText("Interstellar")).toBeDefined();
    expect(screen.getByText("The Dark Knight")).toBeDefined();
  });

  it("sorts items by Title (A-Z), Highest Rated, and Recently Added", async () => {
    for (const movie of mockMovies) {
      await inMemoryRepo.add(movie);
    }

    renderWithProviders(<WatchlistView />);
    expect(await screen.findByText("Inception")).toBeDefined();

    const sortSelect = screen.getByLabelText("Sort by");

    // Sort by Title (A-Z)
    fireEvent.change(sortSelect, { target: { value: "title" } });
    let titles = screen.getAllByRole("link").filter((el) =>
      ["Inception", "Interstellar", "The Dark Knight"].includes(el.textContent || "")
    ).map((el) => el.textContent);
    expect(titles).toEqual(["Inception", "Interstellar", "The Dark Knight"]);

    // Sort by Rating (Highest first)
    fireEvent.change(sortSelect, { target: { value: "rating" } });
    titles = screen.getAllByRole("link").filter((el) =>
      ["Inception", "Interstellar", "The Dark Knight"].includes(el.textContent || "")
    ).map((el) => el.textContent);
    expect(titles).toEqual(["The Dark Knight", "Inception", "Interstellar"]);

    // Sort by Recently Added (Latest addedAt first: m-103 Jan 3, m-102 Jan 2, m-101 Jan 1)
    fireEvent.change(sortSelect, { target: { value: "recent" } });
    titles = screen.getAllByRole("link").filter((el) =>
      ["Inception", "Interstellar", "The Dark Knight"].includes(el.textContent || "")
    ).map((el) => el.textContent);
    expect(titles).toEqual(["The Dark Knight", "Interstellar", "Inception"]);
  });

  it("toggles watched status of an item", async () => {
    await inMemoryRepo.add(mockMovies[0]); // Inception (unwatched)

    renderWithProviders(<WatchlistView />);
    expect(await screen.findByText("Inception")).toBeDefined();

    const markWatchedBtn = screen.getByRole("button", { name: "Mark Inception as watched" });
    expect(markWatchedBtn.textContent).toContain("Mark Watched");

    fireEvent.click(markWatchedBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Mark Inception as unwatched" })).toBeDefined();
      expect(screen.getByText("Watched")).toBeDefined();
    });
  });

  it("removes an item and supports undoing the action via toast notification", async () => {
    await inMemoryRepo.add(mockMovies[0]); // Inception

    renderWithProviders(<WatchlistView />);
    expect(await screen.findByText("Inception")).toBeDefined();

    const removeBtn = screen.getByRole("button", { name: "Remove Inception from watchlist" });
    fireEvent.click(removeBtn);

    // Should remove item and show toast with undo button
    await waitFor(() => {
      expect(screen.queryByText("Inception")).toBeNull();
      expect(screen.getByText('Removed "Inception" from your Watchlist')).toBeDefined();
    });

    const undoBtn = screen.getByRole("button", { name: "Undo" });
    fireEvent.click(undoBtn);

    // Item should be restored
    await waitFor(() => {
      expect(screen.getByText("Inception")).toBeDefined();
    });
  });
});
