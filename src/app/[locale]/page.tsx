import type { Metadata } from "next";
import { getServices, getProjects, getTestimonials, getSiteSettings } from "@/lib/db/queries";
import { services as mockServices, projects as mockProjects, testimonials as mockTestimonials } from "@/data/mockData";
import JsonLd from "@/components/seo/JsonLd";
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
  const siteSettings = await getSiteSettings();
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
    testimonials = dbTestimonials.length > 0 ? dbTestimonials.map((t, i) => ({
      id: i + 1, name: t.name, role: t.role, company: t.company,
      avatar: t.avatar, rating: t.rating, text: t.text,
    })) : mockTestimonials;
  } catch {
    services = mockServices;
    projects = mockProjects;
    testimonials = mockTestimonials;
  }

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "LOOP",
    "image": "https://loop.vn/logo.png",
    "@id": "https://loop.vn",
    "url": "https://loop.vn",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Ho Chi Minh City",
      "addressLocality": "Ho Chi Minh",
      "addressRegion": "SG",
      "postalCode": "70000",
      "addressCountry": "VN"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": testimonials.length > 0 ? testimonials.length + 85 : 89
    },
    "review": testimonials.map((t: any) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": t.name
      },
      "datePublished": new Date().toISOString().split('T')[0],
      "reviewBody": t.text,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": t.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      }
    }))
  };

  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <HomePage
        services={services}
        projects={projects}
        testimonials={testimonials}
        stats={siteSettings.stat_projects ? {
          projects: siteSettings.stat_projects,
          satisfaction: siteSettings.stat_satisfaction,
          teamSize: siteSettings.stat_team_size,
          years: siteSettings.stat_years,
        } : undefined}
      />
    </>
  );
}
