/**
 * Standardized API response helpers.
 *
 * Usage:
 *   import { ok, list, badRequest, ... } from '@/lib/api/response'
 *
 * Convention:
 *   - Single item  → { data: T }
 *   - List         → { data: T[], pagination: Pagination }
 *   - Errors       → { error: string }
 */

import { NextResponse } from "next/server";
import type { Pagination } from "@/types/api-contract";
import type { ApiError } from "./errors";
import type { AuthError } from "@/lib/auth/permissions";

// ─── Success helpers ────────────────────────────────────────────────────────

/**
 * Return a single item wrapped in { data }.
 * @example return ok({ id: '1', name: 'Service A' })
 */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Return a list wrapped in { data, pagination }.
 * @example return list(items, buildPagination(page, limit, total))
 */
export function list<T>(data: T[], pagination: Pagination, status = 200) {
  return NextResponse.json({ data, pagination }, { status });
}

/**
 * Return a raw JSON payload (for custom-shaped responses).
 * Use only when the standard { data } or { data, pagination } wrappers
 * don't fit the endpoint's contract.
 */
export function json<T>(payload: T, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(payload, { status, headers });
}

/**
 * Build a Pagination object from page/limit/total.
 */
export function buildPagination(
  page: number,
  limit: number,
  total: number
): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── Error helpers ──────────────────────────────────────────────────────────

/**
 * 400 Bad Request — client sent invalid data.
 */
export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * 401 Unauthorized — not authenticated.
 */
export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * 403 Forbidden — authenticated but lacks permission.
 */
export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * 404 Not Found — resource does not exist.
 */
export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * 409 Conflict — duplicate or conflicting state.
 */
export function conflict(message = "Conflict") {
  return NextResponse.json({ error: message }, { status: 409 });
}

/**
 * 422 Unprocessable Entity — well-formed but semantically invalid.
 */
export function unprocessable(message = "Unprocessable entity") {
  return NextResponse.json({ error: message }, { status: 422 });
}

/**
 * 500 Internal Server Error — unexpected server-side failure.
 */
export function serverError(message = "Internal server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * 503 Service Unavailable — database or downstream service is down.
 */
export function serviceUnavailable(message = "Service unavailable") {
  return NextResponse.json({ error: message }, { status: 503 });
}

// ─── Error helper utilities ────────────────────────────────────────────────

/**
 * Map thrown errors to appropriate HTTP responses.
 * Used in all route handlers' catch blocks.
 *
 * Handles: ApiError (with code), AuthError, plain Error, unknown.
 *
 * @example
 *   } catch (error) {
 *     return handleError(error)
 *   }
 */
export function handleError(error: unknown) {
  // ApiError — respect statusCode and forward the code
  if (error instanceof Error && "statusCode" in error && typeof (error as Record<string, unknown>)["statusCode"] === "number") {
    const apiErr = error as ApiError & { statusCode: number };
    const body: { error: string; code?: string } = { error: apiErr.message };
    if (apiErr.code) body.code = apiErr.code;
    return NextResponse.json(body, { status: apiErr.statusCode });
  }

  // AuthError
  if (error instanceof Error && error.name === "AuthError") {
    const authErr = error as AuthError;
    return NextResponse.json({ error: authErr.message }, { status: authErr.statusCode });
  }

  // Known string messages → typed responses
  // ⚠️  Only match errors that are OUR own classes.
  //      Third-party errors (DB driver, external APIs) may carry generic messages
  //      like "Not found" or "Unauthorized" that should NOT map to 4xx.
  if (error instanceof Error) {
    return serverError();
  }

  return serverError();
}

/**
 * Map thrown errors to appropriate HTTP responses, with a custom fallback.
 */
export function handleErrorWithFallback(
  error: unknown,
  fallbackMessage = "Server error"
) {
  if (error instanceof Error) {
    return serverError(fallbackMessage);
  }
  return serverError(fallbackMessage);
}
