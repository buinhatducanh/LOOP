/**
 * Blog Post Detail Page — LOOP Solutions
 * Phase 0 i18n: wired to DB, BlogPage namespace
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam } from "@/lib/i18n/localization";
import { mapLocalizedBlogPost } from "@/lib/i18n/localization";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const resolvedLocale = parseLocaleParam(new URLSearchParams({ lang: locale }));
  const t = await getTranslations("BlogPage");
  const tNav = await getTranslations("Navigation");

  const raw = await prisma.blogPost.findFirst({
    where: { slug },
    select: {
      id: true, slug: true, title: true, excerpt: true,
      content: true, coverImage: true, publishedAt: true, authorId: true,
    },
  });

  if (!raw) notFound();

  const post = mapLocalizedBlogPost(raw, resolvedLocale);

  // Resolve author name from TeamMember if available
  let authorName: string | null = null;
  if (raw.authorId) {
    const author = await prisma.teamMember.findUnique({
      where: { id: raw.authorId },
      select: { name: true },
    });
    authorName = author?.name ?? null;
  }

  const related = await prisma.blogPost.findMany({
    where: { status: "published", NOT: { slug } },
    select: { id: true, slug: true, title: true, excerpt: true, coverImage: true, publishedAt: true },
    take: 3,
  });

  const formattedDate = post.publishedAt instanceof Date
    ? post.publishedAt.toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        color: "white",
        padding: "5rem 2rem 4rem",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", opacity: 0.6, fontSize: "0.875rem" }}>
            <a href={`/${locale}`} style={{ color: "inherit", textDecoration: "none" }}>{tNav("home")}</a>
            <span>›</span>
            <a href={`/${locale}/blog`} style={{ color: "inherit", textDecoration: "none" }}>{tNav("blog")}</a>
            <span>›</span>
            <span>{String(post.title ?? "").slice(0, 40)}...</span>
          </div>

          <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, lineHeight: 1.2, marginBottom: "1rem" }}>
            {post.title as string}
          </h1>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", opacity: 0.8, fontSize: "0.875rem" }}>
            {authorName && <span>👤 {authorName}</span>}
            {formattedDate && <span>📅 {formattedDate}</span>}
          </div>
        </div>
      </section>

      {/* Cover Image */}
      {!!post.coverImage && typeof post.coverImage === "string" && (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 2rem 0" }}>
          <img
            src={post.coverImage as string}
            alt={post.title as string}
            style={{ width: "100%", maxHeight: "480px", objectFit: "cover", borderRadius: "1rem" }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "2rem" }}>
        {!!post.excerpt && typeof post.excerpt === "string" && (
          <p style={{ fontSize: "1.125rem", color: "#475569", fontWeight: 500, lineHeight: 1.7, marginBottom: "1.5rem", borderLeft: "4px solid #6366f1", paddingLeft: "1rem" }}>
            {post.excerpt}
          </p>
        )}

        {!!post.content && typeof post.content === "string" ? (
          <div style={{ color: "#374151", fontSize: "1rem", lineHeight: 1.85 }}>
            {(post.content as string).split("\n").map((paragraph, i) =>
              paragraph.trim() ? <p key={i} style={{ marginBottom: "1rem" }}>{paragraph}</p> : null
            )}
          </div>
        ) : (
          <p style={{ color: "#9ca3af", fontStyle: "italic" }}>{t("noContent")}</p>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <section style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0f172a", marginBottom: "1.5rem" }}>
              {t("relatedTitle")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {related.map((r) => {
                const lp = mapLocalizedBlogPost(r, resolvedLocale);
                return (
                  <a
                    key={r.id}
                    href={`/${locale}/blog/${r.slug}`}
                    style={{
                      display: "block",
                      padding: "1rem 1.25rem",
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "0.75rem",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
                      {lp.title as string}
                    </p>
                    {!!r.excerpt && typeof r.excerpt === "string" && (
                      <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                        {r.excerpt.slice(0, 100)}...
                      </p>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Back link */}
        <div style={{ marginTop: "2.5rem" }}>
          <a href={`/${locale}/blog`} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#6366f1",
            textDecoration: "none",
            fontWeight: 600,
          }}>
            ← {t("backToList")}
          </a>
        </div>
      </div>
    </div>
  );
}
