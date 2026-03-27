/**
 * Team Member Detail Page — LOOP Solutions
 * Route: /[locale]/team/[slug]
 * i18n keys: TeamMemberPage namespace in messages/*.json
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedTeamMember } from "@/lib/i18n/localization";
import { TeamMemberClient } from "@/components/landing/TeamMemberClient";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  const member = await prisma.teamMember.findUnique({
    where: { slug, isActive: true },
  });

  if (!member) return { title: "Không tìm thấy" };

  const mapped = mapLocalizedTeamMember(member, resolvedLocale) as Record<string, string | null | undefined>;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

  return {
    title: `${mapped.name ?? ""} - ${mapped.role ?? ""} | LOOP`,
    description: (mapped.shortBio as string | undefined) ?? (mapped.bio as string | undefined) ?? `Gặp gỡ ${mapped.name} tại LOOP`,
    alternates: { canonical: `${baseUrl}/${locale}/team/${slug}` },
  };
}

export default async function TeamMemberPage({ params }: Props) {
  const { locale, slug } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const tMember = await getTranslations("TeamMemberPage");
  const tNav = await getTranslations("Navigation");

  const member = await prisma.teamMember.findUnique({
    where: { slug, isActive: true },
    include: {
      memberExpertise: { include: { expertise: true } },
    },
  });

  if (!member) notFound();

  const mapped = mapLocalizedTeamMember(member, resolvedLocale) as Record<string, string | null | undefined | number | unknown>;

  const expertises: string[] = member.memberExpertise
    .map((me) => {
      const suffix = resolvedLocale === "vi" ? "" : resolvedLocale.charAt(0).toUpperCase() + resolvedLocale.slice(1);
      const fieldKey = suffix ? `name${suffix}` : "name";
      return (me.expertise as Record<string, unknown>)[fieldKey] as string | undefined ?? me.expertise.name;
    })
    .filter(Boolean);

  const expertiseIds = member.memberExpertise.map((me) => me.expertiseId);
  const related = await prisma.teamMember.findMany({
    where: {
      isActive: true,
      slug: { not: slug },
      OR: [
        { roleLevel: member.roleLevel },
        ...(expertiseIds.length > 0
          ? [{ memberExpertise: { some: { expertiseId: { in: expertiseIds } } } }]
          : []),
      ],
    },
    take: 4,
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });

  const relatedMapped = related.map((m) => {
    const rel = mapLocalizedTeamMember(m, resolvedLocale) as Record<string, string | null | undefined | unknown>;
    return {
      id: m.id,
      slug: m.slug,
      name: (rel.name as string | null | undefined) ?? "",
      role: (rel.role as string | null | undefined) ?? "",
      image: rel.image as string | null | undefined,
    };
  });

  return (
    <TeamMemberClient
      locale={locale}
      member={mapped}
      expertises={expertises}
      related={relatedMapped}
      tLabel={tNav("team")}
      tRelated={tMember("relatedMembers")}
      tBack={tMember("backToTeam")}
      tChallenge={tMember("challenge") ?? "Thách thức"}
      tSolution={tMember("solution") ?? "Giải pháp"}
      tResult={tMember("result") ?? "Kết quả"}
    />
  );
}
