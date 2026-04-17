/**
 * Client-side JWT utilities.
 * Decodes JWT payload (without signature verification) to extract expiry.
 * Used for pre-redirect token validation to prevent auth loops.
 */

/**
 * Decode JWT payload without verification.
 * Returns null if token is malformed.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
 try {
 const parts = token.split(".");
 if (parts.length !== 3) return null;
 const payload = parts[1];
 // base64url → base64 → JSON
 const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
 const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
 const json = atob(padded);
 return JSON.parse(json) as Record<string, unknown>;
 } catch {
 return null;
 }
}

/**
 * Check if a JWT token is expired.
 * Returns false for malformed tokens (treating them as invalid).
 */
export function isTokenExpired(token: string): boolean {
 const payload = decodeJwtPayload(token);
 if (!payload) return true;
 const exp = payload.exp;
 if (typeof exp !== "number") return true;
 return Date.now() >= exp * 1000;
}

/**
 * Check if a JWT token is valid (exists, well-formed, not expired).
 */
export function isTokenValid(token: string | null | undefined): token is string {
 if (!token) return false;
 if (token.trim() === "") return false;
 return !isTokenExpired(token);
}
