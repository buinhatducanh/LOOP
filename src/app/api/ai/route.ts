/**
 * /api/ai — AI Crawler & Generative Engine Optimisation Endpoint
 *
 * Purpose:
 *   Delivers structured, comprehensive content optimised for AI crawlers
 *   (ChatGPT, Claude, Gemini, Perplexity, SearchGPT) that can't parse
 *   client-rendered React as effectively as they can consume a pre-rendered
 *   JSON or HTML response.
 *
 * What it exposes:
 *   - /api/ai             → sitemap of all available content types
 *   - /api/ai?type=services → all services with full content
 *   - /api/ai?type=projects → all projects with full content
 *   - /api/ai?type=team     → team members
 *   - /api/ai?type=blog     → blog posts
 *   - /api/ai?type=pricing  → pricing plans
 *   - /api/ai?type=all      → combined dump (rate-limited: 30 req/min)
 *
 * Cache: 1 hour (public, shared cache)
 *
 * Also serves:
 *   - Structured meta tags via x-ai-* headers
 *   - HTML view for crawlers that prefer text/html
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


import { publicApiRateLimit } from "@/lib/redis";

/* ─── Types ───────────────────────────────────────────────────────────── */

type ContentType = "services" | "projects" | "team" | "blog" | "pricing" | "sitemap" | "all";

interface AiResponse {
  meta: {
    generatedAt: string;
    version: string;
    locale: string;
    contentType: ContentType;
    totalItems: number;
    generator: string;
  };
  content?: unknown[];
  sitemap?: { type: string; count: number; updatedAt: string }[];
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function aiHeaders(count: number, type: ContentType): Record<string, string> {
  return {
    "X-AI-Generator": "LOOP-Agency/1.0",
    "X-Content-Type": type,
    "X-Items-Count": String(count),
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  };
}

function extractClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

/* ─── Content fetchers ────────────────────────────────────────────────── */

async function fetchServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    select: {
      id: true, slug: true, title: true, shortDescription: true,
      longDescription: true, category: true, features: true,
      technologies: true, startingPrice: true, deliveryTime: true,
      createdAt: true, updatedAt: true,
    },
  });
}

async function fetchProjects() {
  return prisma.project.findMany({
    where: { isPublished: true },
    select: {
      id: true, slug: true, title: true, description: true,
      category: true, client: true, year: true,
      techStack: true, features: true, results: true,
      service: { select: { slug: true, title: true } },
      teamMember: { select: { slug: true, name: true, role: true } },
      createdAt: true, updatedAt: true,
    },
  });
}

async function fetchTeam() {
  return prisma.teamMember.findMany({
    where: { isActive: true },
    select: {
      id: true, slug: true, name: true, role: true, bio: true,
      shortBio: true, achievements: true, linkedin: true,
      twitter: true, github: true, email: true, phone: true,
      skills: true, experience: true, coverImage: true, quote: true,
      isFeatured: true, isWorking: true,
      memberExpertise: {
        include: { expertise: { select: { name: true, category: true, icon: true } } },
      },
      createdAt: true, updatedAt: true,
    },
  });
}

/**
 * Blog posts — fetched from Sanity CMS via GROQ.
 *
 * Uses postsQuery which only selects listing fields (no body content)
 * to keep the response lean. The full post is fetched separately on
 * /blog/[slug] via postBySlugQuery.
 */
async function fetchBlog() {
  // Import dynamically to avoid pulling Sanity into the bundle for non-blog requests
  const { client: sanity } = await import('@/sanity/client');
  const { postsQuery } = await import('@/sanity/queries');

  return sanity.fetch(postsQuery);
}

async function fetchPricing() {
  const [plans, webPackages, hostingPlans] = await Promise.all([
    prisma.pricingPlan.findMany({
      where: { isActive: true },
      select: {
        name: true, tagline: true, price: true, period: true,
        features: true, highlighted: true, color: true, createdAt: true,
      },
    }),
    prisma.pricingWebPackage.findMany({
      where: { isActive: true },
      select: {
        name: true, nameVi: true, tagline: true, price: true,
        period: true, pages: true, pagesVi: true, highlighted: true,
        color: true, createdAt: true,
      },
    }),
    prisma.pricingHostingPlan.findMany({
      where: { isActive: true },
      select: {
        name: true, monthlyPrice: true, period: true, features: true,
        highlighted: true, color: true, createdAt: true,
      },
    }),
  ]);
  return { plans, webPackages, hostingPlans };
}

