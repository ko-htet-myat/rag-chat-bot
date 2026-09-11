import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/api/auth",
  "/widget.js",
  "/api/widget",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = SESSION_COOKIE_NAMES.some((cookieName) =>
    request.cookies.has(cookieName),
  );

  const isAuthPath =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  if (isAuthPath) {
    if (sessionToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackURL", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
