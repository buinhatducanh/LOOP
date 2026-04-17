/**
 * Unified JWS Token Library — LOOP Auth System
 *
 * Replaces jwt.ts (jsonwebtoken) with jose for Edge + Node.js compatibility.
 *
 * Token types:
 *   - Access token  (5 min TTL) — stateless, verified via JWS signature
 *   - Refresh token (7d TTL)    — stored in DB for revocation, rotated on use
 *
 * Both tokens carry "sid" (session ID) linking to RefreshToken DB row for revocation.
 * Both tokens use JWK thumbprint as "kid" header for key rotation support.
 */

import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { createHash } from "crypto";

// ─── Token Configuration ────────────────────────────────────────────────────────

export const TOKEN_CONFIG = {
  issuer: "loop-auth",
  audience: "loop-admin",
  accessTTL: 24 * 60 * 60, // 24 hours in seconds
  refreshTTL: 7 * 24 * 3600, // 7 days in seconds
} as const;

export type TokenType = "access" | "refresh";

// ─── Secret Management ──────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

/** SHA-256 thumbprint of the secret — used as token "kid" (key ID) */
export function getSecretThumbprint(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return createHash("sha256").update(secret).digest("base64url");
}

// ─── Token Payload Types ────────────────────────────────────────────────────────

/** Claims embedded in access tokens (subset of SessionUser for stateless verify) */
export interface AccessTokenPayload extends JWTPayload {
  sub: string;        // userId
  sid: string;        // sessionId (links to RefreshToken DB row)
  typ: "access";
  kid: string;        // key ID (secret thumbprint)
  rl: number;         // roleLevel
  eml: string;        // email
  nam: string;        // name
  rol: string;        // primary role
  rls: string[];      // all roles
  ats: string[];      // accessTags
  acc: "staff" | "customer";
  onb: boolean;       // isOnboarded
  rmk: string;        // rank (optional)
  alp?: number;       // availableLp (optional)
  rlp?: number;       // rankLevel (optional, for quick level check)
}

/** Claims embedded in refresh tokens */
export interface RefreshTokenPayload extends JWTPayload {
  sub: string;        // userId
  sid: string;        // sessionId
  typ: "refresh";
  kid: string;        // key ID
  dev: string;        // device type
}

// ─── Access Token ───────────────────────────────────────────────────────────────

/**
 * Sign an access token (24h TTL — aligns with cookie maxAge in login route).
 *
 * @param params.sub       - userId
 * @param params.sessionId - links to RefreshToken DB row
 * @param params.roleLevel - numeric role level (CEO=-1 … member=5)
 * @param params.email     - user email (minimal PII)
 * @param params.name      - display name
 * @param params.role      - primary role name
 * @param params.roles     - all assigned role names
 * @param params.accessTags - team member access tags
 * @param params.accountType - "staff" | "customer"
 * @param params.isOnboarded - whether customer completed onboarding
 * @param params.rank       - team member rank (optional)
 * @param params.availableLp - LP balance (optional)
 * @param params.rankLevel  - quick roleLevel for middleware (optional)
 */
export async function signAccessToken(params: {
  userId: string;
  sessionId: string;
  roleLevel: number;
  email: string;
  name: string;
  role: string;
  roles: string[];
  accessTags: string[];
  accountType: "staff" | "customer";
  isOnboarded: boolean;
  rank?: string;
  availableLp?: number;
  rankLevel?: number;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const kid = getSecretThumbprint();

  return new SignJWT({
    typ: "access",
    sid: params.sessionId,
    rl: params.roleLevel,
    eml: params.email,
    nam: params.name,
    rol: params.role,
    rls: params.roles,
    ats: params.accessTags,
    acc: params.accountType,
    onb: params.isOnboarded,
    rmk: params.rank,
    alp: params.availableLp,
    rlp: params.rankLevel,
  })
    .setProtectedHeader({ alg: "HS256", kid })
    .setIssuedAt(now)
    .setIssuer(TOKEN_CONFIG.issuer)
    .setAudience(TOKEN_CONFIG.audience)
    .setExpirationTime(now + TOKEN_CONFIG.accessTTL)
    .setSubject(params.userId)
    .sign(getSecret());
}

/**
 * Verify and decode an access token.
 * Throws if invalid or expired.
 * Works in Edge Runtime (uses jose, not jsonwebtoken).
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: TOKEN_CONFIG.issuer,
    audience: TOKEN_CONFIG.audience,
  });

  if (payload.typ !== "access") {
    throw new Error("invalid token type");
  }

  return payload as AccessTokenPayload;
}

// ─── Refresh Token ─────────────────────────────────────────────────────────────

/**
 * Sign a refresh token (7d TTL).
 * The raw token string is returned to be stored in HttpOnly cookie.
 * Its hash is stored in DB for lookup + revocation.
 *
 * @param params.userId     - userId
 * @param params.sessionId  - unique session ID (embedded in access token too)
 * @param params.deviceType - parsed device string, e.g. "Chrome / macOS"
 */
export async function signRefreshToken(params: {
  userId: string;
  sessionId: string;
  deviceType: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const kid = getSecretThumbprint();

  return new SignJWT({
    typ: "refresh",
    sid: params.sessionId,
    dev: params.deviceType,
  })
    .setProtectedHeader({ alg: "HS256", kid })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_CONFIG.refreshTTL)
    .setSubject(params.userId)
    .sign(getSecret());
}

/**
 * Verify and decode a refresh token.
 * Throws if invalid or expired.
 * Works in Edge Runtime.
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());

  if (payload.typ !== "refresh") {
    throw new Error("invalid token type");
  }

  return payload as RefreshTokenPayload;
}

/** Hash a refresh token for DB storage (SHA-256, base64url) */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

// ─── Utility ────────────────────────────────────────────────────────────────────

/**
 * Lightweight decode (no signature verification).
 * Used by middleware for logging only — DO NOT use for auth decisions.
 * For auth, always use verifyAccessToken() or verifyRefreshToken().
 */
export function decodeTokenPayload(token: string): AccessTokenPayload | null {
  try {
    // jose doesn't have a "decode without verify" in the same way jsonwebtoken does.
    // We use jwtVerify with a dummy secret that will fail signature check,
    // but we can extract the payload from the token directly using base64.
    // Instead, use a simpler approach — split the JWT and decode the payload.
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}