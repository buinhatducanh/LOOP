/**
 * GET /api/pricing/domain-check
 * Check domain name availability (mock WHOIS — production: call real WHOIS API)
 */
import { NextResponse } from "next/server";
import { ok, badRequest, handleError } from "@/lib/api";

const TAKEN_DOMAINS = new Set([
  "google.com", "facebook.com", "microsoft.com", "loop.vn",
  "amazon.com", "apple.com", "twitter.com", "instagram.com",
  "tiktok.com", "shopee.vn", "lazada.vn", "sendo.vn",
]);

const TAKEN_SUFFIXES = new Set([".gov.vn", ".edu.vn", ".org.vn", ".mil.vn"]);

const DOMAIN_RE = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^[a-z0-9]$/i;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");

    if (!domain) return badRequest("domain is required");

    // ── Step 1: format validation ──────────────────────────────────────────────
    if (!DOMAIN_RE.test(domain) || domain.startsWith("-") || domain.endsWith("-")) {
      return ok({ available: false, suggestions: [], invalid: true });
    }

    // Reserved / government TLDs
    if (Array.from(TAKEN_SUFFIXES).some((s: string) => domain.toLowerCase().endsWith(s))) {
      return ok({ available: false, suggestions: [], invalid: true, reserved: true });
    }

    const lower = domain.toLowerCase();

    // ── Step 2: known-taken list ──────────────────────────────────────────────
    if (TAKEN_DOMAINS.has(lower)) {
      const base = domain.split(".")[0];
      const suggestions = generateSuggestions(base);
      return ok({ available: false, suggestions, invalid: false });
    }

    // ── Step 3: common keyword block ───────────────────────────────────────────
    const BLOCKED_KEYWORDS = ["admin", "webmail", "mail", "ftp", "localhost", "test", "demo", "api"];
    if (BLOCKED_KEYWORDS.includes(lower) || BLOCKED_KEYWORDS.some(k => lower.startsWith(k + "."))) {
      return ok({ available: false, suggestions: [], invalid: false, blocked: true });
    }

    // ── Step 4: available ──────────────────────────────────────────────────────
    return ok({ available: true, suggestions: [], invalid: false });
  } catch (err) {
    return handleError(err);
  }
}

function generateSuggestions(base: string): string[] {
  const candidates = [
    `${base}.com.vn`,
    `${base}.vn`,
    `${base}online.com`,
    `${base}pro.com`,
    `${base}io`,
    `${base}co.com`,
  ];
  return candidates.filter(c => !TAKEN_DOMAINS.has(c));
}
