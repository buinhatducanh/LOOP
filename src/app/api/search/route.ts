import { NextRequest, NextResponse } from "next/server";
import { handleError, ok } from "@/lib/api";
import { globalSearch } from "@/lib/services/content/search.service";
import { applyRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/search — Global search across 14 entity types (public, rate-limited)
 *
 * Query params:
 *   q       — search query (min 2 chars)
 *   locale  — "vi" | "en" (default: "vi")
 *   mode    — "full" | "quick" (default: "full")
 *              quick: returns max 2 per category (autocomplete mode)
 *
 * Response: { data: SearchResult }
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
  const mode = searchParams.get("mode") || "full";

  if (!q || q.length < 2) {
    return ok({
      services: [], team: [], projects: [], blog: [],
      courses: [], faqs: [], testimonials: [], instructors: [],
      expertises: [], webTemplates: [], landingPages: [],
      pricingPackages: [], addonServices: [],
      total: 0, totalHits: 0,
    });
  }

  try {
    const maxPerCategory = mode === "quick" ? 2 : 5;
    const results = await globalSearch(q, locale, { maxPerCategory });

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