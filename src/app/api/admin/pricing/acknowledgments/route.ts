/**
 * GET /api/admin/pricing/acknowledgments?packageSlug=landing
 * PUT /api/admin/pricing/acknowledgments
 *
 * Admin CRUD cho acknowledgment + video data cua 4 goi web.
 */

import { NextRequest } from "next/server";
import { ok, badRequest, notFound, serverError, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/permissions";

// Fixed 4 web package slugs
const WEB_PACKAGE_SLUGS = ["landing", "ban-hang", "doanh-nghiep", "yeu-cau"];

export async function GET(req: Request) {
 try {
 const session = await requireAuth();
 if (!isAdmin(session)) {
 return badRequest("Admin access required");
 }

 const { searchParams } = new URL(req.url);
 const slug = searchParams.get("packageSlug");

 if (!slug || !WEB_PACKAGE_SLUGS.includes(slug)) {
 return badRequest("Invalid or missing packageSlug");
 }

 const pkg = await prisma.servicePackage.findUnique({
 where: { slug },
 select: {
 id: true,
 slug: true,
 title: true,
 videoUrl: true,
 videoThumbnail: true,
 showFeatureAcknowledge: true,
 acknowledgmentItems: true,
 features: true,
 },
 });

 if (!pkg) return notFound("Package not found");

 return ok({
 id: pkg.id,
 slug: pkg.slug,
 title: pkg.title,
 videoUrl: pkg.videoUrl,
 videoThumbnail: pkg.videoThumbnail,
 showFeatureAcknowledge: pkg.showFeatureAcknowledge,
 acknowledgmentItems: (pkg.acknowledgmentItems ?? []) as {
 key: string;
 ackLabel: string;
 ackLabelEn?: string;
 icon?: string;
 sortOrder?: number;
 }[],
 features: pkg.features,
 });
 } catch (err) {
 return handleError(err);
 }
}

export async function PUT(req: NextRequest) {
 try {
 const session = await requireAuth();
 if (!isAdmin(session)) {
 return badRequest("Admin access required");
 }

 const body = await req.json();
 const { packageSlug, videoUrl, videoThumbnail, showFeatureAcknowledge, acknowledgmentItems } = body;

 if (!packageSlug || !WEB_PACKAGE_SLUGS.includes(packageSlug)) {
 return badRequest("Invalid or missing packageSlug");
 }

 // Validate acknowledgmentItems shape
 if (acknowledgmentItems !== undefined && !Array.isArray(acknowledgmentItems)) {
 return badRequest("acknowledgmentItems must be an array");
 }

 const updated = await prisma.servicePackage.update({
 where: { slug: packageSlug },
 data: {
 videoUrl: videoUrl ?? null,
 videoThumbnail: videoThumbnail ?? null,
 showFeatureAcknowledge: showFeatureAcknowledge ?? true,
 acknowledgmentItems: acknowledgmentItems ? JSON.stringify(acknowledgmentItems) : undefined,
 },
 select: {
 id: true,
 slug: true,
 title: true,
 videoUrl: true,
 videoThumbnail: true,
 showFeatureAcknowledge: true,
 acknowledgmentItems: true,
 features: true,
 },
 });

 return ok({
 id: updated.id,
 slug: updated.slug,
 title: updated.title,
 videoUrl: updated.videoUrl,
 videoThumbnail: updated.videoThumbnail,
 showFeatureAcknowledge: updated.showFeatureAcknowledge,
 acknowledgmentItems: (updated.acknowledgmentItems ?? []) as {
 key: string;
 ackLabel: string;
 ackLabelEn?: string;
 icon?: string;
 sortOrder?: number;
 }[],
 features: updated.features,
 });
 } catch (err) {
 return handleError(err);
 }
}
