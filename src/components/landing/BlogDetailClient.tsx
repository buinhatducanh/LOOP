"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { ArrowLeft } from "lucide-react";

type PostRecord = Record<string, unknown>;

export function BlogDetailClient({
  locale, post, authorName, related, tNav,
}: {
  locale: string;
  post: PostRecord;
  authorName: string | null;
  related: PostRecord[];
  tNav: Record<string, string>;
}) {
  const title = (post.title as string) ?? "Bài viết";
  const excerpt = (post.excerpt as string) ?? "";
  const content = (post.content as string) ?? "";
  const coverImage = (post.coverImage as string) ?? "";
  const publishedAt = post.publishedAt ? new Date(post.publishedAt as string) : null;

  const formattedDate = publishedAt
    ? publishedAt.toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.05) 0%, transparent 60%)" }}>
        <div className="max-w-4xl mx-auto px-6 py-14">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: DS.text4 }}>
            <Link href={`/${locale}`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>{tNav.home}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href={`/${locale}/blog`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>{tNav.blog}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: DS.text2 }}>{String(title).slice(0, 30)}...</span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: DS.heading, fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, color: DS.text, lineHeight: 1.25, marginBottom: 16, letterSpacing: "0.03em" }}
          >
            {title}
          </motion.h1>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: DS.text4 }}>
            {authorName && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: DS.blue, fontFamily: DS.mono }}>👤</span>
                <span style={{ fontFamily: DS.mono, color: DS.text3 }}>{authorName}</span>
              </span>
            )}
            {formattedDate && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: DS.purple, fontFamily: DS.mono }}>📅</span>
                <span style={{ fontFamily: DS.mono, color: DS.text3 }}>{formattedDate}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Cover image */}
      {coverImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="px-6 pb-10"
        >
          <div className="max-w-4xl mx-auto">
            <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${DS.border}`, maxHeight: 480 }}>
              <img src={coverImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", maxHeight: 480, display: "block" }} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        {excerpt && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ background: `${DS.blue}15`, border: `${DS.blue}30`, borderLeft: `4px solid ${DS.blue}`, borderRadius: 12, padding: "20px 24px", marginBottom: 32 }}
          >
            <p style={{ color: DS.text3, fontSize: 16, lineHeight: 1.75, fontStyle: "italic" }}>{excerpt}</p>
          </motion.div>
        )}

        {content ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ color: DS.text2, fontSize: 16, lineHeight: 1.9 }}
          >
            {content.split("\n").map((para, i) =>
              para.trim() ? (
                para.startsWith("#") ? (
                  <h2 key={i} style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginTop: 32, marginBottom: 12 }}>{para.replace(/^#+\s*/, "")}</h2>
                ) : (
                  <p key={i} style={{ marginBottom: 16 }}>{para}</p>
                )
              ) : <div key={i} style={{ height: 12 }} />
            )}
          </motion.div>
        ) : (
          <p style={{ color: DS.text5, fontStyle: "italic", textAlign: "center", padding: "3rem" }}>Nội dung đang được cập nhật...</p>
        )}

        {/* Related */}
        {related.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${DS.border}` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 4, height: 20, background: GRD.primary, borderRadius: 2 }} />
              <h2 style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 800, color: DS.text }}>Bài viết liên quan</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {related.map((r) => (
                <Link
                  key={r.id as string}
                  href={`/${locale}/blog/${r.slug}`}
                  style={{ display: "block", padding: "16px 20px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 14, textDecoration: "none", color: "inherit", transition: "border-color 0.2s" }}
                >
                  <p style={{ fontWeight: 700, color: DS.text, fontSize: 15, marginBottom: 4 }}>{r.title as string}</p>
                  {(r.excerpt as string) && (
                    <p style={{ fontSize: 13, color: DS.text4, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {(r.excerpt as string).slice(0, 100)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* Back */}
        <div style={{ marginTop: 32 }}>
          <Link href={`/${locale}/blog`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: DS.blue, textDecoration: "none", fontFamily: DS.mono, fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft size={14} /> Quay lại blog
          </Link>
        </div>
      </div>
    </main>
  );
}
