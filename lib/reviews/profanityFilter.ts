/**
 * Profanity Filter & Content Moderation Utility
 * Checks review titles and content against banned words and leetspeak substitutions.
 * Avoids false positives on legitimate cinema terms (e.g. "assassin", "classic", "passionate").
 */

const BASE_PROFANITY_LIST = [
  "fuck",
  "fucking",
  "fucker",
  "motherfucker",
  "fack",
  "fvck",
  "fuk",
  "fck",
  "shit",
  "bullshit",
  "bitch",
  "bastard",
  "asshole",
  "cunt",
  "dickhead",
  "slut",
  "whore",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "dipshit",
  "dumbass",
  "piss",
];

// Leetspeak translation map for obfuscation detection
const LEET_MAP: Record<string, string> = {
  "@": "a",
  "4": "a",
  "8": "b",
  "3": "e",
  "1": "i",
  "!": "i",
  "0": "o",
  "$": "s",
  "5": "s",
  "+": "t",
  "7": "t",
};

/**
 * Normalizes text by removing non-alphanumeric noise and translating common leetspeak substitutions.
 */
export function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  for (const [leet, char] of Object.entries(LEET_MAP)) {
    normalized = normalized.replaceAll(leet, char);
  }
  return normalized;
}

/**
 * Checks if a string contains any prohibited profanity or abusive slurs.
 * Uses word-boundary matching to prevent Scunthorpe false positives.
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== "string") return false;

  const normalized = normalizeText(text);

  return BASE_PROFANITY_LIST.some((word) => {
    // Exact word boundary regex
    const regex = new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, "i");
    return regex.test(normalized);
  });
}

/**
 * Finds all prohibited words present in the given text.
 */
export function findProfanities(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const normalized = normalizeText(text);
  const found: string[] = [];

  for (const word of BASE_PROFANITY_LIST) {
    const regex = new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, "i");
    if (regex.test(normalized)) {
      found.push(word);
    }
  }

  return found;
}

/**
 * Masks prohibited words in text with asterisks (e.g. "f***").
 */
export function censorProfanity(text: string): string {
  if (!text || typeof text !== "string") return text;

  let censored = text;
  for (const word of BASE_PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    censored = censored.replace(regex, (match) => {
      if (match.length <= 2) return "*".repeat(match.length);
      return match[0] + "*".repeat(match.length - 2) + match[match.length - 1];
    });
  }

  return censored;
}

/**
 * Validates review input fields.
 * Returns isValid: false and flaggedWords if any prohibited language is found.
 */
export function validateReviewText(
  title: string,
  content: string
): { isValid: boolean; flaggedWords: string[]; message?: string } {
  const titleProfanities = findProfanities(title);
  const contentProfanities = findProfanities(content);

  const combined = Array.from(new Set([...titleProfanities, ...contentProfanities]));

  if (combined.length > 0) {
    return {
      isValid: false,
      flaggedWords: combined,
      message: `Your review contains inappropriate or abusive language (${combined.join(
        ", "
      )}). Please keep reviews constructive and respectful.`,
    };
  }

  return { isValid: true, flaggedWords: [] };
}
