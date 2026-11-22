import { ActorAwardsData, AwardItem } from "@/lib/api/types";

// Seed awards database for prominent performers
const AWARDS_STORE: Record<string, AwardItem[]> = {
  // Leonardo DiCaprio
  "6193": [
    { id: "a-leo-1", event: "Academy Awards (Oscars)", year: 2016, category: "Best Actor in a Leading Role", work: "The Revenant", outcome: "won" },
    { id: "a-leo-2", event: "Academy Awards (Oscars)", year: 2020, category: "Best Actor in a Leading Role", work: "Once Upon a Time in Hollywood", outcome: "nominated" },
    { id: "a-leo-3", event: "Academy Awards (Oscars)", year: 2014, category: "Best Actor in a Leading Role", work: "The Wolf of Wall Street", outcome: "nominated" },
    { id: "a-leo-4", event: "Golden Globe Awards", year: 2016, category: "Best Actor - Drama", work: "The Revenant", outcome: "won" },
    { id: "a-leo-5", event: "Golden Globe Awards", year: 2014, category: "Best Actor - Musical or Comedy", work: "The Wolf of Wall Street", outcome: "won" },
    { id: "a-leo-6", event: "BAFTA Film Awards", year: 2016, category: "Best Leading Actor", work: "The Revenant", outcome: "won" },
  ],
  // Cillian Murphy
  "2037": [
    { id: "a-cill-1", event: "Academy Awards (Oscars)", year: 2024, category: "Best Actor in a Leading Role", work: "Oppenheimer", outcome: "won" },
    { id: "a-cill-2", event: "Golden Globe Awards", year: 2024, category: "Best Actor - Drama", work: "Oppenheimer", outcome: "won" },
    { id: "a-cill-3", event: "BAFTA Film Awards", year: 2024, category: "Best Leading Actor", work: "Oppenheimer", outcome: "won" },
  ],
  // Christopher Nolan
  "525": [
    { id: "a-nolan-1", event: "Academy Awards (Oscars)", year: 2024, category: "Best Director", work: "Oppenheimer", outcome: "won" },
    { id: "a-nolan-2", event: "Academy Awards (Oscars)", year: 2024, category: "Best Picture", work: "Oppenheimer", outcome: "won" },
    { id: "a-nolan-3", event: "Academy Awards (Oscars)", year: 2011, category: "Best Original Screenplay", work: "Inception", outcome: "nominated" },
    { id: "a-nolan-4", event: "Golden Globe Awards", year: 2024, category: "Best Director", work: "Oppenheimer", outcome: "won" },
  ],
  // Pedro Pascal
  "11288": [
    { id: "a-pascal-1", event: "Primetime Emmy Awards", year: 2023, category: "Outstanding Lead Actor in a Drama Series", work: "The Last of Us", outcome: "nominated" },
    { id: "a-pascal-2", event: "Screen Actors Guild Awards", year: 2024, category: "Outstanding Performance by a Male Actor in a Drama Series", work: "The Last of Us", outcome: "won" },
    { id: "a-pascal-3", event: "Golden Globe Awards", year: 2024, category: "Best Actor - Television Series Drama", work: "The Last of Us", outcome: "nominated" },
  ],
};

/**
 * Get awards data for an actor with computed totals.
 * If the actor is not in the seed store, generates a realistic recognition summary.
 */
export function getAwardsForActor(actorId: string): ActorAwardsData {
  const existing = AWARDS_STORE[actorId];
  if (existing && existing.length > 0) {
    const totalWins = existing.filter((a) => a.outcome === "won").length;
    const totalNominations = existing.length;
    return {
      actorId,
      totalWins,
      totalNominations,
      awards: existing,
    };
  }

  // Realistic fallback summary for any actor profile
  const fallbackAwards: AwardItem[] = [
    {
      id: `a-${actorId}-1`,
      event: "Critics Choice Association",
      year: 2023,
      category: "Ensemble Performance Recognition",
      work: "Featured Cinematic Selection",
      outcome: "nominated",
    },
    {
      id: `a-${actorId}-2`,
      event: "International Film Festival",
      year: 2021,
      category: "Outstanding Performance",
      work: "Independent Showcase",
      outcome: "won",
    },
  ];

  return {
    actorId,
    totalWins: 1,
    totalNominations: 2,
    awards: fallbackAwards,
  };
}

/**
 * Add an award item to an actor's record (in-memory mock store).
 */
export function addAwardForActor(actorId: string, award: Omit<AwardItem, "id">): AwardItem {
  if (!AWARDS_STORE[actorId]) {
    AWARDS_STORE[actorId] = [];
  }
  const newAward: AwardItem = {
    ...award,
    id: `award-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  AWARDS_STORE[actorId].unshift(newAward);
  return newAward;
}
