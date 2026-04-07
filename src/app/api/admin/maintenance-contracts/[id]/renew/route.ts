import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

// POST /api/admin/maintenance-contracts/[id]/renew
// Extends endDate based on billingCycle and resets status + reminder
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("projects", "update");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = z.object({
      months: z.number().optional(),
    }).safeParse(body);

    const contract = await prisma.maintenanceContract.findUnique({ where: { id } });
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const months = parsed.success && parsed.data.months != null
      ? parsed.data.months
      : getDefaultMonths(contract.billingCycle);

    const newEndDate = new Date(contract.endDate);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    const updated = await prisma.maintenanceContract.update({
      where: { id },
      data: {
        startDate: contract.endDate,
        endDate: newEndDate,
        status: "active",
        renewalReminderSent: false,
      },
    });

    console.log(`[Maintenance Renew] Contract ${id} renewed for ${months} months — new end: ${newEndDate.toISOString()}`);

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

function getDefaultMonths(billingCycle: string): number {
  switch (billingCycle) {
    case "monthly": return 1;
    case "quarterly": return 3;
    case "yearly": return 12;
    default: return 1;
  }
}
