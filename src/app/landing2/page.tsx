/**
 * Landing Page 2 — Server Component
 * Route: /landing2
 */
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Landing2Client from "./Landing2Client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTACT_SETTINGS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "LOOPS Studio — Web 4.0 Agency",
  description: "Giải pháp toàn diện về Website, Media, Marketing & Branding. Tạo dấu ấn số, nâng tầm thương hiệu.",
};

export default async function Landing2Page() {
  const dbSettings = await prisma.siteSetting.findMany({
    where: {
      group: "contact",
    },
  });

  const settings: Record<string, string> = { ...DEFAULT_CONTACT_SETTINGS };
  for (const s of dbSettings) {
    settings[s.key] = s.value;
  }

  const dbServices = await prisma.service.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const dbFaqs = await prisma.faq.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const dbProjects = await prisma.project.findMany({
    where: {
      isPublished: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const dbPortfolioImages = await prisma.portfolioImage.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      { row: "asc" },
      { sortOrder: "asc" },
      { createdAt: "desc" }
    ],
  });

  return (
    <Landing2Client
      settings={settings}
      dbServices={JSON.parse(JSON.stringify(dbServices))}
      dbFaqs={JSON.parse(JSON.stringify(dbFaqs))}
      dbProjects={JSON.parse(JSON.stringify(dbProjects))}
      dbPortfolioImages={JSON.parse(JSON.stringify(dbPortfolioImages))}
    />
  );
}

