import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("team", "read");
    const { id } = await params;

    const member = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: member });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("team", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Extract expertise array if present (it's a relation, not a direct field)
    console.log("PUT team - received data:", JSON.stringify(data));
    const { expertise, ...memberData } = data;

    // Update member data
    console.log("Prisma update data:", JSON.stringify(memberData));
    const member = await prisma.teamMember.update({
      where: { id },
      data: memberData,
    });
    console.log("Prisma updated member:", JSON.stringify(member));

    // Update expertise relations if provided
    if (expertise && Array.isArray(expertise)) {
      // Delete existing expertise relations
      await prisma.memberExpertise.deleteMany({
        where: { memberId: id },
      });

      // Create new expertise relations
      if (expertise.length > 0) {
        await prisma.memberExpertise.createMany({
          data: expertise.map((expId: string) => ({
            memberId: id,
            expertiseId: expId,
            level: 3, // Default level
          })),
        });
      }
    }

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "team",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: memberData,
    });

    return NextResponse.json({ data: member });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("team", "delete");
    const { id } = await params;

    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.teamMember.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "team",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
