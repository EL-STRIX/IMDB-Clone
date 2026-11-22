import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import ActorLayout from "@/app/actor/[id]/layout";
import SocialSlot from "@/app/actor/[id]/@social/page";
import AwardsSlot from "@/app/actor/[id]/@awards/page";
import SimilarSlot from "@/app/actor/[id]/@similar/page";
import * as cachedModule from "@/lib/api/cached";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ fill, priority, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "image"} />;
  },
}));

describe("Actor Parallel Route Layout and Subpanels (Day 30)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ActorLayout with children and all three parallel route slots", () => {
    render(
      <ActorLayout
        awards={<div data-testid="awards-slot">Awards Content</div>}
        social={<div data-testid="social-slot">Social Content</div>}
        similar={<div data-testid="similar-slot">Similar Content</div>}
      >
        <div data-testid="main-children">Main Profile</div>
      </ActorLayout>
    );

    expect(screen.getByTestId("main-children")).toBeDefined();
    expect(screen.getByTestId("awards-slot")).toBeDefined();
    expect(screen.getByTestId("social-slot")).toBeDefined();
    expect(screen.getByTestId("similar-slot")).toBeDefined();
  });

  describe("Social Subpanel (@social)", () => {
    it("renders external social links when external IDs are present", async () => {
      vi.spyOn(cachedModule, "getCachedPersonExternalIds").mockResolvedValue({
        imdbId: "nm0000138",
        instagramId: "leonardodicaprio",
        twitterId: "LeoDiCaprio",
      });

      const slotJSX = await SocialSlot({ params: Promise.resolve({ id: "123" }) });
      render(slotJSX);

      expect(screen.getByText("Official Links & Socials")).toBeDefined();
      expect(screen.getByText("IMDb Profile")).toBeDefined();
      expect(screen.getByText("@leonardodicaprio")).toBeDefined();
      expect(screen.getByText("@LeoDiCaprio")).toBeDefined();

      const imdbLink = screen.getByText("IMDb Profile").closest("a");
      expect(imdbLink?.getAttribute("href")).toBe("https://www.imdb.com/name/nm0000138");
    });

    it("renders empty state message when no external IDs are available", async () => {
      vi.spyOn(cachedModule, "getCachedPersonExternalIds").mockResolvedValue({});

      const slotJSX = await SocialSlot({ params: Promise.resolve({ id: "123" }) });
      render(slotJSX);

      expect(screen.getByText("No verified external social profiles found.")).toBeDefined();
    });
  });

  describe("Awards Subpanel (@awards)", () => {
    it("renders awards highlights and accolades", async () => {
      vi.spyOn(cachedModule, "getCachedActorAwards").mockResolvedValue({
        actorId: "123",
        totalWins: 1,
        totalNominations: 3,
        awards: [
          {
            id: "a-1",
            event: "Academy Awards (Oscars)",
            year: 2016,
            category: "Best Actor in a Leading Role",
            work: "The Revenant",
            outcome: "won",
          },
          {
            id: "a-2",
            event: "Golden Globe Awards",
            year: 2014,
            category: "Best Actor",
            work: "The Wolf of Wall Street",
            outcome: "nominated",
          },
        ],
      });

      const slotJSX = await AwardsSlot({ params: Promise.resolve({ id: "123" }) });
      render(slotJSX);

      expect(screen.getByText("Awards & Accolades")).toBeDefined();
      expect(screen.getByText("1 Win")).toBeDefined();
      expect(screen.getByText("3 Nominations")).toBeDefined();
      expect(screen.getByText("Academy Awards (Oscars)")).toBeDefined();
      expect(screen.getByText("Golden Globe Awards")).toBeDefined();
      expect(screen.getByText("Winner")).toBeDefined();
      expect(screen.getByText("Nominee")).toBeDefined();
    });
  });

  describe("Similar Actors Subpanel (@similar)", () => {
    it("renders frequent collaborators grid linking to their profiles", async () => {
      vi.spyOn(cachedModule, "getCachedSimilarActors").mockResolvedValue([
        {
          id: "kate-winslet",
          name: "Kate Winslet",
          character: "Rose DeWitt Bukater",
          profileUrl: "https://image.tmdb.org/t/p/w185/kate.jpg",
        },
        {
          id: "tom-hardy",
          name: "Tom Hardy",
          character: "Eames / John Fitzgerald",
          profileUrl: "https://image.tmdb.org/t/p/w185/tom.jpg",
        },
      ]);

      const slotJSX = await SimilarSlot({ params: Promise.resolve({ id: "123" }) });
      render(slotJSX);

      expect(screen.getByText("Frequent Co-Stars & Collaborators")).toBeDefined();
      expect(screen.getByText("Kate Winslet")).toBeDefined();
      expect(screen.getByText("Tom Hardy")).toBeDefined();

      const kateLink = screen.getByText("Kate Winslet").closest("a");
      expect(kateLink?.getAttribute("href")).toBe("/actor/kate-winslet");
    });

    it("renders empty state when no similar actors are found", async () => {
      vi.spyOn(cachedModule, "getCachedSimilarActors").mockResolvedValue([]);

      const slotJSX = await SimilarSlot({ params: Promise.resolve({ id: "123" }) });
      render(slotJSX);

      expect(screen.getByText("No frequent co-stars found for this profile.")).toBeDefined();
    });
  });
});
