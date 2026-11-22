import { User, Session, AuthProviderType } from "./types";

export const SESSION_COOKIE_NAME = "imdb_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Default secret for session signing in development/tests
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "imdb-clone-super-secure-production-signing-secret-key-32chars";

export const DEMO_USERS: Record<string, User> = {
  critic: {
    id: "usr-critic-101",
    name: "Eleanor Vance (Top Critic)",
    email: "eleanor.vance@variety-reviews.com",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    role: "critic",
  },
  cinephile: {
    id: "usr-cinephile-202",
    name: "Alex Rivera",
    email: "alex.rivera@imdb-fan.org",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    role: "user",
  },
};

/**
 * Creates a base64url encoded string
 */
function base64UrlEncode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64url");
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decodes a base64url encoded string
 */
function base64UrlDecode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64url").toString("utf-8");
  }
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}

/**
 * Generates an HMAC-SHA256 signature using Web Crypto API
 */
async function signMessage(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message)
  );

  const bytes = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

/**
 * Signs and packages a user session into an HMAC-authenticated token
 */
export async function createSessionToken(user: User): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = JSON.stringify({ user, expiresAt });
  const encodedPayload = base64UrlEncode(payload);
  const signature = await signMessage(encodedPayload, AUTH_SECRET);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a session token. Returns the session if valid, null otherwise.
 */
export async function verifySessionToken(token: string): Promise<Session | null> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = await signMessage(encodedPayload, AUTH_SECRET);
  if (expectedSignature !== providedSignature) {
    return null; // Invalid signature / tampered token
  }

  try {
    const json = base64UrlDecode(encodedPayload);
    const parsed = JSON.parse(json);
    if (!parsed.user || !parsed.expiresAt) {
      return null;
    }

    // Check expiration
    if (Date.now() > parsed.expiresAt) {
      return null; // Expired session
    }

    return {
      user: parsed.user,
      expiresAt: parsed.expiresAt,
      token,
    };
  } catch {
    return null;
  }
}

/**
 * Resolves a User object for a given authentication provider
 */
export function resolveUserForProvider(
  provider: AuthProviderType,
  username?: string,
  email?: string
): User {
  if (provider === "demo") {
    return username === "cinephile" ? DEMO_USERS.cinephile : DEMO_USERS.critic;
  }

  if (provider === "github") {
    const handle = username || "github_user";
    return {
      id: `usr-gh-${handle.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      name: username || "GitHub Cinephile",
      email: email || `${handle}@users.noreply.github.com`,
      image: `https://github.com/${handle}.png`,
      role: "user",
    };
  }

  // Google Provider
  const gName = username || "Google User";
  return {
    id: `usr-g-${Math.random().toString(36).slice(2, 10)}`,
    name: gName,
    email: email || "user@gmail.com",
    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(gName)}&background=0D8ABC&color=fff`,
    role: "user",
  };
}
