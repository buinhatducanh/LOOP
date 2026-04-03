/**
 * OnboardingPage — Fullscreen slide-based tutorial for new users
 * Galactic / Cosmic branding · LOOP Solutions intro · Growth stats
 * Bắt buộc xem khi lần đầu truy cập · localStorage tracking
 */
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  ChevronRight, ChevronLeft, Globe, Code2, BarChart3, TrendingUp,
  Users, Star, Rocket, Shield, Zap, ArrowRight, Check,
  Sparkles, Target, Award, Heart, Play, X
} from 'lucide-react';
import { DS, GRD } from '@/lib/design-tokens';
const logoImg = "/logo.png";

// ── hex → rgba helper ────────────────────────────────────────────────────
function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Star field background ────────────────────────────────────────────────
function StarField() {
  const stars = useRef(
    Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(s => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.size > 2 ? '#818CF8' : '#FFFFFF',
          }}
          animate={{ opacity: [s.opacity, s.opacity * 0.3, s.opacity] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Nebula Orbs ──────────────────────────────────────────────────────────
function NebulaOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute"
        style={{
          top: '-20%', left: '-10%', width: '60%', height: '60%',
          background: 'radial-gradient(circle, rgba(29,78,216,0.15) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(60px)',
        }}
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute"
        style={{
          top: '30%', right: '-15%', width: '55%', height: '55%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(50px)',
        }}
        animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      <motion.div
        className="absolute"
        style={{
          bottom: '-15%', left: '20%', width: '50%', height: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)',
          borderRadius: '50%', filter: 'blur(50px)',
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />
    </div>
  );
}

// ── Infinity Logo SVG ────────────────────────────────────────────────────
function InfinityLogo({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 200 100" fill="none">
      <defs>
        <linearGradient id="inf-grad" x1="0" y1="0" x2="200" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="40%" stopColor="#818CF8" />
          <stop offset="70%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <filter id="inf-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M50 50 C50 25, 20 15, 15 40 C10 65, 40 80, 50 50 C60 20, 90 15, 95 40 C100 65, 75 80, 50 50 Z"
        stroke="url(#inf-grad)"
        strokeWidth="4"
        fill="none"
        filter="url(#inf-glow)"
        strokeLinecap="round"
      />
      {/* Additional stroke for depth */}
      <path
        d="M100 50 C100 25, 130 15, 150 35 C170 55, 160 80, 140 65 C120 50, 110 30, 100 50 Z"
        stroke="url(#inf-grad)"
        strokeWidth="4"
        fill="none"
        filter="url(#inf-glow)"
        strokeLinecap="round"
        opacity="0.8"
        transform="translate(-50, 0)"
      />
    </svg>
  );
}

// ── Animated counter ─────────────────────────────────────────────────────
function AnimCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.floor(eased * target);
      setValue(start);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, target, duration]);

  return (
    <motion.span
      onViewportEnter={() => setStarted(true)}
    >
      {value.toLocaleString('vi-VN')}{suffix}
    </motion.span>
  );
}

