import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WatchlistButton from "@/components/watchlist/WatchlistButton";
import { ToastContainer, clearToasts } from "@/components/watchlist/Toast";
import * as repoModule from "@/lib/watchlist/repository";
import { InMemoryWatchlistRepository } from "@/lib/watchlist/repository";

describe("WatchlistButton with Optimistic Updates & Undo Toast (Day 38)", () => {
  let queryClient: QueryClient;
  let inMemoryRepo: InMemoryWatchlistRepository;

  const sampleMovie = {
    id: "m-550",
    title: "Fight Club",
    posterUrl: "https://image.tmdb.org/t/p/w500/fightclub.jpg",
    year: "1999",
    rating: 8.4,
  };

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

  it("renders initial state when movie is not in watchlist", async () => {
    renderWithProviders(<WatchlistButton movie={sampleMovie} />);

    const button = screen.getByRole("button", { name: /Add Fight Club to watchlist/i });
    expect(button).toBeDefined();
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Add to Watchlist")).toBeDefined();
  });

  it("renders in-watchlist state when movie is already saved in repository", async () => {
    await inMemoryRepo.add({ id: sampleMovie.id, title: sampleMovie.title });

    renderWithProviders(<WatchlistButton movie={sampleMovie} />);

    await waitFor(() => {
      expect(screen.getByText("In Watchlist")).toBeDefined();
    });

    const button = screen.getByRole("button", { name: /Remove Fight Club from watchlist/i });
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("optimistically updates UI and triggers Undo toast on click", async () => {
    renderWithProviders(<WatchlistButton movie={sampleMovie} />);

    const button = screen.getByRole("button", { name: /Add Fight Club to watchlist/i });
    fireEvent.click(button);

    // Optimistically transitions immediately
    await waitFor(() => {
      expect(screen.getByText("In Watchlist")).toBeDefined();
    });

    // Toast notification appears with Undo action
    expect(await screen.findByText(/Added "Fight Club" to your Watchlist/i)).toBeDefined();
    const undoButton = screen.getByRole("button", { name: /Undo/i });
    expect(undoButton).toBeDefined();

    // Verify stored in repository
    expect(await inMemoryRepo.has(sampleMovie.id)).toBe(true);
  });

  it("clicking Undo reverses the operation", async () => {
    renderWithProviders(<WatchlistButton movie={sampleMovie} />);

    const button = screen.getByRole("button", { name: /Add Fight Club to watchlist/i });
    fireEvent.click(button);

    const undoButton = await screen.findByRole("button", { name: /Undo/i });
    fireEvent.click(undoButton);

    // Reverses back to Add to Watchlist
    await waitFor(() => {
      expect(screen.getByText("Add to Watchlist")).toBeDefined();
    });

    expect(await inMemoryRepo.has(sampleMovie.id)).toBe(false);
  });

  it("rolls back optimistic update when repository mutation fails", async () => {
    vi.spyOn(inMemoryRepo, "add").mockRejectedValue(new Error("Disk Full / Quota Exceeded"));

    renderWithProviders(<WatchlistButton movie={sampleMovie} />);

    const button = screen.getByRole("button", { name: /Add Fight Club to watchlist/i });
    fireEvent.click(button);

    // After failure, rolls back to original state
    await waitFor(() => {
      expect(screen.getByText("Add to Watchlist")).toBeDefined();
    });

    expect(await screen.findByText(/Failed to update watchlist/i)).toBeDefined();
  });

  it("renders accessible icon variant correctly", () => {
    renderWithProviders(<WatchlistButton movie={sampleMovie} variant="icon" />);

    const button = screen.getByRole("button", { name: /Add Fight Club to watchlist/i });
    expect(button).toBeDefined();
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });
});
