import type { Metadata } from "next";
import { TeamPage } from "./team-page";
import { getTeamMembers, getSiteSettings } from "@/lib/db/queries";
import { mockTeamMembers } from "@/data/teamMockData";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    title: t.has("teamTitle") ? t("teamTitle") : "Đội Ngũ | LOOP",
    description: t.has("teamDescription") ? t("teamDescription") : "Gặp gỡ đội ngũ chuyên gia đằng sau LOOP",
    alternates: { canonical: `https://loop.vn/${locale}/team` },
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

  return (
    <TeamPage
      team={team as any}
      settings={{
        title: siteSettings.team_page_title,
        subtitle: siteSettings.team_page_subtitle,
      }}
    />
  );
}
