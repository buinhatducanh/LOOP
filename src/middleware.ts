import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "./lib/auth/edge";

// ─── Admin page routes ───────────────────────────────────────────────────────
// Admin page auth: redirect to /admin/login if unauthenticated.
// (API auth is handled per-route via requirePermission().)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin API routes ────────────────────────────────────────────────────
  // Auth is handled per-route via requirePermission(), not here.
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // ── Admin page routes ────────────────────────────────────────────────────
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const result = checkAdminAccess(req, pathname);
    if (!result.allowed) {
      // Redirect to admin login for unauthenticated, return 403 for forbidden
      if (result.reason === "unauthenticated") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ── All other routes → API-only app, return lightweight JSON ────────────
  if (
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    pathname !== "/favicon.ico"
  ) {
    return NextResponse.json(
      {
        name: "LOOP API",
        status: "ok",
        message: "Backend-only. API available at /api/*",
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
