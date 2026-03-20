/**
 * GET /api/v1/projects
 *
 * Returns all published projects for the public website.
 * Cached for 5 minutes.
 *
 * Version: v1 (stable)
 */

import { NextResponse } from "next/server";
import { getCachedProjects } from "@/lib/db/queries";

export const revalidate = 300;

export async function GET() {
  try {
    const projects = await getCachedProjects();

    return NextResponse.json(
      {
        version: "v1",
        data: projects,
        meta: { count: projects.length, cached: true },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    console.error("[/api/v1/projects] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch projects" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
