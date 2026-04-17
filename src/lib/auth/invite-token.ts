/**
 * Invite Token — Stateless JWT for team member onboarding.
 *
 * When admin creates a TeamMember, we sign a short-lived JWT containing:
 *   - memberId  (so we know WHICH member record to link)
 *   - email     (so we can match against the Google OAuth profile)
 *   - inviterId (admin who sent the invite)
 *   - expires   (7 days)
 *
 * The token is embedded in the invite email URL.
 * When the member clicks the URL, the verify route decodes the token,
 * then redirects to Google OAuth with the token in the URL.
 * The google-callback route reads the token, verifies it,
 * and uses the memberId/email to auto-link the account.
 *
 * Security: tokens are stateless (jose), not stored in DB.
 * Expiry is enforced at verify time. If a member's email changes,
 * the token still contains the original email — the google-callback
 * match uses current TeamMember.email, which is fine.
 */

import { SignJWT, jwtVerify } from "jose";

const ISSUER = "loop-invite";
const AUDIENCE = "loop-invite";
const TTL_SECONDS = 7 * 24 * 3600; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return new TextEncoder().encode(secret);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InviteTokenPayload {
  memberId: string;
  email: string;
  inviterId: string;
  inviterName: string;
  inviterEmail: string;
  memberName: string;
}

/** Serialized JWT string — safe to put in URL query param */
export type InviteTokenString = string;

// ─── Sign ───────────────────────────────────────────────────────────────────

/**
 * Create a signed invite token (7-day TTL).
 * Call this when admin creates a TeamMember or clicks "Resend invite".
 */
export async function signInviteToken(params: {
  memberId: string;
  email: string;
  inviterId: string;
  inviterName: string;
  inviterEmail: string;
  memberName: string;
}): Promise<InviteTokenString> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    mid: params.memberId,  // memberId
    eml: params.email,
    iid: params.inviterId,
    inm: params.inviterName,
    iem: params.inviterEmail,
    mnm: params.memberName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(now + TTL_SECONDS)
    .sign(getSecret());
}

// ─── Verify ─────────────────────────────────────────────────────────────────

/**
 * Verify and decode an invite token.
 * Throws if invalid or expired.
 * Returns the payload so the caller can read memberId/email.
 */
export async function verifyInviteToken(
  token: string
): Promise<InviteTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  const memberId = payload.mid as string;
  const email = payload.eml as string;
  const inviterId = payload.iid as string;
  const inviterName = payload.inm as string;
  const inviterEmail = payload.iem as string;
  const memberName = payload.mnm as string;

  if (!memberId || !email) {
    throw new Error("invalid invite token: missing required claims");
  }

  return { memberId, email, inviterId, inviterName, inviterEmail, memberName };
}

// ─── Build invite URL ────────────────────────────────────────────────────────

/**
 * Build the full invite URL that goes in the email.
 * Points to /api/auth/invite/verify which decodes the token
 * and redirects to Google OAuth with the token preserved.
 */
export function buildInviteUrl(token: InviteTokenString, baseUrl: string): string {
  const url = new URL(`${baseUrl}/api/auth/invite/verify`);
  url.searchParams.set("token", token);
  return url.toString();
}
