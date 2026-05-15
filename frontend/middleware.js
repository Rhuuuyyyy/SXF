import { NextResponse } from "next/server";

// Protected routes redirect to login when the auth cookie is absent.
// The cookie is set by saveAuth() in lib/auth.js — it is a presence flag
// only (not the JWT itself) so it can be a regular (non-HttpOnly) cookie.
export function middleware(request) {
  const hasAuth = request.cookies.has("sxf_auth");
  if (!hasAuth) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/triagem/:path*", "/resultado/:path*"],
};
