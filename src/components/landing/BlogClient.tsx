"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { DS } from "@/lib/design-tokens";

type BlogRecord = Record<string, unknown>;

export function BlogClient({ locale, posts }: { locale: string; posts: BlogRecord[] }) {
  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      <section className="py-20 px-6 text-center" style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.07) 0%, transparent 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em" }}>BLOG & INSIGHTS</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 40, fontWeight: 900, letterSpacing: "0.06em", background: "linear-gradient(135deg, #FFFFFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 14 }}>
            KIẾN THỨC CHUYÊN MÔN
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>Cập nhật xu hướng công nghệ, design, performance và case study thực tế từ LOOP.</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post, i) => {
            const slug = (post.slug as string) ?? String(post.id ?? i);
            const title = (post.title as string) ?? "Untitled";
            const excerpt = (post.excerpt as string) ?? "";
            const cover = (post.coverImage as string) ?? "";
            const publishedAt = post.publishedAt ? new Date(post.publishedAt as string) : null;

            return (
              <motion.article
                key={slug}
                className="rounded-2xl overflow-hidden"
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                whileHover={{ y: -3, borderColor: `${DS.blue}40` }}
              >
                <Link href={`/${locale}/blog/${slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <div style={{ height: 180, background: "#111827", overflow: "hidden" }}>
                    {cover ? (
                      <img src={cover} alt={title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5 }}>No Cover</div>
                    )}
                  </div>
                  <div style={{ padding: 16 }}>
                    {publishedAt && (
                      <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>
                        {publishedAt.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    )}
                    <h2 style={{ color: DS.text, fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>{title}</h2>
                    <p style={{ color: DS.text4, fontSize: 13, lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 10 }}>
                      {excerpt}
                    </p>
                    <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.08em" }}>ĐỌC THÊM →</span>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>

        {posts.length === 0 && (
          <div style={{ textAlign: "center", color: DS.text4, padding: "3rem" }}>Chưa có bài viết nào.</div>
        )}
      </section>
    </main>
  );
}