// ── Pure SVG Growth Chart ────────────────────────────────────────────────
function GrowthChart() {
  const data = [18, 32, 45, 58, 72, 95, 120, 156, 198, 245, 310, 380];
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const max = Math.max(...data);
  const w = 400, h = 160, pad = 30;
  const chartW = w - pad * 2, chartH = h - pad * 2;

  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * chartW,
    y: pad + chartH - (d / max) * chartH,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaD = pathD + ` L${points[points.length - 1].x},${h - pad} L${points[0].x},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 400 }}>
      <defs>
        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <line key={i} x1={pad} y1={pad + chartH * (1 - pct)} x2={w - pad} y2={pad + chartH * (1 - pct)}
          stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      ))}
      {/* Area */}
      <motion.path d={areaD} fill="url(#chart-grad)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} />
      {/* Line */}
      <motion.path d={pathD} fill="none" stroke="url(#line-grad)" strokeWidth="2.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 2, ease: 'easeOut' }} />
      {/* Dots */}
      {points.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="3" fill="#818CF8" stroke="#0F172A" strokeWidth="1.5"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.08 }} />
      ))}
      {/* Month labels */}
      {points.map((p, i) => (
        <text key={`t${i}`} x={p.x} y={h - 8} textAnchor="middle"
          fill={DS.text5} fontSize="8" fontFamily={DS.mono}>
          {months[i]}
        </text>
      ))}
    </svg>
  );
}

// ── Slide content definitions ────────────────────────────────────────────

interface SlideProps {
  direction: number;
}

// SLIDE 0: Welcome / Logo Reveal
function SlideWelcome({ direction }: SlideProps) {
  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full text-center px-6">
        {/* Logo image */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ filter: 'blur(60px)', background: 'radial-gradient(circle, rgba(129,140,248,0.3), rgba(59,130,246,0.15), transparent)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <img src={logoImg} alt="LOOP Solutions" style={{ width: 'min(80vw, 480px)', position: 'relative', zIndex: 1 }} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ fontFamily: DS.heading, fontSize: 'clamp(28px, 5vw, 52px)', letterSpacing: '0.06em', marginBottom: 16 }}
        >
          <span style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #818CF8 50%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CHÀO MỪNG ĐẾN VỚI
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #3B82F6, #818CF8, #7DD3FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            LOOP SOLUTIONS
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{ color: DS.text3, fontSize: 'clamp(14px, 2vw, 18px)', lineHeight: 1.8, maxWidth: 560, marginBottom: 32 }}
        >
          Hệ điều hành số dành cho Digital Agency — Nơi công nghệ gặp nghệ thuật,
          kiến tạo giải pháp web đỉnh cao cho thị trường Việt Nam.
        </motion.p>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="flex flex-col items-center gap-2"
        >
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>
            NHẤN TIẾP TỤC ĐỂ KHÁM PHÁ
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronRight size={20} style={{ color: DS.blue, transform: 'rotate(90deg)' }} />
          </motion.div>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

// SLIDE 1: About Company
function SlideAbout({ direction }: SlideProps) {
  const pillars = [
    { icon: <Shield size={20} />, title: 'Uy tín', desc: '7+ năm kinh nghiệm, 120+ dự án thành công', color: DS.blue },
    { icon: <Zap size={20} />, title: 'Tốc độ', desc: 'Triển khai nhanh chóng, bàn giao đúng hạn', color: DS.amber },
    { icon: <Heart size={20} />, title: 'Tận tâm', desc: 'Hỗ trợ 24/7, đồng hành lâu dài', color: DS.red },
    { icon: <Target size={20} />, title: 'Chất lượng', desc: 'Tiêu chuẩn quốc tế, thiết kế tinh xảo', color: DS.purple },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.blue, 0.08), border: `1px solid ${hexRgba(DS.blue, 0.2)}` }}>
            <Sparkles size={12} style={{ color: DS.blue }} />
            <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>VỀ CHÚNG TÔI</span>
          </div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(24px, 4vw, 40px)', letterSpacing: '0.04em', marginBottom: 12 }}>
            <span style={{ background: 'linear-gradient(135deg, #FFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              LOOP SOLUTIONS LÀ AI?
            </span>
          </h2>
          <p style={{ color: DS.text3, fontSize: 'clamp(13px, 1.5vw, 16px)', lineHeight: 1.8, maxWidth: 600, margin: '0 auto' }}>
            Chúng tôi là đội ngũ <span style={{ color: DS.blue }}>27 chuyên gia công nghệ</span> hàng đầu,
            chuyên cung cấp giải pháp số toàn diện cho doanh nghiệp Việt Nam.
            Từ thiết kế web, phát triển ứng dụng đến chiến lược marketing số —
            tất cả trong <span style={{ color: DS.purple }}>một hệ sinh thái thống nhất</span>.
          </p>
        </motion.div>

        {/* 4 Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              className="rounded-2xl p-5 text-center"
              style={{
                background: hexRgba(p.color, 0.04),
                border: `1px solid ${hexRgba(p.color, 0.15)}`,
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.12 }}
            >
              <div className="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: hexRgba(p.color, 0.1), color: p.color }}>
                {p.icon}
              </div>
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
              <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.6 }}>{p.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Infinity symbol divider */}
        <motion.div className="mt-8 flex justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <InfinityLogo size={60} />
        </motion.div>
      </div>
    </SlideWrapper>
  );
}

// SLIDE 2: Services
function SlideServices({ direction }: SlideProps) {
  const services = [
    { icon: <Globe size={22} />, title: 'Thiết kế Website', desc: 'Landing page, web doanh nghiệp, thương mại điện tử — kích hoạt trong 2h, dùng thử miễn phí 3-5 ngày', color: '#3B82F6', badge: '12 gói ngành' },
    { icon: <Code2 size={22} />, title: 'Phát triển App & SaaS', desc: 'Mobile app, web app, hệ thống quản lý nội bộ — kiến trúc microservices hiện đại', color: '#818CF8', badge: 'Full-stack' },
    { icon: <BarChart3 size={22} />, title: 'Dashboard & Analytics', desc: 'Real-time dashboard, báo cáo tự động, data visualization — ra quyết định dựa trên dữ liệu', color: '#14B8A6', badge: 'Real-time' },
    { icon: <TrendingUp size={22} />, title: 'SEO & Digital Marketing', desc: 'Lên top Google trong 3-6 tháng, chiến dịch quảng cáo, content marketing bền vững', color: '#22C55E', badge: 'ROI 300%' },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.purple, 0.08), border: `1px solid ${hexRgba(DS.purple, 0.2)}` }}>
            <Rocket size={12} style={{ color: DS.purple }} />
            <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>DỊCH VỤ CHÍNH</span>
          </div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(24px, 4vw, 40px)', letterSpacing: '0.04em' }}>
            <span style={{ background: 'linear-gradient(135deg, #FFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              GIẢI PHÁP TOÀN DIỆN
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: hexRgba(s.color, 0.03),
                border: `1px solid ${hexRgba(s.color, 0.12)}`,
              }}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.12 }}
            >
              {/* Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${hexRgba(s.color, 0.08)}, transparent 70%)` }} />

              <div className="flex items-start gap-4 relative">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: hexRgba(s.color, 0.1), color: s.color }}>
                  {s.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{s.title}</span>
                    <span style={{
                      color: s.color, fontSize: 9, fontFamily: DS.mono,
                      background: hexRgba(s.color, 0.1), padding: '2px 8px', borderRadius: 6,
                    }}>{s.badge}</span>
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

// SLIDE 3: Why Choose Us + Growth
function SlideGrowth({ direction }: SlideProps) {
  const stats = [
    { value: 120, suffix: '+', label: 'Dự án hoàn thành', color: DS.blue, icon: <Star size={16} /> },
    { value: 98, suffix: '%', label: 'Khách hàng hài lòng', color: DS.green, icon: <Heart size={16} /> },
    { value: 50, suffix: '+', label: 'Đối tác tin cậy', color: DS.purple, icon: <Users size={16} /> },
    { value: 380, suffix: '%', label: 'Tăng trưởng 2025', color: DS.cyan, icon: <TrendingUp size={16} /> },
  ];

  const reasons = [
    'Dùng thử miễn phí 3-5 ngày trước khi quyết định',
    'Đội ngũ 27 chuyên gia, hệ thống rank từ Iron → Diamond',
    'Hệ thống LP điểm thưởng — càng đồng hành, càng có lợi',
    'Kích hoạt website trong 2 giờ, bàn giao đúng hạn',
    'Hỗ trợ kỹ thuật 24/7, bảo hành trọn đời',
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.green, 0.08), border: `1px solid ${hexRgba(DS.green, 0.2)}` }}>
            <TrendingUp size={12} style={{ color: DS.green }} />
            <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>SỐ LIỆU TĂNG TRƯỞNG</span>
          </div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(24px, 4vw, 40px)', letterSpacing: '0.04em' }}>
            <span style={{ background: 'linear-gradient(135deg, #FFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              TẠI SAO CHỌN LOOP?
            </span>
          </h2>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="rounded-2xl p-4 text-center"
              style={{
                background: hexRgba(s.color, 0.04),
                border: `1px solid ${hexRgba(s.color, 0.12)}`,
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 150 }}
            >
              <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, fontFamily: DS.mono }}>
                <AnimCounter target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ color: DS.text4, fontSize: 10, marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Growth chart + reasons side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
          {/* Chart */}
          <motion.div
            className="rounded-2xl p-5"
            style={{ background: hexRgba(DS.blue, 0.03), border: `1px solid ${hexRgba(DS.blue, 0.1)}` }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, marginBottom: 12, letterSpacing: '0.1em' }}>
              📈 BIỂU ĐỒ TĂNG TRƯỞNG KHÁCH HÀNG 2025
            </div>
            <GrowthChart />
          </motion.div>

          {/* Reasons */}
          <motion.div
            className="rounded-2xl p-5"
            style={{ background: hexRgba(DS.purple, 0.03), border: `1px solid ${hexRgba(DS.purple, 0.1)}` }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, marginBottom: 12, letterSpacing: '0.1em' }}>
              ✨ LÝ DO ĐỒNG HÀNH CÙNG LOOP
            </div>
            <div className="flex flex-col gap-3">
              {reasons.map((r, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: hexRgba(DS.green, 0.15) }}>
                    <Check size={10} style={{ color: DS.green }} />
                  </div>
                  <span style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6 }}>{r}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </SlideWrapper>
  );
}

