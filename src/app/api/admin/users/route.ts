import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, User } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/lib/auth/audit";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  USER_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("users", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, USER_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          accountType: true,
          teamMemberId: true,
          createdAt: true,
          updatedAt: true,
          userRoles: { include: { role: { select: { name: true, displayName: true } } } },
          teamMember: { select: { id: true, name: true, role: true, image: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("users", "create");
    const { name, email, password, role, roleIds, teamMemberId, accountType } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tên, email, và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    // Normalize email: lowercase + trim before all DB lookups
    const normalizedEmail = String(email).toLowerCase().trim();
    const existing: User | null = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const existingId = existing?.id;
    if (existing) {
      return NextResponse.json(
        { error: "Email đã tồn tại" },
        { status: 409 }
      );
    }

    // Validate teamMemberId if provided
    if (teamMemberId) {
      const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId as string } });
      if (!member) {
        return NextResponse.json({ error: "Team member không tồn tại" }, { status: 400 });
      }
      // Check if already linked to another user (exclude self if editing)
      const alreadyLinked = await prisma.user.findFirst({
        where: {
          teamMemberId: teamMemberId as string,
          ...(existingId != null ? { id: { not: existingId } } : {}),
        },
      });
      if (alreadyLinked) {
        return NextResponse.json(
          { error: "Nhân sự này đã được gán tài khoản khác" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role: role || "user",
        accountType: accountType || "customer",
        teamMemberId: teamMemberId || null,
        userRoles: roleIds?.length
          ? { create: roleIds.map((roleId: string) => ({ roleId })) }
          : undefined,
      },
      include: {
        userRoles: { include: { role: { select: { name: true, displayName: true } } } },
        teamMember: { select: { id: true, name: true, role: true, image: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "users",
      resourceId: user.id,
      newValues: { name, email, role },
    });

    return NextResponse.json({
      data: { ...user, passwordHash: undefined },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
