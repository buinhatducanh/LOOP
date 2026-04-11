"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight, ChevronLeft, Globe, Code2, BarChart3, TrendingUp,
  Users, Star, Rocket, Shield, Zap, ArrowRight, Check,
  Sparkles, Target, Award, Heart, Play, Zap as Lightning,
  Camera, Megaphone, BookOpen, Building2, Layers,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";

type SlideProps = { direction: number };

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function SlideWrapper({ children, direction }: { children: React.ReactNode; direction: number }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-y-auto"
      initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction > 0 ? "-100%" : "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 30 }}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100%",
        paddingBottom: "env(safe-area-inset-bottom, 80px)",
      }}
    >
      {children}
    </motion.div>
  );
}

function StarField() {
  const stars = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: (i * 13) % 100,
    y: (i * 17) % 100,
    size: (i % 4) + 0.5,
    delay: (i % 10) * 0.3,
    opacity: 0.3 + (i % 5) * 0.12,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, background: "#FFF" }}
          animate={{ opacity: [s.opacity, s.opacity * 0.25, s.opacity] }}
          transition={{ duration: 2.5 + (s.id % 4), repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// SLIDE 1 — Welcome / Introduction
// ──────────────────────────────────────────────
function SlideWelcome({ direction }: SlideProps) {
  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full text-center px-6">

        {/* Decorative top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            width: "min(280px, 55vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.pink}, ${DS.blue}, transparent)`,
            boxShadow: `0 0 14px ${hexRgba(DS.pink, 0.6)}`,
            marginBottom: 32,
          }}
        />

        {/* Logo Container */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 14 }}
          className="mb-8"
          style={{ position: "relative" }}
        >
          {/* Glow ring pulsing behind */}
          <motion.div
            className="absolute rounded-full"
            style={{
              inset: "-12%",
              background: `radial-gradient(circle, ${hexRgba(DS.pink, 0.15)} 0%, rgba(107,61,245,0.2) 40%, rgba(79,125,243,0.08) 65%, transparent 80%)`,
              filter: "blur(40px)",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Orbiting glow rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full"
              style={{
                inset: -8 * ring,
                border: `1px solid ${hexRgba(DS.pink, 0.2 - ring * 0.05)}`,
              }}
              animate={{ rotate: ring % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 10 + ring * 4, repeat: Infinity, ease: "linear" }}
            />
          ))}

          {/* Logo image */}
          <img
            src="/assets/design-company/logo-cosmic-infinity.png"
            alt="LOOP Solutions"
            aria-hidden="true"
            data-nosnippet
            style={{
              width: "min(85vw, 380px)",
              position: "relative",
              zIndex: 2,
              borderRadius: 12,
            }}
          />
        </motion.div>

        {/* Tagline badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-6 px-5 py-2 rounded-2xl inline-flex items-center gap-2"
          style={{
            background: hexRgba(DS.pink, 0.08),
            border: `1px solid ${hexRgba(DS.pink, 0.25)}`,
          }}
        >
          <Zap size={12} style={{ color: DS.pink }} />
          <span style={{ color: DS.pink, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>
            CHUYỂN ĐỔI SỐ TOÀN DIỆN
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{
            fontFamily: DS.heading,
            fontSize: "clamp(26px, 5vw, 52px)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, #818CF8 40%, ${DS.pink} 70%, #3B82F6 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            LOOP SOLUTIONS
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ color: DS.text3, fontSize: "clamp(15px, 2.2vw, 19px)", lineHeight: 1.9, maxWidth: 680, margin: "0 auto 20px" }}
        >
          Công ty chuyển đổi số hoàn toàn cho doanh nghiệp Việt Nam.
          <br />
          Từ phần mềm, website, app di động, media, marketing
          <br />
          đến hệ thống quản trị nội bộ — tất cả trong một hệ sinh thái.
        </motion.p>

        {/* Service quick-tags */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap justify-center gap-2 mt-2 max-w-xl"
        >
          {[
            { label: "Website", color: DS.blue },
            { label: "App / SaaS", color: DS.purple },
            { label: "Media", color: DS.pink },
            { label: "Marketing", color: DS.green },
            { label: "Phần mềm quản trị", color: DS.amber },
            { label: "Học viện", color: DS.cyan },
          ].map((t) => (
            <span key={t.label} style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontFamily: DS.mono,
              color: t.color,
              background: hexRgba(t.color, 0.1),
              border: `1px solid ${hexRgba(t.color, 0.25)}`,
            }}>
              {t.label}
            </span>
          ))}
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

