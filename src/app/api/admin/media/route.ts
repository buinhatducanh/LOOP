import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/admin/media — List Cloudinary resources and detect orphans.
 * Returns all images in the given folder, marking which ones have a matching
 * publicId in the database.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "loop-uploads";
    const cursor = searchParams.get("cursor") || undefined;

    // Fetch resources from Cloudinary
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: folder,
      max_results: 50,
      next_cursor: cursor,
      resource_type: "image",
    });

    const resources = (result.resources || []) as Array<{
      public_id: string;
      secure_url: string;
      format: string;
      bytes: number;
      width: number;
      height: number;
      created_at: string;
    }>;

    // Collect all publicIds from DB across all models that track them
    const [
      services,
      projects,
      teamMembers,
      blogPosts,
      homeSliders,
      homeVideos,
      advertisements,
      webTemplates,
      courses,
      instructors,
    ] = await Promise.all([
      prisma.service.findMany({ select: { iconPublicId: true } }),
      prisma.project.findMany({ select: { imagePublicId: true, screenshotsPublicIds: true } }),
      prisma.teamMember.findMany({ select: { imagePublicId: true, coverImagePublicId: true } }),
      prisma.blogPost.findMany({ select: { coverImagePublicId: true } }),
      prisma.homeSlider.findMany({ select: { imagePublicId: true } }),
      prisma.homeVideo.findMany({ select: { thumbnailPublicId: true } }),
      prisma.advertisement.findMany({ select: { thumbnailPublicId: true } }),
      prisma.webTemplate.findMany({ select: { thumbnailPublicId: true, screenshotsPublicIds: true } }),
      prisma.course.findMany({ select: { thumbnailPublicId: true } }),
      prisma.instructor.findMany({ select: { avatarPublicId: true } }),
    ]);

    // Build a Set of all used publicIds
    const usedIds = new Set<string>();
    for (const s of services) if (s.iconPublicId) usedIds.add(s.iconPublicId);
    for (const p of projects) {
      if (p.imagePublicId) usedIds.add(p.imagePublicId);
      for (const pid of p.screenshotsPublicIds) if (pid) usedIds.add(pid);
    }
    for (const m of teamMembers) {
      if (m.imagePublicId) usedIds.add(m.imagePublicId);
      if (m.coverImagePublicId) usedIds.add(m.coverImagePublicId);
    }
    for (const b of blogPosts) if (b.coverImagePublicId) usedIds.add(b.coverImagePublicId);
    for (const h of homeSliders) if (h.imagePublicId) usedIds.add(h.imagePublicId);
    for (const v of homeVideos) if (v.thumbnailPublicId) usedIds.add(v.thumbnailPublicId);
    for (const a of advertisements) if (a.thumbnailPublicId) usedIds.add(a.thumbnailPublicId);
    for (const w of webTemplates) {
      if (w.thumbnailPublicId) usedIds.add(w.thumbnailPublicId);
      for (const pid of w.screenshotsPublicIds) if (pid) usedIds.add(pid);
    }
    for (const c of courses) if (c.thumbnailPublicId) usedIds.add(c.thumbnailPublicId);
    for (const i of instructors) if (i.avatarPublicId) usedIds.add(i.avatarPublicId);

    const enriched = resources.map((r: typeof resources[number]) => ({
      publicId: r.public_id,
      url: r.secure_url,
      format: r.format,
      bytes: r.bytes,
      width: r.width,
      height: r.height,
      createdAt: r.created_at,
      isUsed: usedIds.has(r.public_id),
    }));

    const orphanCount = enriched.filter((r: typeof enriched[number]) => !r.isUsed).length;
    const usedCount = enriched.filter((r: typeof enriched[number]) => r.isUsed).length;

    return ok({
      resources: enriched,
      nextCursor: result.next_cursor || null,
      totalInPage: enriched.length,
      orphanCount,
      usedCount,
      totalDbPublicIds: usedIds.size,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/admin/media — Bulk delete orphan images.
 * Body: { publicIds: string[] }
 */
export async function DELETE(req: NextRequest) {
  try {
    await requireAuth(req);

    const body = await req.json();
    const publicIds = body?.publicIds;

    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return badRequest("No publicIds provided");
    }

    if (publicIds.length > 50) {
      return badRequest("Maximum 50 images at a time");
    }

    // Bulk delete from Cloudinary
    const result = await cloudinary.api.delete_resources(publicIds);

    const deleted = Object.entries(result.deleted || {}).filter(
      ([, status]) => status === "deleted"
    ).length;

    return ok({
      requested: publicIds.length,
      deleted,
      details: result.deleted,
    });
  } catch (error) {
    return handleError(error);
  }
}