/* ─── HTML renderer (for crawlers that prefer text/html) ─────────────── */

function renderHtml(data: AiResponse): string {
  const items = data.content ?? [];
  const itemsHtml = items.length > 0
    ? items.map((item: unknown) => {
        const i = item as Record<string, unknown>;
        const title = String(i.title ?? i.name ?? i.slug ?? "—");
        const fields = [
          i.shortDescription, i.description, i.longDescription, i.tagline,
        ].filter((f: unknown): f is string => !!f).map((f: string) => `<p>${f}</p>`).join("\n");
        const features = Array.isArray(i.features)
          ? `<p><strong>Features:</strong> ${(i.features as string[]).join(", ")}</p>`
          : "";
        const tech = Array.isArray(i.technologies)
          ? `<p><strong>Tech:</strong> ${(i.technologies as string[]).join(", ")}</p>`
          : "";
        const slug = i.slug ? `<p><strong>Slug:</strong> <code>/${i.slug}</code></p>` : "";
        return `<div class="item"><h2>${title}</h2>${fields}${features}${tech}${slug}</div>`;
      }).join("\n")
    : "<p>See sitemap for available content types.</p>";

  return `<!DOCTYPE html>
<html lang="${data.meta.locale}">
<head>
  <meta charset="UTF-8">
  <title>LOOP Agency — AI Content (${data.meta.contentType})</title>
  <meta name="robots" content="noindex, nofollow">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; color: #1a1a1a; }
    h1 { border-bottom: 2px solid #3B82F6; padding-bottom: .5rem; }
    .meta { background: #f0f4ff; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
    .item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .item h2 { margin: 0 0 .5rem; font-size: 1.1rem; color: #3B82F6; }
    .item p { margin: .25rem 0; color: #4b5563; font-size: .9rem; }
    code { background: #f3f4f6; padding: .1rem .3rem; border-radius: 4px; font-size: .85rem; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: .8rem; }
  </style>
</head>
<body>
  <h1>LOOP Agency — ${data.meta.contentType} <small>(${data.meta.totalItems} items)</small></h1>
  <div class="meta">
    <p><strong>Generated:</strong> <code>${data.meta.generatedAt}</code></p>
    <p><strong>Version:</strong> <code>${data.meta.version}</code></p>
    <p><strong>Locale:</strong> <code>${data.meta.locale}</code></p>
    <p><strong>Generator:</strong> <code>${data.meta.generator}</code></p>
  </div>
  ${itemsHtml}
  <footer>
    Generated by <strong>LOOP Agency</strong> · <a href="/api/ai?type=sitemap">API Sitemap</a> ·
    <a href="/">Back to site</a>
  </footer>
</body>
</html>`;
}

