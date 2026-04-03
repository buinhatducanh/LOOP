/**
 * GET /api/admin/auth/google-signin
 * Redirects to NextAuth Google OAuth flow.
 * FE calls this to initiate Google sign-in.
 * NextAuth handles the full OAuth callback → sets session cookie.
 * After OAuth completes, FE can call /api/admin/auth/me to get session.
 */
import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";

export async function GET(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") ?? "/vi/dang-nhap";

  // Redirect to NextAuth Google sign-in handler
  // NextAuth will redirect to Google, then back to /api/auth/callback/google
  return NextResponse.redirect(
    new URL(`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`, req.url)
  );
}
