import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./session";
import { User, Session } from "./types";

export type AuthResult =
  | { authenticated: true; user: User; session: Session }
  | { authenticated: false; response: NextResponse };

/**
 * Validates request authentication from cookie or Bearer header.
 * If unauthenticated, returns a 401 Unauthorized JSON response.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  let token: string | undefined;

  // 1. Try reading from HTTP cookie
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (cookie?.value) {
    token = cookie.value;
  }

  // 2. Fallback to Authorization: Bearer <token> header
  if (!token) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message: "You must be signed in to submit or modify reviews.",
        },
        { status: 401 }
      ),
    };
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          message: "Session expired or invalid. Please sign in again.",
        },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    user: session.user,
    session,
  };
}
