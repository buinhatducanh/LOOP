import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/permissions";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch (err) {
    console.error("[/api/admin/auth/me]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
