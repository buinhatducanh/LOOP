/**
 * Blog Page — LOOP Solutions
 * Public page at /[locale]/blog
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedBlogPost } from "@/lib/i18n/localization";
import type { Metadata } from "next";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("seo");
  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("BlogPage");
  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));

  let posts: unknown[] = [];

  try {
    const raw = await prisma.blogPost.findMany({
      where: { status: "published" },
      select: {
        id: true, slug: true, title: true, excerpt: true,
        publishedAt: true, updatedAt: true, coverImage: true,
      },
      orderBy: { publishedAt: "desc" },
    });
    posts = raw.map((p) => mapLocalizedBlogPost(p, resolvedLocale));
  } catch {
    posts = [];
  }

  return (
    <div style={{ padding: "3rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Hero */}
      <div style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: "0.875rem", color: "#3B82F6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("badge")}
        </p>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {t("heroTitle1")}{" "}
          <span style={{ color: "#3B82F6" }}>{t("heroHighlight")}</span>
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#6B7280", maxWidth: "640px" }}>
          {t("heroDesc")}
        </p>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <p style={{ color: "#9CA3AF", textAlign: "center", padding: "3rem" }}>
          {t("noResults")}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {posts.map((post) => {
            const p = post as Record<string, unknown>;
            const publishedAt = p.publishedAt as string | null;
            const date = publishedAt
              ? new Date(publishedAt).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
              : null;
            return (
              <a
                key={p.id as string}
                href={`/${locale}/blog/${p.slug}`}
                style={{ display: "block", textDecoration: "none", color: "inherit", borderRadius: "12px", overflow: "hidden", border: "1px solid #E5E7EB", transition: "box-shadow 0.2s" }}
              >
                {/* Cover */}
                <div style={{ height: "200px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.coverImage ? (
                    <img src={p.coverImage as string} alt={p.title as string} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "3rem", opacity: 0.3 }}>📝</span>
                  )}
                </div>
                {/* Content */}
                <div style={{ padding: "1.25rem" }}>
                  {date && (
                    <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginBottom: "0.5rem" }}>
                      {t("publishedOn")} {date}
                    </p>
                  )}
                  <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    {p.title as string}
                  </h2>
                  {!!p.excerpt && typeof p.excerpt === "string" && (
                    <p style={{ fontSize: "0.875rem", color: "#6B7280", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.excerpt}
                    </p>
                  )}
                  <p style={{ fontSize: "0.8125rem", color: "#3B82F6", fontWeight: 600, marginTop: "0.75rem" }}>
                    {t("readMore")} →
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
