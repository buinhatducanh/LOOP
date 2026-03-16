import type { Metadata } from "next";
import { AboutPage } from "./about-page";
import { getTeamMembers, getSiteSettings } from "@/lib/db/queries";
import { mockTeamMembers } from "@/data/mockData";
import JsonLd from "@/components/seo/JsonLd";

import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('aboutTitle'),
    description: t('aboutDescription'),
    alternates: { canonical: `https://loop.vn/${locale}/about` },
  };
}

export default async function Page() {
  let team;
  const siteSettings = await getSiteSettings();
  try {
    const dbTeam = await getTeamMembers();
    team = dbTeam.length > 0 ? dbTeam : mockTeamMembers;
  } catch {
    team = mockTeamMembers;
  }

  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": team.map((member, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Person",
        "name": member.name,
        "jobTitle": member.role,
        "description": member.shortBio,
        "url": `https://loop.vn/team/${member.slug}`,
        "image": member.image
      }
    }))
  };

  return (
    <>
      <JsonLd data={teamSchema} />
      <AboutPage
        team={team}
        stats={siteSettings.stat_projects ? {
          projects: siteSettings.stat_projects,
          satisfaction: siteSettings.stat_satisfaction,
          teamSize: siteSettings.stat_team_size,
          years: siteSettings.stat_years,
        } : undefined}
        techStack={siteSettings.tech_stack ? siteSettings.tech_stack.split(",").map(s => s.trim()).filter(Boolean) : undefined}
      />
    </>
  );
}
