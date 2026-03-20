import type { Metadata } from "next";
import { getProjects, getProjectBySlug, getServiceBySlug } from "@/lib/db/queries";
import { getRelatedServicesForProject } from "@/lib/db/internal-linking";
import { projects as mockProjects, services as mockServices } from "@/data/mockData";
import { ProjectDetailPage } from "./project-detail-page";
import { RelatedContent } from "@/components/internal-linking/RelatedContent";
import { notFound } from "next/navigation";

export const revalidate = 3600; // ISR — revalidate every hour

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
      const relatedItems = await getRelatedServicesForProject(dbProject.id);
      return (
        <>
          <ProjectDetailPage
            project={{
              id: dbProject.slug,
              title: dbProject.title,
              category: dbProject.category,
              client: dbProject.client,
              year: dbProject.year,
              image: dbProject.image,
              description: dbProject.description,
              techStack: dbProject.techStack,
              features: dbProject.features,
              results: dbProject.results,
              screenshots: dbProject.screenshots,
              serviceId: serviceSlug,
            }}
            relatedService={relatedService}
            teamMember={dbProject.teamMember ? {
              id: dbProject.teamMember.slug,
              name: dbProject.teamMember.name,
              role: dbProject.teamMember.role,
              image: dbProject.teamMember.image,
            } : undefined}
          />
          <RelatedContent
            variant="project-detail"
            currentId={dbProject.id}
            currentSlug={dbProject.slug}
            currentCategory={dbProject.category}
            currentServiceId={dbProject.serviceId}
            currentTechStack={dbProject.techStack}
            relatedItems={relatedItems}
          />
        </>
      );
    }
  } catch {}
  const project = mockProjects.find((p) => p.id === id);
  if (!project) notFound();
  const svc = mockServices.find((s) => s.id === project.serviceId);
  const relatedService = svc ? { id: svc.id, title: svc.title } : undefined;
  return <ProjectDetailPage project={project} relatedService={relatedService} />;
}