// SLIDE 4: LP System + Get Started
function SlideGetStarted({ direction, handleComplete }: SlideProps & { handleComplete: () => void }) {
  const ranks = [
    { name: 'Sắt', emoji: '🪨', color: '#9CA3AF', lp: '0' },
    { name: 'Đồng', emoji: '🥉', color: '#CD7F32', lp: '500' },
    { name: 'Bạc', emoji: '🥈', color: '#C0C0C0', lp: '2K' },
    { name: 'Vàng', emoji: '🥇', color: '#FFD700', lp: '5K' },
    { name: 'Bạch Kim', emoji: '💎', color: '#E5E4E2', lp: '10K' },
    { name: 'Hồng Ngọc', emoji: '❤️‍🔥', color: '#E0115F', lp: '25K' },
    { name: 'Kim Cương', emoji: '💠', color: '#7DD3FC', lp: '50K' },
  ];

  const quickActions = [
    { label: 'Khám phá Dịch vụ', href: '/dich-vu', icon: <Globe size={16} />, color: DS.blue },
    { label: 'Đặt lịch Tư vấn', href: '/booking', icon: <Play size={16} />, color: DS.green },
    { label: 'Xem Portfolio', href: '/du-an', icon: <Star size={16} />, color: DS.amber },
    { label: 'Gặp đội ngũ', href: '/doi-ngu', icon: <Users size={16} />, color: DS.purple },
  ];

  return (
    <SlideWrapper direction={direction}>
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
        {/* LP System */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: hexRgba(DS.amber, 0.08), border: `1px solid ${hexRgba(DS.amber, 0.2)}` }}>
            <Award size={12} style={{ color: DS.amber }} />
            <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>HỆ THỐNG LP & THĂNG HẠNG</span>
          </div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '0.04em', marginBottom: 8 }}>
            <span style={{ background: 'linear-gradient(135deg, #FFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              TÍCH LŨY — THĂNG HẠNG — NHẬN THƯỞNG
            </span>
          </h2>
          <p style={{ color: DS.text4, fontSize: 13, maxWidth: 500, margin: '0 auto' }}>
            Mỗi giao dịch tích lũy điểm LP. Thăng hạng để nhận ưu đãi độc quyền và hiệu ứng đặc biệt.
          </p>
        </motion.div>

        {/* Rank progression */}
        <motion.div
          className="flex items-center justify-center gap-1 md:gap-2 mb-8 flex-wrap max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {ranks.map((r, i) => (
            <motion.div
              key={r.name}
              className="flex flex-col items-center rounded-xl px-2 py-3 md:px-4 md:py-3"
              style={{
                background: hexRgba(r.color, 0.06),
                border: `1px solid ${hexRgba(r.color, 0.15)}`,
                minWidth: 64,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <span style={{ fontSize: 20 }}>{r.emoji}</span>
              <span style={{ color: r.color, fontSize: 10, fontWeight: 700, marginTop: 4 }}>{r.name}</span>
              <span style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, marginTop: 2 }}>{r.lp} LP</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="rounded-xl p-4 text-center cursor-pointer transition-all duration-200"
              style={{
                background: hexRgba(a.color, 0.04),
                border: `1px solid ${hexRgba(a.color, 0.12)}`,
                textDecoration: 'none',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = hexRgba(a.color, 0.35);
                (e.currentTarget as HTMLElement).style.backgroundColor = hexRgba(a.color, 0.08);
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = hexRgba(a.color, 0.12);
                (e.currentTarget as HTMLElement).style.backgroundColor = hexRgba(a.color, 0.04);
              }}
            >
              <div className="flex justify-center mb-2" style={{ color: a.color }}>{a.icon}</div>
              <div style={{ color: DS.text3, fontSize: 12 }}>{a.label}</div>
            </Link>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          className="flex items-center gap-3 px-10 py-4 rounded-2xl cursor-pointer"
          style={{
            background: GRD.primary,
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            boxShadow: '0 0 50px rgba(129,140,248,0.4), 0 8px 32px rgba(0,0,0,0.3)',
            letterSpacing: '0.03em',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 150 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleComplete}
        >
          <Rocket size={20} />
          BẮT ĐẦU KHÁM PHÁ
          <ArrowRight size={18} />
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 16 }}
        >
          Bạn có thể xem lại hướng dẫn này bất kỳ lúc nào
        </motion.p>
      </div>
    </SlideWrapper>
  );
}

