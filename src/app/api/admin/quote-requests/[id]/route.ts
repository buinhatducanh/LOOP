import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("quote-requests", "read");
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
    const session = await requirePermission("quote-requests", "update");
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("quote-requests", "delete");
    const { id } = await params;

    const existing = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.quoteRequest.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "quote_requests",
      resourceId: id,
      oldValues: existing,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
