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
  const t = await getTranslations("TeamPage");
  const tMember = await getTranslations("TeamMemberPage");

  // Fetch member + related members
  const member = await prisma.teamMember.findUnique({
    where: { slug, isActive: true },
    include: {
      memberExpertise: {
        include: { expertise: true },
      },
    },
  });

  if (!member) notFound();

  // Cast mapped fields to their expected string types
  const mapped = mapLocalizedTeamMember(member, resolvedLocale) as unknown as Record<string, string | null | undefined | string[] | unknown>;
  const memberName = (mapped.name as string | null | undefined) ?? "";
  const memberRole = (mapped.role as string | null | undefined) ?? "";
  const memberBio = mapped.bio as string | null | undefined;
  const memberShortBio = mapped.shortBio as string | null | undefined;
  const memberImage = mapped.image as string | null | undefined;

  // Build expertise array manually
  const expertises: string[] = member.memberExpertise
    .map((me) => {
      const suffix = resolvedLocale === "vi" ? "" : resolvedLocale.charAt(0).toUpperCase() + resolvedLocale.slice(1);
      const fieldKey = suffix ? `name${suffix}` : "name";
      return (me.expertise as Record<string, unknown>)[fieldKey] as string | undefined ?? me.expertise.name;
    })
    .filter(Boolean);

  // Related: same role-level or same expertise, max 4
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
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem 2rem 0" }}>
        <p style={{ fontSize: "0.875rem", color: "#6B7280" }}>
          <a href={`/${locale}/team`} style={{ color: "#6366f1", textDecoration: "none" }}>{t("heroTitle1")}</a>
          {" / "}
          <span style={{ color: "#374151" }}>{memberName}</span>
        </p>
      </div>

      {/* Hero */}
      <section style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "3rem 2rem",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: "3rem",
        alignItems: "start",
      }}>
        {/* Avatar */}
        <div style={{ width: "280px", flexShrink: 0 }}>
          <div style={{
            width: "280px",
            height: "280px",
            borderRadius: "1.5rem",
            overflow: "hidden",
            background: "#EFF6FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(99,102,241,0.15)",
          }}>
            {memberImage ? (
              <img
                src={memberImage}
                alt={memberName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ fontSize: "6rem", color: "#3B82F6", opacity: 0.4 }}>
                {memberName.charAt(0)}
              </div>
            )}
          </div>

          {/* Expertise tags */}
          {expertises.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
              {expertises.map((exp, i) => (
                <span key={i} style={{
                  background: "#EEF2FF",
                  color: "#4F46E5",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                }}>
                  {exp}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <span style={{
            display: "inline-block",
            background: "#EEF2FF",
            color: "#4F46E5",
            padding: "0.25rem 0.875rem",
            borderRadius: "9999px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            marginBottom: "1rem",
          }}>
            {tMember("teamMember")}
          </span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#0f172a", marginBottom: "0.5rem" }}>
            {memberName}
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#6366f1", fontWeight: 600, marginBottom: "1.5rem" }}>
            {memberRole}
          </p>

          {/* Bio */}
          <div style={{ color: "#374151", lineHeight: 1.8, fontSize: "1rem", maxWidth: "640px" }}>
            {memberBio ? (
              memberBio.split("\n").map((para, i) => (
                <p key={i} style={{ marginBottom: "1rem" }}>{para}</p>
              ))
            ) : memberShortBio ? (
              <p>{memberShortBio}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Related Members */}
      {relatedMapped.length > 0 && (
        <section style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "3rem 2rem",
          borderTop: "1px solid #E5E7EB",
        }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "2rem" }}>
            {tMember("relatedMembers")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {relatedMapped.map((rel) => (
              <a
                key={rel.id}
                href={`/${locale}/team/${rel.slug}`}
                style={{ display: "block", textDecoration: "none", color: "inherit", borderRadius: "12px", overflow: "hidden", border: "1px solid #E5E7EB", transition: "box-shadow 0.2s" }}
              >
                <div style={{ height: "200px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {rel.image ? (
                    <img src={rel.image} alt={rel.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ fontSize: "3rem", color: "#3B82F6", opacity: 0.4 }}>{rel.name.charAt(0)}</div>
                  )}
                </div>
                <div style={{ padding: "1rem" }}>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.25rem" }}>{rel.name}</h3>
                  <p style={{ fontSize: "0.8125rem", color: "#6366f1", fontWeight: 500 }}>{rel.role}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Back CTA */}
      <section style={{ textAlign: "center", padding: "1rem 2rem 4rem", maxWidth: "1200px", margin: "0 auto" }}>
        <a
          href={`/${locale}/team`}
          style={{
            display: "inline-block",
            padding: "0.75rem 2rem",
            background: "#6366f1",
            color: "white",
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.9375rem",
          }}
        >
          ← {tMember("backToTeam")}
        </a>
      </section>
    </div>
  );
}
