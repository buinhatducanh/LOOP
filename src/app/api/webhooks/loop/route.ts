import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const LOOP_WEBHOOK_SECRET =
  process.env.LOOP_WEBHOOK_SECRET ?? process.env.WEBHOOK_LOOP_SECRET ?? "";

const payloadSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  source: z.string().default("loop"),
  timestamp: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional().default({}),
});

function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("P1001") ||
    error.message.includes("P2024") ||
    error.message.includes("timeout") ||
    error.message.includes("Connection")
  );
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isTransientError(error)) break;
      const waitMs = 250 * 2 ** attempt;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastError;
}

function verifySignature(
  rawBody: string,
  signatureHeader: string,
  timestampHeader?: string | null
): boolean {
  if (!LOOP_WEBHOOK_SECRET) {
    return process.env.NODE_ENV !== "production";
  }

  const expectedRaw = timestampHeader ? `${timestampHeader}.${rawBody}` : rawBody;
  const hmac = crypto.createHmac("sha256", LOOP_WEBHOOK_SECRET);
  hmac.update(expectedRaw);
  const expected = `sha256=${hmac.digest("hex")}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

function isFreshTimestamp(timestampHeader?: string | null): boolean {
  if (!timestampHeader) return true;
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  return Math.abs(nowSec - ts) <= 300;
}

export async function POST(_req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-loop-signature") ?? "";
  const timestamp = req.headers.get("x-loop-timestamp");
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  if (!isFreshTimestamp(timestamp)) {
    return NextResponse.json({ error: "Stale timestamp" }, { status: 401 });
  }

  if (!verifySignature(rawBody, signature, timestamp)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed: z.infer<typeof payloadSchema>;
  try {
    parsed = payloadSchema.parse(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventTime = parsed.timestamp ? new Date(parsed.timestamp) : new Date();
  if (Number.isNaN(eventTime.getTime())) {
    return NextResponse.json({ error: "Invalid payload timestamp" }, { status: 400 });
  }

  // Delivery log — receive
  await withRetry(() =>
    prisma.auditLog.create({
      data: {
        action: "webhook_received",
        resource: "webhook:loop",
        resourceId: parsed.eventId,
        newValues: {
          eventType: parsed.eventType,
          source: parsed.source,
          timestamp: parsed.timestamp ?? null,
        },
        ipAddress,
        userAgent,
      },
    })
  );

  try {
    // TODO: route business events to handlers (Inngest/DB workflows)
    // At this stage we only acknowledge and log delivery.

    await withRetry(() =>
      prisma.auditLog.create({
        data: {
          action: "webhook_processed",
          resource: "webhook:loop",
          resourceId: parsed.eventId,
          newValues: {
            eventType: parsed.eventType,
            processedAt: new Date().toISOString(),
          },
          ipAddress,
          userAgent,
        },
      })
    );

    return NextResponse.json(
      {
        data: {
          received: true,
          eventId: parsed.eventId,
          eventType: parsed.eventType,
          processedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    await withRetry(() =>
      prisma.auditLog.create({
        data: {
          action: "webhook_failed",
          resource: "webhook:loop",
          resourceId: parsed.eventId,
          newValues: {
            eventType: parsed.eventType,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          ipAddress,
          userAgent,
        },
      })
    );

    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Webhook endpoint — POST only" }, { status: 405 });
}
