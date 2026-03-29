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
import { handleError } from "@/lib/api/response";
import { logger } from "@/lib/logger";

export const revalidate = 300;

export async function GET() {
  const start = Date.now();
  try {
    const plans = await getPricingPlans();

    logger.withSLO("GET /api/v1/pricing success", {
      endpoint: "/api/v1/pricing",
      method: "GET",
      statusCode: 200,
      latencyMs: Date.now() - start,
    });
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
    logger.withSLO("GET /api/v1/pricing failed", {
      endpoint: "/api/v1/pricing",
      method: "GET",
      statusCode: 500,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
