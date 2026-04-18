import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const result = await prisma.servicePackage.upsert({
      where: { slug: "landing" },
      update: { price: 1890000 },
      create: {
        slug: "landing",
        title: "Landing Page",
        shortDesc: "Test",
        type: "website",
        price: 1890000,
        features: [],
      },
    });
    console.log("OK:", result.id);
  } catch (e: unknown) {
    const err = e as { message?: string; reason?: { message?: string } };
    console.error("FAIL:", err?.reason?.message ?? e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
