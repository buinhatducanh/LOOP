import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { addAvatar } from "@/lib/api/mappings";
import { handleError, ok } from "@/lib/api/response";
import type { InputJsonValue } from "@/generated/prisma/internal/prismaNamespace";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("team", "read");
    const { id } = await params;

    const [member, user] = await Promise.all([
      prisma.teamMember.findUnique({ where: { id } }),
      prisma.user.findFirst({
        where: { teamMemberId: id },
        include: {
          userRoles: {
            where: { isActive: true },
            include: { role: { select: { name: true, level: true } } },
          },
        },
      }),
    ]);

    if (!member) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const junctionRoles = (user?.userRoles ?? [])
      .filter((ur) => ur.role != null)
      .map((ur) => ur.role.name);

    return NextResponse.json({
      data: addAvatar({
        ...member,
        systemRole: user?.role ?? member.role ?? null,
        roles: junctionRoles,
      }),
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/admin/team/[id]
 *
 * Update strategy:
 *   - If avatar-only change: update ONLY image field → never slug conflict
 *   - If name/slug/role changes: update those fields + defensive pre-check
 *
 * P1-5 FIX: all writes (teamMember.update, user.updateMany, userRole.deleteMany,
 * userRole.createMany, memberExpertise.*) are wrapped in a single $transaction.
 * createAuditLog is also inside the transaction.
 *
 * Prisma fields vs FE field names:
 *   avatar (FE) → image (Prisma)
 *   team      (FE) → department (Prisma)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("team", "update");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy thành viên" }, { status: 404 });
    }

    // Determine what fields are being changed
    const nameChanged   = body.name   !== undefined && body.name   !== existing.name;
    const slugChanged   = body.slug   !== undefined && body.slug   !== existing.slug;
    const roleChanged   = body.role   !== undefined && body.role   !== existing.role;
    const avatarChanged = body.avatar !== undefined && body.avatar !== existing.image;

    // ── Avatar-only update ──────────────────────────────────────────────────────
    // When only avatar is changed, update ONLY the image field.
    // This avoids touching slug/name/role and eliminates all slug-conflict risk.
    if (!nameChanged && !slugChanged && !roleChanged && avatarChanged) {
      let member;
      // P1-5: wrap avatar update + audit log in a transaction
      try {
        member = await prisma.$transaction(async (tx) => {
          const m = await tx.teamMember.update({
            where: { id },
            data: { image: body.avatar ?? null },
          });
          await tx.auditLog.create({
            data: {
              userId: session.userId,
              action: "update",
              resource: "team",
              resourceId: id,
              oldValues: { image: existing.image } as unknown as InputJsonValue,
              newValues: { image: m.image } as unknown as InputJsonValue,
            },
          });
          return m;
        });
      } catch (prismaErr: unknown) {
        console.error("[PUT /api/admin/team] avatar-only update error:", prismaErr);
        return NextResponse.json({ error: "Cập nhật ảnh thất bại" }, { status: 500 });
      }
      return NextResponse.json({ data: addAvatar(member) });
    }

    // ── Full update (name/slug/role or other fields) ───────────────────────────
    const { memberExpertise, avatar, ...memberData } = body;

    // Map FE field names → Prisma field names
    const fieldMap: Record<string, string> = {
      avatar:   "image",
      team:     "department",
    };

    // Build update payload: only fields that are present in the request body.
    // Required fields: only include if explicitly sent by FE (FE always sends them).
    // Do NOT spread existing values — FE sends everything, missing fields mean "no change".
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(memberData)) {
      const prismaKey = fieldMap[key] ?? key;

      // Skip auto-managed fields
      if (prismaKey === "id" || prismaKey === "createdAt" || prismaKey === "updatedAt") continue;

      // Empty string → null for optional fields
      if (value === "") {
        updateData[prismaKey] = null;
        continue;
      }

      // Date fields: parse dd/mm/yyyy → Date
      if ((prismaKey === "birthDate" || prismaKey === "contractStart") && typeof value === "string") {
        const parts = value.split("/");
        if (parts.length === 3) {
          const [day, month, year] = parts;
          updateData[prismaKey] = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
        } else {
          updateData[prismaKey] = new Date(value);
        }
        continue;
      }

      updateData[prismaKey] = value;
    }

    // Override avatar → image if present
    if (avatar !== undefined) {
      updateData.image = avatar === "" ? null : avatar;
    }

    // ── Slug uniqueness check (only when slug is changing to a non-empty value) ─
    if (slugChanged && updateData.slug && String(updateData.slug).trim() !== "") {
      const conflict = await prisma.teamMember.findFirst({
        where: { slug: updateData.slug as string, id: { not: id } },
        select: { id: true, name: true },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `Slug "${updateData.slug}" đã được dùng bởi "${conflict.name}". Vui lòng chọn slug khác.` },
          { status: 409 }
        );
      }
    }

    // ── Email uniqueness check (only when email is changing to a non-empty value) ─
    if (body.email !== undefined && body.email !== existing.email && String(body.email).trim() !== "") {
      const conflict = await prisma.teamMember.findFirst({
        where: { email: body.email, id: { not: id } },
        select: { id: true, name: true },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `Email "${body.email}" đã được dùng bởi "${conflict.name}".` },
          { status: 409 }
        );
      }
    }

    // ── Extract systemRole before TeamMember update ─────────────────────────────
    const systemRole = updateData.systemRole as string | undefined;
    const teamUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([k]) => k !== "systemRole")
    ) as Record<string, unknown>;

    // ── Resolve expertise IDs (reads — safe outside tx) ─────────────────────────
    let expertiseRecords: { memberId: string; expertiseId: string; level: number }[] = [];
    if (body.hasOwnProperty("memberExpertise") && Array.isArray(memberExpertise) && memberExpertise.length > 0) {
      expertiseRecords = [];
      for (const exp of memberExpertise as { name?: string; expertiseId?: string; level?: number }[]) {
        let resolvedId = exp.expertiseId;
        if (!resolvedId && exp.name) {
          let expRecord = await prisma.expertise.findFirst({ where: { name: exp.name } });
          if (!expRecord) {
            expRecord = await prisma.expertise.create({ data: { name: exp.name, category: "General" } });
          }
          resolvedId = expRecord.id;
        }
        if (resolvedId) {
          expertiseRecords.push({
            memberId: id,
            expertiseId: resolvedId,
            level: (exp.level as number) || 5,
          });
        }
      }
    }

    // ── Resolve role IDs (reads — safe outside tx) ───────────────────────────────
    const roleNames = (body as { roles?: string[] }).roles;
    let roleIds: string[] = [];
    if ((systemRole !== undefined || roleNames !== undefined) && roleNames !== undefined && roleNames.length > 0) {
      const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });
      roleIds = roles.map((r) => r.id);
    }

    // ── Resolve userId for User table updates ────────────────────────────────────
    const user = roleNames !== undefined || systemRole !== undefined
      ? await prisma.user.findFirst({ where: { teamMemberId: id } })
      : null;
    const userId = user?.id ?? null;

    // ── P1-5 FIX: execute all writes in a single $transaction ────────────────────
    let member;
    try {
      member = await prisma.$transaction(async (tx) => {
        // 1. Update TeamMember
        const m = await tx.teamMember.update({
          where: { id },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: teamUpdateData as any,
        });

        // 2. Update User.systemRole scalar
        if (systemRole !== undefined && userId) {
          await tx.user.updateMany({
            where: { teamMemberId: id },
            data: { role: systemRole },
          });
        }

        // 3. Sync UserRole junction table
        if (roleNames !== undefined && userId) {
          await tx.userRole.deleteMany({ where: { userId } });
          if (roleIds.length > 0) {
            await tx.userRole.createMany({
              data: roleIds.map((roleId) => ({
                userId,
                roleId,
                isActive: true,
                assignedBy: session.userId,
              })),
            });
          }
        }

        // 4. Sync expertise relations
        if (body.hasOwnProperty("memberExpertise")) {
          await tx.memberExpertise.deleteMany({ where: { memberId: id } });
          if (expertiseRecords.length > 0) {
            await tx.memberExpertise.createMany({ data: expertiseRecords });
          }
        }

        // 5. P1-2 FIX: audit log inside tx — no gap between write and audit record
        await tx.auditLog.create({
          data: {
            userId: session.userId,
            action: "update",
            resource: "team",
            resourceId: id,
            oldValues: existing as unknown as InputJsonValue,
            newValues: m as unknown as InputJsonValue,
          },
        });

        return m;
      });
    } catch (prismaErr: unknown) {
      console.error("[PUT /api/admin/team] Prisma error:", prismaErr);
      const code = (prismaErr as { code?: string })?.code;
      if (code === "P2002") {
        const target = ((prismaErr as { meta?: { target?: string[] } })?.meta?.target as string[] | undefined) ?? [];
        return NextResponse.json(
          { error: `Trùng lặp: ${target.join(", ") || "field"} đã tồn tại.` },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
    }

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
    const session = await requirePermission("team", "delete");
    const { id } = await params;

    const existing = await prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy thành viên" }, { status: 404 });
    }

    // P1-5 FIX: wrap delete + audit log in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "delete",
          resource: "team",
          resourceId: id,
          oldValues: existing as unknown as InputJsonValue,
        },
      });
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
