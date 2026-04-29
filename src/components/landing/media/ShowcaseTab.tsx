"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { Camera, X, ExternalLink, Image, ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaProject } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAssetSrc(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
  }
  return "";
}

function getAllAssets(assets: unknown): string[] {
  if (!Array.isArray(assets)) return [];
  return assets.map((a) => getAssetSrc(a)).filter(Boolean);
}

const BOOKING_TYPE_KEY: Record<string, string> = {
  event: "filterEvent",
  product: "filterProduct",
  corporate: "filterCorporate",
  social: "filterSocial",
  custom: "filterCustom",
};

// ── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  title,
  customer,
}: {
  items: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  title: string;
  customer: string;
}) {
  const t = useTranslations("MediaPage");
  const src = items[currentIndex] ?? "";
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label={title}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.96)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        outline: "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <div>
          <p style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>{title}</p>
          <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
            {customer} · {currentIndex + 1} / {items.length}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: `${DS.cosmicBlue}20`,
                border: `1px solid ${DS.cosmicBlue}40`,
                color: DS.cosmicBlue,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                textDecoration: "none",
              }}
            >
              <ExternalLink size={12} /> {t("openOriginal")}
            </a>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: DS.bgCard,
              border: `1px solid ${DS.border}`,
              color: DS.text3,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
            }}
          >
            <X size={13} /> {t("close")}
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          position: "relative",
        }}
      >
        {hasPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous"
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <img
          src={src}
          alt={title}
          key={currentIndex}
          style={{
            maxHeight: "75vh",
            maxWidth: "90vw",
            objectFit: "contain",
            borderRadius: 12,
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}
        />

        {hasNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next"
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 24px",
            overflowX: "auto",
            borderTop: `1px solid ${DS.border}`,
          }}
        >
          {items.map((url, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to this index
                if (i < currentIndex) {
                  for (let j = 0; j < currentIndex - i; j++) onPrev();
                } else if (i > currentIndex) {
                  for (let j = 0; j < i - currentIndex; j++) onNext();
                }
              }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                flexShrink: 0,
                border: `2px solid ${i === currentIndex ? DS.pink : "transparent"}`,
                overflow: "hidden",
                cursor: "pointer",
                padding: 0,
                opacity: i === currentIndex ? 1 : 0.5,
                transition: "opacity 0.15s, border-color 0.15s",
              }}
            >
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── ShowcaseTab ──────────────────────────────────────────────────────────────

export function ShowcaseTab({
  projects,
  locale,
}: {
  projects: MediaProject[];
  locale: string;
}) {
  const t = useTranslations("MediaPage");

  const [lightbox, setLightbox] = useState<{
    items: string[];
    index: number;
    title: string;
    customer: string;
  } | null>(null);

  // Category filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) set.add(p.bookingType);
    return Array.from(set);
  }, [projects]);

  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!activeFilter) return projects;
    return projects.filter((p) => p.bookingType === activeFilter);
  }, [projects, activeFilter]);

  const openLightbox = (project: MediaProject, startIndex = 0) => {
    const items = getAllAssets(project.deliveredAssets);
    if (items.length > 0) {
      setLightbox({
        items,
        index: startIndex,
        title: project.title,
        customer: project.customerName,
      });
    }
  };

  return (
    <section style={{ padding: "0 1.5rem 4rem" }}>
      {/* Grid */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        <AnimatePresence>
          {filtered.map((project, i) => {
            const allAssets = getAllAssets(project.deliveredAssets);
            const cover = allAssets[0] ?? "";
            const assetCount = allAssets.length;
            const typeKey = BOOKING_TYPE_KEY[project.bookingType];
            const typeLabel = typeKey ? t(typeKey) : project.bookingType;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  background: DS.bgCard,
                  border: `1px solid ${DS.border}`,
                  cursor: "pointer",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                whileHover={{
                  borderColor: DS.pink,
                  boxShadow: GLOW.cardPinkGlow,
                }}
              >
                {/* Cover */}
                <div
                  onClick={() => openLightbox(project)}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    height: 220,
                    cursor: "pointer",
                  }}
                >
                  {cover ? (
                    <>
                      <motion.img
                        src={cover}
                        alt={project.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(135deg, rgba(236,72,153,0.6), rgba(2,11,29,0.85))",
                          display: "grid",
                          placeItems: "center",
                          opacity: 0,
                          transition: "opacity 0.3s",
                        }}
                        className="showcase-hover-overlay"
                      >
                        <span
                          style={{
                            color: "#fff",
                            fontFamily: DS.mono,
                            fontSize: 11,
                            letterSpacing: "0.12em",
                            fontWeight: 600,
                          }}
                        >
                          {t("viewProject")} →
                        </span>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        background: `linear-gradient(160deg, ${DS.bgCard}, ${DS.bgCard3})`,
                        color: DS.text5,
                      }}
                    >
                      <Camera size={32} />
                    </div>
                  )}

                  {/* Asset count badge */}
                  {assetCount > 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
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
                  {project.bookingType !== "portfolio" && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: `${DS.pink}25`,
                        border: `1px solid ${DS.pink}50`,
                        color: DS.pink,
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
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      color: DS.text,
                      fontWeight: 700,
                      fontSize: 15,
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}
                  >
                    {project.title}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginBottom: 10,
                      alignItems: "center",
                    }}
                  >
                    {project.teamMember && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontFamily: DS.mono,
                          background: `${DS.cosmicPurple}15`,
                          color: DS.cosmicPurple,
                          border: `1px solid ${DS.cosmicPurple}30`,
                        }}
                      >
                        {project.teamMember.name}
                      </span>
                    )}
                    {project.package && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontFamily: DS.mono,
                          background: `${DS.teal}15`,
                          color: DS.teal,
                          border: `1px solid ${DS.teal}30`,
                        }}
                      >
                        {project.package.title}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ color: DS.text4, fontSize: 11 }}>{project.customerName}</p>
                      {project.deliveredAt && (
                        <p style={{ color: DS.text5, fontSize: 10, marginTop: 1 }}>
                          {new Date(project.deliveredAt).toLocaleDateString(locale)}
                        </p>
                      )}
                    </div>

                    {assetCount > 0 && (
                      <button
                        onClick={() => openLightbox(project)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "5px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          background: `${DS.pink}15`,
                          border: `1px solid ${DS.pink}30`,
                          color: DS.pink,
                          fontSize: 11,
                          fontFamily: DS.mono,
                          fontWeight: 600,
                        }}
                      >
                        <Image size={11} />
                        {t("files", { n: assetCount })}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: DS.text4,
            padding: "4rem 2rem",
            maxWidth: 400,
            margin: "0 auto",
            background: DS.bgCard,
            borderRadius: 16,
            border: `1px solid ${DS.border}`,
          }}
        >
          <Camera size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            {t("emptyShowcase")}
          </p>
          <p style={{ fontSize: 13 }}>{t("emptyShowcaseDesc")}</p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            items={lightbox.items}
            currentIndex={lightbox.index}
            title={lightbox.title}
            customer={lightbox.customer}
            onClose={() => setLightbox(null)}
            onPrev={() =>
              setLightbox((l) => (l ? { ...l, index: Math.max(0, l.index - 1) } : l))
            }
            onNext={() =>
              setLightbox((l) =>
                l ? { ...l, index: Math.min(l.items.length - 1, l.index + 1) } : l
              )
            }
          />
        )}
      </AnimatePresence>

      {/* CSS for hover overlay */}
      <style>{`
        .showcase-hover-overlay { opacity: 0 !important; }
        *:hover > .showcase-hover-overlay { opacity: 1 !important; }
      `}</style>
    </section>
  );
}
