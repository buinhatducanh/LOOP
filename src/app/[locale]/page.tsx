import type { Metadata } from "next";
import { getServices, getProjects, getTestimonials, getSiteSettings, getTeamMembers, getHomeSliders, getHomeVideo } from "@/lib/db/queries";
import { services as mockServices, projects as mockProjects, testimonials as mockTestimonials, mockTeamMembers } from "@/data/mockData";
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
  let services, projects, testimonials, team;
  const siteSettings = await getSiteSettings();

  // Get banner settings
  const banners = [
    siteSettings.hero_banner_1,
    siteSettings.hero_banner_2,
    siteSettings.hero_banner_3,
    siteSettings.hero_banner_4,
    siteSettings.hero_banner_5,
  ].filter(Boolean);

  const heroEnabled = siteSettings.hero_enable !== "0";

  // Get sliders and video from database (with fallback)
  let dbSliders: any[] = [];
  let dbVideo: any = null;

  try {
    dbSliders = await getHomeSliders();
    dbVideo = await getHomeVideo();
  } catch (e) {
    // Tables may not exist yet - use fallback
    console.log("HomeSlider tables not found, using fallback");
  }

  const sliders = dbSliders.map((s: any) => ({
    id: s.id,
    image: s.image,
    title: s.title,
    subtitle: s.subtitle,
    link: s.link,
    sortOrder: s.sortOrder,
  }));

  const video = dbVideo ? {
    id: dbVideo.id,
    videoUrl: dbVideo.videoUrl,
    thumbnail: dbVideo.thumbnail,
    title: dbVideo.title,
    description: dbVideo.description,
  } : null;

  try {
    const [dbServices, dbProjects, dbTestimonials, dbTeam] = await Promise.all([
      getServices(), getProjects(), getTestimonials(), getTeamMembers(),
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

    // Transform team members for landing page
    if (dbTeam.length > 0) {
      team = dbTeam.map((dbMember: any) => {
        const mockMember = mockTeamMembers.find(m => m.slug === dbMember.slug);
        const image = dbMember.image || (mockMember?.image || "");
        const coverImage = dbMember.coverImage || (mockMember?.coverImage || "");
        // Prefer dbMember.roleLevel, fallback to mockMember, then default to 4
        const roleLevel = dbMember.roleLevel ?? mockMember?.roleLevel ?? 4;

        return {
          ...(mockMember || {}),
          ...dbMember,
          image,
          coverImage,
          roleLevel,
          expertise: dbMember.expertise || mockMember?.expertise || [],
          achievements: dbMember.achievements || mockMember?.achievements || [],
          skills: dbMember.skills || mockMember?.skills || [],
          shortBio: dbMember.shortBio || dbMember.bio?.substring(0, 100) || mockMember?.shortBio || "",
          linkedin: dbMember.linkedin || mockMember?.linkedin || null,
          twitter: dbMember.twitter || mockMember?.twitter || null,
          github: dbMember.github || mockMember?.github || null,
          email: dbMember.email || mockMember?.email || null,
          phone: dbMember.phone || mockMember?.phone || null,
          quote: dbMember.quote || mockMember?.quote || null,
          roleCategory: dbMember.roleCategory || mockMember?.roleCategory || null,
          isFeatured: dbMember.isFeatured ?? mockMember?.isFeatured ?? false,
        };
      });
    } else {
      team = mockTeamMembers;
    }
  } catch {
    services = mockServices;
    projects = mockProjects;
    testimonials = mockTestimonials;
    team = mockTeamMembers;
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
        team={team}
        stats={siteSettings.stat_projects ? {
          projects: siteSettings.stat_projects,
          satisfaction: siteSettings.stat_satisfaction,
          teamSize: siteSettings.stat_team_size,
          years: siteSettings.stat_years,
        } : undefined}
        banners={banners}
        heroEnabled={heroEnabled}
        sliders={sliders}
        video={video}
      />
    </>
  );
}
