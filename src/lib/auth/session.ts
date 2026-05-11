/**
 * Session Store — LOOP Auth System
 *
 * Provides revocable session management via RefreshToken DB table.
 *
 * Core operations:
 *   createSession()       — issue access + refresh tokens, persist RefreshToken record
 *   rotateRefreshToken()  — revoke old token, issue new pair (token rotation)
 *   revokeSession()       — mark RefreshToken as revoked (force logout)
 *   revokeAllSessions()   — revoke every session for a user (logout everywhere)
 *   getActiveSessions()   — list active sessions for a user (for "devices" UI)
 *   isSessionValid()      — check if a session is active and not revoked
 *
 * Login lockout:
 *   checkLoginLockout()  — is this email/IP temporarily locked?
 *   recordLoginAttempt()  — track failed attempt, trigger lockout if needed
 *   clearLoginLockout()  — remove lockout on successful login
 */

import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  TOKEN_CONFIG,
} from "./token";

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_LOGIN_ATTEMPTS = 5;
const LOOKBACK_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000;   // 15 minutes lockout

// ─── Device Parsing ─────────────────────────────────────────────────────────────

/** Parse User-Agent into a human-readable device string, e.g. "Chrome / macOS" */
export function parseDeviceType(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();
  let browser = "Unknown";
  if (ua.includes("edg/"))       browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("chrome") && !ua.includes("chromium")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";
  let os = "Unknown";
  if (ua.includes("mac os") || ua.includes("macos")) os = "macOS";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("linux") && !ua.includes("android")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  return `${browser} / ${os}`;
}

