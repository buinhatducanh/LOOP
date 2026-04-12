import { handleError, ok, list, buildPagination } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { getClientNotifications, createClientNotification } from "@/lib/services/notification/client-notification.service";

/**
 * GET /api/client/notifications — list notifications for current user
 * POST /api/client/notifications — create a notification (internal use)
 */
export async function GET(req: NextRequest) {
 try {
 const session = await requireAuth();
 const { searchParams } = new URL(req.url);
 const page = parseInt(searchParams.get("page") ?? "1");
 const limit = parseInt(searchParams.get("limit") ?? "20");

 const result = await getClientNotifications(session.userId, page, limit);
 return list(result.items, buildPagination(result.page, result.limit, result.total));
 } catch (err) {
 return handleError(err);
 }
}

export async function POST(req: NextRequest) {
 try {
 const session = await requireAuth();
 const data = await req.json();

 if (!data.type || !data.title || !data.message) {
 return ok({ error: "type, title, message are required" }, 400);
 }

 await createClientNotification({
 userId: session.userId,
 type: data.type,
 title: data.title,
 message: data.message,
 link: data.link,
 data: data.data,
 });

 return ok({ success: true }, 201);
 } catch (err) {
 return handleError(err);
 }
}
