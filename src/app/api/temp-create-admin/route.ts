import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "@/lib/auth/password";

const prisma = (() => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: connectionString || "" });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
})();

export async function POST(req: NextRequest) {
  try {
    const { secret, email, password, name } = await req.json();

    if (secret !== "create-admin-123") {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.delete({ where: { email } });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "admin",
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
