/**
 * GET /api/auth/invite/verify
 *
 * Receives the invite token from email link.
 * Decodes the token, verifies expiry,
 * stores the memberId in a short-lived cookie,
 * then redirects to Google OAuth.
 *
 * Flow:
 *   1. Verify token
 *   2. Set HttpOnly cookie: invite-member-id (memberId) + invite-email (email)
 *      These are read by google-callback to enforce the email match.
 *   3. Redirect to Google OAuth
 *   4. After Google OAuth, google-callback reads the invite cookies
 *      and uses them to auto-link the account.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyInviteToken } from "@/lib/auth/invite-token";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/vi/dang-nhap?error=missing_invite_token", req.url));
  }

  try {
    // 1. Verify token
    const payload = await verifyInviteToken(token);

    // 2. Verify member still exists and is active
    const member = await prisma.teamMember.findUnique({
      where: { id: payload.memberId },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!member || !member.isActive) {
      return NextResponse.redirect(
        new URL("/vi/dang-nhap?error=invite_invalid", req.url)
      );
    }

    // 3. Check if member already has a linked user account
    const existingUser = await prisma.user.findUnique({
      where: { teamMemberId: member.id },
      select: { id: true },
    });

    if (existingUser) {
      // Member already linked — redirect to login instead
      return NextResponse.redirect(
        new URL("/vi/dang-nhap?info=already_linked", req.url)
      );
    }

    // 4. Set invite cookies (HttpOnly, 15 min TTL)
    const response = NextResponse.redirect(
      new URL("/api/auth/google-signin", req.url)
    );

    response.cookies.set("invite-member-id", member.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    response.cookies.set("invite-email", member.email ?? "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[INVITE VERIFY] Token verify failed:", msg);

    // Differentiate token expired vs invalid
    if (msg.includes("expired") || msg.includes("Expiration")) {
      return NextResponse.redirect(
        new URL("/vi/dang-nhap?error=invite_expired", req.url)
      );
    }

    return NextResponse.redirect(
      new URL("/vi/dang-nhap?error=invite_invalid", req.url)
    );
  }
}
