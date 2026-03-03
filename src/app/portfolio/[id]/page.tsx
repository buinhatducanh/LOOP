import type { Metadata } from "next";
import { projects } from "@/data/mockData";
import { ProjectDetailPage } from "./project-detail-page";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) return {};
  return {
    title: `${project.title} - Dự án bởi LOOP`,
    description: project.description,
    alternates: { canonical: `https://loop.vn/portfolio/${project.id}` },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();
  return <ProjectDetailPage project={project} />;
}