// ─── Session Management ─────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  sessionParams: {
    roleLevel: number;
    email: string;
    name: string;
    role: string;
    roles: string[];
    accessTags: string[];
    tabPermissions?: string[];
    departmentId?: string | null;
    isDeptHead?: boolean;
    accountType: "staff" | "customer";
    isOnboarded: boolean;
    rank?: string;
    availableLp?: number;
  },
  metadata?: {
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: Date;
}> {
  const sessionId = `sess_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const expiresAt = new Date(Date.now() + TOKEN_CONFIG.refreshTTL * 1000);

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      userId,
      sessionId,
      ...sessionParams,
    }),
    signRefreshToken({
      userId,
      sessionId,
      deviceType: metadata?.deviceType ?? "Unknown",
    }),
  ]);

  // Persist refresh token hash for revocation lookup
  // Skip DB write if metadata not provided (Edge redirects without Prisma access)
  if (metadata) {
    try {
      await prisma.refreshToken.create({
        data: {
          tokenHash: hashRefreshToken(refreshToken),
          userId,
          sessionId,
          deviceType: metadata.deviceType ?? null,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
          expiresAt,
        },
      });
    } catch {
      // Non-fatal: tokens are already issued; session won't be in revocation list
    }
  }

  return { accessToken, refreshToken, sessionId, expiresAt };
}

export async function rotateRefreshToken(
  oldRefreshToken: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: Date;
} | null> {
  let payload;
  try {
    payload = await verifyRefreshToken(oldRefreshToken);
  } catch {
    return null;
  }

  const { sub: userId, sid: sessionId } = payload;
  if (!userId || !sessionId) return null;

  const session = await prisma.refreshToken.findUnique({ where: { sessionId } });
  if (!session || session.userId !== userId || session.isRevoked) {
    if (session) await revokeAllSessions(userId);
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: session.id },
    data: { isRevoked: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: { role: { include: { permissions: true } } },
        where: { isActive: true },
      },
      teamMember: { select: { rank: true, availableLp: true, lockedLp: true, accessTags: true } },
    },
  });

  if (!user || !user.isActive) return null;

  const effectiveRoleLevel =
    user.userRoles.length > 0
      ? Math.min(...user.userRoles.map((ur: typeof user.userRoles[number]) => ur.role.level ?? 99))
      : 99;
  const accountType: "staff" | "customer" = effectiveRoleLevel <= 5 ? "staff" : "customer";

  const expiresAt = new Date(Date.now() + TOKEN_CONFIG.refreshTTL * 1000);
  const deviceType = parseDeviceType(metadata?.userAgent);

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({
      userId,
      sessionId,
      roleLevel: effectiveRoleLevel,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: user.userRoles.map((ur: typeof user.userRoles[number]) => ur.role.name),
      accessTags: user.teamMember?.accessTags ?? [],
      accountType,
      isOnboarded: user.isOnboarded,
      rank: user.teamMember?.rank,
      availableLp: user.teamMember?.availableLp,
    }),
    signRefreshToken({ userId, sessionId, deviceType }),
  ]);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId,
      sessionId,
      deviceType,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      expiresAt,
      lastUsedAt: new Date(),
    },
  });

  return { accessToken, refreshToken, sessionId, expiresAt };
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  const result = await prisma.refreshToken.updateMany({
    where: { sessionId, isRevoked: false },
    data: { isRevoked: true },
  });
  return result.count > 0;
}

export async function revokeAllSessions(userId: string): Promise<number> {
  const result = await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
  return result.count;
}

export async function getActiveSessions(userId: string) {
  const sessions = await prisma.refreshToken.findMany({
    where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { sessionId: true, deviceType: true, ipAddress: true, userAgent: true, createdAt: true, lastUsedAt: true, expiresAt: true },
  });
  return sessions.map((s: { sessionId: string; deviceType: string | null; ipAddress: string | null; userAgent: string | null; createdAt: Date; lastUsedAt: Date; expiresAt: Date }) => ({ ...s, isCurrent: false }));
}

export async function isSessionValid(sessionId: string): Promise<boolean> {
  const session = await prisma.refreshToken.findUnique({
    where: { sessionId },
    select: { isRevoked: true, expiresAt: true },
  });
  return !!session && !session.isRevoked && session.expiresAt > new Date();
}

export async function clearExpiredSessions(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

// ─── Login Attempt Lockout ─────────────────────────────────────────────────────

export async function checkLoginLockout(
  email: string,
  _ipAddress: string
): Promise<{ locked: boolean; lockedUntil: Date | null }> {
  const attempt = await prisma.loginAttempt.findFirst({
    where: { email, lastAttempt: { gte: new Date(Date.now() - LOOKBACK_MS) } },
    orderBy: { lastAttempt: "desc" },
  });
  if (!attempt) return { locked: false, lockedUntil: null };
  if (attempt.lockedUntil && attempt.lockedUntil > new Date()) {
    return { locked: true, lockedUntil: attempt.lockedUntil };
  }
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return { locked: true, lockedUntil: new Date(Date.now() + LOCKOUT_MS) };
  }
  return { locked: false, lockedUntil: null };
}

export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  userId?: string
): Promise<void> {
  const now = new Date();
  const windowStart = new Date(Date.now() - LOOKBACK_MS);
  await prisma.loginAttempt.deleteMany({
    where: { email, lastAttempt: { lt: windowStart } },
  });
  const last = await prisma.loginAttempt.findFirst({
    where: { email },
    orderBy: { lastAttempt: "desc" },
  });
  if (!last) {
    await prisma.loginAttempt.create({
      data: {
        email, ipAddress, userId: userId ?? null,
        count: 1, lastAttempt: now,
        lockedUntil: LOCKOUT_MS > 0 ? new Date(Date.now() + LOCKOUT_MS) : null,
      },
    });
  } else {
    const updatedCount = last.count + 1;
    await prisma.loginAttempt.update({
      where: { id: last.id },
      data: {
        count: updatedCount,
        ipAddress,
        lockedUntil: updatedCount >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
        lastAttempt: now,
      },
    });
  }
}

export async function clearLoginLockout(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { email } });
}
