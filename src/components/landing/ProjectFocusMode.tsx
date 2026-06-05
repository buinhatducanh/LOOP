"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface FocusProject {
  id: string;
  name: string;
  industry: string;
  description: string;
  thumbnail: string;
  metrics: { label: string; value: string }[];
  tech: string[];
  accentHue: string;
}

const SP = {
  heavy: { type: "spring" as const, mass: 1.8, stiffness: 140, damping: 28 },
  med:   { type: "spring" as const, mass: 1.0, stiffness: 200, damping: 22 },
  light: { type: "spring" as const, mass: 0.7, stiffness: 280, damping: 22 },
  snap:  { type: "spring" as const, mass: 0.4, stiffness: 340, damping: 20 },
};

const TEXT = {
  primary:   "rgba(10, 10, 20, 0.90)",
  secondary: "rgba(10, 10, 20, 0.58)",
  accent:    "#5250f3",
  white:     "#ffffff",
};

function DesktopMockup({ thumbnail }: { thumbnail: string }) {
  return (
    <div style={{
      width: "100%",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
      border: "1px solid rgba(0,0,0,0.07)",
      background: "#fff",
    }}>
      <div style={{
        background: "#f0f0f5",
        padding: "9px 14px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <div style={{ flex: 1, marginLeft: 8, height: 20, background: "rgba(0,0,0,0.07)", borderRadius: 5, display: "flex", alignItems: "center", paddingLeft: 10 }}>
          <span style={{ fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)", fontSize: "11px", color: "rgba(0,0,0,0.35)" }}>
            project.vn
          </span>
        </div>
      </div>
      <img src={thumbnail} alt="Desktop preview" style={{ width: "100%", height: "280px", objectFit: "cover", display: "block" }} />
    </div>
  );
}

function PhoneMockup({ thumbnail }: { thumbnail: string }) {
  return (
    <div style={{
      width: "130px",
      borderRadius: "28px",
      overflow: "hidden",
      border: "9px solid #e8e8ef",
      outline: "1px solid rgba(0,0,0,0.09)",
      background: "#fff",
      boxShadow: "0 20px 56px rgba(0,0,0,0.16), 0 4px 14px rgba(0,0,0,0.08)",
      flexShrink: 0,
    }}>
      <div style={{ background: "#e8e8ef", padding: "7px 0", display: "flex", justifyContent: "center", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ width: 38, height: 5, borderRadius: 4, background: "rgba(0,0,0,0.2)" }} />
      </div>
      <img src={thumbnail} alt="Mobile preview" style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
      <div style={{ background: "#e8e8ef", padding: "8px 0", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 30, height: 4, borderRadius: 3, background: "rgba(0,0,0,0.22)" }} />
      </div>
    </div>
  );
}

interface ProjectFocusModeProps {
  project: FocusProject | null;
  onClose: () => void;
}

export function ProjectFocusMode({ project, onClose }: ProjectFocusModeProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (project) {
      window.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* ── Cinematic DOF backdrop ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.1 } }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 90,
              background: "rgba(240, 240, 250, 0.78)",
              backdropFilter: "blur(28px) saturate(55%) brightness(0.9)",
              WebkitBackdropFilter: "blur(28px) saturate(55%) brightness(0.9)",
              cursor: "pointer",
            }}
          />

          {/* ── Showcase panel ── */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.88, y: 48 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -20, transition: { duration: 0.3 } }}
            transition={{ ...SP.med, delay: 0.05 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "16px",
              pointerEvents: "none",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "980px",
                maxHeight: "92vh",
                overflowY: "auto",
                overflowX: "hidden",
                pointerEvents: "all",
                borderRadius: "24px",
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 40px 120px rgba(60,70,180,0.16), 0 12px 40px rgba(60,70,180,0.1)",
                position: "relative",
              }}
            >
              {/* ── HEADER ── */}
              <div style={{ padding: "32px 36px 0" }}>
                {/* Row: tag + close */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <motion.div
                    initial={{ x: -70, y: 12, rotate: 10, opacity: 0 }}
                    animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{ ...SP.snap, delay: 0.07 }}
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "rgba(82,80,243,0.09)", border: "1px solid rgba(82,80,243,0.22)",
                      borderRadius: "100px", padding: "5px 13px",
                      fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                      fontSize: "11px", fontWeight: 700, color: TEXT.accent,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: TEXT.accent, display: "inline-block" }} />
                      {project.industry}
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "100px", padding: "5px 13px",
                      fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                      fontSize: "11px", fontWeight: 600, color: TEXT.secondary,
                      letterSpacing: "0.06em",
                    }}>
                      2024 – 2025
                    </span>
                  </motion.div>

                  {/* Close button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ ...SP.snap, delay: 0.08 }}
                    whileHover={{ scale: 1.12, rotate: 90, backgroundColor: "rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.06)",
                      border: "1px solid rgba(0,0,0,0.09)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px", color: TEXT.primary, flexShrink: 0,
                      fontFamily: "system-ui",
                    }}
                  >
                    ×
                  </motion.button>
                </div>

                {/* Project title */}
                <motion.h2
                  initial={{ x: 90, y: -18, skewX: -10, opacity: 0 }}
                  animate={{ x: 0, y: 0, skewX: 0, opacity: 1 }}
                  exit={{ x: 70, opacity: 0 }}
                  transition={{ ...SP.light, delay: 0.12 }}
                  style={{
                    fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                    fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800,
                    lineHeight: 1.15, letterSpacing: "-0.025em",
                    color: TEXT.primary, margin: "0 0 10px",
                  }}
                >
                  {project.name}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ x: -40, y: 40, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: 1 }}
                  exit={{ x: -28, opacity: 0 }}
                  transition={{ ...SP.light, delay: 0.19 }}
                  style={{
                    fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                    fontSize: "15px", lineHeight: 1.7,
                    color: TEXT.secondary, margin: "0 0 28px",
                    maxWidth: "680px",
                  }}
                >
                  {project.description}
                </motion.p>
              </div>

              {/* ── HERO DESKTOP MOCKUP ── */}
              <motion.div
                initial={{ x: 50, y: -50, opacity: 0, scale: 0.82, rotate: 2 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                exit={{ x: 40, y: -30, opacity: 0 }}
                transition={{ ...SP.heavy, delay: 0.06 }}
                style={{ padding: "0 36px 28px" }}
              >
                <DesktopMockup thumbnail={project.thumbnail} />
              </motion.div>

              {/* ── KPI STATS ROW ── */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 28, opacity: 0 }}
                transition={{ ...SP.med, delay: 0.22 }}
                style={{
                  margin: "0 36px 28px",
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(project.metrics.length, 4)}, 1fr)`,
                  gap: "12px",
                }}
              >
                {project.metrics.map((m, i) => {
                  const origins = [
                    { x: -44, y: -30 },
                    { x: 44, y: -28 },
                    { x: -44, y: 30 },
                    { x: 44, y: 32 },
                  ];
                  const o = origins[i % 4];
                  return (
                    <motion.div
                      key={i}
                      initial={{ x: o.x, y: o.y, opacity: 0, scale: 0.78 }}
                      animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      exit={{ x: o.x * 0.5, opacity: 0 }}
                      transition={{ ...SP.med, delay: 0.27 + i * 0.06 }}
                      style={{
                        background: "rgba(82,80,243,0.06)",
                        borderRadius: "16px",
                        padding: "18px 20px",
                        border: "1px solid rgba(82,80,243,0.14)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{
                        fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                        fontSize: "clamp(22px,2.8vw,28px)", fontWeight: 800,
                        color: TEXT.accent, lineHeight: 1.1, marginBottom: "5px",
                      }}>
                        {m.value}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                        fontSize: "12px", color: TEXT.secondary, fontWeight: 500,
                      }}>
                        {m.label}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* ── DETAILS + PHONE ROW ── */}
              <div style={{
                margin: "0 36px 32px",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "28px",
                alignItems: "start",
              }}>
                {/* Left: project details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* About section */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -35, opacity: 0 }}
                    transition={{ ...SP.light, delay: 0.30 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <div style={{ width: 20, height: 2, background: TEXT.accent, borderRadius: 2 }} />
                      <span style={{
                        fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                        fontSize: "11px", fontWeight: 700, color: TEXT.accent,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>Về Dự Án</span>
                    </div>
                    <p style={{
                      fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                      fontSize: "14px", lineHeight: 1.75, color: TEXT.secondary, margin: 0,
                    }}>
                      Dự án được thiết kế và phát triển để tối ưu hóa trải nghiệm người dùng, tăng tỷ lệ chuyển đổi và xây dựng thương hiệu số bền vững. Chúng tôi áp dụng quy trình thiết kế dựa trên dữ liệu với A/B testing liên tục trong suốt quá trình triển khai.
                    </p>
                  </motion.div>

                  {/* Tech stack */}
                  <motion.div
                    initial={{ x: -45, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -30, opacity: 0 }}
                    transition={{ ...SP.snap, delay: 0.36 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ width: 20, height: 2, background: TEXT.accent, borderRadius: 2 }} />
                      <span style={{
                        fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                        fontSize: "11px", fontWeight: 700, color: TEXT.accent,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>Công Nghệ</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {project.tech.map((t, i) => (
                        <motion.span
                          key={i}
                          initial={{ x: -30, opacity: 0, scale: 0.8 }}
                          animate={{ x: 0, opacity: 1, scale: 1 }}
                          transition={{ ...SP.snap, delay: 0.38 + i * 0.04 }}
                          style={{
                            fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                            fontSize: "12px", fontWeight: 600, color: TEXT.primary,
                            background: "rgba(0,0,0,0.05)", borderRadius: "8px",
                            padding: "5px 11px", border: "1px solid rgba(0,0,0,0.08)",
                          }}
                        >
                          {t}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Process highlights */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -35, opacity: 0 }}
                    transition={{ ...SP.light, delay: 0.33 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                      <div style={{ width: 20, height: 2, background: TEXT.accent, borderRadius: 2 }} />
                      <span style={{
                        fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                        fontSize: "11px", fontWeight: 700, color: TEXT.accent,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>Quy Trình</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {[
                        { step: "01", label: "Nghiên cứu & Phân tích", desc: "User research, competitive analysis" },
                        { step: "02", label: "Thiết kế UI/UX", desc: "Wireframe, prototype, design system" },
                        { step: "03", label: "Phát triển", desc: "Frontend, backend, API integration" },
                        { step: "04", label: "Launch & Tối ưu", desc: "A/B testing, performance tuning" },
                      ].map((s, i) => (
                        <div key={i} style={{
                          background: "rgba(0,0,0,0.025)", borderRadius: "12px",
                          padding: "12px 14px", border: "1px solid rgba(0,0,0,0.06)",
                        }}>
                          <span style={{
                            fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                            fontSize: "10px", fontWeight: 700, color: TEXT.accent,
                            letterSpacing: "0.08em",
                          }}>{s.step}</span>
                          <p style={{
                            fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                            fontSize: "12px", fontWeight: 700, color: TEXT.primary,
                            margin: "3px 0 2px",
                          }}>{s.label}</p>
                          <p style={{
                            fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                            fontSize: "11px", color: TEXT.secondary, margin: 0,
                          }}>{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* CTA buttons */}
                  <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.86 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 36, opacity: 0 }}
                    transition={{ ...SP.med, delay: 0.50 }}
                    style={{ display: "flex", gap: "10px", paddingTop: "4px" }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                      style={{
                        background: "linear-gradient(135deg, #5250f3, #7c6af0)",
                        color: TEXT.white, border: "none", borderRadius: "100px",
                        padding: "13px 26px", cursor: "pointer",
                        fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                        fontSize: "13px", fontWeight: 700, letterSpacing: "0.02em",
                        boxShadow: "0 6px 24px rgba(82,80,243,0.36)",
                      }}
                    >
                      Xem Case Study →
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                      onClick={onClose}
                      style={{
                        background: "rgba(0,0,0,0.05)", color: TEXT.primary,
                        border: "1px solid rgba(0,0,0,0.1)", borderRadius: "100px",
                        padding: "13px 26px", cursor: "pointer",
                        fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                        fontSize: "13px", fontWeight: 600,
                      }}
                    >
                      Đóng
                    </motion.button>
                  </motion.div>
                </div>

                {/* Right: phone mockup + floating chips */}
                <motion.div
                  initial={{ x: 60, y: 40, opacity: 0, rotate: -30, scale: 0.65 }}
                  animate={{ x: 0, y: 0, opacity: 1, rotate: -12, scale: 1 }}
                  exit={{ x: 50, y: 30, opacity: 0, rotate: -20 }}
                  transition={{ type: "spring", mass: 1.3, stiffness: 175, damping: 24, delay: 0.18 }}
                  style={{ position: "relative", paddingTop: "16px" }}
                >
                  <PhoneMockup thumbnail={project.thumbnail} />

                  {/* Floating metric chip #1 */}
                  <motion.div
                    initial={{ x: 40, y: -30, opacity: 0, scale: 0.7 }}
                    animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    exit={{ x: 28, opacity: 0 }}
                    transition={{ ...SP.snap, delay: 0.42 }}
                    style={{ position: "absolute", top: "0px", left: "-90px" }}
                  >
                    <motion.div
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        background: "rgba(255,255,255,0.98)", backdropFilter: "blur(12px)",
                        borderRadius: "100px", padding: "7px 14px",
                        border: "1px solid rgba(82,80,243,0.22)",
                        boxShadow: "0 6px 22px rgba(82,80,243,0.18)",
                        display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>✦</span>
                      <span style={{
                        fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                        fontSize: "12px", fontWeight: 700, color: TEXT.accent,
                      }}>
                        {project.metrics[0]?.value} {project.metrics[0]?.label}
                      </span>
                    </motion.div>
                  </motion.div>

                  {/* Floating metric chip #2 */}
                  {project.metrics[1] && (
                    <motion.div
                      initial={{ x: -40, y: 40, opacity: 0, scale: 0.7 }}
                      animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      exit={{ x: -28, opacity: 0 }}
                      transition={{ ...SP.snap, delay: 0.46 }}
                      style={{ position: "absolute", bottom: "60px", left: "-80px" }}
                    >
                      <motion.div
                        animate={{ y: [0, 7, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        style={{
                          background: "rgba(255,255,255,0.98)", backdropFilter: "blur(12px)",
                          borderRadius: "100px", padding: "7px 14px",
                          border: "1px solid rgba(22,163,74,0.25)",
                          boxShadow: "0 6px 22px rgba(22,163,74,0.14)",
                          display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ fontSize: "12px" }}>📈</span>
                        <span style={{
                          fontFamily: "var(--font-sans,'Instrument Sans',system-ui,sans-serif)",
                          fontSize: "12px", fontWeight: 700, color: "#16a34a",
                        }}>
                          {project.metrics[1].value} {project.metrics[1].label}
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
