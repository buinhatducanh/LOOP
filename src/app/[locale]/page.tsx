import type { Metadata } from "next";
import { getServices, getProjects, getTestimonials } from "@/lib/db/queries";
import { services as mockServices, projects as mockProjects, testimonials as mockTestimonials } from "@/data/mockData";
import { HomePage } from "./home-page";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('homeTitle'),
    description: t('homeDescription'),
    alternates: {
      canonical: locale === 'vi' ? "https://loop.vn" : `https://loop.vn/${locale}`,
      languages: {
        "vi": "https://loop.vn",
        "en": "https://loop.vn/en"
      }
    },
  };
}

export default async function Page() {
  let services, projects, testimonials;
  try {
    const [dbServices, dbProjects, dbTestimonials] = await Promise.all([
      getServices(), getProjects(), getTestimonials(),
    ]);
    services = dbServices.length > 0 ? dbServices.map((s) => ({
      id: s.slug, icon: s.icon, title: s.title, shortDescription: s.shortDescription,
      longDescription: s.longDescription, features: s.features, technologies: s.technologies,
      startingPrice: s.startingPrice, deliveryTime: s.deliveryTime, category: s.category,
    })) : mockServices;
    projects = dbProjects.length > 0 ? dbProjects.map((p) => ({
      id: p.slug, title: p.title, category: p.category, client: p.client, year: p.year,
      image: p.image, description: p.description, techStack: p.techStack,
      features: p.features, results: p.results, screenshots: p.screenshots,
      serviceId: (p.service as { slug: string } | null)?.slug ?? "",
    })) : mockProjects;
    testimonials = dbTestimonials.length > 0 ? dbTestimonials.map((t) => ({
      id: parseInt(t.id) || 0, name: t.name, role: t.role, company: t.company,
      avatar: t.avatar, rating: t.rating, text: t.text,
    })) : mockTestimonials;
  } catch {
    services = mockServices;
    projects = mockProjects;
    testimonials = mockTestimonials;
  }
  return <HomePage services={services} projects={projects} testimonials={testimonials} />;
}
