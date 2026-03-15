import type { Metadata } from "next";
import { getProjects, getProjectBySlug, getServiceBySlug } from "@/lib/db/queries";
import { projects as mockProjects, services as mockServices } from "@/data/mockData";
import { ProjectDetailPage } from "./project-detail-page";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  try {
    const dbProjects = await getProjects();
    if (dbProjects.length > 0) return dbProjects.map((p) => ({ id: p.slug }));
  } catch {}
  return mockProjects.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const project = await getProjectBySlug(id);
    if (project) {
      return {
        title: `${project.title} - Dự án bởi LOOP`,
        description: project.description,
        alternates: { canonical: `https://loop.vn/portfolio/${project.slug}` },
      };
    }
  } catch {}
  const mock = mockProjects.find((p) => p.id === id);
  if (!mock) return {};
  return {
    title: `${mock.title} - Dự án bởi LOOP`,
    description: mock.description,
    alternates: { canonical: `https://loop.vn/portfolio/${mock.id}` },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  try {
    const dbProject = await getProjectBySlug(id);
    if (dbProject) {
      const serviceSlug = dbProject.service?.slug ?? "";
      let relatedService: { id: string; title: string } | undefined;
      if (serviceSlug) {
        const svc = await getServiceBySlug(serviceSlug);
        if (svc) relatedService = { id: svc.slug, title: svc.title };
      }
      return (
        <ProjectDetailPage
          project={{
            id: dbProject.slug, title: dbProject.title, category: dbProject.category,
            client: dbProject.client, year: dbProject.year, image: dbProject.image,
            description: dbProject.description, techStack: dbProject.techStack,
            features: dbProject.features, results: dbProject.results,
            screenshots: dbProject.screenshots, serviceId: serviceSlug,
          }}
          relatedService={relatedService}
        />
      );
    }
  } catch {}
  const project = mockProjects.find((p) => p.id === id);
  if (!project) notFound();
  const svc = mockServices.find((s) => s.id === project.serviceId);
  const relatedService = svc ? { id: svc.id, title: svc.title } : undefined;
  return <ProjectDetailPage project={project} relatedService={relatedService} />;
}
