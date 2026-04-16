import { handleError, ok, list, buildPagination } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { listTemplates, upsertTemplate, deleteTemplate, seedDefaultTemplates } from "@/lib/services/notification/notification-template.service";

/**
 * GET /api/admin/notification-templates — list all templates
 * POST /api/admin/notification-templates — upsert a template
 * POST /api/admin/notification-templates/seed — seed default templates
 */
export async function GET(req: NextRequest) {
 try {
 const session = await requirePermission("notifications", "read");
 const { searchParams } = new URL(req.url);
 const locale = searchParams.get("locale") ?? undefined;
 const page = parseInt(searchParams.get("page") ?? "1");
 const limit = parseInt(searchParams.get("limit") ?? "100");

 const templates = await listTemplates(locale);
 const paginated = templates.slice((page - 1) * limit, page * limit);
 return list(paginated, buildPagination(page, limit, templates.length));
 } catch (err) {
 return handleError(err);
 }
}

export async function POST(req: NextRequest) {
 try {
 const session = await requirePermission("notifications", "create");
 const data = await req.json();

 // Special seed endpoint
 if (data._action === "seed") {
 await seedDefaultTemplates();
 return ok({ success: true, message: "Templates seeded successfully" }, 201);
 }

 if (!data.key || !data.locale || !data.title || !data.message) {
 return handleError(new Error("key, locale, title, and message are required"));
 }

 const template = await upsertTemplate({
 key: data.key,
 locale: data.locale,
 title: data.title,
 message: data.message,
 isActive: data.isActive ?? true,
 });

 return ok(template, 201);
 } catch (err) {
 return handleError(err);
 }
}
