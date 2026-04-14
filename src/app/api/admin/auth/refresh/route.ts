/**
 * POST /api/admin/auth/refresh
 *
 * Token refresh with rotation.
 *
 * Reads the refresh-token HttpOnly cookie, verifies it, rotates it,
 * and issues a new access token.
 *
 * Flow:
 *   1. Read refresh-token cookie
 *   2. Verify + decode (jose, Edge-compatible)
 *   3. Check DB: session exists, not revoked, not expired
 *   4. Rotate: revoke old RefreshToken record, create new pair
 *   5. Return new { token, refreshToken } + set new cookies
 *   6. 401 if invalid/revoked/expired
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { rotateRefreshToken } from "@/lib/auth/session";
import { extractClientIp } from "@/lib/rate-limit";
import { authLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ipAddress = extractClientIp(req);

  try {
    // Read refresh token from HttpOnly cookie
    const refreshToken =
      req.cookies.get("refresh-token")?.value ??
      (await cookies()).get("refresh-token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    const userAgent = req.headers.get("user-agent") ?? undefined;

    const result = await rotateRefreshToken(refreshToken, {
      ipAddress,
      userAgent,
    });

    if (!result) {
      authLogger.withSLO("POST /api/admin/auth/refresh — INVALID", {
        endpoint: "/api/admin/auth/refresh",
        method: "POST",
        statusCode: 401,
        latencyMs: Date.now() - start,
        ip: ipAddress,
      });

      const response = NextResponse.json(
        { error: "Refresh token invalid or revoked" },
        { status: 401 }
      );
      // Clear cookies so client knows to redirect to login
      response.cookies.delete("auth-token");
      response.cookies.delete("refresh-token");
      response.cookies.delete("auth-logged-in");
      return response;
    }

    authLogger.withSLO("POST /api/admin/auth/refresh — SUCCESS", {
      endpoint: "/api/admin/auth/refresh",
      method: "POST",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });

    const response = NextResponse.json({
      token: result.accessToken,
      refreshToken: result.refreshToken,
    });

    // Set new access token cookie (5 min)
    response.cookies.set("auth-token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 5 * 60,
      path: "/",
    });

    // Set new refresh token cookie (7 days)
    response.cookies.set("refresh-token", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 3600,
      path: "/",
    });

    return response;
  } catch (err) {
    authLogger.withSLO("POST /api/admin/auth/refresh — ERROR", {
      endpoint: "/api/admin/auth/refresh",
      method: "POST",
      statusCode: 500,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
  }
}
