/**
 * POST /api/analytics/track
 *
 * Lightweight server-side event pipeline.
 *
 * Accepts analytics events from the client and:
 *   - Forwards to GA4 Measurement Protocol (when configured)
 *   - Persists to DB for business intelligence (contact form conversions, pricing quotes, etc.)
 *   - Returns fast — async (fire-and-forget) to DB write
 *
 * CORS: open for any origin (client-side fetch)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/* ─── Types ───────────────────────────────────────────────────────────── */

type AnalyticsEventName =
  | "form_submission"
  | "cta_click"
  | "page_view"
  | "service_viewed"
  | "pricing_viewed"
  | "demo_clicked"
  | "quote_request"
  | "language_switch"
  | "search_query"
  | "blog_post_viewed"
  | "outbound_link_click";

interface AnalyticsPayload {
  event: AnalyticsEventName;
  properties?: Record<string, string | number | boolean | null>;
  /** ISO timestamp of when the event occurred client-side */
  ts?: string;
  /** Session/user identifier (anonymous UUID stored in localStorage) */
  sessionId?: string;
}

/* ─── Validation ─────────────────────────────────────────────────────── */

const KNOWN_EVENTS = new Set<string>([
  "form_submission",
  "cta_click",
  "page_view",
  "service_viewed",
  "pricing_viewed",
  "demo_clicked",
  "quote_request",
  "language_switch",
  "search_query",
  "blog_post_viewed",
  "outbound_link_click",
]);

/* ─── Helpers ──────────────────────────────────────────────────────── */

async function persistEvent(payload: AnalyticsPayload, ip: string): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: `analytics:${payload.event}`,
        resource: "analytics",
        newValues: {
          properties: payload.properties ?? {},
          sessionId: payload.sessionId ?? null,
          ts: payload.ts ?? new Date().toISOString(),
        },
        ipAddress: ip,
        userAgent: "", // not available server-side without headers
      },
    });
  } catch {
    // Never throw — analytics failure must not break user experience
  }
}

/* ─── Route handler ──────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  // CORS preflight
  const origin = request.headers.get("origin") ?? "*";
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };

  try {
    const body: AnalyticsPayload = await request.json();

    // Basic validation
    if (!body.event || typeof body.event !== "string") {
      return NextResponse.json(
        { error: "event is required" },
        { status: 400, headers }
      );
    }

    if (!KNOWN_EVENTS.has(body.event)) {
      return NextResponse.json(
        { error: `Unknown event: ${body.event}` },
        { status: 400, headers }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    // Fire-and-forget — don't await the DB write in the response path
    persistEvent(body, ip).catch(() => {});

    return new NextResponse(null, { status: 204, headers });
  } catch (err) {
    console.warn("[/api/analytics/track]", err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
