import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TeamMemberCreateInput } from "@/generated/prisma/models/TeamMember";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { addAvatar } from "@/lib/api/mappings";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  TEAM_MEMBER_FILTER_CONFIG,
} from "@/lib/api/search-utils";
import { computeRankFieldsFromLp } from "@/lib/rank/xp";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("team", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, TEAM_MEMBER_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [members, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          memberExpertise: {
            include: {
              expertise: true,
            },
          },
          lpTransactions: {
            orderBy: { createdAt: "desc" },
            take: 30,
          },
        },
      }),
      prisma.teamMember.count({ where }),
    ]);

    // ── Aggregate approved LP per member and compute rank fields ───────────
    const memberIds = members.map((m) => m.id);

    const [lpAggregates, users] = await Promise.all([
      prisma.lpAward.groupBy({
        by: ["memberId"],
        where: { memberId: { in: memberIds }, status: "approved" },
        _sum: { lpAmount: true },
      }),
      // Join User to get system role + ALL junction roles (UserRole junction table)
      prisma.user.findMany({
        where: { teamMemberId: { in: memberIds } },
        include: {
          userRoles: {
            where: { isActive: true },
            include: { role: { select: { name: true, level: true } } },
          },
        },
      }),
    ]);

    const lpMap = new Map<string, number>(
      lpAggregates.map((a) => [a.memberId, a._sum.lpAmount ?? 0])
    );

    // userMap: teamMemberId → { role, roles[] }
    const userMap = new Map<string, { role: string; roles: string[] }>();
    for (const u of users) {
      const junctionRoles = u.userRoles
        .filter((ur) => ur.role != null)
        .map((ur) => ur.role.name);
      userMap.set(u.teamMemberId!, {
        role: u.role,          // User.role scalar (primary display role)
        roles: junctionRoles,    // ALL junction role names from UserRole table
      });
    }

    const enriched = members.map((m) => {
      const totalApprovedLp = lpMap.get(m.id) ?? 0;
      const { level, currentXp, maxXp, rank } = computeRankFieldsFromLp(totalApprovedLp);
      const userInfo = userMap.get(m.id);
      return addAvatar({
        ...m,
        // Override level/XP/rank with computed values (reflect real LP)
        level,
        currentXp,
        maxXp,
        rank,
        totalApprovedLp,
        // LP balances (denormalized on TeamMember)
        lockedLp: m.lockedLp,
        availableLp: m.availableLp,
        // User.role scalar (primary display role)
        systemRole: userInfo?.role ?? m.role ?? null,
        // ALL junction roles from UserRole table (multi-role support)
        roles: userInfo?.roles ?? [],
        // Rich transaction history — powers the stats panel rank history + mission logs
        lpTransactions: m.lpTransactions ?? [],
      });
    });

    return NextResponse.json({
      data: enriched,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("team", "create");
    const data = await req.json();

    if (!data.name || !data.role || !data.slug) {
      return NextResponse.json(
        { error: "Tên, vai trò và slug là bắt buộc" },
        { status: 400 }
      );
    }

    // Extract non-Prisma fields before writing (roles = UserRole junction, not TeamMember field)
    const { memberExpertise, avatar, roles: _roles, ...memberData } = data;

    // Convert empty strings to null for optional fields (except required fields)
    // Also convert date strings (dd/mm/yyyy) to proper ISO format
    const requiredFields = ['name', 'slug', 'role'];
    const dateFields = ['birthDate', 'contractStart'];
    const cleanedData = Object.fromEntries(
      Object.entries(memberData).map(([key, value]) => {
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

    // Resolve expertise IDs before the atomic transaction.
    // Reads + potential expertise.create happen outside the member tx — this is safe
    // because expertise records are shared across members and idempotent.
    const expertiseRecords: { memberId: string; expertiseId: string; level: number }[] = [];
    if (Array.isArray(memberExpertise) && memberExpertise.length > 0) {
      const resolved = await Promise.all(
        memberExpertise.map(async (exp: { name?: string; expertiseId?: string; level?: number }) => {
          let resolvedExpertiseId = exp.expertiseId;
          // Resolve by name if FE sends { name } instead of { expertiseId }
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
            expertiseId: resolvedExpertiseId as string,
            level: (exp.level as number) || 5,
          };
        })
      );
      // memberId injected inside tx below (not known yet)
      expertiseRecords.push(...resolved.map(r => ({
        memberId: "", // filled below
        expertiseId: r.expertiseId,
        level: r.level,
      })));
    }

    // Sequential writes (PrismaNeon HTTP adapter does NOT support $transaction)
    const created = await prisma.teamMember.create({
      data: {
        ...(cleanedData as TeamMemberCreateInput),
        // Map FE field name "avatar" → Prisma "image" if provided
        ...(avatar !== undefined && { image: avatar }),
      },
    });

    // Fill memberId in expertise records now that we have it
    const recordsWithMemberId = expertiseRecords.map(r => ({
      ...r,
      memberId: created.id,
    }));

    if (recordsWithMemberId.length > 0) {
      await prisma.memberExpertise.createMany({
        data: recordsWithMemberId,
      });
    }

    const member = created;

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "team",
      resourceId: member.id,
      // Log actual DB values (not cleanedData which has avatar stripped)
      newValues: member,
    });

    return NextResponse.json({ data: addAvatar(member) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/team error:", error);
    return handleError(error);
  }
}
