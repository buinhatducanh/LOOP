/**
 * GET /api/auth/google-callback
 *
 * Bridges NextAuth Google OAuth → custom JWT cookie.
 *
 * Flow:
 *   1. User clicks "Continue with Google" in LoginForm
 *   2. NextAuth redirects to Google OAuth consent
 *   3. Google redirects back to /api/auth/callback/google
 *   4. NextAuth creates session cookie, redirects here with ?callbackUrl=...
 *   5. This route reads NextAuth session via auth(), creates our JWT cookie
 *   6. Redirects to destination
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { signToken } from "@/lib/auth/jwt";
import { authLogger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const callbackUrl = searchParams.get("callbackUrl") ?? "/vi/khach-hang";
  const locale = searchParams.get("locale") ?? "vi";

  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.redirect(new URL(`/${locale}/dang-nhap?error=google_failed`, req.url));
    }

    const oauthUser = session.user as {
      id: string;
      email: string;
      name?: string | null;
      role?: string;
    };

    // Create custom JWT token matching what /api/admin/auth/login issues
    const jwtToken = signToken({
      userId: oauthUser.id,
      email: oauthUser.email,
      role: oauthUser.role ?? "user",
      roles: [],
    });

    // Destination: respect callbackUrl, but role-aware as fallback
    const dest =
      callbackUrl && callbackUrl !== "/vi/khach-hang"
        ? callbackUrl
        : oauthUser.role === "staff" || oauthUser.role === "admin" || oauthUser.role === "manager"
          ? "/admin/overview"
          : `/${locale}/khach-hang`;

    const response = NextResponse.redirect(new URL(dest, req.url));

    // Set our custom JWT cookie (same pattern as /api/admin/auth/login)
    response.cookies.set("auth-token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    // Marker cookie for getSession() to identify auth method
    response.cookies.set("auth-method", "google", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    authLogger.withSLO("Google OAuth → JWT cookie", {
      endpoint: "/api/auth/google-callback",
      method: "GET",
      statusCode: 302,
      latencyMs: 0,
    });

    return response;
  } catch (err) {
    authLogger.withSLO("Google OAuth callback error", {
      endpoint: "/api/auth/google-callback",
      method: "GET",
      statusCode: 500,
      latencyMs: 0,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(new URL(`/${locale}/dang-nhap?error=google_failed`, req.url));
  }
}
