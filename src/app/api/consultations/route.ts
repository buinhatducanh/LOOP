/**
 * POST /api/consultations — Public consultation request form
 * Body: { name, email, phone, company?, companySize?, service, message?, preferredTime? }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, company, companySize, service, message, preferredTime } = body;

    if (!name || !email || !service) {
      return badRequest("name, email and service are required");
    }

    // Create an admin notification for the team
    await prisma.adminNotification.create({
      data: {
        type: "contact_request",
        title: `Yêu cầu tư vấn mới từ ${name}`,
        message: `Khách: ${name} (${email})\nCông ty: ${company ?? "—"}\nDịch vụ: ${service}\nNội dung: ${message ?? "—"}\nThời gian ưu tiên: ${preferredTime ?? "—"}`,
        priority: "high",
      },
    });

    return ok({ id: "ok" }, 201);
  } catch (err) {
    return handleError(err);
  }
}
