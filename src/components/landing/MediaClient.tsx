"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { ArrowRight, Camera, X, ChevronLeft, ChevronRight, ExternalLink, Image } from "lucide-react";

type MediaProject = {
  id: string;
  bookingNumber: string;
  title: string;
  customerName: string;
  bookingType: string;
  deliveredAssets: unknown;
  deliveredAt: Date | null;
  teamMember: { name: string } | null;
  package: { title: string } | null;
};

const BOOKING_TYPE_LABELS: Record<string, string> = {
  event: "Sự kiện",
  product: "Sản phẩm",
  corporate: "Doanh nghiệp",
  social: "Mạng xã hội",
  custom: "Tùy chỉnh",
};

function getAssetSrc(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
  }
  return "";
}

function getAssetLabel(item: unknown, index: number): string {
  if (typeof item === "string") {
    return item.split("/").pop() ?? `File ${index + 1}`;
  }
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    if (typeof obj.name === "string") return obj.name;
  }
  return `File ${index + 1}`;
}

function getAllAssets(assets: unknown): string[] {
  if (!Array.isArray(assets)) return [];
  return assets.map((a) => getAssetSrc(a)).filter(Boolean);
}

// ─── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  startIndex,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  title,
  customer,
}: {
  items: string[];
  startIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  title: string;
  customer: string;
}) {
  const src = items[startIndex] ?? "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.96)",
        zIndex: 200, display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: `1px solid ${DS.border}`,
      }}>
        <div>
          <p style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>{title}</p>
          <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
            {customer} · {startIndex + 1} / {items.length}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "6px 12px", borderRadius: 8,
                background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                color: DS.blue, fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, textDecoration: "none",
              }}
            >
              <ExternalLink size={12} /> Mở file gốc
            </a>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px", borderRadius: 8, background: DS.bgCard,
              border: `1px solid ${DS.border}`, color: DS.text3, cursor: "pointer",
              display: "flex", alignItems: "center", fontSize: 12,
            }}
          >
            <X size={13} /> Đóng
          </button>
        </div>
      </div>

      {/* Image area */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 24px", position: "relative",
      }}>
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            style={{
              position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22,
            }}
          >
            ‹
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={title}
          key={startIndex}
          style={{
            maxHeight: "75vh", maxWidth: "90vw", objectFit: "contain",
            borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        />

        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22,
            }}
          >
            ›
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div style={{
          display: "flex", gap: 8, padding: "12px 24px",
          overflowX: "auto", borderTop: `1px solid ${DS.border}`,
        }}>
          {items.map((url, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onPrev(); /* handled by parent */ }}
              style={{
                width: 60, height: 60, borderRadius: 8, flexShrink: 0,
                border: `2px solid ${i === startIndex ? DS.blue : "transparent"}`,
                overflow: "hidden", cursor: "pointer", padding: 0,
                opacity: i === startIndex ? 1 : 0.5,
                transition: "opacity 0.15s",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── MediaClient ───────────────────────────────────────────────────────────────

export function MediaClient({ locale, projects }: { locale: string; projects: MediaProject[] }) {
  const [lightbox, setLightbox] = useState<{
    items: string[];
    index: number;
    title: string;
    customer: string;
  } | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(["Tất cả"]);
    for (const p of projects) {
      set.add(p.bookingType);
    }
    return Array.from(set);
  }, [projects]);

  const [active, setActive] = useState("Tất cả");

  const filtered = useMemo(() => {
    if (active === "Tất cả") return projects;
    return projects.filter((p) => p.bookingType === active);
  }, [projects, active]);

  const openLightbox = (project: MediaProject, startIndex = 0) => {
    const items = getAllAssets(project.deliveredAssets);
    if (items.length > 0) {
      setLightbox({ items, index: startIndex, title: project.title, customer: project.customerName });
    }
  };

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section
        className="py-20 px-6 text-center"
        style={{ background: "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 100%)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <Camera size={12} style={{ color: DS.purple }} />
            <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em" }}>
              MEDIA PRODUCTION
            </span>
          </div>
          <h1
            style={{
              fontFamily: DS.heading, fontSize: 40, fontWeight: 900, letterSpacing: "0.06em",
              background: "linear-gradient(135deg, #FFFFFF, #94A3B8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 14,
            }}
          >
            SẢN PHẨM MEDIA
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>
            {filtered.length > 0
              ? `${filtered.length} sản phẩm media đã hoàn thành — từ chụp ảnh sự kiện đến video doanh nghiệp.`
              : "Những sản phẩm media chất lượng cao từ đội ngũ LOOP Production."}
          </p>
        </div>
      </section>

      {/* Category filters */}
      {categories.length > 1 && (
        <div className="flex justify-center gap-3 pb-10 flex-wrap px-6">
          {categories.map((cat) => {
            const isActive = active === cat;
            const label = BOOKING_TYPE_LABELS[cat] ?? cat;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 30,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  background: isActive ? GRD.primary : "transparent",
                  border: isActive ? "none" : `1px solid ${DS.border}`,
                  color: isActive ? "#fff" : DS.text3,
                  boxShadow: isActive ? "0 0 16px rgba(129,140,248,0.35)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((project, i) => {
              const allAssets = getAllAssets(project.deliveredAssets);
              const cover = allAssets[0] ?? "";
              const assetCount = allAssets.length;
              const typeLabel = BOOKING_TYPE_LABELS[project.bookingType] ?? project.bookingType;

              return (
                <motion.div
                  key={project.id}
                  className="rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                >
                  {/* Cover */}
                  <div
                    onClick={() => openLightbox(project)}
                    style={{
                      position: "relative", overflow: "hidden", height: 200,
                      cursor: "pointer",
                    }}
                  >
                    {cover ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cover}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
                          style={{
                            background: "linear-gradient(135deg, rgba(59,130,246,0.75), rgba(2,6,23,0.85))",
                            display: "grid", placeItems: "center",
                          }}
                        >
                          <span style={{ color: "#fff", fontFamily: DS.mono, fontSize: 11, letterSpacing: "0.12em" }}>
                            XEM SẢN PHẨM →
                          </span>
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          width: "100%", height: "100%", display: "grid", placeItems: "center",
                          background: "linear-gradient(160deg, #0F172A, #111827)", color: DS.text5,
                        }}
                      >
                        <Camera size={32} />
                      </div>
                    )}

                    {/* Asset count badge */}
                    {assetCount > 1 && (
                      <div
                        className="absolute top-3 right-3"
                        style={{
                          background: "rgba(0,0,0,0.75)",
                          color: "#fff",
                          fontSize: 10,
                          fontFamily: DS.mono,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 99,
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        +{assetCount - 1}
                      </div>
                    )}

                    {/* Type badge */}
                    <div
                      className="absolute top-3 left-3"
                      style={{
                        background: `${DS.purple}25`,
                        border: `1px solid ${DS.purple}50`,
                        color: DS.purple,
                        fontSize: 10,
                        fontFamily: DS.mono,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 99,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {typeLabel}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div style={{ color: DS.text, fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>
                      {project.title}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8, alignItems: "center" }}>
                      {project.teamMember && (
                        <span style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 10,
                          fontFamily: DS.mono, background: "rgba(139,92,246,0.1)",
                          color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.2)",
                        }}>
                          {project.teamMember.name}
                        </span>
                      )}
                      {project.package && (
                        <span style={{
                          padding: "2px 8px", borderRadius: 4, fontSize: 10,
                          fontFamily: DS.mono, background: "rgba(20,184,166,0.1)",
                          color: DS.cyan, border: "1px solid rgba(20,184,166,0.2)",
                        }}>
                          {project.package.title}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ color: DS.text4, fontSize: 11 }}>{project.customerName}</p>
                        {project.deliveredAt && (
                          <p style={{ color: DS.text4, fontSize: 10, marginTop: 1 }}>
                            {new Date(project.deliveredAt).toLocaleDateString("vi-VN")}
                          </p>
                        )}
                      </div>

                      {assetCount > 0 && (
                        <button
                          onClick={() => openLightbox(project)}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                            background: `${DS.blue}15`, border: `1px solid ${DS.blue}30`,
                            color: DS.blue, fontSize: 11, fontFamily: DS.mono, fontWeight: 600,
                          }}
                        >
                          <Image size={11} />
                          {assetCount} file{assetCount > 1 ? "s" : ""}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center", color: DS.text4, padding: "4rem",
              background: DS.bgCard, borderRadius: 16, border: `1px solid ${DS.border}`,
            }}
          >
            <Camera size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Chưa có sản phẩm media nào</p>
            <p style={{ fontSize: 13 }}>Các sản phẩm sẽ xuất hiện tại đây sau khi hoàn thành.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="py-14 px-6" style={{ borderTop: `1px solid ${DS.border}` }}>
        <div className="max-w-4xl mx-auto text-center">
          <p style={{ color: DS.text3, marginBottom: 16 }}>
            Bạn cần dịch vụ media chuyên nghiệp cho doanh nghiệp?
          </p>
          <Link
            href={`/${locale}/contact`}
            style={{
              display: "inline-flex", gap: 8, alignItems: "center",
              background: GRD.primary, color: "#fff", textDecoration: "none",
              padding: "11px 22px", borderRadius: 10,
              boxShadow: "0 0 20px rgba(129,140,248,0.35)",
              fontWeight: 700, fontSize: 14,
            }}
          >
            Đặt dịch vụ media <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            items={lightbox.items}
            startIndex={lightbox.index}
            title={lightbox.title}
            customer={lightbox.customer}
            onClose={() => setLightbox(null)}
            onPrev={() => setLightbox((l) => l ? { ...l, index: Math.max(0, l.index - 1) } : l)}
            onNext={() => setLightbox((l) => l ? { ...l, index: Math.min(l.items.length - 1, l.index + 1) } : l)}
            hasPrev={lightbox.index > 0}
            hasNext={lightbox.index < lightbox.items.length - 1}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
