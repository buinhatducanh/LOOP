"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight, ChevronLeft, Globe, Code2, BarChart3, TrendingUp,
  Users, Star, Rocket, Shield, Zap, ArrowRight, Check,
  Sparkles, Target, Award, Heart, Play, Zap as Lightning,
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
      style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100%" }}
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
// SLIDE 1 — Welcome
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
              width: "min(75vw, 460px)",
              position: "relative",
              zIndex: 2,
              borderRadius: 16,
            }}
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{
            fontFamily: DS.heading,
            fontSize: "clamp(28px, 5vw, 56px)",
            fontWeight: 900,
            letterSpacing: "0.07em",
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
            CHÀO MỪNG ĐẾN VỚI
          </span>
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, #3B82F6, #818CF8 30%, ${DS.pink} 60%, #7DD3FC 80%, #E0E7FF)`,
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
          style={{ color: DS.text3, fontSize: "clamp(14px, 2vw, 18px)", lineHeight: 1.8, maxWidth: 620 }}
        >
          Hệ điều hành số cho Digital Agency — nơi công nghệ, thiết kế và tăng trưởng kết nối thành hệ sinh thái.
        </motion.p>
      </div>
    </SlideWrapper>
  );
}

// ──────────────────────────────────────────────
// SLIDE 2 — About Us
// ──────────────────────────────────────────────
function SlideAbout({ direction }: SlideProps) {
  const pillars = [
    { icon: <Shield size={20} />, title: "Uy tín", desc: "120+ dự án thành công", color: DS.blue },
    { icon: <Zap size={20} />, title: "Tốc độ", desc: "Triển khai nhanh, đúng hạn", color: DS.amber },
    { icon: <Heart size={20} />, title: "Tận tâm", desc: "Hỗ trợ đồng hành 24/7", color: DS.red },
    { icon: <Target size={20} />, title: "Chất lượng", desc: "Chuẩn enterprise", color: DS.purple },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">

        {/* Decorative top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{
            width: "min(300px, 60vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.pink}, ${DS.blue}, ${DS.purple}, transparent)`,
            boxShadow: `0 0 16px ${hexRgba(DS.pink, 0.6)}, 0 0 32px ${hexRgba(DS.pink, 0.3)}`,
            marginBottom: 28,
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.pink, 0.08), border: `1px solid ${hexRgba(DS.pink, 0.2)}` }}>
            <Sparkles size={12} style={{ color: DS.pink }} />
            <span style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>VỀ CHÚNG TÔI</span>
          </div>

          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(24px, 4vw, 46px)", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 14 }}>
            <span style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 55%, ${DS.pinkLight} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              GIỚI THIỆU
            </span>
            <br />
            <span style={{
              background: `linear-gradient(135deg, ${DS.blue} 0%, ${DS.purple} 40%, ${DS.pink} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              LOOP SOLUTIONS
            </span>
          </h2>

          <p style={{ color: DS.text3, fontSize: "clamp(14px, 1.6vw, 17px)", lineHeight: 1.9, maxWidth: 680, margin: "0 auto" }}>
            Đội ngũ gần 20 nhân sự với mục tiêu cung cấp <span style={{ color: DS.pink, fontWeight: 700 }}>toàn diện giải pháp chuyển đối số</span> cho doanh nghiệp Việt Nam.
          </p>
        </motion.div>

        {/* Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              className="rounded-2xl p-5 text-center cursor-default"
              style={{
                position: "relative",
                background: `linear-gradient(145deg, ${hexRgba(p.color, 0.06)}, ${hexRgba(p.color, 0.02)})`,
                border: `1px solid ${hexRgba(p.color, 0.2)}`,
                boxShadow: `0 0 0 1px ${hexRgba(p.color, 0.05)} inset, 0 4px 24px ${hexRgba(p.color, 0.08)}`,
              }}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{
                boxShadow: `0 0 0 1px ${hexRgba(p.color, 0.4)} inset, 0 8px 32px ${hexRgba(p.color, 0.2)}`,
                borderColor: hexRgba(p.color, 0.5),
              }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
            >
              {/* Glow top accent line */}
              <div style={{
                position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
                background: `linear-gradient(90deg, transparent, ${p.color}, transparent)`,
                borderRadius: 1,
              }} />
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center relative"
                style={{ background: hexRgba(p.color, 0.12), color: p.color, boxShadow: `0 0 20px ${hexRgba(p.color, 0.25)}` }}>
                {p.icon}
              </div>
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
              <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.6 }}>{p.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center gap-8 mt-8"
        >
          {[
            { value: "120+", label: "Dự án", color: DS.blue },
            { value: "5★", label: "Khách hàng", color: DS.pink },
            { value: "24/7", label: "Hỗ trợ", color: DS.green },
            { value: "380%", label: "Tăng trưởng", color: DS.amber },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div style={{ color: s.color, fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 900, fontFamily: DS.mono, lineHeight: 1, textShadow: `0 0 20px ${hexRgba(s.color, 0.5)}` }}>{s.value}</div>
              <div style={{ color: DS.text5, fontSize: 10, marginTop: 4, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

// ──────────────────────────────────────────────
// SLIDE 3 — Services
// ──────────────────────────────────────────────
function SlideServices({ direction }: SlideProps) {
  const services = [
    {
      icon: <Globe size={22} />,
      title: "Thiết kế Website",
      desc: "Landing page, web doanh nghiệp, e-commerce",
      color: DS.blue,
      badge: "12 gói ngành",
      highlight: "Chuyển đổi Lead",
    },
    {
      icon: <Code2 size={22} />,
      title: "Phát triển App & SaaS",
      desc: "Mobile app, web app, hệ thống nội bộ",
      color: DS.purple,
      badge: "Full-stack",
      highlight: "Tốc độ ×3",
    },
    {
      icon: <BarChart3 size={22} />,
      title: "Dashboard & Analytics",
      desc: "Realtime dashboard, báo cáo dữ liệu",
      color: DS.pink,
      badge: "Realtime",
      highlight: "Insights thông minh",
    },
    {
      icon: <TrendingUp size={22} />,
      title: "SEO & Marketing",
      desc: "Lên top Google, growth bền vững",
      color: DS.green,
      badge: "ROI cao",
      highlight: "Tăng trưởng bền vững",
    },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">

        {/* Top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          style={{
            width: "min(260px, 55vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.pink}, ${DS.purple}, transparent)`,
            boxShadow: `0 0 12px ${hexRgba(DS.pink, 0.5)}`,
            marginBottom: 28,
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.pink, 0.08), border: `1px solid ${hexRgba(DS.pink, 0.2)}` }}>
            <Lightning size={12} style={{ color: DS.pink }} />
            <span style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>DỊCH VỤ CHÍNH</span>
          </div>

          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(24px, 4vw, 44px)", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 10 }}>
            <span style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 50%, ${DS.pinkLight} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              GIẢI PHÁP TOÀN DIỆN
            </span>
          </h2>

          <p style={{ color: DS.text4, fontSize: "clamp(13px, 1.5vw, 15px)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
            Từ thiết kế đến triển khai — mọi thứ doanh nghiệp cần để chuyển đổi số.
          </p>
        </motion.div>

        {/* Service cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${hexRgba(s.color, 0.06)}, ${hexRgba(s.color, 0.02)})`,
                border: `1px solid ${hexRgba(s.color, 0.2)}`,
                boxShadow: `0 4px 24px ${hexRgba(s.color, 0.08)}`,
              }}
              initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              whileHover={{
                borderColor: hexRgba(s.color, 0.5),
                boxShadow: `0 0 0 1px ${hexRgba(s.color, 0.3)} inset, 0 8px 32px ${hexRgba(s.color, 0.15)}`,
              }}
              transition={{ delay: 0.25 + i * 0.1, type: "spring", stiffness: 180 }}
            >
              {/* Radial glow top-right */}
              <div style={{
                position: "absolute", top: 0, right: 0, width: 80, height: 80,
                background: `radial-gradient(circle, ${hexRgba(s.color, 0.12)}, transparent 70%)`,
                pointerEvents: "none",
              }} />
              {/* Top accent line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
              }} />

              <div className="flex items-start gap-4 relative">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: hexRgba(s.color, 0.12), color: s.color, boxShadow: `0 0 18px ${hexRgba(s.color, 0.3)}`, width: 52, height: 52 }}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{s.title}</span>
                    <span style={{
                      color: s.color, fontSize: 9, fontFamily: DS.mono,
                      background: hexRgba(s.color, 0.1),
                      padding: "2px 8px", borderRadius: 6, border: `1px solid ${hexRgba(s.color, 0.25)}`,
                    }}>
                      {s.badge}
                    </span>
                  </div>
                  <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.7 }}>{s.desc}</p>
                  {/* Highlight tag */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    marginTop: 8, color: s.color, fontSize: 10,
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
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">

        {/* Top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          style={{
            width: "min(260px, 55vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.green}, ${DS.pink}, transparent)`,
            boxShadow: `0 0 12px ${hexRgba(DS.green, 0.5)}`,
            marginBottom: 28,
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.green, 0.08), border: `1px solid ${hexRgba(DS.green, 0.2)}` }}>
            <TrendingUp size={12} style={{ color: DS.green }} />
            <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>SỐ LIỆU TĂNG TRƯỞNG</span>
          </div>

          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(24px, 4vw, 44px)", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 10 }}>
            <span style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.green} 50%, ${DS.cyan} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              TẠI SAO CHỌN LOOP?
            </span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="rounded-2xl p-4 text-center"
              style={{
                background: `linear-gradient(145deg, ${hexRgba(s.color, 0.07)}, ${hexRgba(s.color, 0.02)})`,
                border: `1px solid ${hexRgba(s.color, 0.2)}`,
                boxShadow: `0 0 0 1px ${hexRgba(s.color, 0.06)} inset, 0 4px 20px ${hexRgba(s.color, 0.08)}`,
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, borderColor: hexRgba(s.color, 0.5) }}
              transition={{ delay: 0.25 + i * 0.08, type: "spring", stiffness: 200 }}
            >
              {/* Top glow line */}
              <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
                background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`,
              }} />
              <div style={{ color: s.color, marginBottom: 6, display: "flex", justifyContent: "center" }}>{s.icon}</div>
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
            border: `1px solid ${hexRgba(DS.pink, 0.15)}`,
            boxShadow: `0 4px 24px ${hexRgba(DS.pink, 0.08)}`,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div style={{ color: DS.pink, fontSize: 11, fontFamily: DS.mono, marginBottom: 12, letterSpacing: "0.1em" }}>
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
                  style={{ background: hexRgba(r.color, 0.15), color: r.color, boxShadow: `0 0 8px ${hexRgba(r.color, 0.3)}` }}>
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
// SLIDE 5 — Get Started
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
    { label: "Khám phá Dịch vụ", icon: <Globe size={18} />, color: DS.blue, desc: "12+ gói dịch vụ" },
    { label: "Nhận báo giá Website", icon: <Play size={18} />, color: DS.green, desc: "Miễn phí 3-5 ngày" },
    { label: "Xem Portfolio", icon: <Star size={18} />, color: DS.amber, desc: "120+ dự án" },
    { label: "Gặp đội ngũ", icon: <Users size={18} />, color: DS.purple, desc: "Gần 20 chuyên gia" },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">

        {/* Top bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          style={{
            width: "min(260px, 55vw)", height: 2, borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${DS.amber}, ${DS.pink}, transparent)`,
            boxShadow: `0 0 12px ${hexRgba(DS.amber, 0.5)}`,
            marginBottom: 28,
          }}
        />

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.pink, 0.08), border: `1px solid ${hexRgba(DS.pink, 0.2)}` }}>
            <Award size={12} style={{ color: DS.pink }} />
            <span style={{ color: DS.pink, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>HỆ THỐNG LP & THĂNG HẠNG</span>
          </div>

          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 8 }}>
            <span style={{
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 60%, ${DS.pinkLight} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              TÍCH LŨY — THĂNG HẠNG — NHẬN THƯỞNG
            </span>
          </h2>

          <p style={{ color: DS.text4, fontSize: 13, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
            Mỗi giao dịch tích lũy điểm LP. Thăng hạng để nhận ưu đãi độc quyền dành riêng cho bạn.
          </p>
        </motion.div>

        {/* Rank cards */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-8 flex-wrap max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {ranks.map((r, i) => (
            <motion.div
              key={r.name}
              className="flex flex-col items-center rounded-2xl px-4 py-4"
              style={{
                background: `linear-gradient(145deg, ${hexRgba(r.color, 0.08)}, ${hexRgba(r.color, 0.02)})`,
                border: `1px solid ${hexRgba(r.color, 0.25)}`,
                boxShadow: `0 0 16px ${hexRgba(r.color, 0.12)}, 0 4px 16px rgba(0,0,0,0.2)`,
                minWidth: 70,
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
              <span style={{ fontSize: 24 }}>{r.emoji}</span>
              <span style={{ color: r.color, fontSize: 10, fontWeight: 700, marginTop: 4, fontFamily: DS.mono }}>{r.name}</span>
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
                boxShadow: `0 4px 16px ${hexRgba(a.color, 0.08)}`,
              }}>
              <div style={{ color: a.color, marginBottom: 6, display: "flex", justifyContent: "center" }}>{a.icon}</div>
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
const LABELS = ["Chào mừng", "Về chúng tôi", "Dịch vụ", "Tăng trưởng", "Bắt đầu"];

export function OnboardingClient({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const total = 5;

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
              animate={{
                width: i === current ? 28 : 8,
                height: 8,
              }}
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