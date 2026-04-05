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
import { prisma } from "@/lib/prisma";
import { ROLE_LEVEL } from "@/lib/auth/roles";

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

    // Resolve authoritative role from DB (authoritative over NextAuth raw role field)
    const dbUser = await prisma.user.findUnique({
      where: { id: oauthUser.id },
      select: {
        role: true,
        accountType: true,
        isOnboarded: true,
        teamMemberId: true,
      },
    });

    const primaryRole = dbUser?.role ?? "member";
    const accountType = dbUser?.accountType ?? "customer";
    const isOnboarded = dbUser?.isOnboarded ?? false;
    const roleLevel = ROLE_LEVEL[primaryRole] ?? 5;

    // Track loginCount + lastLogin for Google OAuth users
    await prisma.user.update({
      where: { id: oauthUser.id },
      data: {
        loginCount: { increment: 1 },
        lastLogin: new Date(),
      },
    }).catch(() => {/* ignore if user doesn't exist yet */});

    // Determine redirect destination
    let dest: string;
    if (accountType === "staff") {
      dest = "/admin/overview";
    } else if (isOnboarded) {
      dest = `/${locale}/khach-hang`;
    } else {
      // New customer via Google — redirect to onboarding
      dest = `/${locale}/dang-nhap/client-onboarding`;
    }

    // Create custom JWT token with authoritative DB roleLevel + isOnboarded
    const jwtToken = signToken({
      userId: oauthUser.id,
      email: oauthUser.email,
      role: primaryRole,
      roles: [primaryRole],
      roleLevel,
      accountType,
      teamMemberId: dbUser?.teamMemberId ?? null,
      isOnboarded,
    });

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
