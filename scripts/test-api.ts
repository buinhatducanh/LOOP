/**
 * Test API route handler directly
 */
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { parseLocaleParam, getLocalizedField } from "@/lib/i18n/localization";
import { list, buildPagination } from "@/lib/api";
import { logger } from "@/lib/logger";

config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function test() {
  const start = Date.now();
  try {
    const locale = "vi";
    const industry = undefined;
    const page = 1;
    const limit = 12;

    const where = {
      isCaseStudy: true,
      isPublished: true,
      ...(industry && industry !== "all" ? { industry } : {}),
    };

    console.log("Where clause:", JSON.stringify(where));

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          description: true,
          descriptionEn: true,
          client: true,
          year: true,
          image: true,
          industry: true,
          projectScope: true,
          teamSize: true,
          duration: true,
          challenge: true,
          solution: true,
          results: true,
          clientQuote: true,
          clientRole: true,
          roiMetric: true,
          primaryMetric: true,
          videoUrl: true,
          galleryImages: true,
          isPublished: true,
          category: true,
          createdAt: true,
        },
      }),
      prisma.project.count({ where }),
    ]);

    const localized = projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: getLocalizedField(p, "title", locale),
      description: getLocalizedField(p, "description", locale),
      client: p.client,
      year: p.year,
      image: p.image,
      industry: p.industry,
      projectScope: p.projectScope,
      teamSize: p.teamSize,
      duration: p.duration,
      challenge: p.challenge,
      solution: p.solution,
      results: p.results,
      clientQuote: p.clientQuote,
      clientRole: p.clientRole,
      roiMetric: p.roiMetric,
      primaryMetric: p.primaryMetric,
      videoUrl: p.videoUrl,
      galleryImages: p.galleryImages ?? [],
      category: p.category,
      isPublished: p.isPublished,
    }));

    console.log("Projects:", localized.length, "Total:", total);
    console.log("Response:", list(localized, buildPagination(page, limit, total)));
    console.log("Success! Latency:", Date.now() - start, "ms");
  } catch (e: unknown) {
    console.error("Error:", e);
    const err = e as Error;
    console.error("Name:", err.name, "Message:", err.message);
    if (err.name === "PrismaClientValidationError") {
      console.error("Prisma validation error - check field names in query vs schema");
    }
  }
  await prisma.$disconnect();
}

test();
