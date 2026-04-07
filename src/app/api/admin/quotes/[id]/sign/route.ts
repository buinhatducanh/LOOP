import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// POST /api/admin/quotes/[id]/sign
// Marks a quote as signed by the customer.
// This is a SEPARATE step from internal approval — previously both approvedAt
// and signedAt were set at the same time (P0-2 bug).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("quotes", "update");
    const { id } = await params;
    const _data = await req.json().catch(() => ({}));

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only signed quotes can transition to signed status
    if (quote.status !== "approved") {
      return NextResponse.json(
        { error: `Quote must be approved before signing. Current status: ${quote.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: "signed",
        signedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "sign",
      resource: "quotes",
      resourceId: id,
      newValues: { signedAt: updated.signedAt },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}