/* ─── Route handler ───────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = (searchParams.get("type") ?? "sitemap") as ContentType;
  const locale = searchParams.get("locale") ?? "vi";
  const accept = request.headers.get("Accept") ?? "";

  const validTypes: ContentType[] = ["services", "projects", "team", "blog", "pricing", "sitemap", "all"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Valid: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // Rate limit: use the Upstash publicApiRateLimit (100 req/min) when Redis is available,
  // otherwise fall back to an in-memory limiter so the endpoint is always protected.
  let rateLimitAllowed = true;
  let rateLimitResponse: NextResponse | undefined;
  const ip = extractClientIp(request);

  try {
    if (!publicApiRateLimit) {
      rateLimitAllowed = true;
    } else {
      const { success, remaining, reset } = await publicApiRateLimit.limit(ip);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        rateLimitResponse = NextResponse.json(
          { error: "Too many requests. Please slow down." },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfter),
              "X-RateLimit-Remaining": String(remaining),
              "X-RateLimit-Reset": String(reset),
            },
          }
        );
        rateLimitAllowed = false;
      }
    }
  } catch {
    // Redis unavailable — fail open (allow request to avoid service disruption)
    rateLimitAllowed = true;
  }

  if (!rateLimitAllowed && rateLimitResponse) {
    return rateLimitResponse;
  }

  const now = new Date().toISOString();
  let data: AiResponse | undefined;

  try {
    switch (type) {
      case "services": {
        const raw = await fetchServices();
        data = {
          meta: { generatedAt: now, version: "1.0", locale, contentType: "services", totalItems: raw.length, generator: "LOOP-Agency/1.0" },
          content: raw,
        };
        break;
      }
      case "projects": {
        const raw = await fetchProjects();
        data = {
          meta: { generatedAt: now, version: "1.0", locale, contentType: "projects", totalItems: raw.length, generator: "LOOP-Agency/1.0" },
          content: raw,
        };
        break;
      }
      case "team": {
        const raw = await fetchTeam();
        data = {
          meta: { generatedAt: now, version: "1.0", locale, contentType: "team", totalItems: raw.length, generator: "LOOP-Agency/1.0" },
          content: raw,
        };
        break;
      }
      case "blog": {
        const raw = await fetchBlog();
        data = {
          meta: { generatedAt: now, version: "1.0", locale, contentType: "blog", totalItems: raw.length, generator: "LOOP-Agency/1.0" },
          content: raw,
        };
        break;
      }
      case "pricing": {
        const raw = await fetchPricing();
        const planCount = (raw as { plans: unknown[] }).plans.length;
        const pkgCount = (raw as { webPackages: unknown[] }).webPackages.length;
        data = {
          meta: { generatedAt: now, version: "1.0", locale, contentType: "pricing", totalItems: planCount + pkgCount, generator: "LOOP-Agency/1.0" },
          content: [raw],
        };
        break;
      }
      case "all": {
        const [services, projects, team, pricing] = await Promise.all([
          fetchServices(), fetchProjects(), fetchTeam(), fetchPricing(),
        ]);
        data = {
          meta: {
            generatedAt: now, version: "1.0", locale, contentType: "all",
            totalItems: services.length + projects.length + team.length,
            generator: "LOOP-Agency/1.0",
          },
          content: [{ services, projects, team, pricing }],
        };
        break;
      }
      case "sitemap":
      default: {
        const [services, projects, team, pricing] = await Promise.all([
          fetchServices(), fetchProjects(), fetchTeam(), fetchPricing(),
        ]);
        const planCount = (pricing as { plans: unknown[] }).plans.length;
        const pkgCount = (pricing as { webPackages: unknown[] }).webPackages.length;
        data = {
          meta: {
            generatedAt: now, version: "1.0", locale, contentType: "sitemap",
            totalItems: services.length + projects.length + team.length + planCount + pkgCount,
            generator: "LOOP-Agency/1.0",
          },
          sitemap: [
            { type: "services", count: services.length, updatedAt: now },
            { type: "projects", count: projects.length, updatedAt: now },
            { type: "team", count: team.length, updatedAt: now },
            { type: "pricing", count: planCount + pkgCount, updatedAt: now },
            { type: "all", count: services.length + projects.length + team.length, updatedAt: now },
          ],
        };
        break;
      }
    }
  } catch (err) {
    console.error("[/api/ai] fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch content", meta: { generatedAt: now, generator: "LOOP-Agency/1.0" } },
      { status: 500 }
    );
  }

  const headers = {
    ...aiHeaders(data!.meta.totalItems, data!.meta.contentType),
    "Content-Type": "application/json; charset=utf-8",
  };

  if (accept.includes("text/html")) {
    const html = renderHtml(data!);
    return new NextResponse(html, {
      status: 200,
      headers: {
        ...aiHeaders(data!.meta.totalItems, data!.meta.contentType),
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  return NextResponse.json(data, { status: 200, headers });
}

/* ─── OPTIONS for CORS preflight (AI tools may send them) ───────────── */

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Accept, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
