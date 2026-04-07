import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  price: z.number().int().min(0).optional(),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]).optional(),
  startDate: z.string().transform(s => new Date(s)).optional(),
  endDate: z.string().transform(s => new Date(s)).optional(),
  autoRenew: z.boolean().optional(),
  status: z.enum(["active", "expiring_soon", "expired", "cancelled"]).optional(),
  renewalReminderSent: z.boolean().optional(),
  note: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("projects", "read");
    const { id } = await params;
    const data = await prisma.maintenanceContract.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true, companyName: true } },
      },
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("projects", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const existing = await prisma.maintenanceContract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = await prisma.maintenanceContract.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("projects", "delete");
    const { id } = await params;
    await prisma.maintenanceContract.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
