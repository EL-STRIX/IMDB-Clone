import { openDB, IDBPDatabase } from "idb";

export interface ReviewDraft {
  movieId: string;
  rating: number;
  title: string;
  content: string;
  spoiler: boolean;
  savedAt: string; // ISO string
}

const DB_NAME = "imdb_review_drafts_db";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const LOCAL_STORAGE_PREFIX = "imdb_review_draft_";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "movieId" });
        }
      },
    });
  }
  return dbPromise;
}

export class ReviewDraftStore {
  /**
   * Saves a draft to IndexedDB (with LocalStorage fallback)
   */
  async saveDraft(draft: Omit<ReviewDraft, "savedAt">): Promise<ReviewDraft> {
    const fullDraft: ReviewDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    };

    // Primary: IndexedDB
    if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
      try {
        const db = await getDb();
        await db.put(STORE_NAME, fullDraft);
        return fullDraft;
      } catch {
        // Fallback below
      }
    }

    // Fallback: LocalStorage
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(
          `${LOCAL_STORAGE_PREFIX}${draft.movieId}`,
          JSON.stringify(fullDraft)
        );
      } catch {
        // Storage quota exceeded or private mode
      }
    }

    return fullDraft;
  }

  /**
   * Retrieves an existing draft for a movie
   */
  async getDraft(movieId: string): Promise<ReviewDraft | null> {
    if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
      try {
        const db = await getDb();
        const draft = await db.get(STORE_NAME, movieId);
        if (draft) return draft;
      } catch {
        // Fallback below
      }
    }

    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const item = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${movieId}`);
        if (item) {
          return JSON.parse(item) as ReviewDraft;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Deletes a draft (called on discard or successful review post)
   */
  async clearDraft(movieId: string): Promise<void> {
    if (typeof window !== "undefined" && typeof indexedDB !== "undefined") {
      try {
        const db = await getDb();
        await db.delete(STORE_NAME, movieId);
      } catch {
        // Fallback below
      }
    }

    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${movieId}`);
      } catch {
        // Ignore
      }
    }
  }
}

export const reviewDraftStore = new ReviewDraftStore();