// ── Slide transition wrapper ─────────────────────────────────────────────
function SlideWrapper({ children, direction }: { children: React.ReactNode; direction: number }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-y-auto"
      initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 28 }}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%' }}
    >
      {children}
    </motion.div>
  );
}

// ── Progress indicator ───────────────────────────────────────────────────
function ProgressDots({ total, current, onGo }: { total: number; current: number; onGo: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onGo(i)}
          className="cursor-pointer"
          style={{
            width: i === current ? 28 : 8,
            height: 8,
            borderRadius: 4,
            border: 'none',
            background: i === current ? DS.blue : hexRgba(DS.blue, 0.2),
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

// ── Slide labels ─────────────────────────────────────────────────────────
const SLIDE_LABELS = ['Chào mừng', 'Về chúng tôi', 'Dịch vụ', 'Tăng trưởng', 'Bắt đầu'];

// ══════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ───────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const total = 5;

  const handleComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("loop_onboarding_done", "true");
    }
  }, []);

  const goTo = useCallback((idx: number) => {
    if (idx === current || idx < 0 || idx >= total) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  // Keyboard navigation
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [next, prev]);

  const slides = [
    <SlideWelcome key="welcome" direction={direction} />,
    <SlideAbout key="about" direction={direction} />,
    <SlideServices key="services" direction={direction} />,
    <SlideGrowth key="growth" direction={direction} />,
    <SlideGetStarted key="start" direction={direction} handleComplete={handleComplete} />,
  ];

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" style={{ background: DS.bg }}>
      {/* Background */}
      <StarField />
      <NebulaOrbs />

      {/* Grid overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.02 }}>
        <defs>
          <pattern id="onb-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#3B82F6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#onb-grid)" />
      </svg>

      {/* Slide content */}
      <div className="relative w-full h-full" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait" initial={false}>
          {slides[current]}
        </AnimatePresence>
      </div>

      {/* ── Bottom navigation bar ────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4 md:px-10"
        style={{
          zIndex: 10,
          background: 'linear-gradient(to top, rgba(2,6,23,0.95), transparent)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Left: step label */}
        <div className="flex items-center gap-3">
          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
            {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <span style={{ color: DS.text4, fontSize: 12 }}>{SLIDE_LABELS[current]}</span>
        </div>

        {/* Center: dots */}
        <ProgressDots total={total} current={current} onGo={goTo} />

        {/* Right: buttons */}
        <div className="flex items-center gap-3">
          {current > 0 && (
            <button
              onClick={prev}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200"
              style={{
                background: hexRgba(DS.blue, 0.06),
                border: `1px solid ${hexRgba(DS.blue, 0.15)}`,
                color: DS.text3,
                fontSize: 13,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = hexRgba(DS.blue, 0.35); }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = hexRgba(DS.blue, 0.15); }}
            >
              <ChevronLeft size={14} />
              Quay lại
            </button>
          )}
          {current < total - 1 ? (
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl cursor-pointer"
              style={{
                background: GRD.primary,
                border: 'none',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 0 20px rgba(129,140,248,0.3)',
              }}
            >
              Tiếp tục
              <ChevronRight size={14} />
            </button>
          ) : null}

          {/* Skip button */}
          {current < total - 1 && (
            <button
              onClick={handleComplete}
              className="cursor-pointer"
              style={{ background: 'none', border: 'none', color: DS.text5, fontSize: 11, fontFamily: DS.mono }}
            >
              Bỏ qua →
            </button>
          )}
        </div>
      </div>

      {/* Top-right skip */}
      <button
        onClick={handleComplete}
        className="fixed top-6 right-6 flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-opacity duration-200"
        style={{
          zIndex: 10,
          background: hexRgba('#FFFFFF', 0.04),
          border: `1px solid ${hexRgba('#FFFFFF', 0.08)}`,
          color: DS.text5,
          fontSize: 11,
          fontFamily: DS.mono,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
      >
        <X size={12} />
        BỎ QUA
      </button>
    </div>
  );
}
