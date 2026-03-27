/**
 * Team Page — LOOP Solutions
 * Public page at /[locale]/team
 * Full guild UI: Hall of Fame, rank LED effects, XP bars, LP system.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedTeamMember } from "@/lib/i18n/localization";
import { TeamGuildClient } from "@/components/landing/guild/TeamGuildClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  return {
    title: t("teamTitle"),
    description: t("teamDescription"),
  };
}

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  let members: Record<string, unknown>[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any[] = await prisma.teamMember.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        role: true,
        bio: true,
        shortBio: true,
        image: true,
        achievements: true,
        isFeatured: true,
        rank: true,
        level: true,
        currentXp: true,
        maxXp: true,
        availableLp: true,
        lockedLp: true,
        lpEarned: true,
        lpSpent: true,
        team: true,
        roleCode: true,
        specialty: true,
        missions: true,
        challenge: true,
        solution: true,
        result: true,
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });
    members = (raw as Record<string, unknown>[]).map((m) => mapLocalizedTeamMember(m, resolvedLocale));
  } catch {
    members = [];
  }

  // Hero content via i18n (server-side)
  const tTeam = await getTranslations("TeamPage");
  const hero = {
    badge:          tTeam("badge"),
    heroTitle1:     tTeam("heroTitle1"),
    heroHighlight:  tTeam("heroHighlight"),
    heroTitle2:     tTeam("heroTitle2"),
    heroDesc:       tTeam("heroDesc"),
  };

  return <TeamGuildClient locale={locale} members={members} hero={hero} />;
}
