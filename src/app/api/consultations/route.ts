/**
 * POST /api/consultations — Public consultation request form
 * Body: { name, email, phone, company?, companySize?, service, message?, preferredTime? }
 */
import { NextRequest } from "next/server";
import { ok, badRequest, handleError } from "@/lib/api";
import { notify } from "@/lib/services/notification/admin-notification.service";

export async function POST(req: NextRequest) {
 try {
 const body = await req.json();
 const { name, email, phone, company, companySize, service, message, preferredTime } = body;

 if (!name || !email || !service) {
 return badRequest("name, email and service are required");
 }

 void notify("contact_request", {
 name,
 email,
 company: company ?? "—",
 service,
 message: message ?? "—",
 preferredTime: preferredTime ?? "—",
 }, { priority: "high" });

 return ok({ id: "ok" }, 201);
 } catch (err) {
 return handleError(err);
 }
}
