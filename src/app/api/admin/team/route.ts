import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { addAvatar } from "@/lib/api/mappings";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  TEAM_MEMBER_FILTER_CONFIG,
} from "@/lib/api/search-utils";
import { computeRankFieldsFromLp, xpForLevel } from "@/lib/rank/xp";
import { signInviteToken, buildInviteUrl } from "@/lib/auth/invite-token";
import { sendTeamInviteEmail } from "@/lib/email/team-invite";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("team", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, TEAM_MEMBER_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    // Pre-fetch departments for label resolution
    const [departments, [members, total]] = await Promise.all([
      prisma.department.findMany({ select: { id: true, key: true, name: true } }),
      Promise.all([
        prisma.teamMember.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            departmentRelation: { select: { id: true, key: true, name: true } },
            memberExpertise: {
              include: {
                expertise: true,
              },
            },
            memberDepartments: {
              include: {
                department: { select: { id: true, key: true, name: true, shortName: true, color: true } },
              },
            },
            lpTransactions: {
              orderBy: { createdAt: "desc" },
              take: 30,
            },
          },
        }),
        prisma.teamMember.count({ where }),
      ]),
    ]);

    const deptIdToName = new Map(departments.map((d) => [d.id, d.name]));
    const deptKeyToName = new Map(departments.map((d) => [d.key, d.name]));

    // ── Aggregate LP from BOTH sources per member and compute rank fields ───
    const memberIds = members.map((m) => m.id);

    const [awardAggs, txAggs, users] = await Promise.all([
      memberIds.length > 0
        ? prisma.lpAward.groupBy({
            by: ["memberId"],
            where: { memberId: { in: memberIds }, status: "approved" },
            _sum: { lpAmount: true },
          })
        : Promise.resolve([]),
      memberIds.length > 0
        ? prisma.lpTransaction.groupBy({
            by: ["memberId"],
            where: {
              memberId: { in: memberIds },
              type: "award",
              status: "completed",
              amount: { gt: 0 },
            },
            _sum: { amount: true },
          })
        : Promise.resolve([]),
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

    // Merge both sources into lpMap
    const lpMap = new Map<string, number>();
    for (const a of awardAggs) {
      lpMap.set(a.memberId, (lpMap.get(a.memberId) ?? 0) + (a._sum.lpAmount ?? 0));
    }
    for (const t of txAggs) {
      lpMap.set(t.memberId, (lpMap.get(t.memberId) ?? 0) + (t._sum.amount ?? 0));
    }

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
      // FIX: rank is admin-set and persisted in TeamMember.
      // Only compute rank from LP when there are actual LpAward records.
      // If totalApprovedLp > 0, compute from LP (LP-driven).
      // If totalApprovedLp === 0, preserve the persisted rank fields.
      // This fixes the bug where a manual rank update was overwritten
      // because the GET re-computed rank from zero LP (CEO/seed members).
      let level: number, currentXp: number, maxXp: number, rank: string;
      if (totalApprovedLp > 0) {
        const computed = computeRankFieldsFromLp(totalApprovedLp);
        level = computed.level;
        currentXp = computed.currentXp;
        maxXp = computed.maxXp;
        rank = computed.rank;
      } else {
        // Preserve admin-set values — rank was manually set, not driven by LP
        level = m.level;
        currentXp = m.currentXp;
        maxXp = xpForLevel(level);
        rank = m.rank ?? "iron";
      }
      const userInfo = userMap.get(m.id);

      // Resolve department label from FK (departmentRelation) — source of truth.
      // Falls back to legacy scalar department field if FK is null.
      let deptName = "";
      if (m.departmentRelation?.id) {
        deptName = deptIdToName.get(m.departmentRelation.id) ?? m.departmentRelation.name ?? m.departmentRelation.key ?? "";
      } else if (m.departmentRelation?.key) {
        deptName = deptKeyToName.get(m.departmentRelation.key) ?? m.departmentRelation.key;
      } else if (m.department) {
        // legacy scalar fallback (pre-FK data)
        deptName = m.department;
      }

      return addAvatar({
        ...m,
        // Expose level/XP/rank as stored (admin-set overrides take precedence
        // when no LP awards exist; LP-driven when awards exist)
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
        // Department from FK (source of truth) + display name
        departmentId: m.departmentRelation?.id ?? null,
        department: deptName,
        // Position — chức danh do HR/Admin nhập
        position: m.position,
        // Multi-department — all departments member belongs to (from junction)
        departments: (m.memberDepartments ?? []).filter((md) => md.department != null).map((md) => ({
          id: md.department!.id,
          key: md.department!.key ?? "",
          name: md.department!.name ?? "",
          shortName: md.department!.shortName ?? "",
          color: md.department!.color ?? "",
          position: md.position,
          isDeptHead: md.isDeptHead,
          isPrimary: md.isPrimary,
        })),
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

 // Email uniqueness check — prevent duplicate emails across TeamMembers
 if (data.email && String(data.email).trim() !== "") {
 const existing = await prisma.teamMember.findFirst({
 where: { email: data.email as string },
 select: { id: true, name: true },
 });
 if (existing) {
 return NextResponse.json(
 { error: `Email "${data.email}" đã được dùng bởi "${existing.name}".` },
 { status: 409 }
 );
 }
 }


    // Extract non-Prisma fields before writing (roles = UserRole junction, not TeamMember field)
    const { memberExpertise, avatar, roles: _roles, ...memberData } = data;

    // Convert empty strings to null for optional fields (except required fields)
    // Also convert date strings (dd/mm/yyyy) to proper ISO format
    const requiredFields = ['name', 'slug', 'role'];
    const dateFields = ['birthDate', 'contractStart', 'joinedDate'];
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
        ...(cleanedData as Prisma.TeamMemberCreateInput),
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

    // ── Auto-send team invite email if member has an email ────────────────────
    let inviteSent = false;
    if (member.email) {
      const inviterName = session.name ?? "LOOP Admin";
      const inviterEmail = session.email ?? "hello@loop.vn";
      const deptLabels: Record<string, string> = {
        engineering: "Phòng Kỹ thuật",
        design: "Phòng Thiết kế",
        media: "Phòng Media",
        marketing: "Phòng Marketing",
        sales: "Phòng Kinh doanh",
        finance: "Phòng Tài chính",
        hr: "Phòng Nhân sự",
        management: "Ban Quản lý",
      };

      try {
        const token = await signInviteToken({
          memberId: member.id,
          email: member.email,
          inviterId: session.userId,
          inviterName,
          inviterEmail,
          memberName: member.name,
        });
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://loops.vn";
        const inviteUrl = buildInviteUrl(token, baseUrl);

        const result = await sendTeamInviteEmail({
          memberName: member.name,
          memberEmail: member.email,
          inviterName,
          inviterEmail,
          department: deptLabels[member.department] ?? member.department,
          role: member.role,
          inviteUrl,
          expiresDays: 7,
        });
        inviteSent = result.success;
        if (!result.success) {
          console.warn(`[TEAM] Invite email failed for ${member.email}: ${result.error}`);
        }
      } catch (err) {
        // Non-fatal: member was created, just email failed
        console.warn("[TEAM] Invite email error:", err);
      }
    }

    return NextResponse.json({
      data: addAvatar(member),
      inviteSent,
      message: inviteSent
        ? `Đã tạo thành viên và gửi email mời đến ${member.email}`
        : member.email
        ? `Đã tạo thành viên (email mời gửi thất bại — xem log)`
        : "Đã tạo thành viên",
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/team error:", error);
    return handleError(error);
  }
}
