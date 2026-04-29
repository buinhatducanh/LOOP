import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, list, handleError } from "@/lib/api";

/**
 * Public API to list active service packages
 * GET /api/pricing/packages?serviceKey=media
 */
export async function GET(req: NextRequest) {
  try {
    const serviceKey = req.nextUrl.searchParams.get("serviceKey");
    const type = req.nextUrl.searchParams.get("type");
    
    const where: any = { isActive: true };
    if (serviceKey && type) {
      where.OR = [{ serviceKey }, { type }];
    } else if (serviceKey) {
      where.serviceKey = serviceKey;
    } else if (type) {
      where.type = type;
    }

    const items = await prisma.servicePackage.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    return ok(items);
  } catch (err) {
    return handleError(err);
  }
}
