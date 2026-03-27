/**
 * Team Page — LOOP Solutions
 * Public page at /[locale]/team
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedTeamMember } from "@/lib/i18n/localization";
import { TeamClient } from "@/components/landing/TeamClient";
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
    const raw = await prisma.teamMember.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, name: true, image: true, role: true,
        shortBio: true, isFeatured: true, rank: true, level: true,
        availableLp: true,
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });
    members = raw.map((m) => {
      const localized = mapLocalizedTeamMember(m, resolvedLocale);
      return { ...localized, lpBalance: (m as { availableLp?: number }).availableLp ?? 0 };
    });
  } catch {
    members = [];
  }

  // Hero content via i18n (server-side, no client hook needed)
  const tTeam = await getTranslations("TeamPage");
  const hero = {
    badge:       tTeam("badge"),
    heroTitle1:  tTeam("heroTitle1"),
    heroHighlight: tTeam("heroHighlight"),
    heroTitle2:  tTeam("heroTitle2"),
    heroDesc:    tTeam("heroDesc"),
  };

  return <TeamClient locale={locale} members={members} hero={hero} />;
}
