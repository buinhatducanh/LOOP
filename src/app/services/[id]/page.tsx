import type { Metadata } from "next";
import { services } from "@/data/mockData";
import { ServiceDetailPage } from "./service-detail-page";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return services.map((service) => ({ id: service.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = services.find((s) => s.id === id);
  if (!service) return {};
  return {
    title: `${service.title} - Dịch vụ | LOOP`,
    description: service.longDescription,
    alternates: { canonical: `https://loop.vn/services/${service.id}` },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const service = services.find((s) => s.id === id);
  if (!service) notFound();
  return <ServiceDetailPage service={service} />;
}
