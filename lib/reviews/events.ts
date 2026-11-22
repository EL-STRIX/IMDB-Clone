/**
 * Review Server-Sent Events (SSE) Bus
 * Provides pub/sub distribution for real-time review updates across connected clients.
 */

export type ReviewEventType =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "vote"
  | "flag";

export interface ReviewEventPayload {
  type: ReviewEventType;
  movieId: string;
  reviewId: string;
  timestamp: string;
  data?: any;
}

type EventListener = (event: ReviewEventPayload) => void;

class ReviewEventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * Subscribes a listener to events for a specific movie ID.
   * Returns an unsubscribe function.
   */
  subscribe(movieId: string, listener: EventListener): () => void {
    if (!this.listeners.has(movieId)) {
      this.listeners.set(movieId, new Set());
    }

    const movieListeners = this.listeners.get(movieId)!;
    movieListeners.add(listener);

    return () => {
      movieListeners.delete(listener);
      if (movieListeners.size === 0) {
        this.listeners.delete(movieId);
      }
    };
  }

  /**
   * Broadcasts a review event to all active subscribers for the specified movie.
   */
  emit(movieId: string, event: Omit<ReviewEventPayload, "timestamp" | "movieId">) {
    const movieListeners = this.listeners.get(movieId);
    if (!movieListeners || movieListeners.size === 0) return;

    const payload: ReviewEventPayload = {
      ...event,
      movieId,
      timestamp: new Date().toISOString(),
    };

    movieListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error("Error in review SSE event listener:", err);
      }
    });
  }

  /**
   * Returns count of active listeners for a movie. Useful for testing.
   */
  subscriberCount(movieId: string): number {
    return this.listeners.get(movieId)?.size ?? 0;
  }
}

export const reviewEventBus = new ReviewEventBus();
