import { describe, it, expect, beforeEach } from "vitest";
import { ZodError } from "zod";
import {
  InMemoryWatchlistRepository,
  defaultWatchlistRepository,
} from "@/lib/watchlist/repository";
import { WatchlistItemSchema } from "@/lib/watchlist/schema";

describe("Typed Watchlist Repository with Zod Validation (Day 34)", () => {
  let repository: InMemoryWatchlistRepository;

  beforeEach(() => {
    repository = new InMemoryWatchlistRepository();
  });

  describe("WatchlistItem Zod Schema", () => {
    it("validates a properly formed WatchlistItem", () => {
      const validItem = {
        id: "m-550",
        title: "Fight Club",
        poster: "https://image.tmdb.org/t/p/w500/poster.jpg",
        addedAt: "2026-11-22T10:00:00.000Z",
        rating: 8.4,
        year: "1999",
        notes: "Classic psychological thriller.",
      };

      const parsed = WatchlistItemSchema.parse(validItem);
      expect(parsed.id).toBe("m-550");
      expect(parsed.title).toBe("Fight Club");
    });

    it("rejects items missing required fields: id and title", () => {
      expect(() =>
        WatchlistItemSchema.parse({
          title: "Missing ID",
          addedAt: new Date().toISOString(),
        })
      ).toThrow(ZodError);

      expect(() =>
        WatchlistItemSchema.parse({
          id: "m-123",
          addedAt: new Date().toISOString(),
        })
      ).toThrow(ZodError);
    });

    it("rejects items with invalid rating range (outside 0..10)", () => {
      expect(() =>
        WatchlistItemSchema.parse({
          id: "m-123",
          title: "Invalid Rating",
          addedAt: new Date().toISOString(),
          rating: 11.5,
        })
      ).toThrow(ZodError);

      expect(() =>
        WatchlistItemSchema.parse({
          id: "m-123",
          title: "Invalid Rating",
          addedAt: new Date().toISOString(),
          rating: -1,
        })
      ).toThrow(ZodError);
    });
  });

  describe("Repository Operations", () => {
    it("adds a movie to watchlist and generates timestamp when omitted", async () => {
      const item = await repository.add({
        id: "m-27205",
        title: "Inception",
        poster: "https://image.tmdb.org/t/p/w500/inception.jpg",
        year: "2010",
        rating: 8.8,
      });

      expect(item.id).toBe("m-27205");
      expect(item.title).toBe("Inception");
      expect(item.addedAt).toBeDefined();
      expect(await repository.has("m-27205")).toBe(true);
    });

    it("adds a movie preserving custom addedAt timestamp", async () => {
      const customDate = "2025-01-01T00:00:00.000Z";
      const item = await repository.add({
        id: "m-155",
        title: "The Dark Knight",
        addedAt: customDate,
      });

      expect(item.addedAt).toBe(customDate);
      const fetched = await repository.get("m-155");
      expect(fetched?.title).toBe("The Dark Knight");
    });

    it("removes a movie by id and returns boolean indicating success", async () => {
      await repository.add({ id: "m-1", title: "Interstellar" });
      expect(await repository.has("m-1")).toBe(true);

      const removed = await repository.remove("m-1");
      expect(removed).toBe(true);
      expect(await repository.has("m-1")).toBe(false);

      // Subsequent removal of same id returns false
      const secondRemoval = await repository.remove("m-1");
      expect(secondRemoval).toBe(false);
    });

    it("lists items sorted by addedAt descending (newest first)", async () => {
      await repository.add({
        id: "m-old",
        title: "Old Movie",
        addedAt: "2024-01-01T00:00:00.000Z",
      });
      await repository.add({
        id: "m-new",
        title: "New Movie",
        addedAt: "2026-01-01T00:00:00.000Z",
      });
      await repository.add({
        id: "m-mid",
        title: "Middle Movie",
        addedAt: "2025-01-01T00:00:00.000Z",
      });

      const list = await repository.list();
      expect(list.length).toBe(3);
      expect(list[0].id).toBe("m-new");
      expect(list[1].id).toBe("m-mid");
      expect(list[2].id).toBe("m-old");
    });

    it("updates attributes of an existing item and validates schema", async () => {
      await repository.add({
        id: "m-100",
        title: "Oppenheimer",
        rating: 8.5,
      });

      const updated = await repository.update("m-100", {
        notes: "Must watch on 70mm IMAX.",
        rating: 9.2,
      });

      expect(updated).not.toBeNull();
      expect(updated?.notes).toBe("Must watch on 70mm IMAX.");
      expect(updated?.rating).toBe(9.2);

      // Verify persistence in repository
      const fetched = await repository.get("m-100");
      expect(fetched?.rating).toBe(9.2);
    });

    it("returns null when updating non-existent item", async () => {
      const updated = await repository.update("non-existent", { notes: "test" });
      expect(updated).toBeNull();
    });

    it("rejects update with invalid schema values", async () => {
      await repository.add({ id: "m-200", title: "Barbie" });

      await expect(
        repository.update("m-200", { rating: 15 })
      ).rejects.toThrow(ZodError);
    });

    it("clears all items in the repository", async () => {
      await repository.add({ id: "m-1", title: "Movie 1" });
      await repository.add({ id: "m-2", title: "Movie 2" });
      expect((await repository.list()).length).toBe(2);

      await repository.clear();
      expect((await repository.list()).length).toBe(0);
    });
  });
});
