/**
 * GET /api/admin/auth/google-signin
 * Initiates NextAuth Google OAuth flow.
 *
 * Flow:
 *   1. FE calls this route
 *   2. signIn("google") generates CSRF, redirects to Google OAuth
 *   3. Google redirects to /api/auth/callback/google (NextAuth default)
 *   4. NextAuth processes OAuth → session cookie
 *   5. NextAuth redirects to /api/auth/google-callback (our custom handler)
 *   6. google-callback bridges NextAuth session → our JWT cookie → redirect
 *
 * NEVER pass callbackUrl with query params to signIn — NextAuth encodes them
 * literally, and if the value itself is a NextAuth signin URL it causes a CSRF
 * loop (the CSRF check fails because the URL keeps re-encoding).
 */
import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";

export const GET = (req: NextRequest) =>
  signIn("google", {
    redirectTo: "/api/auth/google-callback",
  });
