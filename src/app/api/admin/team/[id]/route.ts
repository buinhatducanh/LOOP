import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { addAvatar } from "@/lib/api/mappings";

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

    return NextResponse.json({ data: addAvatar(member) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("team", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Extract memberExpertise array if present (it's a relation, not a direct field)
    // Also rename avatar → image (Prisma field is "image", not "avatar")
    const { memberExpertise, avatar, ...memberData } = data;

    // Convert empty strings to null for optional fields (except required fields)
    // Also convert date strings (dd/mm/yyyy) to proper ISO format
    const requiredFields = ['name', 'slug', 'role'];
    const dateFields = ['birthDate', 'contractStart'];
    const entries = Object.entries(memberData);

    // Map avatar → image if present
    if (avatar !== undefined) {
      entries.push(['image', avatar]);
    }

    const cleanedData = Object.fromEntries(
      entries.map(([key, value]) => {
        if (requiredFields.includes(key)) {
          return [key, value];
        }
        if (value === "") return [key, null];
        // Convert date string to ISO format (supports both dd/mm/yyyy and yyyy-mm-dd)
        if (dateFields.includes(key) && value && typeof value === 'string') {
          // Try to parse dd/mm/yyyy format
          const parts = value.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            return [key, new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString()];
          }
          // Try standard ISO format
          return [key, new Date(value).toISOString()];
        }
        return [key, value];
      })
    );

    // Update member data
    let member;
    try {
      member = await prisma.teamMember.update({
        where: { id },
        data: cleanedData,
      });
    } catch (prismaError) {
      console.error("Prisma update error:", prismaError);
      return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
    }

    // Update expertise relations if explicitly provided (even if empty array)
    if (data.hasOwnProperty('memberExpertise')) {
      // Delete existing expertise relations
      await prisma.memberExpertise.deleteMany({
        where: { memberId: id },
      });

      // Create new expertise relations with level (only if not empty).
      // FE sends: { name: "React" }[] or { expertiseId, level }[].
      // Resolve expertise names → IDs by querying/upserting the Expertise table.
      if (Array.isArray(memberExpertise) && memberExpertise.length > 0) {
        const records = await Promise.all(
          memberExpertise.map(async (exp: { name?: string; expertiseId?: string; level?: number }) => {
            let resolvedExpertiseId = exp.expertiseId;
            if (!resolvedExpertiseId && exp.name) {
              let expertise = await prisma.expertise.findFirst({
                where: { name: exp.name as string },
              });
              if (!expertise) {
                expertise = await prisma.expertise.create({
                  data: { name: exp.name as string, category: "General" },
                });
              }
              resolvedExpertiseId = expertise.id;
            }
            return {
              memberId: id,
              expertiseId: resolvedExpertiseId,
              level: (exp.level as number) || 5,
            };
          })
        );
        await prisma.memberExpertise.createMany({ data: records as { memberId: string; expertiseId: string; level: number }[] });
      }
    }

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "team",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: member,
    });

    return NextResponse.json({ data: addAvatar(member) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("team", "delete");
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

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
