/**
 * GET /api/pricing/domain-search
 *
 * Domain availability search using Cloudflare DNS-over-HTTPS (free, no API key).
 *
 * Strategy:
 * 1. Validate format + block reserved keywords
 * 2. Check local DB — already-purchased domains are taken
 * 3. Query Cloudflare DNS-over-HTTPS — NXDOMAIN = available, no error = taken
 * 4. Return pricing from PricingDomainPrice table
 *
 * Cloudflare DoH endpoint: https://dns.google/resolve?type=A&name={domain}
 * - Status=3 (NXDOMAIN) → available
 * - Any other status or network error → treat as unavailable (safer)
 */
import { NextResponse } from "next/server";
import { ok, badRequest, handleError } from "@/lib/api";

const DOMAIN_RE = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^[a-z0-9]$/i;
const RESERVED_TLDS = new Set([".gov.vn", ".edu.vn", ".org.vn", ".mil.vn"]);
const BLOCKED_KEYWORDS = [
 "admin", "webmail", "mail", "ftp", "localhost",
 "test", "demo", "api", "ns1", "ns2", "mx", "smtp",
];

interface DnsResponse {
 Status: number;
 Answer?: { name: string; type: number; TTL: number; data: string }[];
}

async function checkDnsAvailable(domain: string): Promise<boolean> {
 try {
 const url = `https://dns.google/resolve?type=A&name=${encodeURIComponent(domain)}`;
 const res = await fetch(url, {
 signal: AbortSignal.timeout(3000),
 headers: { Accept: "application/dns-json" },
 });
 if (!res.ok) return false; // network error → assume taken
 const json: DnsResponse = await res.json();
 // Status=3 = NXDOMAIN → domain is available
 return json.Status === 3;
 } catch {
 // timeout or fetch error → assume taken (safer)
 return false;
 }
}

export async function GET(req: Request) {
 try {
 const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

 if (!query || query.trim().length < 2) {
 return badRequest("q (query) must be at least 2 characters");
 }

 const keyword = query.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

 // ── Step 1: format validation ──────────────────────────────────────────────
 if (!DOMAIN_RE.test(keyword)) {
 return ok({ domains: [], invalid: true });
 }

 // ── Step 2: check local DB for already-purchased domains ─────────────────
 const { prisma } = await import("@/lib/prisma");
 const purchased = await prisma.customerWebsite.findMany({
 where: { domain: { not: null } },
 select: { domain: true },
 });
 const purchasedSet = new Set(
 purchased.map((r) => r.domain?.toLowerCase()).filter(Boolean) as string[],
 );

 // ── Step 3: Load pricing + active extensions from DB ────────────────────────
 const dbPrices = await prisma.pricingDomainPrice.findMany({
 where: { isActive: true },
 select: { extension: true, registrationPrice: true },
 orderBy: { sortOrder: "asc" },
 });
 const priceMap = Object.fromEntries(dbPrices.map((p) => [p.extension, p.registrationPrice]));
 // Use active extensions from DB — fallback to common TLDs if DB is empty
 const dbExtensions = dbPrices.map((p) => p.extension);
 const tldOptions = dbExtensions.length > 0
 ? dbExtensions
 : ["com.vn", "vn", "com", "net", "io", "co", "org", "info", "biz"];

 const results = await Promise.all(
 tldOptions.map(async (tld) => {
 const fullDomain = `${keyword}.${tld}`;
 const lower = fullDomain.toLowerCase();

 // Reserved TLD check
 if (RESERVED_TLDS.has(`.${tld}`)) {
 return { domain: fullDomain, available: false, reason: "reserved", price: 0 };
 }

 // Blocked keyword check
 if (BLOCKED_KEYWORDS.includes(keyword)) {
 return { domain: fullDomain, available: false, reason: "blocked", price: 0 };
 }

 // Already purchased in our DB
 if (purchasedSet.has(lower)) {
 return { domain: fullDomain, available: false, reason: "taken", price: priceMap[tld] ?? 0 };
 }

 // Cloudflare DNS check
 const available = await checkDnsAvailable(lower);

 return {
 domain: fullDomain,
 available,
 reason: available ? undefined : "taken",
 price: priceMap[tld] ?? 0,
 };
 }),
 );

 // Sort: primary TLD (from query param) first, then by DB sortOrder
 const primaryDomain = `${keyword}.${query}`;
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
