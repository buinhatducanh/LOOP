"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight, ChevronLeft, Globe, Code2, BarChart3, TrendingUp,
  Users, Star, Rocket, Shield, Zap, ArrowRight, Check,
  Sparkles, Target, Award, Heart, Play,
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

function SlideWelcome({ direction }: SlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [_showLogo, setShowLogo] = useState(false);

  // Restart video each time this slide is shown
  useEffect(() => {
    setShowLogo(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [direction]);

  const _handleVideoEnded = () => {
    setShowLogo(true);
  };

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full text-center px-6">
        {/* ── Logo Container ──────────────────────────────── */}
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
              background: "radial-gradient(circle, rgba(129,140,248,0.25) 0%, rgba(59,130,246,0.1) 45%, transparent 70%)",
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
                border: `1px solid rgba(129,140,248,${0.25 - ring * 0.06})`,
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

        {/* ── Title ──────────────────────────────────────── */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          style={{
            fontFamily: DS.heading,
            fontSize: "clamp(28px, 5vw, 56px)",
            letterSpacing: "0.07em",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #818CF8 55%, #3B82F6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CHÀO MỪNG ĐẾN VỚI
          </span>
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #3B82F6, #818CF8 40%, #7DD3FC 70%, #E0E7FF)",
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
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: hexRgba(DS.blue, 0.08), border: `1px solid ${hexRgba(DS.blue, 0.2)}` }}>
            <Sparkles size={12} style={{ color: DS.blue }} />
            <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>VỀ CHÚNG TÔI</span>
          </div>
          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(24px, 4vw, 42px)", letterSpacing: "0.04em", marginBottom: 12 }}>
            <span style={{ background: "linear-gradient(135deg, #FFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              LOOP SOLUTIONS LÀ AI?
            </span>
          </h2>
          <p style={{ color: DS.text3, fontSize: "clamp(13px, 1.6vw, 16px)", lineHeight: 1.8, maxWidth: 620, margin: "0 auto" }}>
            Đội ngũ 27 chuyên gia công nghệ hàng đầu, cung cấp giải pháp số toàn diện cho doanh nghiệp Việt Nam.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              className="rounded-2xl p-5 text-center"
              style={{ background: hexRgba(p.color, 0.04), border: `1px solid ${hexRgba(p.color, 0.15)}` }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
            >
              <div className="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: hexRgba(p.color, 0.1), color: p.color }}>
                {p.icon}
              </div>
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
              <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.6 }}>{p.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

function SlideServices({ direction }: SlideProps) {
  const services = [
    { icon: <Globe size={22} />, title: "Thiết kế Website", desc: "Landing page, web doanh nghiệp, e-commerce", color: DS.blue, badge: "12 gói ngành" },
    { icon: <Code2 size={22} />, title: "Phát triển App & SaaS", desc: "Mobile app, web app, hệ thống nội bộ", color: DS.purple, badge: "Full-stack" },
    { icon: <BarChart3 size={22} />, title: "Dashboard & Analytics", desc: "Realtime dashboard, báo cáo dữ liệu", color: DS.cyan, badge: "Realtime" },
    { icon: <TrendingUp size={22} />, title: "SEO & Marketing", desc: "Lên top Google, growth bền vững", color: DS.green, badge: "ROI cao" },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: hexRgba(DS.purple, 0.08), border: `1px solid ${hexRgba(DS.purple, 0.2)}` }}>
            <Rocket size={12} style={{ color: DS.purple }} />
            <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>DỊCH VỤ CHÍNH</span>
          </div>
          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(24px, 4vw, 40px)", letterSpacing: "0.04em" }}>
            <span style={{ background: "linear-gradient(135deg, #FFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              GIẢI PHÁP TOÀN DIỆN
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
          {services.map((s, i) => (
            <motion.div key={s.title} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: hexRgba(s.color, 0.03), border: `1px solid ${hexRgba(s.color, 0.12)}` }} initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.1 }}>
              <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none" style={{ background: `radial-gradient(circle, ${hexRgba(s.color, 0.08)}, transparent 70%)` }} />
              <div className="flex items-start gap-4 relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexRgba(s.color, 0.1), color: s.color }}>{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{s.title}</span>
                    <span style={{ color: s.color, fontSize: 9, fontFamily: DS.mono, background: hexRgba(s.color, 0.1), padding: "2px 8px", borderRadius: 6 }}>{s.badge}</span>
                  </div>
                  <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideWrapper>
  );
}

function SlideGrowth({ direction }: SlideProps) {
  const stats = [
    { value: "120+", label: "Dự án hoàn thành", color: DS.blue, icon: <Star size={16} /> },
    { value: "98%", label: "Khách hàng hài lòng", color: DS.green, icon: <Heart size={16} /> },
    { value: "50+", label: "Đối tác tin cậy", color: DS.purple, icon: <Users size={16} /> },
    { value: "380%", label: "Tăng trưởng 2025", color: DS.cyan, icon: <TrendingUp size={16} /> },
  ];

  const reasons = [
    "Dùng thử miễn phí 3-5 ngày",
    "Đội ngũ 27 chuyên gia, rank từ Iron → Diamond",
    "Hệ thống LP điểm thưởng",
    "Kích hoạt website trong 2 giờ",
    "Hỗ trợ kỹ thuật 24/7",
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: hexRgba(DS.green, 0.08), border: `1px solid ${hexRgba(DS.green, 0.2)}` }}>
            <TrendingUp size={12} style={{ color: DS.green }} />
            <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>SỐ LIỆU TĂNG TRƯỞNG</span>
          </div>
          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(24px, 4vw, 40px)", letterSpacing: "0.04em" }}>
            <span style={{ background: "linear-gradient(135deg, #FFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              TẠI SAO CHỌN LOOP?
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: hexRgba(s.color, 0.04), border: `1px solid ${hexRgba(s.color, 0.12)}` }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.08 }}>
              <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 800, fontFamily: DS.mono }}>{s.value}</div>
              <div style={{ color: DS.text4, fontSize: 10, marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div className="rounded-2xl p-5 max-w-2xl w-full" style={{ background: hexRgba(DS.purple, 0.03), border: `1px solid ${hexRgba(DS.purple, 0.1)}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, marginBottom: 12, letterSpacing: "0.1em" }}>
            ✨ LÝ DO ĐỒNG HÀNH CÙNG LOOP
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: hexRgba(DS.green, 0.15) }}>
                  <Check size={10} style={{ color: DS.green }} />
                </div>
                <span style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6 }}>{r}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

function SlideGetStarted({ direction, onComplete }: SlideProps & { onComplete: () => void }) {
  const ranks = [
    { name: "Sắt", emoji: "🪨", color: "#9CA3AF", lp: "0" },
    { name: "Đồng", emoji: "🥉", color: "#CD7F32", lp: "500" },
    { name: "Bạc", emoji: "🥈", color: "#C0C0C0", lp: "2K" },
    { name: "Vàng", emoji: "🥇", color: "#FFD700", lp: "5K" },
    { name: "Kim Cương", emoji: "💠", color: "#7DD3FC", lp: "50K" },
  ];

  const quickActions = [
    { label: "Khám phá Dịch vụ", href: "/dich-vu", icon: <Globe size={16} />, color: DS.blue },
    { label: "Nhận báo giá Website", href: "/booking", icon: <Play size={16} />, color: DS.green },
    { label: "Xem Portfolio", href: "/du-an", icon: <Star size={16} />, color: DS.amber },
    { label: "Gặp đội ngũ", href: "/doi-ngu", icon: <Users size={16} />, color: DS.purple },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: hexRgba(DS.amber, 0.08), border: `1px solid ${hexRgba(DS.amber, 0.2)}` }}>
            <Award size={12} style={{ color: DS.amber }} />
            <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.2em" }}>HỆ THỐNG LP & THĂNG HẠNG</span>
          </div>
          <h2 style={{ fontFamily: DS.heading, fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "0.04em", marginBottom: 8 }}>
            <span style={{ background: "linear-gradient(135deg, #FFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              TÍCH LŨY — THĂNG HẠNG — NHẬN THƯỞNG
            </span>
          </h2>
          <p style={{ color: DS.text4, fontSize: 13, maxWidth: 500, margin: "0 auto" }}>
            Mỗi giao dịch tích lũy điểm LP. Thăng hạng để nhận ưu đãi độc quyền.
          </p>
        </motion.div>

        <motion.div className="flex items-center justify-center gap-2 mb-8 flex-wrap max-w-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {ranks.map((r, i) => (
            <motion.div key={r.name} className="flex flex-col items-center rounded-xl px-3 py-3" style={{ background: hexRgba(r.color, 0.06), border: `1px solid ${hexRgba(r.color, 0.15)}`, minWidth: 64 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
              <span style={{ fontSize: 20 }}>{r.emoji}</span>
              <span style={{ color: r.color, fontSize: 10, fontWeight: 700, marginTop: 4 }}>{r.name}</span>
              <span style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, marginTop: 2 }}>{r.lp} LP</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          {quickActions.map((a) => (
            <div key={a.label} className="rounded-xl p-4 text-center" style={{ background: hexRgba(a.color, 0.04), border: `1px solid ${hexRgba(a.color, 0.12)}` }}>
              <div className="flex justify-center mb-2" style={{ color: a.color }}>{a.icon}</div>
              <div style={{ color: DS.text3, fontSize: 12 }}>{a.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.button
          className="flex items-center gap-3 px-10 py-4 rounded-2xl cursor-pointer"
          style={{ background: GRD.primary, color: "#fff", fontSize: 16, fontWeight: 700, border: "none", boxShadow: "0 0 50px rgba(129,140,248,0.4), 0 8px 32px rgba(0,0,0,0.3)", letterSpacing: "0.03em" }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 140 }}
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

      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.12) 0%, transparent 45%), radial-gradient(circle at 80% 30%, rgba(129,140,248,0.12) 0%, transparent 45%), radial-gradient(circle at 50% 80%, rgba(20,184,166,0.08) 0%, transparent 50%)",
      }} />

      <div className="relative w-full h-full" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait" initial={false}>{slides[current]}</AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 md:px-10" style={{ zIndex: 10, background: "linear-gradient(to top, rgba(2,6,23,0.95), transparent)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-3">
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
          <span style={{ color: DS.text4, fontSize: 12 }}>{LABELS[current]}</span>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: total }, (_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: i === current ? 28 : 8, height: 8, borderRadius: 4, border: "none", background: i === current ? DS.blue : hexRgba(DS.blue, 0.2), transition: "all 0.3s ease", cursor: "pointer" }} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {current > 0 && (
            <button onClick={prev} className="flex items-center gap-1.5 px-4 py-2 rounded-xl cursor-pointer" style={{ background: hexRgba(DS.blue, 0.06), border: `1px solid ${hexRgba(DS.blue, 0.15)}`, color: DS.text3, fontSize: 13 }}>
              <ChevronLeft size={14} /> Quay lại
            </button>
          )}
          {current < total - 1 && (
            <button onClick={next} className="flex items-center gap-1.5 px-5 py-2 rounded-xl cursor-pointer" style={{ background: GRD.primary, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 0 20px rgba(129,140,248,0.3)" }}>
              Tiếp tục <ChevronRight size={14} />
            </button>
          )}
          {current < total - 1 && (
            <button onClick={onComplete} className="cursor-pointer" style={{ background: "none", border: "none", color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
              Bỏ qua →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
