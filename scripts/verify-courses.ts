import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, titleEn: true, titleJa: true, titleKo: true, titleZh: true }
  });
  courses.forEach(c => {
    console.log(c.id);
    console.log('  title    :', c.title);
    console.log('  titleEn  :', c.titleEn ?? 'NULL');
    console.log('  titleJa  :', c.titleJa ?? 'NULL');
    console.log('  titleKo  :', c.titleKo ?? 'NULL');
    console.log('  titleZh  :', c.titleZh ?? 'NULL');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
