import { config } from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  try {
    // Check services table
    const svcCols = await prisma.$queryRawUnsafe<
      Array<{ column_name: string }>
    >(`SELECT column_name FROM information_schema.columns WHERE table_name = 'services' ORDER BY ordinal_position`);
    console.log("Services columns:", svcCols.map(c => c.column_name).join(", "));

    // Check projects table
    const projCols = await prisma.$queryRawUnsafe<
      Array<{ column_name: string }>
    >(`SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' ORDER BY ordinal_position`);
    console.log("Projects columns:", projCols.map(c => c.column_name).join(", "));

    // Check orders table
    const ordCols = await prisma.$queryRawUnsafe<
      Array<{ column_name: string }>
    >(`SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position`);
    console.log("Orders columns:", ordCols.map(c => c.column_name).join(", "));

  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
