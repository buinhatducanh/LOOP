import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const u = await prisma.user.findUnique({
    where: { email: "admin@loop.vn" },
    include: { userRoles: { include: { role: true } } },
  });

  console.log("Admin user from DB:");
  console.log(JSON.stringify(u, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
