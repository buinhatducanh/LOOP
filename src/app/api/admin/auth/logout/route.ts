import { NextResponse } from "next/server";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/permissions";

export async function POST() {
  // Auth guard: only an authenticated user can clear their own session cookies.
  // Without this, unauthenticated attackers could wipe other users' sessions.
  await requireAuth();
  const response = ok({ success: true });

  // Clear auth-token cookie
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  // Clear auth-method cookie
  response.cookies.set("auth-method", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
