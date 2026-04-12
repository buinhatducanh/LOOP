import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, notFound, badRequest } from "@/lib/api";

export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const session = await requireAuth(req);
 const { id } = await params;

 const ticket = await prisma.supportTicket.findUnique({
 where: { id },
 // No order relation
 });

 if (!ticket) return notFound("Ticket not found");
 if (ticket.userId !== session.userId) return notFound("Ticket not found");

 return ok(ticket);
 } catch (err) {
 return handleError(err);
 }
}

const replySchema = { /* no body needed — admin replies via admin API */ };

export async function PATCH(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 const session = await requireAuth(req);
 const { id } = await params;
 const body = await req.json();

 const ticket = await prisma.supportTicket.findUnique({ where: { id } });
 if (!ticket) return notFound("Ticket not found");
 if (ticket.userId !== session.userId) return notFound("Ticket not found");

 // Client can only close their own ticket
 if (body.status === "closed" && ticket.status !== "closed") {
 const updated = await prisma.supportTicket.update({
 where: { id },
 data: { status: "closed" },
 });
 return ok(updated);
 }

 return badRequest("Cannot update ticket in this way");
 } catch (err) {
 return handleError(err);
 }
}
