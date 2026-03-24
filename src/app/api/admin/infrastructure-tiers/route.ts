import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/infrastructure-tiers
// Returns all active infrastructure tiers for the pricing calculator.

export async function GET() {
  try {
    await requirePermission("services", "read");

    const tiers = await prisma.infrastructureTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: tiers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST /api/admin/infrastructure-tiers
// Create a new infrastructure tier.

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("services", "create");
    const body = await req.json();

    const { slug, name, nameVi, monthlyCost, setupCost, description, descriptionVi, icon, color, sortOrder } = body;

    if (!slug || !name || monthlyCost === undefined) {
      return NextResponse.json(
        { error: "slug, name, and monthlyCost are required" },
        { status: 400 }
      );
    }

    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "").trim();

    const existing = await prisma.infrastructureTier.findUnique({ where: { slug: normalizedSlug } });
    if (existing) {
      return NextResponse.json({ error: `Tier "${normalizedSlug}" already exists` }, { status: 409 });
    }

    const tier = await prisma.infrastructureTier.create({
      data: {
        slug: normalizedSlug,
        name,
        nameVi: nameVi ?? name,
        monthlyCost: parseInt(monthlyCost, 10) || 0,
        setupCost: parseInt(setupCost ?? 0, 10) || 0,
        description: description ?? null,
        descriptionVi: descriptionVi ?? null,
        icon: icon ?? null,
        color: color ?? "#6366F1",
        sortOrder: parseInt(sortOrder ?? 0, 10) || 0,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "infrastructure-tiers",
      resourceId: tier.id,
      newValues: body,
    });

    return NextResponse.json({ data: tier }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
