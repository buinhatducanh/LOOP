import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/services/search.service";
import { applyRateLimit } from "@/lib/rate-limit";

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
    return NextResponse.json({ services: [], team: [], projects: [], total: 0 });
  }

  const results = await globalSearch(q, locale, { maxPerCategory: 5 });

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