// ──────────────────────────────────────────────
// SLIDE 2 — About Us (6 service areas)
// ──────────────────────────────────────────────
function SlideAbout({ direction }: SlideProps) {
  const services = [
    { icon: <Globe size={20} />,   title: "Website",       desc: "Landing page, web doanh nghiệp, thương mại điện tử", color: DS.blue },
    { icon: <Code2 size={20} />,   title: "App & SaaS",    desc: "Mobile app, web app, hệ thống nội bộ",             color: DS.purple },
    { icon: <Camera size={20} />,  title: "Quay dựng Media", desc: "Video quảng cáo, TVC, nội dung sáng tạo",          color: DS.pink },
    { icon: <Megaphone size={20} />, title: "Social Marketing", desc: "Content, chạy quảng cáo, tăng trưởng follow",   color: DS.green },
    { icon: <Building2 size={20} />, title: "Quản trị hệ thống", desc: "ERP, CRM, phần mềm vận hành doanh nghiệp",    color: DS.amber },
    { icon: <BookOpen size={20} />, title: "Học viện LOOP", desc: "Khoá học kỹ năng cho nhân sự & khách hàng",       color: DS.cyan },
  ];

  const pillars = [
    { icon: <Shield size={16} />, title: "Uy tín", desc: "120+ dự án thành công", color: DS.blue },
    { icon: <Zap size={16} />, title: "Tốc độ", desc: "Triển khai nhanh, đúng hạn", color: DS.amber },
    { icon: <Heart size={16} />, title: "Tận tâm", desc: "Hỗ trợ đồng hành 24/7", color: DS.red },
    { icon: <Target size={16} />, title: "Chất lượng", desc: "Chuẩn enterprise", color: DS.purple },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-10">

        {/* Top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{
            width: "min(280px, 60vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.pink}, ${DS.blue}, ${DS.purple}, transparent)`,
            boxShadow: `0 0 16px ${hexRgba(DS.pink, 0.6)}, 0 0 32px ${hexRgba(DS.pink, 0.3)}`,
            marginBottom: 20,
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.pink, 0.08), border: `1px solid ${hexRgba(DS.pink, 0.2)}` }}>
            <Sparkles size={11} style={{ color: DS.pink }} />
            <span style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>6 LĨNH VỰC</span>
          </div>

          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(20px, 4vw, 36px)", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 8 }}>
            <span style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 55%, ${DS.pinkLight} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              DỊCH VỤ TOÀN DIỆN
            </span>
          </h2>

          <p style={{ color: DS.text3, fontSize: "clamp(12px, 1.6vw, 15px)", lineHeight: 1.8, maxWidth: 660, margin: "0 auto" }}>
            Một đối tác — giải pháp số cho <span style={{ color: DS.pink, fontWeight: 700 }}>toàn bộ hành trình chuyển đổi</span> của doanh nghiệp.
          </p>
        </motion.div>

        {/* 6 service cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl w-full mb-5">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              className="rounded-2xl p-3 text-center cursor-default relative"
              style={{
                background: `linear-gradient(145deg, ${hexRgba(s.color, 0.06)}, ${hexRgba(s.color, 0.02)})`,
                border: `1px solid ${hexRgba(s.color, 0.2)}`,
                boxShadow: `0 4px 20px ${hexRgba(s.color, 0.07)}`,
              }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 200 }}
            >
              {/* Top accent line */}
              <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
                background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
                borderRadius: 1,
              }} />
              <div className="w-10 h-10 rounded-2xl mx-auto mb-2 flex items-center justify-center relative"
                style={{ background: hexRgba(s.color, 0.12), color: s.color, boxShadow: `0 0 18px ${hexRgba(s.color, 0.25)}` }}>
                {s.icon}
              </div>
              <div style={{ color: DS.text, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{s.title}</div>
              <div style={{ color: DS.text4, fontSize: 9, lineHeight: 1.5 }}>{s.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Pillars + Stats */}
        <div className="flex flex-wrap justify-center gap-2 max-w-3xl w-full mb-4">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              className="rounded-xl px-3 py-2 text-center"
              style={{
                background: hexRgba(p.color, 0.07),
                border: `1px solid ${hexRgba(p.color, 0.2)}`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + i * 0.08 }}
            >
              <div style={{ color: p.color, fontSize: 9, fontFamily: DS.mono, fontWeight: 700 }}>{p.title}</div>
              <div style={{ color: DS.text5, fontSize: 8, marginTop: 2 }}>{p.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-6 flex-wrap"
        >
          {[
            { value: "120+", label: "Dự án", color: DS.blue },
            { value: "6",    label: "Lĩnh vực", color: DS.pink },
            { value: "24/7", label: "Hỗ trợ", color: DS.green },
            { value: "380%", label: "Tăng trưởng", color: DS.amber },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div style={{ color: s.color, fontSize: "clamp(16px, 2.5vw, 24px)", fontWeight: 900, fontFamily: DS.mono, lineHeight: 1, textShadow: `0 0 20px ${hexRgba(s.color, 0.5)}` }}>{s.value}</div>
              <div style={{ color: DS.text5, fontSize: 8, marginTop: 3, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

// ──────────────────────────────────────────────
// SLIDE 3 — Services Detail
// ──────────────────────────────────────────────
function SlideServices({ direction }: SlideProps) {
  const services = [
    {
      icon: <Globe size={22} />,
      title: "Website",
      desc: "Landing page, web doanh nghiệp, e-commerce, báo giá 8 bước minh bạch.",
      color: DS.blue,
      badge: "12 gói ngành",
      highlight: "Chuyển đổi Lead",
    },
    {
      icon: <Code2 size={22} />,
      title: "App & SaaS",
      desc: "Mobile app, web app, hệ thống nội bộ, dashboard theo dõi realtime.",
      color: DS.purple,
      badge: "Full-stack",
      highlight: "Tốc độ ×3",
    },
    {
      icon: <Camera size={22} />,
      title: "Quay dựng Media",
      desc: "Video quảng cáo, TVC, animation, sản phẩm, sự kiện doanh nghiệp.",
      color: DS.pink,
      badge: "Video & Animation",
      highlight: "Production chuyên nghiệp",
    },
    {
      icon: <Megaphone size={22} />,
      title: "Social Marketing",
      desc: "Content strategy, chạy quảng cáo đa nền tảng, tăng trưởng bền vững.",
      color: DS.green,
      badge: "Multi-platform",
      highlight: "ROI đo lường được",
    },
    {
      icon: <Building2 size={22} />,
      title: "Phần mềm quản trị",
      desc: "ERP, CRM, hệ thống vận hành, workflow tự động hoá — giải pháp enterprise.",
      color: DS.amber,
      badge: "Enterprise ERP",
      highlight: "Tự động hoá 80%",
    },
    {
      icon: <BookOpen size={22} />,
      title: "Học viện LOOP",
      desc: "Khoá học kỹ năng cho nhân sự nội bộ & khách hàng. Video gate, certificate.",
      color: DS.cyan,
      badge: "7 khoá học",
      highlight: "Certificate khi hoàn thành",
    },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-10">

        {/* Top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          style={{
            width: "min(260px, 55vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.pink}, ${DS.purple}, transparent)`,
            boxShadow: `0 0 12px ${hexRgba(DS.pink, 0.5)}`,
            marginBottom: 24,
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.pink, 0.08), border: `1px solid ${hexRgba(DS.pink, 0.2)}` }}>
            <Lightning size={12} style={{ color: DS.pink }} />
            <span style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>6 LĨNH VỰC CHÍNH</span>
          </div>

          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(22px, 4vw, 42px)", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 8 }}>
            <span style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 50%, ${DS.pinkLight} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              TẤT CẢ NHỮNG GÌ BẠN CẦN
            </span>
          </h2>

          <p style={{ color: DS.text4, fontSize: "clamp(12px, 1.5vw, 15px)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
            Từ thiết kế đến triển khai — mọi thứ doanh nghiệp cần để chuyển đổi số toàn diện.
          </p>
        </motion.div>

        {/* Service cards — 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl w-full">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${hexRgba(s.color, 0.06)}, ${hexRgba(s.color, 0.02)})`,
                border: `1px solid ${hexRgba(s.color, 0.18)}`,
                boxShadow: `0 4px 20px ${hexRgba(s.color, 0.07)}`,
              }}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              whileHover={{
                borderColor: hexRgba(s.color, 0.45),
                boxShadow: `0 0 0 1px ${hexRgba(s.color, 0.28)} inset, 0 8px 28px ${hexRgba(s.color, 0.14)}`,
              }}
              transition={{ delay: 0.25 + i * 0.08, type: "spring", stiffness: 180 }}
            >
              {/* Radial glow top-right */}
              <div style={{
                position: "absolute", top: 0, right: 0, width: 70, height: 70,
                background: `radial-gradient(circle, ${hexRgba(s.color, 0.1)}, transparent 70%)`,
                pointerEvents: "none",
              }} />
              {/* Top accent line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
              }} />

              <div className="flex items-start gap-3 relative">
                <div style={{
                  background: hexRgba(s.color, 0.12), color: s.color,
                  boxShadow: `0 0 16px ${hexRgba(s.color, 0.28)}`,
                  width: 46, height: 46, borderRadius: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{s.title}</span>
                    <span style={{
                      color: s.color, fontSize: 9, fontFamily: DS.mono,
                      background: hexRgba(s.color, 0.1),
                      padding: "2px 7px", borderRadius: 6, border: `1px solid ${hexRgba(s.color, 0.22)}`,
                    }}>
                      {s.badge}
                    </span>
                  </div>
                  <p style={{ color: DS.text4, fontSize: 11, lineHeight: 1.65 }}>{s.desc}</p>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    marginTop: 6, color: s.color, fontSize: 9,
                    fontFamily: DS.mono, fontWeight: 600,
                  }}>
                    <Star size={9} fill={s.color} />
                    {s.highlight}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

// ──────────────────────────────────────────────
// SLIDE 4 — Growth / Why LOOP
// ──────────────────────────────────────────────
function SlideGrowth({ direction }: SlideProps) {
  const stats = [
    { value: "120+", label: "Dự án hoàn thành", color: DS.blue, icon: <Star size={16} /> },
    { value: "98%", label: "Khách hàng hài lòng", color: DS.pink, icon: <Heart size={16} /> },
    { value: "50+", label: "Đối tác tin cậy", color: DS.purple, icon: <Users size={16} /> },
    { value: "380%", label: "Tăng trưởng 2025", color: DS.amber, icon: <TrendingUp size={16} /> },
  ];

  const reasons = [
    { text: "Đội ngũ gần 20 nhân sự, rank từ Iron → Diamond", color: DS.purple },
    { text: "Hệ thống LP điểm thưởng nội bộ", color: DS.amber },
    { text: "Kích hoạt website trong 2 giờ", color: DS.green },
    { text: "Hỗ trợ kỹ thuật 24/7", color: DS.pink },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-10">

        {/* Top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          style={{
            width: "min(260px, 55vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.green}, ${DS.pink}, transparent)`,
            boxShadow: `0 0 12px ${hexRgba(DS.green, 0.5)}`,
            marginBottom: 24,
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.green, 0.08), border: `1px solid ${hexRgba(DS.green, 0.2)}` }}>
            <TrendingUp size={12} style={{ color: DS.green }} />
            <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>SỐ LIỆU TĂNG TRƯỞNG</span>
          </div>

          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(22px, 4vw, 42px)", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 8 }}>
            <span style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.green} 50%, ${DS.cyan} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              TẠI SAO CHỌN LOOP?
            </span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl w-full mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="rounded-2xl p-4 text-center"
              style={{
                background: `linear-gradient(145deg, ${hexRgba(s.color, 0.07)}, ${hexRgba(s.color, 0.02)})`,
                border: `1px solid ${hexRgba(s.color, 0.2)}`,
                boxShadow: `0 0 0 1px ${hexRgba(s.color, 0.05)} inset, 0 4px 20px ${hexRgba(s.color, 0.07)}`,
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, borderColor: hexRgba(s.color, 0.5) }}
              transition={{ delay: 0.25 + i * 0.08, type: "spring", stiffness: 200 }}
            >
              <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              <div style={{ color: s.color, marginBottom: 5, display: "flex", justifyContent: "center" }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 900, fontFamily: DS.mono, lineHeight: 1, textShadow: `0 0 20px ${hexRgba(s.color, 0.45)}` }}>{s.value}</div>
              <div style={{ color: DS.text4, fontSize: 10, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Reasons card */}
        <motion.div
          className="rounded-2xl p-5 max-w-2xl w-full"
          style={{
            background: `linear-gradient(145deg, ${hexRgba(DS.pink, 0.05)}, ${hexRgba(DS.purple, 0.03)})`,
            border: `1px solid ${hexRgba(DS.pink, 0.14)}`,
            boxShadow: `0 4px 24px ${hexRgba(DS.pink, 0.07)}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div style={{ color: DS.pink, fontSize: 11, fontFamily: DS.mono, marginBottom: 10, letterSpacing: "0.1em" }}>
            ✨ LÝ DO ĐỒNG HÀNH CÙNG LOOP
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reasons.map((r, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: hexRgba(r.color, 0.14), color: r.color, boxShadow: `0 0 8px ${hexRgba(r.color, 0.28)}` }}>
                  <Check size={10} />
                </div>
                <span style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6 }}>{r.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

// ──────────────────────────────────────────────
// SLIDE 5 — VIP Tiers (Customer Loyalty)
// ──────────────────────────────────────────────
function SlideVip({ direction }: SlideProps) {
  const vipTiers = [
    {
      name: "Khách hàng",
      label: "REGULAR",
      emoji: "👤",
      color: "#94A3B8",
      spending: "0 VNĐ",
      discount: "10%",
      lpRate: "1,000 LP = 500K",
      benefits: ["Tích điểm LP khi mua dịch vụ", "Đổi thưởng nội bộ", "Giảm giá tối đa 10%"],
      highlight: false,
    },
    {
      name: "VIP 1",
      label: "VIP 1",
      emoji: "🌟",
      color: "#3B82F6",
      spending: "10 triệu",
      discount: "15%",
      lpRate: "1,000 LP = 550K",
      benefits: ["Tất cả quyền lợi Regular", "Hỗ trợ ưu tiên", "Giảm giá tối đa 15%"],
      highlight: false,
    },
    {
      name: "VIP 2",
      label: "VIP 2",
      emoji: "💎",
      color: "#A855F7",
      spending: "50 triệu",
      discount: "20%",
      lpRate: "1,000 LP = 600K",
      benefits: ["Tất cả quyền lợi VIP 1", "Priority Support", "Truy cập dịch vụ độc quyền"],
      highlight: true,
    },
    {
      name: "VIP 3",
      label: "VIP 3",
      emoji: "👑",
      color: "#E6C75F",
      spending: "100 triệu",
      discount: "25%",
      lpRate: "1,000 LP = 750K",
      benefits: ["Tất cả quyền lợi VIP 2", "VIP Desk chuyên biệt", "Early access dịch vụ mới"],
      highlight: true,
    },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6 py-8 overflow-y-auto">

        {/* Top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          style={{
            width: "min(240px, 55vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.amber}, ${DS.pink}, transparent)`,
            boxShadow: `0 0 12px ${hexRgba(DS.amber, 0.5)}`,
            marginBottom: 20,
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.amber, 0.08), border: `1px solid ${hexRgba(DS.amber, 0.2)}` }}>
            <Award size={12} style={{ color: DS.amber }} />
            <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>CHƯƠNG TRÌNH VIP</span>
          </div>

          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(18px, 4vw, 34px)", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 6 }}>
            <span style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.amber} 60%, ${DS.pink} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              CÀNG CHI TIÊU — CÀNG HƯỞNG
            </span>
          </h2>

          <p style={{ color: DS.text4, fontSize: 12, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            Mỗi giao dịch đều tích lũy. Lên VIP để hưởng tỷ lệ quy đổi LP tốt hơn và ưu đãi giảm giá cao hơn.
          </p>
        </motion.div>

        {/* VIP Tier Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-3xl w-full mb-4">
          {vipTiers.map((tier, i) => (
            <motion.div
              key={tier.label}
              className="rounded-2xl p-3 sm:p-4 text-center relative overflow-hidden"
              style={{
                background: tier.highlight
                  ? `linear-gradient(145deg, ${hexRgba(tier.color, 0.12)}, ${hexRgba(tier.color, 0.04)})`
                  : `linear-gradient(145deg, ${hexRgba(tier.color, 0.06)}, ${hexRgba(tier.color, 0.02)})`,
                border: tier.highlight
                  ? `1px solid ${hexRgba(tier.color, 0.55)}`
                  : `1px solid ${hexRgba(tier.color, 0.2)}`,
                boxShadow: tier.highlight
                  ? `0 0 24px ${hexRgba(tier.color, 0.2)}, 0 4px 16px rgba(0,0,0,0.25)`
                  : `0 4px 16px ${hexRgba(tier.color, 0.06)}`,
                minHeight: 140,
              }}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: tier.highlight ? 1.06 : 1.03, borderColor: hexRgba(tier.color, 0.7) }}
              transition={{ delay: 0.25 + i * 0.08, type: "spring", stiffness: 180 }}
            >
              {/* Glow top */}
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
                background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
              }} />
              {tier.highlight && (
                <div style={{
                  position: "absolute", top: 4, right: 4,
                  padding: "1px 5px", borderRadius: 4,
                  background: hexRgba(tier.color, 0.2),
                  color: tier.color, fontSize: 7, fontFamily: DS.mono, fontWeight: 700,
                }}>
                  ✦ ĐỀ XUẤT
                </div>
              )}
              <span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>{tier.emoji}</span>
              <div style={{ color: tier.color, fontSize: 9, fontWeight: 800, fontFamily: DS.mono, letterSpacing: "0.08em", marginBottom: 4 }}>{tier.label}</div>

              {/* Spending requirement */}
              <div style={{
                background: hexRgba(tier.color, 0.08),
                border: `1px solid ${hexRgba(tier.color, 0.15)}`,
                borderRadius: 6, padding: "3px 6px", marginBottom: 4,
              }}>
                <div style={{ color: DS.text5, fontSize: 7, fontFamily: DS.mono, marginBottom: 1 }}>TỔNG CHI TIÊU</div>
                <div style={{ color: tier.color, fontSize: 10, fontWeight: 700, fontFamily: DS.mono }}>{tier.spending}</div>
              </div>

              {/* Discount */}
              <div style={{ color: tier.color, fontSize: 13, fontWeight: 900, fontFamily: DS.mono, marginBottom: 1 }}>
                Giảm {tier.discount}
              </div>
              <div style={{ color: DS.text5, fontSize: 7, fontFamily: DS.mono }}>{tier.lpRate}</div>
            </motion.div>
          ))}
        </div>

        {/* Benefits breakdown */}
        <motion.div
          className="rounded-2xl p-4 max-w-2xl w-full"
          style={{
            background: `linear-gradient(145deg, ${hexRgba(DS.amber, 0.05)}, ${hexRgba(DS.pink, 0.03)})`,
            border: `1px solid ${hexRgba(DS.amber, 0.14)}`,
            boxShadow: `0 4px 24px ${hexRgba(DS.amber, 0.07)}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono, marginBottom: 10, letterSpacing: "0.1em" }}>
            ✦ QUYỀN LỢI VIP 3 — ĐỈNH CAO NHẤT
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "💰", text: "Giảm giá đến 25%", sub: "Khi dùng LP thanh toán" },
              { icon: "💎", text: "1,000 LP = 750K VNĐ", sub: "Tỷ lệ quy đổi tốt nhất" },
              { icon: "👑", text: "VIP Desk ưu tiên", sub: "Hỗ trợ riêng biệt 24/7" },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <span style={{ fontSize: 20 }}>{b.icon}</span>
                <div>
                  <div style={{ color: DS.text2, fontSize: 12, fontWeight: 700 }}>{b.text}</div>
                  <div style={{ color: DS.text4, fontSize: 10, marginTop: 2 }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

// ──────────────────────────────────────────────
// SLIDE 6 — Get Started (LP System)
// ──────────────────────────────────────────────
function SlideGetStarted({ direction, onComplete }: SlideProps & { onComplete: () => void }) {
  const ranks = [
    { name: "Sắt", emoji: "🪨", color: "#9CA3AF", lp: "0", level: "Lv.1" },
    { name: "Đồng", emoji: "🥉", color: "#CD7F32", lp: "500", level: "Lv.15" },
    { name: "Bạc", emoji: "🥈", color: "#C0C0C0", lp: "2K", level: "Lv.35" },
    { name: "Vàng", emoji: "🥇", color: "#FFD700", lp: "5K", level: "Lv.55" },
    { name: "Kim Cương", emoji: "💠", color: "#7DD3FC", lp: "50K", level: "Lv.115" },
  ];

  const quickActions = [
    { label: "Khám phá Dịch vụ", icon: <Globe size={18} />, color: DS.blue, desc: "6 lĩnh vực" },
    { label: "Nhận báo giá", icon: <Play size={18} />, color: DS.green, desc: "Miễn phí 3-5 ngày" },
    { label: "Xem Portfolio", icon: <Star size={18} />, color: DS.amber, desc: "120+ dự án" },
    { label: "Gặp đội ngũ", icon: <Users size={18} />, color: DS.purple, desc: "Gần 20 chuyên gia" },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6 py-8 overflow-y-auto">

        {/* Top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          style={{
            width: "min(240px, 55vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.amber}, ${DS.pink}, transparent)`,
            boxShadow: `0 0 12px ${hexRgba(DS.amber, 0.5)}`,
            marginBottom: 20,
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.pink, 0.08), border: `1px solid ${hexRgba(DS.pink, 0.2)}` }}>
            <Award size={12} style={{ color: DS.pink }} />
            <span style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>HỆ THỐNG LP & THĂNG HẠNG</span>
          </div>

          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(18px, 4vw, 36px)", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 6 }}>
            <span style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 60%, ${DS.pinkLight} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              TÍCH LŨY — THĂNG HẠNG — NHẬN THƯỞNG
            </span>
          </h2>

          <p style={{ color: DS.text4, fontSize: 12, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Mỗi giao dịch tích lũy điểm LP. Thăng hạng để nhận ưu đãi độc quyền dành riêng cho bạn.
          </p>
        </motion.div>

        {/* Rank cards */}
        <motion.div
          className="flex items-center justify-center gap-2 sm:gap-3 mb-6 flex-wrap max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {ranks.map((r, i) => (
            <motion.div
              key={r.name}
              className="flex flex-col items-center rounded-2xl px-3 py-3 relative"
              style={{
                background: `linear-gradient(145deg, ${hexRgba(r.color, 0.08)}, ${hexRgba(r.color, 0.02)})`,
                border: `1px solid ${hexRgba(r.color, 0.25)}`,
                boxShadow: `0 0 16px ${hexRgba(r.color, 0.12)}, 0 4px 16px rgba(0,0,0,0.2)`,
                minWidth: 60,
              }}
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: 1.08, borderColor: hexRgba(r.color, 0.6) }}
              transition={{ delay: 0.35 + i * 0.07, type: "spring", stiffness: 180 }}
            >
              {/* Glow top */}
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
                background: `linear-gradient(90deg, transparent, ${r.color}, transparent)`,
              }} />
              <span style={{ fontSize: 22 }}>{r.emoji}</span>
              <span style={{ color: r.color, fontSize: 9, fontWeight: 700, marginTop: 3, fontFamily: DS.mono }}>{r.name}</span>
              <span style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, marginTop: 2 }}>{r.lp} LP</span>
              <span style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, marginTop: 1 }}>{r.level}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {quickActions.map((a) => (
            <div key={a.label} className="rounded-2xl p-4 text-center"
              style={{
                background: `linear-gradient(145deg, ${hexRgba(a.color, 0.06)}, ${hexRgba(a.color, 0.02)})`,
                border: `1px solid ${hexRgba(a.color, 0.2)}`,
                boxShadow: `0 4px 16px ${hexRgba(a.color, 0.07)}`,
              }}>
              <div style={{ color: a.color, marginBottom: 5, display: "flex", justifyContent: "center" }}>{a.icon}</div>
              <div style={{ color: DS.text, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{a.label}</div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{a.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          className="flex items-center gap-3 px-10 py-4 rounded-2xl cursor-pointer"
          style={{
            background: GRD.primary,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            border: "none",
            boxShadow: `0 0 50px ${hexRgba(DS.pink, 0.45)}, 0 8px 32px rgba(0,0,0,0.3)`,
            letterSpacing: "0.03em",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.85, type: "spring", stiffness: 140 }}
          whileHover={{ boxShadow: `0 0 70px ${hexRgba(DS.pink, 0.6)}, 0 8px 32px rgba(0,0,0,0.3)` }}
          whileTap={{ scale: 0.97 }}
          onClick={onComplete}
        >
          <Rocket size={20} />
          BẮT ĐẦU KHÁM PHÁ
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </SlideWrapper>
  );
}

// ──────────────────────────────────────────────
// Root export
// ──────────────────────────────────────────────
const LABELS = ["Chào mừng", "Dịch vụ", "Chi tiết", "Tăng trưởng", "VIP Ưu đãi", "Bắt đầu"];

export function OnboardingClient({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const total = 6;

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= total || idx === current) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  const slides = [
    <SlideWelcome key="welcome" direction={direction} />,
    <SlideAbout key="about" direction={direction} />,
    <SlideServices key="services" direction={direction} />,
    <SlideGrowth key="growth" direction={direction} />,
    <SlideGetStarted key="start" direction={direction} onComplete={onComplete} />,
  ];

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" style={{ background: DS.bg }}>
      <StarField />

      {/* Background glow overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(circle at 20% 20%, rgba(79,125,243,0.10) 0%, transparent 45%), radial-gradient(circle at 80% 30%, rgba(107,61,245,0.10) 0%, transparent 45%), radial-gradient(circle at 50% 80%, rgba(110,177,168,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 70%, ${hexRgba(DS.pink, 0.08)} 0%, transparent 40%)`,
      }} />

      <div className="relative w-full h-full" style={{ zIndex: 1 }}>
        <AnimatePresence mode="sync">{slides[current]}</AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 md:px-10"
        style={{ zIndex: 10, background: "linear-gradient(to top, rgba(12,12,20,0.95), transparent)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-3">
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          <span style={{ color: DS.text4, fontSize: 12 }}>{LABELS[current]}</span>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {Array.from({ length: total }, (_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              animate={{ width: i === current ? 28 : 8, height: 8 }}
              style={{
                borderRadius: 4,
                border: "none",
                background: i === current ? DS.pink : hexRgba(DS.pink, 0.2),
                cursor: "pointer",
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {current > 0 && (
            <button
              onClick={prev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl cursor-pointer"
              style={{ background: hexRgba(DS.pink, 0.06), border: `1px solid ${hexRgba(DS.pink, 0.2)}`, color: DS.text3, fontSize: 13 }}
            >
              <ChevronLeft size={14} /> Quay lại
            </button>
          )}
          {current < total - 1 && (
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl cursor-pointer"
              style={{
                background: GRD.primary,
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: `0 0 20px ${hexRgba(DS.pink, 0.35)}`,
              }}
            >
              Tiếp tục <ChevronRight size={14} />
            </button>
          )}
          {current < total - 1 && (
            <button
              onClick={onComplete}
              className="cursor-pointer"
              style={{ background: "none", border: "none", color: DS.text5, fontSize: 11, fontFamily: DS.mono }}
            >
              Bỏ qua →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}