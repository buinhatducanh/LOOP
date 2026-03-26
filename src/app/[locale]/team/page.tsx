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

  const t = await getTranslations("TeamPage");
  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  let members: unknown[] = [];

  try {
    const raw = await prisma.teamMember.findMany({
      where: { isActive: true },
      select: {
        id: true, slug: true, name: true, image: true, role: true,
        shortBio: true, isFeatured: true,
      },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });
    members = raw.map((m) => mapLocalizedTeamMember(m, resolvedLocale));
  } catch {
    members = [];
  }

  return (
    <div style={{ padding: "3rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "#3B82F6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
          {t("badge")}
        </p>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {t("heroTitle1")}
          <span style={{ color: "#3B82F6" }}>{t("heroHighlight")}</span>
          {t("heroTitle2")}
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#6B7280", maxWidth: "640px", margin: "0 auto" }}>
          {t("heroDesc")}
        </p>
      </div>

      {/* Team Grid */}
      {members.length === 0 ? (
        <p style={{ color: "#9CA3AF", textAlign: "center", padding: "3rem" }}>
          {t("noResults")}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.5rem" }}>
          {members.map((member) => {
            const m = member as Record<string, unknown>;
            return (
              <a
                key={m.id as string}
                href={`/${locale}/team/${m.slug}`}
                style={{ display: "block", textDecoration: "none", color: "inherit", borderRadius: "12px", overflow: "hidden", border: "1px solid #E5E7EB", transition: "box-shadow 0.2s" }}
              >
                {/* Avatar */}
                <div style={{ height: "240px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {m.image ? (
                    <img src={m.image as string} alt={m.name as string} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ fontSize: "4rem", color: "#3B82F6", opacity: 0.4 }}>
                      {String(m.name).charAt(0)}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: "1.25rem" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
                    {m.name as string}
                  </h2>
                  <p style={{ fontSize: "0.875rem", color: "#3B82F6", fontWeight: 500, marginBottom: "0.5rem" }}>
                    {m.role as string}
                  </p>
                  {!!m.shortBio && typeof m.shortBio === "string" && (
                    <p style={{ fontSize: "0.8125rem", color: "#6B7280", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {m.shortBio}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
