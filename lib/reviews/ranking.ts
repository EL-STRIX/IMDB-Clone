import { Review } from "./schema";

/**
 * Calculates the Wilson score lower bound for a 95% confidence interval.
 * Solves the "100% positive with 1 review vs 95% positive with 1000 reviews" problem.
 * Reference: Edwin B. Wilson (1927), "Probable Inference, the Law of Succession, and Statistical Inference".
 */
export function calculateWilsonScore(upvotes: number, downvotes: number): number {
  const n = upvotes + downvotes;
  if (n === 0) return 0;

  const z = 1.96; // 95% confidence level
  const p = upvotes / n;

  const numerator =
    p +
    (z * z) / (2 * n) -
    z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  const denominator = 1 + (z * z) / n;

  return Math.max(0, numerator / denominator);
}

/**
 * Calculates a controversy score for a review.
 * A review is controversial if:
 * 1. It has a substantial total number of votes.
 * 2. The ratio of upvotes to downvotes is close to 1:1 (equal disagreement).
 */
export function calculateControversyScore(upvotes: number, downvotes: number): number {
  const total = upvotes + downvotes;
  if (total < 2) return 0;

  // Closeness of upvotes and downvotes (1 = equal, 0 = completely one-sided)
  const balance = 1 - Math.abs(upvotes - downvotes) / total;

  // Magnitude scaling (using logarithmic dampening so high vote counts carry weight)
  const magnitude = Math.log10(total + 1);

  return balance * magnitude;
}

export type ReviewSortOption = "helpful" | "recent" | "controversial";

/**
 * Sorts a list of reviews according to the specified ranking strategy.
 */
export function sortReviews(reviews: Review[], sortBy: ReviewSortOption): Review[] {
  const sorted = [...reviews];

  if (sortBy === "helpful") {
    return sorted.sort((a, b) => {
      const aUp = a.upvotes ?? a.helpfulVotes ?? 0;
      const aDown = a.downvotes ?? 0;
      const bUp = b.upvotes ?? b.helpfulVotes ?? 0;
      const bDown = b.downvotes ?? 0;

      const scoreA = calculateWilsonScore(aUp, aDown);
      const scoreB = calculateWilsonScore(bUp, bDown);

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  if (sortBy === "controversial") {
    return sorted.sort((a, b) => {
      const aUp = a.upvotes ?? a.helpfulVotes ?? 0;
      const aDown = a.downvotes ?? 0;
      const bUp = b.upvotes ?? b.helpfulVotes ?? 0;
      const bDown = b.downvotes ?? 0;

      const contA = calculateControversyScore(aUp, aDown);
      const contB = calculateControversyScore(bUp, bDown);

      if (contB !== contA) {
        return contB - contA;
      }
      return (bUp + bDown) - (aUp + aDown);
    });
  }

  // "recent" (default)
  return sorted.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
