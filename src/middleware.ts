import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Routes that don't require authentication
const publicRoutes = ["/login", "/register", "/api/auth"];

// Helper to check if user is authenticated
function isAuthenticated(req: NextRequest): boolean {
  // Check for NextAuth session cookie
  const nextAuthSessionToken = req.cookies.get("next-auth.session-token");
  const nextAuthCsrfToken = req.cookies.get("__Host-next-auth.csrf-token");

  // Check for custom auth token
  const authToken = req.cookies.get("auth-token");

  return !!(nextAuthSessionToken || authToken || nextAuthCsrfToken);
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin API routes
  if (pathname.startsWith("/api/admin")) {
    // Allow NextAuth endpoints
    if (pathname.startsWith("/api/auth/")) {
      return NextResponse.next();
    }
    // Allow auth endpoints without token for login
    if (pathname.startsWith("/api/admin/auth/")) {
      return NextResponse.next();
    }
    // Protect all other admin API routes
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect admin pages - redirect to login if not authenticated
  // /vi/admin or /en/admin routes
  if (pathname.match(/^\/(vi|en)\/admin/)) {
    if (!isAuthenticated(req)) {
      // Extract locale from pathname
      const locale = pathname.split("/")[1];
      const loginUrl = new URL(`/${locale}/login`, req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Also check for /admin without locale (shouldn't happen with localePrefix: always)
  if (pathname === "/admin" && !isAuthenticated(req)) {
    const loginUrl = new URL("/vi/login", req.url);
    loginUrl.searchParams.set("redirect", "/vi/admin");
    return NextResponse.redirect(loginUrl);
  }

  // Handle i18n routes
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/", "/(vi|en)/:path*", "/admin/:path*", "/api/admin/:path*"],
};
