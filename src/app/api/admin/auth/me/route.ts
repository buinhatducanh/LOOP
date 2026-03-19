import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/permissions";
import { getToken } from "next-auth/jwt";

export async function GET() {
  try {
    // First check NextAuth session (Google login)
    const token = await getToken(
      { req: { headers: { cookie: "" } } } as Parameters<typeof getToken>[0],
      { secret: process.env.AUTH_SECRET }
    );

    if (token?.sub) {
      const session = await getSession();
      return NextResponse.json({ user: session });
    }

    // Fallback to custom session (email/password login)
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user: session });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
