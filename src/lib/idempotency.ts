/**
 * Idempotency deduplication for critical POST endpoints.
 *
 * Design:
 * - FE sends `Idempotency-Key: <uuid>` header on every mutation call
 * - BE checks DB for existing key:
 *     • If exists → replay cached response (no side-effect re-executed)
 *     • If absent  → execute handler, store response keyed by idempotency key
 * - Keys auto-expire after 24h (TTL cleanup via scheduled job or on-read cleanup)
 *
 * Usage in a route handler:
 *   import { withIdempotency } from "@/lib/idempotency"
 *
 *   export const POST = withIdempotency(
 *     "create_order",
 *     async (req, session) => {
 *       // your business logic here — return NextResponse
 *     }
 *   )
 *
 * The operation name must match `IdempotencyKey.operation` in the DB.
 * Allowed operations:
 *   create_order        → POST /api/services/order
 *   create_order_admin  → POST /api/admin/orders
 *   create_enrollment   → POST /api/academy/enroll
 *   create_lp_award     → POST /api/admin/lp-awards
 *   create_lp_redemption → POST /api/admin/lp-redemptions
 *
 * @see Prisma model: IdempotencyKey (schema.prisma)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lpLogger } from "@/lib/logger";
import type { Prisma } from "@/generated/prisma";

// ─── Constants ───────────────────────────────────────────────────────────────

const IDEMPOTENCY_HEADER = "Idempotency-Key";
const TTL_HOURS = 24;

/** Registered operation names. Guard prevents typos. */
export type IdempotencyOperation =
  | "create_order"
  | "create_order_admin"
  | "create_enrollment"
  | "create_lp_award"
  | "create_lp_redemption";

const REGISTERED_OPERATIONS: IdempotencyOperation[] = [
  "create_order",
  "create_order_admin",
  "create_enrollment",
  "create_lp_award",
  "create_lp_redemption",
];

// ─── Types ─────────────────────────────────────────────────────────────────

export interface IdempotencyContext {
  userId?: string;
  memberId?: string;
}

export type IdempotentHandler = (
  req: NextRequest,
  ctx: IdempotencyContext
) => Promise<NextResponse>;

// ─── Core logic ─────────────────────────────────────────────────────────────

/**
 * Extract and validate the Idempotency-Key header value.
 * Returns null if header is missing (idempotency not requested — proceed normally).
 */
export function extractIdempotencyKey(req: NextRequest): string | null {
  const value = req.headers.get(IDEMPOTENCY_HEADER);
  if (!value || value.trim() === "") return null;

  // UUID format: 36 chars (8-4-4-4-12), alphanumeric + hyphens
  if (!/^[a-zA-Z0-9-]{1,128}$/.test(value.trim())) {
    // Reject obviously malformed keys
    return null;
  }
  return value.trim().slice(0, 128); // Safety: cap at 128 chars
}

/**
 * Check if an idempotency key already exists and is still valid (not expired).
 */
async function getExistingRecord(
  key: string
): Promise<{ statusCode: number; responseBody: unknown } | null> {
  const record = await prisma.idempotencyKey.findUnique({
    where: { key },
    select: { statusCode: true, responseBody: true, expiresAt: true },
  });
  if (!record) return null;

  // Return null if expired (handles clock skew and manual cleanup gaps)
  if (record.expiresAt < new Date()) {
    // Silently treat as no record — can proceed with deduplication check + re-execute
    // In practice this should be pruned by a scheduled job
    return null;
  }
  return { statusCode: record.statusCode, responseBody: record.responseBody };
}

/**
 * Store the idempotency key + response for future deduplication.
 * Fails silently — the mutation still succeeds even if storage fails.
 */
