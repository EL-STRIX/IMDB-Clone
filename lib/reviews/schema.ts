import { z } from "zod";

/**
 * Review Creation Schema (shared between client-side form validation and server-side request parsing)
 */
export const CreateReviewSchema = z.object({
  rating: z
    .number({ message: "Rating must be a number" })
    .min(1, "Rating must be at least 1")
    .max(10, "Rating cannot exceed 10"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .trim(),
  content: z
    .string()
    .min(10, "Review content must be at least 10 characters")
    .max(5000, "Review content cannot exceed 5000 characters")
    .trim(),
  spoiler: z.boolean().optional().default(false),
  idempotencyKey: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

/**
 * Review Update Schema
 */
export const UpdateReviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(10, "Rating cannot exceed 10")
    .optional(),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .trim()
    .optional(),
  content: z
    .string()
    .min(10, "Review content must be at least 10 characters")
    .max(5000, "Review content cannot exceed 5000 characters")
    .trim()
    .optional(),
  spoiler: z.boolean().optional(),
});

export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;

/**
 * Full Review Record Schema
 */
export const ReviewSchema = z.object({
  id: z.string(),
  movieId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.enum(["user", "critic", "admin"]),
  authorAvatar: z.string().optional(),
  rating: z.number().min(1).max(10),
  title: z.string(),
  content: z.string(),
  spoiler: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  helpfulVotes: z.number().default(0),
  totalVotes: z.number().default(0),
  upvotes: z.number().default(0),
  downvotes: z.number().default(0),
  userVote: z.enum(["up", "down"]).nullable().optional(),
  isOptimistic: z.boolean().optional(),
  deletedAt: z.string().nullable().optional(),
});

export type Review = z.infer<typeof ReviewSchema>;
