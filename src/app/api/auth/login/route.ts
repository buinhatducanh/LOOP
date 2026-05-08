/**
 * POST /api/auth/login
 *
 * Customer credentials login — issues a JWT for customer portal access.
 *
 * Split Auth Architecture (Option C):
 *   1. Validates email + password credentials
 *   2. Creates session with accountType = "customer"
 *   3. Sets loop-customer-token HttpOnly cookie (15 min)
 *   4. Returns { user, token } in body (FE stores token in localStorage)
 *
 * This endpoint is used by the "Khách hàng" tab on /dang-nhap page.
 * Staff login uses POST /api/admin/auth/login instead.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  checkLoginLockout,
  recordLoginAttempt,
  clearLoginLockout,
  parseDeviceType,
} from "@/lib/auth/session";
import { createAuditLog } from "@/lib/auth/audit";
import { ROLE_LEVEL } from "@/lib/auth/roles";
import { applyRateLimit, extractClientIp } from "@/lib/rate-limit";
import { authLogger } from "@/lib/logger";

// Pre-computed hash for timing-safe comparison when user doesn't exist
const DUMMY_HASH = "$2a$12$LJ3m4ys3Rl3hPcyFSevMnuGHvZw7KLEqKl6.s8EWYFONbJdRe0Gu2";

function isDbUnavailableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message;
    return (
      msg.includes("Can't reach database") ||
      msg.includes("Connection terminated") ||
      msg.includes("timeout") ||
      msg.includes("P1001") ||
      msg.includes("P2024")
    );
  }
  return false;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ipAddress = extractClientIp(req);

  // ── Rate limit: 5 attempts/min per IP ─────────────────────────────────────
  const rateLimitResult = await applyRateLimit(req, "auth");
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    // ── LoginAttempt lockout check ────────────────────────────────────────────
    const lockout = await checkLoginLockout(email, ipAddress);
    if (lockout.locked) {
      return NextResponse.json(
        {
          error: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.",
          retryAfter: lockout.lockedUntil
            ? Math.ceil((lockout.lockedUntil.getTime() - Date.now()) / 1000)
            : 900,
        },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    // ── Fetch user ────────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        isOnboarded: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
                level: true,
                permissions: {
                  select: { resource: true, action: true, scope: true },
                },
              },
            },
          },
        },
        teamMember: {
          select: { accessTags: true, rank: true, availableLp: true },
        },
      },
    });

    // ── Timing-safe password verification ─────────────────────────────────────
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const valid = await verifyPassword(password, hashToCompare);

    if (!user || !user.passwordHash || !valid) {
      if (user) {
        await recordLoginAttempt(email, ipAddress, user.id);
        await createAuditLog({ userId: user.id, action: "login_failed", resource: "auth-customer" });
      }
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // ── Account status check ──────────────────────────────────────────────────
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Tài khoản đã bị vô hiệu hoá" },
        { status: 403 }
      );
    }

    // ── Success: clear lockout + track login ──────────────────────────────────
    await Promise.all([
      clearLoginLockout(email),
      prisma.user.update({
        where: { id: user.id },
        data: { loginCount: { increment: 1 }, lastLogin: new Date() },
      }),
      createAuditLog({ userId: user.id, action: "login_success", resource: "auth-customer" }),
    ]);

    // ── Determine effective role level ───────────────────────────────────────
    // Customers have roleLevel > 5 (by convention). If user somehow has level ≤ 5,
    // they should use /api/admin/auth/login instead. We treat them as customer here.
    const effectiveRoleLevel =
      user.userRoles.length > 0
        ? Math.min(...user.userRoles.map((ur: typeof user.userRoles[number]) => ur.role.level ?? 99))
        : ROLE_LEVEL[user.role] ?? 99;

    // Force accountType = "customer" for this endpoint
    // (Staff accounts should use /api/admin/auth/login)
    const accountType: "staff" | "customer" = "customer";

    const userAgent = req.headers.get("user-agent") ?? "";
    const deviceType = parseDeviceType(userAgent);

    // ── Create session ─────────────────────────────────────────────────────────
    const { accessToken, refreshToken } = await createSession(user.id, {
      roleLevel: effectiveRoleLevel,
      email: user.email,
      name: user.name ?? "",
      role: user.role ?? "customer",
      roles: user.userRoles.map((ur: typeof user.userRoles[number]) => ur.role.name),
      accessTags: user.teamMember?.accessTags ?? [],
      accountType,
      isOnboarded: user.isOnboarded ?? false,
      rank: user.teamMember?.rank ?? undefined,
      availableLp: user.teamMember?.availableLp ?? undefined,
    }, {
      deviceType,
      ipAddress,
      userAgent,
    });

    authLogger.withSLO("POST /api/auth/login success (customer)", {
      endpoint: "/api/auth/login",
      method: "POST",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });

    // ── Build response ────────────────────────────────────────────────────────
    const response = NextResponse.json({
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role ?? "customer",
        accountType,
        isOnboarded: user.isOnboarded ?? false,
        rank: user.teamMember?.rank,
        availableLp: user.teamMember?.availableLp,
      },
      token: accessToken,
      refreshToken,
    });

    // ── Set cookies (split auth: Option C) ─────────────────────────────────────
    const cookieOptions = (maxAge: number) => ({
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge,
      path: "/",
    });

    // Customer access token — HttpOnly, 15 minutes
    response.cookies.set("loop-customer-token", accessToken, cookieOptions(15 * 60));

    // Refresh token — HttpOnly, 7 days
    response.cookies.set("refresh-token", refreshToken, cookieOptions(7 * 24 * 3600));

    // Clear staff token on customer login (prevent cross-account state)
    response.cookies.set("loop-staff-token", "", {
      ...cookieOptions(0),
      maxAge: 0,
    });

    // Flags (non-HttpOnly, FE reads these)
    response.cookies.set("auth-method", "customer", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      path: "/",
    });

    response.cookies.set("auth-logged-in", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      path: "/",
    });

    return response;
  } catch (err) {
    authLogger.withSLO("POST /api/auth/login failed", {
      endpoint: "/api/auth/login",
      method: "POST",
      statusCode: 500,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });

    if (isDbUnavailableError(err)) {
      return NextResponse.json(
        { error: "Không thể kết nối máy chủ. Vui lòng thử lại sau." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
