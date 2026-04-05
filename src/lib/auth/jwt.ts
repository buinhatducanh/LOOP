import jwt from "jsonwebtoken";

const EXPIRES_IN = "8h";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  roles: string[];
  roleLevel?: number;
  teamMemberId?: string | null;
  accountType?: string;
  accessTags?: string[];
  isOnboarded?: boolean;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN });
}

/** Sign a short-lived token for password reset. No userId/role needed. */
export function signResetToken(email: string, otpId: string): string {
  return jwt.sign(
    { purpose: "password_reset", email, otpId },
    getSecret(),
    { expiresIn: "10m" }
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JWTPayload;
  } catch {
    return null;
  }
}
