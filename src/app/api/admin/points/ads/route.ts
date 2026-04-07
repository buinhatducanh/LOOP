import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/permissions";
import { handleError, ok } from "@/lib/api";

// GET — List advertisements
export async function GET() {
  try {
    await getSession();

    const ads = await prisma.advertisement.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return ok(ads);
  } catch (error) {
    console.error("Error fetching ads:", error);
    return handleError(error);
  }
}

// POST — Create a new advertisement
export async function POST(_req: NextRequest) {
  try {
    await getSession();

    const body = await req.json();
    const ad = await prisma.advertisement.create({
      data: body,
    });

    return ok(ad, 201);
  } catch (error) {
    console.error("Error creating ad:", error);
    return handleError(error);
  }
}
