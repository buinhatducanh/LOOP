"use client";

import Link from "next/link";
import { DS, GRD } from "@/lib/design-tokens";
import { ArrowLeft, ExternalLink, Video } from "lucide-react";

type PostRecord = Record<string, unknown>;
type BacklinkEntry = { url: string; label: string };

export function BlogDetailClient({
  locale, post, authorName, related, tNav,
  videoUrl, backlinks,
}: {
  locale: string;
  post: PostRecord;
  authorName: string | null;
  related: PostRecord[];
  tNav: Record<string, string>;
  videoUrl?: string | null;
  backlinks?: string | null;
}) {
  const title = (post.title as string) ?? "Bài viết";
  const excerpt = (post.excerpt as string) ?? "";
  const content = (post.content as string) ?? "";
  const coverImage = (post.coverImage as string) ?? "";
  const publishedAt = post.publishedAt ? new Date(post.publishedAt as string) : null;

  const getEmbedUrl = (url: string): string => {
    try {
      if (url.includes("youtube.com/watch")) {
        const id = new URL(url).searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (url.includes("player.vimeo.com/video/")) return url;
      if (url.includes("vimeo.com/")) {
        const id = url.split("vimeo.com/")[1]?.split("?")[0];
        return id ? `https://player.vimeo.com/video/${id}` : url;
      }
      return url;
    } catch { return url; }
  };

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  const isYoutube = embedUrl?.includes("youtube.com/embed") || embedUrl?.includes("player.vimeo.com");

  let backlinkList: BacklinkEntry[] = [];
  if (backlinks) {
    try { backlinkList = JSON.parse(backlinks); } catch { /* ignore */ }
  }

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const plainText = stripHtml(content);
  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.ceil(words / 200);

  const formattedDate = publishedAt
    ? publishedAt.toLocaleDateString(locale === "vi" ? "vi-VN" : locale === "en" ? "en-US" : locale, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div style={{ background: DS.bg, minHeight: "100vh" }}>
      <section style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.05) 0%, transparent 60%)" }}>
        <div className="max-w-4xl mx-auto px-6 py-14">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: DS.text4 }}>
            <Link href={`/${locale}`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>{tNav.home}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href={`/${locale}/blog`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>{tNav.blog}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: DS.text2 }}>{String(title).slice(0, 30)}...</span>
          </div>

          <h1 style={{ fontFamily: DS.heading, fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, color: DS.text, lineHeight: 1.25, marginBottom: 16, letterSpacing: "0.03em" }}>
            {title}
          </h1>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13, color: DS.text4 }}>
            {authorName && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: DS.blue, fontFamily: DS.mono }}>👤</span><span style={{ fontFamily: DS.mono, color: DS.text3 }}>{authorName}</span></span>}
            {formattedDate && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: DS.purple, fontFamily: DS.mono }}>📅</span><span style={{ fontFamily: DS.mono, color: DS.text3 }}>{formattedDate}</span></span>}
            {words > 0 && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: DS.teal, fontFamily: DS.mono }}>📝</span><span style={{ fontFamily: DS.mono, color: DS.text3 }}>{words.toLocaleString()} từ · {readTime} phút đọc</span></span>}
          </div>
        </div>
      </section>

      {coverImage && (
        <div className="px-6 pb-10">
          <div className="max-w-4xl mx-auto">
            <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${DS.border}`, maxHeight: 480 }}>
              <img src={coverImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", maxHeight: 480, display: "block" }} />
            </div>
          </div>
        </div>
      )}

      {embedUrl && isYoutube && (
        <div className="px-6 pb-10">
          <div className="max-w-4xl mx-auto">
            <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${DS.border}` }}>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe src={embedUrl} title={title} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 pb-20">
        {excerpt && (
          <div style={{ background: `${DS.blue}15`, border: `${DS.blue}30`, borderLeft: `4px solid ${DS.blue}`, borderRadius: 12, padding: "20px 24px", marginBottom: 32 }}>
            <p style={{ color: DS.text3, fontSize: 16, lineHeight: 1.75, fontStyle: "italic" }}>{excerpt}</p>
          </div>
        )}

        {content ? (
          <div className="blog-prose">
            <style>{`
              .blog-prose { color: ${DS.text2}; font-size: 16px; line-height: 1.9; }
              .blog-prose h2 { font-family: ${DS.heading}; font-size: 22px; font-weight: 800; color: ${DS.text}; margin: 36px 0 14px; padding-bottom: 8px; border-bottom: 1px solid ${DS.border}; }
              .blog-prose h3 { font-family: ${DS.heading}; font-size: 18px; font-weight: 700; color: ${DS.text}; margin: 28px 0 10px; }
              .blog-prose p { margin-bottom: 16px; }
              .blog-prose ul, .blog-prose ol { padding-left: 24px; margin-bottom: 16px; }
              .blog-prose li { margin-bottom: 6px; }
              .blog-prose blockquote { border-left: 4px solid ${DS.pink}; padding: 12px 20px; margin: 20px 0; background: rgba(236,72,153,0.06); border-radius: 0 10px 10px 0; font-style: italic; color: ${DS.text3}; }
              .blog-prose code { background: rgba(107,61,245,0.12); padding: 2px 5px; border-radius: 4px; font-family: ${DS.mono}; font-size: 14px; color: ${DS.cosmicPurple}; }
              .blog-prose pre { background: #0d1117; border-radius: 10px; padding: 16px; margin: 16px 0; overflow-x: auto; }
              .blog-prose pre code { background: none; padding: 0; color: #e2e8f0; }
              .blog-prose img { max-width: 100%; border-radius: 10px; margin: 16px 0; }
              .blog-prose a { color: ${DS.blue}; text-decoration: underline; }
              .blog-prose iframe { width: 100%; border-radius: 10px; border: none; aspect-ratio: 16/9; }
              .blog-prose hr { border: none; border-top: 1px solid ${DS.border}; margin: 28px 0; }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        ) : (
          <p style={{ color: DS.text5, fontStyle: "italic", textAlign: "center", padding: "3rem" }}>Nội dung đang được cập nhật...</p>
        )}

        {related.length > 0 && (
          <section style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${DS.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 4, height: 20, background: GRD.primary, borderRadius: 2 }} />
              <h2 style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 800, color: DS.text }}>Bài viết liên quan</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {related.map((r) => (
                <Link key={r.id as string} href={`/${locale}/blog/${r.slug}`} style={{ display: "block", padding: "16px 20px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 14, textDecoration: "none", color: "inherit" }}>
                  <p style={{ fontWeight: 700, color: DS.text, fontSize: 15, marginBottom: 4 }}>{r.title as string}</p>
                  {(r.excerpt as string) && <p style={{ fontSize: 13, color: DS.text4, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{(r.excerpt as string).slice(0, 100)}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div style={{ marginTop: 32 }}>
          <Link href={`/${locale}/blog`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: DS.blue, textDecoration: "none", fontFamily: DS.mono, fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft size={14} /> Quay lại blog
          </Link>
        </div>
      </div>
    </div>
  );
}
