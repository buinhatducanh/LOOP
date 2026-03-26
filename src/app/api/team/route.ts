import { ok, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ roleLevel: "asc" }, { sortOrder: "asc" }],
    });

    return ok(members);
  } catch (error) {
    return serverError();
  }
}
