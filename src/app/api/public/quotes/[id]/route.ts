import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/api";

/**
 * Public API to fetch a quote and mark it as viewed.
 * GET /api/public/quotes/[id]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        salesLead: {
          select: { id: true, customerName: true, companyName: true },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // AUTO-VIEWED LOGIC:
    // If quote is currently 'sent', update it to 'viewed' and record the time.
    if (quote.status === "sent") {
      await prisma.quote.update({
        where: { id },
        data: {
          status: "viewed",
        },
      });
      // Update local object for the response
      quote.status = "viewed";
    }

    return NextResponse.json({ data: quote });
  } catch (error) {
    return handleError(error);
  }
}
