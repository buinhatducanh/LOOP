/**
 * GET /api/auth/google-callback
 *
 * Bridges NextAuth Google OAuth → custom JWT cookie + refresh token.
 *
 * Flow:
 *   1. User clicks "Continue with Google" in LoginForm
 *   2. NextAuth redirects to Google OAuth consent
 *   3. Google redirects back to /api/auth/callback/google
 *   4. NextAuth creates session cookie, redirects here with ?callbackUrl=...
 *   5. This route reads NextAuth session via auth(), creates our JWT cookie + refresh token
 *   6. Redirects to destination
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSession } from "@/lib/auth/session";
import { ROLE_LEVEL, AUTH_COOKIES } from "@/lib/auth/roles";
import { authLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const _callbackUrl = searchParams.get("callbackUrl") ?? "/vi/khach-hang";
  const locale = searchParams.get("locale") ?? "vi";

  try {
    const oauthSession = await auth();

    if (!oauthSession?.user?.email) {
      return NextResponse.redirect(new URL(`/${locale}/dang-nhap?error=google_failed`, req.url));
    }

    const oauthUser = oauthSession.user as {
      id: string;
      email: string;
      name?: string | null;
      role?: string;
    };

    // Resolve authoritative role from DB (authoritative over NextAuth raw role field)
    let dbUser = await prisma.user.findUnique({
      where: { id: oauthUser.id },
      select: {
        id: true,
        role: true,
        accountType: true,
        isOnboarded: true,
        teamMemberId: true,
        userRoles: {
          select: { role: { select: { name: true, level: true } } },
        },
        teamMember: { select: { accessTags: true, rank: true, availableLp: true } },
      },
    });

    // Determine authoritative accountType — always check TeamMember email match first.
    // A User might have accountType="customer" from a previous login, but if their email
    // now matches an active TeamMember, they should be treated as staff.
    // Normalize: lowercase + trim to handle email whitespace / case mismatch.
    const email = oauthUser.email?.toLowerCase().trim();
    // Capture ids before any narrowing so closures can safely reference them
    const dbUserId = dbUser?.id ?? null;
    let accountType: "staff" | "customer" = (dbUser?.accountType as "staff" | "customer") ?? "customer";
    let teamMemberMatchId: string | null = dbUser?.teamMemberId ?? null;

    if (teamMemberMatchId) {
      // User already linked to a TeamMember → staff
      accountType = "staff";
    } else if (email) {
      // Check if email matches any active TeamMember → staff
      const teamMemberMatch = await prisma.teamMember.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          isActive: true,
        },
        select: { id: true },
      });
      if (teamMemberMatch) {
        teamMemberMatchId = teamMemberMatch.id;
        accountType = "staff";
        // Auto-link + promote customer→staff inside a transaction (atomic)
        if (dbUserId) {
          const userId = dbUserId; // stable reference for closure
          const tmId = teamMemberMatchId; // stable reference for closure
          const isCustomer = dbUser?.accountType === "customer"; // capture before transaction
          await prisma.$transaction(async (tx) => {
            if (!isCustomer && tmId) {
              // Case B-3b: Link pre-created member (HR made member, user logs in first time)
              await tx.user.update({
                where: { id: userId },
                data: { teamMemberId: tmId, accountType: "staff" },
              });
            } else if (isCustomer && tmId) {
              // Case B-3c: Promote existing customer → staff
              //   (HR added this person as TeamMember AFTER their first login as customer)
              await tx.user.update({
                where: { id: userId },
                data: { teamMemberId: tmId, accountType: "staff", isOnboarded: true },
              });
            }
          }).catch(() => {/* non-fatal — next login will retry */});
        }
      }
    }

    // Re-fetch user after potentially linking teamMember so rank/LP reflect the
    // linked TeamMember (not the stale in-memory dbUser snapshot).
    if (dbUserId && teamMemberMatchId && !(dbUser?.teamMemberId)) {
      dbUser = await prisma.user.findUnique({
        where: { id: dbUserId },
        select: {
          id: true,
          role: true,
          accountType: true,
          isOnboarded: true,
          teamMemberId: true,
          userRoles: {
            select: { role: { select: { name: true, level: true } } },
          },
          teamMember: { select: { accessTags: true, rank: true, availableLp: true } },
        },
      });
    }
    const primaryRole = dbUser?.role ?? "member";
    const isOnboarded = dbUser?.isOnboarded ?? false;
    const roles = dbUser?.userRoles.map((ur) => ur.role.name) ?? [primaryRole];
    const roleLevel = dbUser?.userRoles.length
      ? Math.min(...dbUser.userRoles.map((ur) => ur.role.level ?? 99))
      : ROLE_LEVEL[primaryRole] ?? 5;

    const ipAddress = req.headers.get("x-forwarded-for")
      ?? req.headers.get("x-real-ip")
      ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const { accessToken, refreshToken } = await createSession(
      oauthUser.id,
      {
        roleLevel,
        email: oauthUser.email,
        name: oauthUser.name ?? "User",
        role: primaryRole,
        roles,
        accessTags: dbUser?.teamMember?.accessTags ?? [],
        accountType,
        isOnboarded,
        rank: dbUser?.teamMember?.rank,
        availableLp: dbUser?.teamMember?.availableLp,
      },
      { ipAddress: ipAddress ?? undefined, userAgent: userAgent ?? undefined }
    );

    // Determine redirect destination
    let dest: string;
    if (accountType === "staff") {
      dest = "/admin/overview";
    } else if (isOnboarded) {
      dest = `/${locale}/khach-hang`;
    } else {
      // New customer via Google — redirect to onboarding WITH token
      dest = `/${locale}/dang-nhap/client-onboarding?token=${encodeURIComponent(accessToken)}`;
    }

    const response = NextResponse.redirect(new URL(dest, req.url));

    // Access token cookie (15 min)
    response.cookies.set(AUTH_COOKIES.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });
    // Refresh token cookie (7 days)
    response.cookies.set(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    // Marker cookie for getSession() to identify auth method
    response.cookies.set(AUTH_COOKIES.AUTH_METHOD, "google", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    // Client-side auth indicator
    response.cookies.set(AUTH_COOKIES.LOGGED_IN, "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Clear stale NextAuth session cookies to prevent dual auth state
    for (const name of [
      "__Secure-next-auth.session-token",
      "__Host-next-auth.csrf-token",
      "next-auth.session-token",
      "next-auth.csrf-token",
    ]) {
      response.cookies.set(name, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
    }

    authLogger.withSLO("Google OAuth → JWT cookie + refresh token", {
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
