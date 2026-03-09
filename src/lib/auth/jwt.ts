import jwt from "jsonwebtoken";

const SECRET = process.env.AUTH_SECRET || "fallback-dev-secret";
const EXPIRES_IN = "8h";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  roles: string[];
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
