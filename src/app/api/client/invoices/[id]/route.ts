import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, notFound } from "@/lib/api";

export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const session = await requireAuth(req);
 const { id } = await params;

 const invoice = await prisma.invoice.findUnique({
 where: { id },
 include: { lineItems: true },
 });

 if (!invoice) return notFound("Invoice not found");
 if (invoice.customerId !== session.userId) return notFound("Invoice not found");

 return ok(invoice);
 } catch (err) {
 return handleError(err);
 }
}