async function storeIdempotencyRecord(
  key: string,
  operation: IdempotencyOperation,
  ctx: IdempotencyContext,
  statusCode: number,
  responseBody: Prisma.InputJsonValue
): Promise<void> {
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  try {
    await prisma.idempotencyKey.upsert({
      where: { key },
      create: { key, operation, userId: ctx.userId, memberId: ctx.memberId, statusCode, responseBody: responseBody as Prisma.InputJsonValue, expiresAt },
      update: { statusCode, responseBody: responseBody as Prisma.InputJsonValue, expiresAt },
    });
  } catch (err) {
    // Non-fatal: log but do not fail the request
    lpLogger.warn("Failed to store idempotency key — request still succeeded", {
      key,
      operation,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Wrap a route handler with idempotency deduplication.
 *
 * Usage:
 *   export const POST = withIdempotency("create_order", async (req) => {
 *     const body = await req.json()
 *     const order = await prisma.order.create({ data: { ... } })
 *     return NextResponse.json({ data: order }, { status: 201 })
 *   })
 *
 * @param operation   - One of the registered IdempotencyOperation names
 * @param handler     - Async handler returning NextResponse (success is cached)
 * @param getContext - Optional: extract userId/memberId from request for logging
 */
export function withIdempotency(
  operation: IdempotencyOperation,
  handler: IdempotentHandler,
  getContext?: (req: NextRequest) => Promise<IdempotencyContext>
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    const key = extractIdempotencyKey(req);

    // ── No key: execute without idempotency protection ────────────────────────
    if (!key) {
      lpLogger.warn(`Idempotency-Key header missing on ${req.method} ${operation}`, {
        operation,
        path: req.nextUrl.pathname,
      });
      const ctx: IdempotencyContext = getContext ? await getContext(req) : {};
      return handler(req, ctx);
    }

    // ── Key present: check for duplicate ─────────────────────────────────────
    const existing = await getExistingRecord(key);
    if (existing) {
      // Replay cached response — side-effect already happened on first call
      lpLogger.info("Idempotency replay — duplicate request detected", {
        operation,
        idempotencyKey: key,
        statusCode: existing.statusCode,
      });
      return NextResponse.json(existing.responseBody, {
        status: existing.statusCode,
        headers: {
          "X-Idempotency-Replayed": "true",
          "X-Idempotency-Key": key,
        },
      });
    }

    // ── First request with this key: execute handler ──────────────────────────
    const ctx: IdempotencyContext = getContext ? await getContext(req) : {};

    let response: NextResponse;
    try {
      response = await handler(req, ctx);
    } catch (err) {
      // Unexpected thrown errors are not cached — let them propagate
      throw err;
    }

    // Only cache successful creation responses (2xx)
    if (response.status >= 200 && response.status < 300) {
      let responseBody: Prisma.InputJsonValue;
      try {
        responseBody = await response.clone().json() as Prisma.InputJsonValue;
      } catch {
        responseBody = { message: "Response body could not be parsed" } as Prisma.InputJsonValue;
      }
      await storeIdempotencyRecord(key, operation, ctx, response.status, responseBody);
    }

    return response;
  };
}

/**
 * Standalone check + store helper for handlers that need more control.
 * Returns { alreadyProcessed, response } — caller must NOT re-execute if alreadyProcessed=true.
 *
 * Usage:
 *   const check = await checkAndStoreIdempotency(req, "create_enrollment", { memberId })
 *   if (check.alreadyProcessed) return check.response
 *   // ... execute handler ...
 */
export async function checkAndStoreIdempotency(
  req: NextRequest,
  operation: IdempotencyOperation,
  ctx: IdempotencyContext
): Promise<{ alreadyProcessed: false } | { alreadyProcessed: true; response: NextResponse }> {
  const key = extractIdempotencyKey(req);
  if (!key) return { alreadyProcessed: false };

  const existing = await getExistingRecord(key);
  if (existing) {
    lpLogger.info("Idempotency replay", { operation, key });
    return {
      alreadyProcessed: true,
      response: NextResponse.json(existing.responseBody, {
        status: existing.statusCode,
        headers: {
          "X-Idempotency-Replayed": "true",
          "X-Idempotency-Key": key,
        },
      }),
    };
  }

  // Return a no-op response placeholder; caller must store actual response
  return { alreadyProcessed: false };
}
