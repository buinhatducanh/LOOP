import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/permissions";
import { getToken } from "next-auth/jwt";

export async function GET() {
  // First check NextAuth session (Google login)
  const token = await getToken({ req: { headers: { cookie: "" } } } as any, { secret: process.env.AUTH_SECRET });

  if (token?.sub) {
    return NextResponse.json({
      user: {
        userId: token.sub,
        email: token.email,
        name: token.name,
        role: token.role || "user",
        roles: token.role === "admin" ? ["admin"] : ["user"],
        avatar: token.picture,
      },
    });
  }

  // Fallback to custom session (email/password login)
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: session });
}
