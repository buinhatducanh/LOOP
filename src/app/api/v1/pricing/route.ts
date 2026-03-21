/**
 * GET /api/v1/pricing
 *
 * Returns all active pricing plans.
 * Cached for 5 minutes.
 *
 * Version: v1 (stable)
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPricingPlans } from "@/lib/db/queries";

export const revalidate = 300;

export async function GET() {
  try {
    const plans = await getPricingPlans();

    return NextResponse.json(
      {
        version: "v1",
        data: plans,
        meta: { count: plans.length, cached: true },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    console.error("[/api/v1/pricing] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch pricing plans" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
