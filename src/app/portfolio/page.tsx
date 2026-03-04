import type { Metadata } from "next";
import { getProjects } from "@/lib/db/queries";
import { projects as mockProjects } from "@/data/mockData";
import { PortfolioPage } from "./portfolio-page";

export const metadata: Metadata = {
  title: "Dự án đã thực hiện | LOOP",
  description:
    "Xem các dự án website, ứng dụng web đã hoàn thành bởi LOOP. 150+ dự án, 98% khách hàng hài lòng. E-commerce, SaaS, corporate.",
  alternates: { canonical: "https://loop.vn/portfolio" },
};

export default async function Page() {
  let projects;
  try {
    const dbProjects = await getProjects();
    projects = dbProjects.length > 0 ? dbProjects.map((p) => ({
      id: p.slug, title: p.title, category: p.category, client: p.client, year: p.year,
      image: p.image, description: p.description, techStack: p.techStack,
      features: p.features, results: p.results, screenshots: p.screenshots,
      serviceId: (p.service as { slug: string } | null)?.slug ?? "",
    })) : mockProjects;
  } catch {
    projects = mockProjects;
  }
  return <PortfolioPage projects={projects} />;
}
