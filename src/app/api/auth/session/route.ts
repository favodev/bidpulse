import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

const SESSION_COOKIE_NAME = "bp_session";
const SESSION_MAX_AGE = 60 * 60; // 1 hour in seconds

/**
 * POST /api/auth/session
 * Sets an HttpOnly session cookie after verifying the Firebase ID token.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Verify the token with Firebase Admin
    const auth = getAdminAuth();
    await auth.verifyIdToken(token);

    // Set HttpOnly cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid token";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie on logout.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
