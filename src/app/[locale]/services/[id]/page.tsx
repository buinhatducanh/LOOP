import type { Metadata } from "next";
import { getServices, getServiceBySlug } from "@/lib/db/queries";
import { getRelatedProjectsForService } from "@/lib/db/internal-linking";
import { services as mockServices } from "@/data/mockData";
import { ServiceDetailPage } from "./service-detail-page";
import { RelatedContent } from "@/components/internal-linking/RelatedContent";
import { notFound } from "next/navigation";

export const revalidate = 3600; // ISR — revalidate every hour

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  try {
    const dbServices = await getServices();
    if (dbServices.length > 0) return dbServices.map((s) => ({ id: s.slug }));
  } catch {}
  return mockServices.map((service) => ({ id: service.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  try {
    const service = await getServiceBySlug(id);
    if (service) {
      const ogImage = `${siteUrl}/api/og?title=${encodeURIComponent(service.title)}&description=${encodeURIComponent(service.longDescription ?? "")}&type=service&locale=vi`;
      return {
        title: `${service.title} - Dịch vụ | LOOP`,
        description: service.longDescription,
        alternates: { canonical: `https://loop.vn/vi/services/${service.slug}` },
        openGraph: {
          title: `${service.title} - Dịch vụ | LOOP`,
          description: service.longDescription ?? "",
          url: `${siteUrl}/vi/services/${service.slug}`,
          siteName: "LOOP",
          locale: "vi_VN",
          type: "website",
          images: [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: service.title,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: `${service.title} - Dịch vụ | LOOP`,
          description: service.longDescription ?? "",
          images: [ogImage],
        },
      };
    }
  } catch {}
  const mock = mockServices.find((s) => s.id === id);
  if (!mock) return {};
  const ogImage = `${siteUrl}/api/og?title=${encodeURIComponent(mock.title)}&description=${encodeURIComponent(mock.longDescription ?? "")}&type=service&locale=vi`;
  return {
    title: `${mock.title} - Dịch vụ | LOOP`,
    description: mock.longDescription,
    alternates: { canonical: `https://loop.vn/vi/services/${mock.id}` },
    openGraph: {
      title: `${mock.title} - Dịch vụ | LOOP`,
      description: mock.longDescription ?? "",
      url: `${siteUrl}/vi/services/${mock.id}`,
      siteName: "LOOP",
      locale: "vi_VN",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: mock.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${mock.title} - Dịch vụ | LOOP`,
      description: mock.longDescription ?? "",
      images: [ogImage],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  try {
    const dbService = await getServiceBySlug(id);
    if (dbService) {
      const relatedItems = await getRelatedProjectsForService(dbService.id);
      return (
        <>
          <ServiceDetailPage
            service={{
              id: dbService.slug, icon: dbService.icon, title: dbService.title,
              shortDescription: dbService.shortDescription, longDescription: dbService.longDescription,
              features: dbService.features, technologies: dbService.technologies,
              startingPrice: dbService.startingPrice, deliveryTime: dbService.deliveryTime,
              category: dbService.category,
            }}
          />
          <RelatedContent
            variant="service-detail"
            currentId={dbService.id}
            currentSlug={dbService.slug}
            currentCategory={dbService.category}
            relatedItems={relatedItems}
          />
        </>
      );
    }
  } catch {}
  const service = mockServices.find((s) => s.id === id);
  if (!service) notFound();
  return <ServiceDetailPage service={service} />;
}
