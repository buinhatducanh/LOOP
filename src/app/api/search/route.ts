import { NextRequest, NextResponse } from "next/server";
import { handleError, ok } from "@/lib/api";
import { globalSearch } from "@/lib/services/content/search.service";
import { applyRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/search — Global search across services, team, projects (public, rate-limited)
 *
 * Response: { data: { services: [], team: [], projects: [], total: number } }
 */
export async function GET(req: NextRequest) {
  // Rate limit check
  const rateLimit = await applyRateLimit(req, "search");
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const locale = searchParams.get("locale") || "vi";

  if (!q || q.length < 2) {
    return ok({ services: [], team: [], projects: [], total: 0 });
  }

  try {
    const results = await globalSearch(q, locale, { maxPerCategory: 5 });
    return NextResponse.json(
      { data: results },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("Search error:", err);
    return handleError(err);
  }
}
