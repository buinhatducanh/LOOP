import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("pricing_features", "read");
    const { id } = await params;

    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id },
    });

    if (!quoteRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: quoteRequest });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("pricing_features", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.quoteRequest.update({
      where: { id },
      data: { status: data.status },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "quote_requests",
      resourceId: id,
      oldValues: { status: existing.status },
      newValues: { status: data.status },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}
