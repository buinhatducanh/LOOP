import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { renderTemplate } from "@/lib/services/notification/notification-template.service";

/**
 * POST /api/admin/notification-templates/preview
 * Render a template with given variables — for admin preview before saving.
 *
 * Body: { key: string, variables: Record<string, string|number>, locale?: string }
 */
export async function POST(req: NextRequest) {
 try {
 await requirePermission("notifications", "read");
 const data = await req.json();

 if (!data.key) {
 return handleError(new Error("key is required"));
 }

 const rendered = await renderTemplate(
 data.key,
 data.variables ?? {},
 data.locale ?? "vi"
 );

 return ok(rendered);
 } catch (err) {
 return handleError(err);
 }
}
