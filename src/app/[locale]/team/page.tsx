/**
 * Team Page — LOOP Solutions
 * Public page at /[locale]/team
 * Full guild UI: Hall of Fame, rank LED effects, XP bars, LP system.
 */

import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedTeamMember } from "@/lib/i18n/localization";
import { TeamGuildClient } from "@/components/landing/guild/TeamGuildClient";
import { computeRankFieldsFromLp } from "@/lib/rank/xp";
import type { Metadata } from "next";
import { isTeamPageVisible } from "@/lib/config/page-visibility";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
  const title = t("teamTitle");
  const description = t("teamDescription");
  const brandMetaTitle = t("brandMetaTitle");
  const brandMetaDescription = t("brandMetaDescription");
  const _ogImage = t("ogImage");
  const canonical = `${baseUrl}/${locale}/team`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      url: canonical,
      images: [{ url: `/api/og?type=service&locale=${locale}`, width: 1200, height: 630, alt: "LOOP Solutions" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${brandMetaTitle}`,
      description: brandMetaDescription || description,
      images: [`/api/og?type=service&locale=${locale}`],
    },
  };
}

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  if (!isTeamPageVisible) {
    redirect(`/${locale}`);
  }

  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  let members: Record<string, unknown>[] = [];

  try {
    const raw = await prisma.teamMember.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        role: true,
        department: true,
        departmentId: true,
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
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });

    // Aggregate LP from both sources per member (same logic as leaderboard)
    const memberIds = raw.map((m: typeof raw[number]) => m.id);
    const [awardAggs, txAggs] = await Promise.all([
      memberIds.length > 0
        ? prisma.lpAward.groupBy({
            by: ["memberId"],
            where: { memberId: { in: memberIds }, status: "approved" },
            _sum: { lpAmount: true },
          })
        : Promise.resolve([]),
      memberIds.length > 0
        ? prisma.lpTransaction.groupBy({
            by: ["memberId"],
            where: {
              memberId: { in: memberIds },
              type: "award",
              status: "completed",
              amount: { gt: 0 },
            },
            _sum: { amount: true },
          })
        : Promise.resolve([]),
    ]);

    // Build LP map
    const lpMap = new Map<string, number>();
    for (const a of awardAggs) {
      lpMap.set(a.memberId, (lpMap.get(a.memberId) ?? 0) + (a._sum.lpAmount ?? 0));
    }
    for (const t of txAggs) {
      lpMap.set(t.memberId, (lpMap.get(t.memberId) ?? 0) + (t._sum.amount ?? 0));
    }

    // Compute rank + enrich member data (same fallback logic as leaderboard)
    members = raw.map((m: typeof raw[number]) => {
      const totalLp = lpMap.get(m.id) ?? 0;
      const computed = computeRankFieldsFromLp(totalLp);

      // Use persisted DB fields if they have real data; fall back to computed
      const level = m.level > 1 || (m.currentXp ?? 0) > 0 ? m.level : computed.level;
      const currentXp = (m.currentXp ?? 0) > 0 ? m.currentXp : computed.currentXp;
      const maxXp = m.maxXp >= 100 ? m.maxXp : computed.maxXp;
      const rank = m.rank && m.rank !== "iron" ? m.rank : computed.rank;

      return {
        ...mapLocalizedTeamMember({ ...m, level, rank, currentXp, maxXp }, resolvedLocale),
        availableLp: m.availableLp ?? 0,
        lockedLp: m.lockedLp ?? 0,
      };
    });
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
