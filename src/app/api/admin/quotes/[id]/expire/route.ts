/**
 * POST /api/admin/quotes/[id]/expire
 *
 * Manually expire a QuoteRequest.
 * Admin can force-expire any non-final quote.
 */

import { NextRequest } from "next/server";
import { handleError, ok, badRequest } from "@/lib/api/response";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/services/notification/admin-notification.service";

export async function POST(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 await requirePermission("quotes", "update");
 const { id } = await params;

 if (!id || !id.startsWith("cl")) {
 return badRequest("invalid quote id");
 }

 const quote = await prisma.quoteRequest.findUnique({
 where: { id },
 select: { id: true, status: true, customerName: true, customerEmail: true },
 });

 if (!quote) {
 return badRequest("quote not found");
 }

 if (["expired", "approved", "rejected", "paid"].includes(quote.status)) {
 return badRequest(`cannot expire quote with status: ${quote.status}`);
 }

 const updated = await prisma.quoteRequest.update({
 where: { id },
 data: {
 status: "expired",
 },
 });

 void notify("quote_expired", {
 customerName: quote.customerName,
 quoteId: id,
 }, { priority: "normal" });

 return ok({ id: updated.id, status: updated.status });
 } catch (err) {
 return handleError(err);
 }
}
