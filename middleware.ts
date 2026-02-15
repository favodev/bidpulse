import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("bp_session")?.value;

  // No session cookie at all — redirect to login
  if (!session) {
    return redirectToLogin(request);
  }

  // For admin routes, verify token + admin status server-side
  if (request.nextUrl.pathname.startsWith("/admin")) {
    try {
      const verifyUrl = new URL("/api/auth/verify-admin", request.url);
      const res = await fetch(verifyUrl, {
        headers: { Cookie: `bp_session=${session}` },
      });
      if (!res.ok) {
        return redirectToLogin(request);
      }
    } catch {
      return redirectToLogin(request);
    }
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/auction/create",
    "/auction/:path*/edit",
    "/profile",
    "/settings",
    "/my-auctions",
    "/my-bids",
    "/favorites",
    "/reviews/create",
    "/dashboard",
    "/reviews",
    "/checkout/:path*",
    "/transactions",
    "/admin/:path*",
  ],
};
