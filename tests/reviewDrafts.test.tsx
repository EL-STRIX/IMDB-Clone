import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReviewForm from "@/components/reviews/ReviewForm";
import { reviewDraftStore, ReviewDraft } from "@/lib/reviews/draftStore";
import { ToastContainer, clearToasts } from "@/components/watchlist/Toast";
import * as sessionModule from "@/components/auth/SessionProvider";
import { DEMO_USERS } from "@/lib/auth/session";

describe("Review Draft Autosave & Auto-Restore (Day 44)", () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    vi.restoreAllMocks();
    clearToasts();
    localStorage.clear();
    await reviewDraftStore.clearDraft("550");
    await reviewDraftStore.clearDraft("999");

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.spyOn(sessionModule, "useSession").mockReturnValue({
      user: DEMO_USERS.critic,
      status: "authenticated",
      isAuthenticated: true,
      signIn: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    });
  });

  afterEach(async () => {
    clearToasts();
    localStorage.clear();
    await reviewDraftStore.clearDraft("550");
    await reviewDraftStore.clearDraft("999");
  });

  function renderWithProviders(ui: React.ReactElement) {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
        <ToastContainer />
      </QueryClientProvider>
    );
  }

  describe("ReviewDraftStore Unit Operations", () => {
    it("saves and retrieves drafts correctly", async () => {
      const draft = {
        movieId: "550",
        rating: 9,
        title: "Masterpiece Draft",
        content: "Draft content saved in IndexedDB or fallback.",
        spoiler: true,
      };

      const saved = await reviewDraftStore.saveDraft(draft);
      expect(saved.savedAt).toBeDefined();

      const retrieved = await reviewDraftStore.getDraft("550");
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe("Masterpiece Draft");
      expect(retrieved?.content).toBe("Draft content saved in IndexedDB or fallback.");
      expect(retrieved?.rating).toBe(9);
      expect(retrieved?.spoiler).toBe(true);
    });

    it("clears draft successfully", async () => {
      await reviewDraftStore.saveDraft({
        movieId: "999",
        rating: 7,
        title: "To Be Cleared",
        content: "Some draft text",
        spoiler: false,
      });

      expect(await reviewDraftStore.getDraft("999")).not.toBeNull();

      await reviewDraftStore.clearDraft("999");
      expect(await reviewDraftStore.getDraft("999")).toBeNull();
    });
  });

  describe("ReviewForm Auto-Restore & Discard UI Integration", () => {
    it("automatically restores existing draft on mount and displays banner", async () => {
      // Seed a draft
      await reviewDraftStore.saveDraft({
        movieId: "550",
        rating: 10,
        title: "Unsaved Masterpiece",
        content: "Deep analysis written earlier that was saved in background.",
        spoiler: true,
      });

      renderWithProviders(<ReviewForm movieId="550" />);

      // Form opens and restores values
      expect(await screen.findByRole("form", { name: "Write a movie review" })).toBeDefined();

      const titleInput = screen.getByLabelText(/Headline/i) as HTMLInputElement;
      const contentInput = screen.getByLabelText(/Review Content/i) as HTMLTextAreaElement;
      const spoilerCheckbox = screen.getByLabelText(/This review contains spoilers/i) as HTMLInputElement;

      expect(titleInput.value).toBe("Unsaved Masterpiece");
      expect(contentInput.value).toBe("Deep analysis written earlier that was saved in background.");
      expect(spoilerCheckbox.checked).toBe(true);

      // Status banner appears
      expect(screen.getByText(/Restored unsaved draft/i)).toBeDefined();
      expect(screen.getByRole("button", { name: "Discard Draft" })).toBeDefined();
    });

    it("discards draft when clicking Discard Draft button", async () => {
      await reviewDraftStore.saveDraft({
        movieId: "550",
        rating: 9,
        title: "Draft to discard",
        content: "Discard this content please.",
        spoiler: false,
      });

      renderWithProviders(<ReviewForm movieId="550" />);

      const discardBtn = await screen.findByRole("button", { name: "Discard Draft" });
      fireEvent.click(discardBtn);

      await waitFor(async () => {
        expect(await reviewDraftStore.getDraft("550")).toBeNull();
        expect(screen.queryByText(/Restored unsaved draft/i)).toBeNull();
      });
    });

    it("autosaves draft when typing with debounce", async () => {
      renderWithProviders(<ReviewForm movieId="550" />);

      // Open form
      const openBtn = screen.getByRole("button", { name: /Write a Review/i });
      fireEvent.click(openBtn);

      const titleInput = screen.getByLabelText(/Headline/i);
      const contentInput = screen.getByLabelText(/Review Content/i);

      fireEvent.change(titleInput, { target: { value: "Autosaved Title" } });
      fireEvent.change(contentInput, { target: { value: "Autosaved Content that is long enough" } });

      // Wait for debounce (800ms) to trigger and persist draft
      await waitFor(
        async () => {
          const draft = await reviewDraftStore.getDraft("550");
          expect(draft).not.toBeNull();
          expect(draft?.title).toBe("Autosaved Title");
          expect(draft?.content).toBe("Autosaved Content that is long enough");
        },
        { timeout: 3000 }
      );
    });

    it("clears draft from store upon successful review submission", async () => {
      await reviewDraftStore.saveDraft({
        movieId: "550",
        rating: 9,
        title: "Ready to Submit",
        content: "Will be published and cleared from draft store.",
        spoiler: false,
      });

      vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            success: true,
            review: {
              id: "rev-new-123",
              movieId: "550",
              authorId: DEMO_USERS.critic.id,
              authorName: DEMO_USERS.critic.name,
              authorRole: "critic",
              rating: 9,
              title: "Ready to Submit",
              content: "Will be published and cleared from draft store.",
              spoiler: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              helpfulVotes: 0,
              totalVotes: 0,
            },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      });

      renderWithProviders(<ReviewForm movieId="550" />);

      // Form is restored with draft
      await screen.findByRole("form", { name: "Write a movie review" });

      const submitBtn = screen.getByRole("button", { name: "Submit Review" });
      fireEvent.click(submitBtn);

      // Verify draft is deleted after submission
      await waitFor(async () => {
        const draft = await reviewDraftStore.getDraft("550");
        expect(draft).toBeNull();
      });
    });
  });
});
