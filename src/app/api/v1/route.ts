/**
 * GET /api/v1
 *
 * Returns API version metadata and available endpoints.
 * This endpoint is NOT cached — it returns dynamic information.
 *
 * Version: v1 (stable)
 * Documentation: https://loop.vn/api/v1
 */

import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

  const payload = {
    name: "LOOP Public API",
    version: "v1",
    status: "stable",
    documentation: `${baseUrl}/api/v1`,
    endpoints: {
      services: {
        GET: `${baseUrl}/api/v1/services`,
        description: "All active web services offered by LOOP",
        cache: "5 minutes",
      },
      projects: {
        GET: `${baseUrl}/api/v1/projects`,
        description: "Published portfolio projects",
        cache: "5 minutes",
      },
      team: {
        GET: `${baseUrl}/api/v1/team`,
        description: "Active team members",
        cache: "5 minutes",
      },
      testimonials: {
        GET: `${baseUrl}/api/v1/testimonials`,
        description: "Client testimonials and reviews",
        cache: "5 minutes",
      },
      pricing: {
        GET: `${baseUrl}/api/v1/pricing`,
        description: "Pricing plans",
        cache: "5 minutes",
      },
      blog: {
        GET: `${baseUrl}/api/v1/blog`,
        description: "Blog posts from Sanity CMS",
        cache: "5 minutes",
      },
      courses: {
        GET: `${baseUrl}/api/v1/courses`,
        description: "Published Academy courses with instructors",
        cache: "5 minutes",
      },
    },
    rateLimits: {
      public: "100 requests/minute per IP",
      authenticated: "1000 requests/minute per IP",
    },
    contact: {
      POST: `${baseUrl}/api/contact`,
      description: "Submit a contact form message",
    },
  };

  const response = json(payload);
  response.headers.set("X-API-Version", "v1");
  response.headers.set("X-API-Status", "stable");
  return response;
}
