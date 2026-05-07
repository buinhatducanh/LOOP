"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { Camera, ArrowRight, Sparkles, Layers, Film, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ShowcaseTab } from "./ShowcaseTab";
import { StoriesTab } from "./StoriesTab";
import { PackagesTab } from "./PackagesTab";
import { MediaTestimonialsSection } from "./MediaTestimonialsSection";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { rgba } from "@/components/ui/utils";
import type { MediaProject, MediaStoryItem, MediaTestimonialItem, MediaPackage } from "./types";

export type { MediaProject, MediaStoryItem, MediaTestimonialItem };

export type MediaStats = {
  totalProjects: number;
  totalCustomers: number;
  totalFiles: number;
};
export function MediaPageClient({
  locale,
  projects,
  stories,
  packages = [],
  testimonials,
  stats,
}: {
  locale: string;
  projects: MediaProject[];
  stories: MediaStoryItem[];
  packages?: MediaPackage[];
  testimonials: MediaTestimonialItem[];
  stats: MediaStats;
}) {
  const t = useTranslations("MediaPage");
  const [mounted, setMounted] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; title: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Group projects by package ──────────────────────────────────────
  const groupedProjects = useMemo(() => {
    const groups: Record<string, { pkg: MediaPackage | null; projects: MediaProject[]; images: string[] }> = {};

    // First, group all projects
    projects.forEach(p => {
      const pkgId = p.packageId || "other";
      if (!groups[pkgId]) {
        const pkg = packages.find(pkg => pkg.id === pkgId) || null;
        groups[pkgId] = { pkg, projects: [], images: [] };
      }
      groups[pkgId].projects.push(p);
    });

    return Object.values(groups)
      .map(group => {
        // Sort: Featured first
        const sorted = group.projects.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

        // Collect images from sorted projects
        const images: string[] = [];
        sorted.forEach(p => {
          if (Array.isArray(p.deliveredAssets)) {
            p.deliveredAssets.forEach(asset => {
              const url = typeof asset === "string" ? asset : (asset as any).url;
              if (url && images.length < 5) images.push(url);
            });
          }
        });

        return {
          pkg: group.pkg || { id: "other", title: "Dự án khác", price: 0, features: [] },
          projects: sorted,
          images
        };
      })
      .filter(group => group.images.length > 0)
      // Prioritize packages that have featured projects
      .sort((a, b) => {
        const aHasFeatured = a.projects.some(p => p.isFeatured);
        const bHasFeatured = b.projects.some(p => p.isFeatured);
        return (bHasFeatured ? 1 : 0) - (aHasFeatured ? 1 : 0);
      });
  }, [projects, packages]);

  if (!mounted) return <main style={{ background: DS.bg, minHeight: "100vh" }} />;

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "6rem 1.5rem 3rem", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: GRD.cosmicBg1, pointerEvents: "none" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ fontFamily: DS.heading, fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, background: `linear-gradient(180deg, ${DS.text} 0%, ${rgba(DS.text, 0.6)} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16 }}>
            {t("heroTitle")}
          </h1>
          <p style={{ color: DS.text3, fontSize: 16, maxWidth: 600, margin: "0 auto" }}>{t("heroDesc")}</p>
        </motion.div>
      </section>

      {/* ── Main Layout Grid ────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1400, margin: "0 auto", padding: "0 1.5rem 5rem",
        display: "grid", gridTemplateColumns: "1fr 320px", gap: 40
      }}>

        {/* ── Left Column: Main Content ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 60 }}>

          {/* Section 1: Featured Projects Showcase */}
          <section>
            <div style={{ marginBottom: 32 }}>
              <div style={{ width: 60, height: 4, background: GRD.primary, borderRadius: 2, marginTop: 8 }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              {groupedProjects.map((group, groupIdx) => (
                <div key={groupIdx} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  {group.projects.filter(p => p.isFeatured).map(project => {
                    const projectImages = Array.isArray(project.deliveredAssets)
                      ? project.deliveredAssets.map(a => typeof a === 'string' ? a : (a as any).url).filter(Boolean)
                      : [];

                    if (projectImages.length === 0) return null;

                    return (
                      <div key={project.id} style={{
                        background: rgba(DS.bgCosmic, 0.7), border: `1px solid ${DS.border}`,
                        borderRadius: 24, overflow: "hidden", padding: 24,
                        boxShadow: `0 8px 32px ${rgba(DS.text, 0.05)}`
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <h3 style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 700, color: DS.text }}>
                            {project.title}
                          </h3>
                          <button
                            onClick={() => setLightbox({ images: projectImages, index: 0, title: project.title })}
                            style={{
                              padding: "8px 16px", borderRadius: 12, background: "rgba(244,114,182,0.1)",
                              color: DS.pink, border: "none", fontSize: 12, fontWeight: 700,
                              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                              transition: "all 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "rgba(244,114,182,0.2)"}
                            onMouseOut={(e) => e.currentTarget.style.background = "rgba(244,114,182,0.1)"}
                          >
                            Xem thêm <Layers size={14} />
                          </button>
                        </div>

                        {/* Image Grid: 1 large + 4 small */}
                        <div style={{
                          display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, height: 450
                        }}>
                          <div
                            onClick={() => setLightbox({ images: projectImages, index: 0, title: project.title })}
                            style={{ borderRadius: 16, overflow: "hidden", position: "relative", cursor: "zoom-in" }}
                          >
                            <img src={projectImages[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)", opacity: 0, transition: "opacity 0.3s" }} onMouseOver={(e) => e.currentTarget.style.opacity = "1"} onMouseOut={(e) => e.currentTarget.style.opacity = "0"} />
                          </div>
                          <div style={{ display: "grid", gridTemplateRows: "repeat(2, 1fr)", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                            {projectImages.slice(1, 5).map((img, i) => (
                              <div
                                key={i}
                                onClick={() => setLightbox({ images: projectImages, index: i + 1, title: project.title })}
                                style={{ borderRadius: 12, overflow: "hidden", cursor: "zoom-in" }}
                              >
                                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            ))}
                            {/* Fill empty slots */}
                            {Array.from({ length: Math.max(0, 4 - (projectImages.length - 1)) }).map((_, i) => (
                              <div key={`empty-${i}`} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: DS.text5 }}>
                                <Camera size={20} opacity={0.3} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Pricing Packages */}
          <section>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: DS.heading, fontSize: 24, fontWeight: 800, color: DS.text, marginBottom: 8 }}>
                Bảng giá dịch vụ
              </h2>
              <div style={{ width: 40, height: 3, background: DS.pink, borderRadius: 2 }} />
            </div>
            <PackagesTab packages={packages} locale={locale} />
          </section>

          {/* Section 3: Testimonials */}
          <MediaTestimonialsSection testimonials={testimonials} />
        </div>

        {/* ── Right Column: Sidebar Blog ── */}
        <aside style={{ position: "sticky", top: 100, alignSelf: "start" }}>
          <div style={{
            background: rgba(DS.bgCosmic, 0.8), backdropFilter: "blur(12px)",
            border: `1px solid ${DS.border}`, borderRadius: 24, padding: 24
          }}>
            <h2 style={{
              fontFamily: DS.heading, fontSize: 16, fontWeight: 800,
              color: DS.pink, marginBottom: 20, display: "flex", alignItems: "center", gap: 8
            }}>
              <Sparkles size={16} /> CHUYỆN HẬU TRƯỜNG
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {stories.map(story => (
                <Link key={story.id} href={`/${locale}/media/story/${story.slug}`} style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <div style={{
                      width: 64, height: 64, borderRadius: 12, overflow: "hidden", flexShrink: 0,
                      border: `1px solid ${DS.border}`
                    }}>
                      <img src={story.coverImage || ""} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                      <h4 style={{
                        color: DS.text, fontSize: 13, fontWeight: 600, lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                      }}>
                        {story.title}
                      </h4>
                      <p style={{ color: DS.text4, fontSize: 11, marginTop: 4, fontFamily: DS.mono }}>
                        {story.publishedAt ? new Date(story.publishedAt).toLocaleDateString(locale) : ""}
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            <Link href={`/${locale}/media/stories`} style={{
              display: "block", marginTop: 24, textAlign: "center",
              color: DS.text3, fontSize: 12, fontWeight: 700, textDecoration: "none"
            }}>
              Xem tất cả bài viết <ArrowRight size={12} style={{ marginLeft: 4 }} />
            </Link>
          </div>
        </aside>

      </div>

      {/* ── Lightbox Modal ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)",
              display: "flex", flexDirection: "column", padding: 40
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: "#fff", fontFamily: DS.heading, fontSize: 20 }}>{lightbox.title}</h3>
              <button onClick={() => setLightbox(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                <X size={32} />
              </button>
            </div>

            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <img
                src={lightbox.images[lightbox.index]}
                alt=""
                style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: 12 }}
              />

              {/* Navigation */}
              {lightbox.images.length > 1 && (
                <>
                  <button
                    onClick={() => setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length })}
                    style={{ position: "absolute", left: 0, background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 20 }}
                  >
                    <ChevronLeft size={48} />
                  </button>
                  <button
                    onClick={() => setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length })}
                    style={{ position: "absolute", right: 0, background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 20 }}
                  >
                    <ChevronRight size={48} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, overflowX: "auto", padding: "10px 0" }}>
              {lightbox.images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setLightbox({ ...lightbox, index: i })}
                  style={{
                    width: 60, height: 60, borderRadius: 8, overflow: "hidden", cursor: "pointer",
                    border: i === lightbox.index ? `2px solid ${DS.pink}` : "2px solid transparent",
                    opacity: i === lightbox.index ? 1 : 0.5, transition: "all 0.2s"
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
