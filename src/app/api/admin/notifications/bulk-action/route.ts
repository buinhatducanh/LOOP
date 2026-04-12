import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { markReadBulk, bulkArchive } from "@/lib/services/notification/admin-notification.service";

/**
 * POST /api/admin/notifications/bulk-action
 * Body: { action: "markRead" | "archive", ids: string[] }
 */
export async function POST(req: NextRequest) {
 try {
 await requirePermission("notifications", "read");
 const { action, ids } = await req.json();

 if (!Array.isArray(ids) || ids.length === 0) {
 return ok({ success: false, error: "ids must be a non-empty array" }, 400);
 }

 if (action === "markRead") {
 await markReadBulk(ids);
 } else if (action === "archive") {
 await bulkArchive(ids);
 } else {
 return ok({ success: false, error: "Invalid action" }, 400);
 }

 return ok({ success: true });
 } catch (err) {
 return handleError(err);
 }
}
