import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("bp_session")?.value;
  if (session) return NextResponse.next();

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
  ],
};
