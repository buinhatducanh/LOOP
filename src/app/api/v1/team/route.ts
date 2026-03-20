/**
 * GET /api/v1/team
 *
 * Returns all active team members for the public website.
 * Cached for 5 minutes.
 *
 * Version: v1 (stable)
 */

import { NextResponse } from "next/server";
import { getCachedTeamMembers } from "@/lib/db/queries";

export const revalidate = 300;

export async function GET() {
  try {
    const members = await getCachedTeamMembers();

    // Lightweight projection — only public-safe fields
    const publicMembers = members.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      role: m.role,
      shortBio: m.shortBio,
      image: m.image,
      isFeatured: m.isFeatured,
      expertise: m.memberExpertise?.map((e) => e.expertise.name) ?? [],
    }));

    return NextResponse.json(
      {
        version: "v1",
        data: publicMembers,
        meta: { count: publicMembers.length, cached: true },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          "X-API-Version": "v1",
        },
      }
    );
  } catch (error) {
    console.error("[/api/v1/team] Failed:", error);
    return NextResponse.json(
      { version: "v1", error: "Failed to fetch team members" },
      { status: 500, headers: { "X-API-Version": "v1" } }
    );
  }
}
