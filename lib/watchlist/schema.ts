import { z } from "zod";

/**
 * WatchlistItem Zod Schema
 * Defines the core shape of a movie saved to a user's watchlist.
 */
export const WatchlistItemSchema = z.object({
  id: z.string().min(1, "Movie ID is required"),
  title: z.string().min(1, "Title is required"),
  poster: z.string().nullable().optional(),
  addedAt: z.string().datetime().or(z.number()).or(z.string().min(1, "addedAt is required")),
  rating: z.number().min(0).max(10).optional(),
  year: z.string().optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  watched: z.boolean().optional(),
  customOrder: z.number().optional(),
});

export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;

/**
 * Schema for adding a new item where addedAt is optional (defaults to now)
 */
export const AddWatchlistItemSchema = WatchlistItemSchema.omit({ addedAt: true }).extend({
  addedAt: z.string().datetime().or(z.number()).or(z.string()).optional(),
});

export type AddWatchlistItemInput = z.infer<typeof AddWatchlistItemSchema>;

/**
 * Schema for updating an existing watchlist item (id cannot be modified)
 */
export const UpdateWatchlistItemSchema = WatchlistItemSchema.partial().omit({ id: true });

export type UpdateWatchlistItemInput = z.infer<typeof UpdateWatchlistItemSchema>;
