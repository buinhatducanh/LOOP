import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes (except login-related)
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      const loginUrl = new URL("/vi/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Token exists - let the API/page handle full validation
    return NextResponse.next();
  }

  // Protect admin API routes
  if (pathname.startsWith("/api/admin") && !pathname.includes("/auth/")) {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Handle i18n routes
  return intlMiddleware(req);
}

export const config = {
  matcher: ["/", "/(vi|en)/:path*", "/admin/:path*", "/api/admin/:path*"],
};
