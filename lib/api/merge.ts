import { Movie } from "./types";

/**
 * Merge function that updates existing items by id instead of resetting the list on refresh.
 */
export function mergeMovies(prev: Movie[], incoming: Movie[]): Movie[] {
  const map = new Map<string, Movie>();
  for (const item of prev) {
    map.set(item.id, item);
  }
  for (const item of incoming) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}
