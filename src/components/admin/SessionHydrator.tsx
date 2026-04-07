"use client";

/**
 * SessionHydrator — no-op for now.
 *
 * Login already validated credentials and persisted the token.
 * Session is trusted — no re-verification needed.
 *
 * Future: add periodic token refresh here if JWT expiry is short.
 */
export function SessionHydrator() {
  return null;
}
