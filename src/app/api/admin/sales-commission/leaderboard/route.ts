/**
 * GET /api/admin/sales-commission/leaderboard
 *
 * Returns all members ranked by their total completed sales commission (LP).
 * For the Admin Sales Commission Leaderboard tab.
 *
 * Requires: admin permission (sales permission or admin/super_admin/ceo)
 */

import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/api/response";

interface CommissionEntry {
 id: string;
 name: string;
 avatar: string | null;
 systemRole: string | null;
 departmentKey: string | null;
 completedCommission: number;
 totalSalesCommission: number;
 dealCount: number;
}

export async function GET(req: NextRequest) {
 try {
 await requirePermission("team", "read");

 // Group commission events by salesRepId to count deals
 const commissionEvents = await prisma.salesCommissionEvent.groupBy({
 by: ["salesRepId"],
 _count: { id: true },
 _sum: { totalLp: true },
 where: { referenceType: "order" },
 });

 const salesRepIds = commissionEvents.map((e: typeof commissionEvents[number]) => e.salesRepId);

 // Fetch team members who have commission data
 const members = await prisma.teamMember.findMany({
 where: {
 id: { in: salesRepIds },
 },
 select: {
 id: true,
 name: true,
 image: true,
 role: true,
 department: true,
 departmentId: true,
 completedCommission: true,
 totalSalesCommission: true,
 },
 });

 // Build the leaderboard entries
 const eventMap = new Map<string, { dealCount: number; totalLp: number }>(
 commissionEvents.map((e: typeof commissionEvents[number]) => [e.salesRepId, { dealCount: e._count.id, totalLp: e._sum.totalLp ?? 0 }])
 );

 const entries: CommissionEntry[] = members.map((m: typeof members[number]) => {
 const evt = eventMap.get(m.id);
 return {
 id: m.id,
 name: m.name,
 avatar: m.image ?? null,
 systemRole: m.role ?? null,
 departmentKey: m.departmentId ?? null,
 completedCommission: evt?.totalLp ?? m.completedCommission,
 totalSalesCommission: evt?.totalLp ?? m.totalSalesCommission,
 dealCount: evt?.dealCount ?? 0,
 };
 });

 // Sort by completed commission descending
 entries.sort((a, b) => b.completedCommission - a.completedCommission);

 return (await import("@/lib/api/response")).ok(entries);
 } catch (err) {
 return handleError(err);
 }
}
