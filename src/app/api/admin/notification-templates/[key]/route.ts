import { handleError, ok, notFound } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { upsertTemplate, deleteTemplate } from "@/lib/services/notification/notification-template.service";

/**
 * GET /api/admin/notification-templates/[key] — get template by key (all locales)
 * PUT /api/admin/notification-templates/[key] — update template
 * DELETE /api/admin/notification-templates/[key] — delete template
 */
export async function GET(
 _req: NextRequest,
 { params }: { params: Promise<{ key: string }> }
) {
 try {
 await requirePermission("notifications", "read");
 const { key } = await params;

 const templates = await prisma.notificationTemplate.findMany({
 where: { key },
 orderBy: { locale: "asc" },
 });

 if (templates.length === 0) return notFound("Template not found");
 return ok(templates);
 } catch (err) {
 return handleError(err);
 }
}

export async function PUT(
 req: NextRequest,
 { params }: { params: Promise<{ key: string }> }
) {
 try {
 await requirePermission("notifications", "create");
 const { key } = await params;
 const data = await req.json();

 if (!data.locale || !data.title || !data.message) {
 return handleError(new Error("locale, title, and message are required"));
 }

 const template = await upsertTemplate({
 key,
 locale: data.locale,
 title: data.title,
 message: data.message,
 isActive: data.isActive ?? true,
 });

 return ok(template);
 } catch (err) {
 return handleError(err);
 }
}

export async function DELETE(
 req: NextRequest,
 { params }: { params: Promise<{ key: string }> }
) {
 try {
 await requirePermission("notifications", "create");
 const { key } = await params;
 const { searchParams } = new URL(req.url);
 const locale = searchParams.get("locale") ?? "vi";

 await deleteTemplate(key, locale);
 return ok({ success: true });
 } catch (err) {
 return handleError(err);
 }
}
