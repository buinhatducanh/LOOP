import { config } from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function test() {
  try {
    console.log("Testing Project.findMany...");
    const projects = await prisma.project.findMany({ where: { isCaseStudy: true }, take: 3 });
    console.log("Projects:", projects.length, projects.map((p: { slug: string }) => p.slug));
  } catch (e: unknown) {
    console.error("Project error:", e);
  }
  try {
    console.log("Testing Service.findMany...");
    const services = await prisma.service.findMany({ where: { isActive: true }, take: 3 });
    console.log("Services:", services.length, services.map((s: { slug: string }) => s.slug));
  } catch (e: unknown) {
    console.error("Service error:", e);
  }
  await prisma.$disconnect();
}

test();
