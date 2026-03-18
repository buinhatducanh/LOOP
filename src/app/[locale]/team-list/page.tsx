import type { Metadata } from "next";
import { TeamPage } from "./team-page";
import { getTeamMembers, getSiteSettings, getExpertises } from "@/lib/db/queries";
import { mockTeamMembers } from "@/data/teamMockData";
import { getTranslations } from "next-intl/server";

export function generateStaticParams() {
  return [{ locale: "vi" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return {
    title: t.has("teamTitle") ? t("teamTitle") : "Đội Ngũ | LOOP",
    description: t.has("teamDescription") ? t("teamDescription") : "Gặp gỡ đội ngũ chuyên gia đằng sau LOOP",
    alternates: { canonical: `https://loop.vn/${locale}/team-list` },
  };
}

export default async function Page() {
  let team;
  const siteSettings = await getSiteSettings();
  const expertises = await getExpertises(true);

  try {
    const dbTeam = await getTeamMembers();

    if (dbTeam.length > 0) {
      team = dbTeam.map((dbMember: any) => {
        const mockMember = mockTeamMembers.find(m => m.slug === dbMember.slug);

        // Transform memberExpertise to skills array with level
        const memberExpertise = dbMember.memberExpertise || [];
        const skillsWithLevel = memberExpertise.map((me: any) => ({
          name: me.expertise?.name || "",
          nameVi: me.expertise?.nameVi || me.expertise?.name || "",
          level: me.level || 3,
          icon: me.expertise?.icon || null,
        }));

        // Use dbMember.image directly (already has the correct value from database)
        const image = dbMember.image || (mockMember?.image || "");
        const coverImage = dbMember.coverImage || (mockMember?.coverImage || "");

        if (mockMember) {
          return {
            ...mockMember,
            ...dbMember,
            image,
            coverImage,
            memberExpertise,
            skills: skillsWithLevel,
            expertise: skillsWithLevel,
          };
        }
        return {
          ...dbMember,
          image,
          coverImage,
          memberExpertise,
          skills: skillsWithLevel,
          expertise: skillsWithLevel,
        };
      });
    } else {
      team = mockTeamMembers;
    }
  } catch (e) {
    console.error("Error loading team:", e);
    team = mockTeamMembers;
  }

  return (
    <TeamPage
      team={team as any}
      expertises={expertises as any}
      settings={{
        title: siteSettings.team_page_title,
        subtitle: siteSettings.team_page_subtitle,
      }}
    />
  );
}
