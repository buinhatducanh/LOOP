import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/service-tiers — List all service tiers
export async function GET(req: NextRequest) {
  try {
    await requirePermission("services", "read");
    const { searchParams } = new URL(req.url);
    const serviceKey = searchParams.get("serviceKey");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (serviceKey) where.serviceKey = serviceKey;
    if (isActive !== null) where.isActive = isActive === "true";

    const tiers = await prisma.serviceTier.findMany({
      where,
      orderBy: [{ serviceKey: "asc" }, { level: "asc" }],
    });

    return NextResponse.json({ data: tiers });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/service-tiers — Create a service tier
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("services", "create");
    const data = await req.json();

    if (!data.serviceKey || !data.level || !data.name || data.basePrice === undefined) {
      return NextResponse.json({ error: "serviceKey, level, name, basePrice are required" }, { status: 400 });
    }

    const tier = await prisma.serviceTier.create({ data });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "service_tiers",
      resourceId: tier.id,
      newValues: data,
    });

    return NextResponse.json({ data: tier }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
