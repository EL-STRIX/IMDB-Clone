import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  verifySessionToken,
  resolveUserForProvider,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { SignInOptions } from "@/lib/auth/types";

/**
 * GET: Retrieve active session
 */
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.json({ authenticated: false, session: null });
  }

  const session = await verifySessionToken(cookie.value);
  if (!session) {
    const response = NextResponse.json({ authenticated: false, session: null });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    expiresAt: session.expiresAt,
  });
}

/**
 * POST: Sign in / Create session
 */
export async function POST(req: NextRequest) {
  try {
    const body: SignInOptions = await req.json();
    const { provider = "demo", username, email } = body;

    const user = resolveUserForProvider(provider, username, email);
    const token = await createSessionToken(user);

    const response = NextResponse.json({
      authenticated: true,
      user,
      message: `Signed in successfully as ${user.name}`,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Bad Request", message: "Failed to process sign in request" },
      { status: 400 }
    );
  }
}

/**
 * DELETE: Sign out / Invalidate session
 */
export async function DELETE() {
  const response = NextResponse.json({
    authenticated: false,
    message: "Signed out successfully",
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
