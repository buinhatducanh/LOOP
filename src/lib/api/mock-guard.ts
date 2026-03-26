/**
 * Mock API guard — controls whether mock routes are active.
 *
 * Enable mock API by setting:
 *   NEXT_PUBLIC_MOCK_API=true
 *
 * This allows FE to develop in parallel with BE without needing
 * a real backend connection.
 */

import { NextResponse } from "next/server";
import { serviceUnavailable } from "./response";

/**
 * Returns a 503 NextResponse if mock API is not enabled,
 * or null if it's enabled. Use in mock route handlers:
 *
 *   const blocked = requireMockApi()
 *   if (blocked) return blocked
 */
export function requireMockApi(): NextResponse | null {
  if (process.env.NEXT_PUBLIC_MOCK_API !== "true") {
    return serviceUnavailable(
      "Mock API is disabled. Set NEXT_PUBLIC_MOCK_API=true in .env.local to enable it."
    );
  }
  return null;
}
