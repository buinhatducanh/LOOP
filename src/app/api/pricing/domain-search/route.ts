/**
 * GET /api/pricing/domain-search
 *
 * Domain availability search using Node.js native DNS module.
 *
 * Strategy:
 * 1. Validate format + block reserved keywords
 * 2. Check local DB — already-purchased domains are taken
 * 3. Query native DNS — ENOTFOUND = available, no error = taken
 * 4. Return pricing from PricingDomainPrice table
 */
import { NextResponse } from "next/server";
import { ok, badRequest, handleError } from "@/lib/api";

const DOMAIN_RE = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^[a-z0-9]$/i;
const RESERVED_TLDS = new Set([".gov.vn", ".edu.vn", ".org.vn", ".mil.vn"]);
const BLOCKED_KEYWORDS = [
  "admin", "webmail", "mail", "ftp", "localhost",
  "test", "demo", "api", "ns1", "ns2", "mx", "smtp",
];

async function checkDnsAvailable(domain: string): Promise<boolean> {
  const dns = await import("dns/promises");
  try {
    // Check ANY record to see if domain exists
    await dns.resolve(domain).catch(async () => {
      // If ANY fails, try A record as fallback
      await dns.resolve4(domain);
    });
    // If it resolves, it's taken
    return false;
  } catch (err: any) {
    // ENOTFOUND = NXDOMAIN = available
    // ENODATA = domain exists but no records of requested type
    if (err.code === "ENOTFOUND") {
      return true;
    }
    // If ENODATA, it might be taken but just no A records (e.g. only NS)
    // For availability check, ENOTFOUND is the most reliable "available" indicator
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const tldQuery = searchParams.get("tld") || "com"; // primary TLD to highlight

    if (!query) return badRequest("Missing query");
    if (!DOMAIN_RE.test(query)) return badRequest("Invalid domain format");

    const keyword = query.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const { prisma } = await import("@/lib/prisma");
    const purchased = await prisma.customerWebsite.findMany({
      where: { domain: { startsWith: keyword } },
      select: { domain: true },
    });
    const purchasedSet = new Set(
      purchased.map((r) => r.domain?.toLowerCase()).filter(Boolean) as string[],
    );

    const dbPrices = await prisma.pricingDomainPrice.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Normalise extension: strip leading dot so we can concatenate cleanly
    // DB may store ".com" or "com" — handle both
    const stripDot = (ext: string) => ext.replace(/^\./, "");

    // priceMap keyed by BOTH formats so lookup always works
    const priceMap: Record<string, number> = {};
    for (const p of dbPrices) {
      priceMap[p.extension] = p.registrationPrice;
      priceMap[stripDot(p.extension)] = p.registrationPrice;
    }

    // Use active extensions from DB — fallback to common TLDs if DB is empty
    // Normalise to bare TLD (no leading dot) for domain construction
    const dbExtensions = [...new Set(dbPrices.map((p) => stripDot(p.extension)))];
    const tldOptions = dbExtensions.length > 0
      ? dbExtensions
      : ["com.vn", "vn", "com", "net", "io", "co", "org", "info", "biz"];

    const results = await Promise.all(
      tldOptions.map(async (tld) => {
        // tld is now guaranteed to have no leading dot, e.g. "com", "com.vn"
        const fullDomain = `${keyword}.${tld}`;
        const lower = fullDomain.toLowerCase();

        // Reserved TLD check (RESERVED_TLDS stores ".gov.vn" etc.)
        if (RESERVED_TLDS.has(`.${tld}`)) {
          return { domain: fullDomain, extension: `.${tld}`, available: false, reason: "reserved", price: 0 };
        }

        // Blocked keyword check
        if (BLOCKED_KEYWORDS.includes(keyword)) {
          return { domain: fullDomain, extension: `.${tld}`, available: false, reason: "blocked", price: 0 };
        }

        // Already purchased in our DB
        if (purchasedSet.has(lower)) {
          return { domain: fullDomain, extension: `.${tld}`, available: false, reason: "taken", price: priceMap[tld] ?? 0 };
        }

        // Native DNS check
        const available = await checkDnsAvailable(lower);

        return {
          domain: fullDomain,
          extension: `.${tld}`,
          available,
          reason: available ? undefined : "taken",
          price: priceMap[tld] ?? 0,
        };
      }),
    );

    // Sort: primary TLD (from query param) first
    const primaryTldBare = stripDot(tldQuery);
    const primaryDomain = `${keyword}.${primaryTldBare}`;
    results.sort((a, b) => {
      if (a.domain === primaryDomain) return -1;
      if (b.domain === primaryDomain) return 1;
      return 0;
    });

    return ok({ domains: results, invalid: false });
  } catch (err) {
    return handleError(err);
  }
}
