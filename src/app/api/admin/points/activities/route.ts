import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/permissions";
import { handleError, ok } from "@/lib/api";

// GET — List point activities
export async function GET() {
  try {
    await getSession();

    const activities = await prisma.pointActivity.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return ok(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return handleError(error);
  }
}

// POST — Create a new point activity
export async function POST(_req: NextRequest) {
  try {
    await getSession();

    const body = await req.json();
    const activity = await prisma.pointActivity.create({
      data: body,
    });

    return ok(activity, 201);
  } catch (error) {
    console.error("Error creating activity:", error);
    return handleError(error);
  }
}
