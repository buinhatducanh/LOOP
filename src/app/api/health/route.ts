import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { client } from "@/sanity/client";

// Simple in-memory store for startup time
let startedAt = Date.now();

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latency?: number; error?: string }> = {};
  let healthy = true;

  // ─── Database check ─────────────────────────────────────────────────────────
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch (err) {
    healthy = false;
    checks.database = {
      status: "error",
      latency: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "Unknown DB error",
    };
  }

  // ─── Sanity CMS check ────────────────────────────────────────────────────────
  const sanityStart = Date.now();
  try {
    await client.fetch<unknown>(`*[_type == "siteConfig"][0]{_id}`);
    checks.sanity = { status: "ok", latency: Date.now() - sanityStart };
  } catch (err) {
    checks.sanity = {
      status: "error",
      latency: Date.now() - sanityStart,
      error: err instanceof Error ? err.message : "Unknown Sanity error",
    };
    // Sanity failure is non-critical for health — degrade gracefully
  }

  const status = healthy ? 200 : 503;
  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}
