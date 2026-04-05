import { ok, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TeamMemberCreateInput } from "@/generated/prisma/models/TeamMember";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { addAvatar, addAvatarToList } from "@/lib/api/mappings";
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
        },
      }),
      prisma.teamMember.count({ where }),
    ]);

    // ── Aggregate approved LP per member and compute rank fields ───────────
    const memberIds = members.map((m) => m.id);

    const lpAggregates = await prisma.lpAward.groupBy({
      by: ["memberId"],
      where: { memberId: { in: memberIds }, status: "approved" },
      _sum: { lpAmount: true },
    });

    const lpMap = new Map<string, number>(
      lpAggregates.map((a) => [a.memberId, a._sum.lpAmount ?? 0])
    );

    const enriched = members.map((m) => {
      const totalApprovedLp = lpMap.get(m.id) ?? 0;
      const { level, currentXp, maxXp, rank } = computeRankFieldsFromLp(totalApprovedLp);
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

    // Extract memberExpertise array if present (it's a relation, not a direct field)
    const { memberExpertise, avatar, ...memberData } = data;

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

    const member = await prisma.teamMember.create({
      data: {
        ...(cleanedData as TeamMemberCreateInput),
        // Map FE field name "avatar" → Prisma "image" if provided
        ...(avatar !== undefined && { image: avatar }),
      },
    });

    // Create member expertise relations with level if provided and not empty.
    // FE sends: { name: "React" }[] or { expertiseId, level }[].
    // Resolve expertise names → IDs by querying/upserting the Expertise table.
    if (Array.isArray(memberExpertise) && memberExpertise.length > 0) {
      const records = await Promise.all(
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
            memberId: member.id,
            expertiseId: resolvedExpertiseId,
            level: (exp.level as number) || 5,
          };
        })
      );
      await prisma.memberExpertise.createMany({ data: records as { memberId: string; expertiseId: string; level: number }[] });
    }

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
