import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, useInView, useMotionValue, useSpring } from 'motion/react';
import {
  Zap, Globe, Code2, BarChart3, Shield, Star, ChevronRight,
  ArrowRight, Check, TrendingUp, Users, Award, Sparkles,
  Play, Clock, Target, Layers, MousePointer,
  GitBranch, Rocket, Heart, Eye
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useI18n } from '../hooks/useI18n';

// ── Animated Counter ────────────────────────────────────────────────────────
function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 18 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);

  useEffect(() => spring.on('change', (v) => {
    setDisplay(Math.floor(v).toLocaleString('vi-VN'));
  }), [spring]);

  return <span ref={ref}>{display}{suffix}</span>;
}

// ── Animated gradient background ───────────────────────────────────────────
function AnimatedBg() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Gradient orbs */}
      <motion.div
        style={{ position: 'absolute', top: '-15%', left: '-5%', width: '55%', height: '55%', background: 'radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 70%)', borderRadius: '50%' }}
        animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{ position: 'absolute', top: '40%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.09) 0%, transparent 70%)', borderRadius: '50%' }}
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        style={{ position: 'absolute', bottom: '-5%', left: '25%', width: '45%', height: '45%', background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 70%)', borderRadius: '50%' }}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.025 }}>
        <defs>
          <pattern id="grid-lp" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3B82F6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-lp)" />
      </svg>
    </div>
  );
}

// ── Section Badge ──────────────────────────────────────────────────────────
function Badge({ label, color = DS.blue }: { label: string; color?: string }) {
  return (
    <div
      className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.22em' }}>{label}</span>
    </div>
  );
}

// ── HERO SECTION ─────────────────────────────────────────────────────────
function HeroSection() {
  const { t } = useI18n();
  const [activeMetric, setActiveMetric] = useState(0);
  const metrics = [
    { label: t('landing.hero.metric1'), value: '120+', color: DS.blue },
    { label: t('landing.hero.metric2'), value: '98%', color: DS.green },
    { label: t('landing.hero.metric3'), value: '7+', color: DS.purple },
    { label: t('landing.hero.metric4'), value: '50+', color: DS.cyan },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveMetric(p => (p + 1) % metrics.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* LEFT: Text */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            {/* Eyebrow */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Badge label={t('landing.hero.badge')} />
            </motion.div>

            {/* Headline */}
            <h1 style={{ fontFamily: DS.heading, letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: 24 }}>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ display: 'block', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900 }}
              >
                <span style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('landing.hero.headline1')}
                </span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ display: 'block', fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900 }}
              >
                <span style={{ background: GRD.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('landing.hero.headline2')}
                </span>
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ color: DS.text3, fontSize: 17, lineHeight: 1.8, marginBottom: 36, maxWidth: 520 }}
            >
              {t('landing.hero.description')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link
                to="/dat-lich"
                style={{
                  background: GRD.primary,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  padding: '14px 32px',
                  borderRadius: 14,
                  textDecoration: 'none',
                  boxShadow: '0 0 40px rgba(129,140,248,0.5), 0 8px 24px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  letterSpacing: '0.02em',
                }}
              >
                <Rocket size={17} />
                {t('landing.hero.ctaProject')}
              </Link>
              <Link
                to="/du-an"
                style={{
                  color: DS.text2,
                  fontSize: 15,
                  fontWeight: 500,
                  padding: '14px 32px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.12)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <Eye size={16} />
                {t('landing.hero.ctaPortfolio')}
              </Link>
            </motion.div>

            {/* Rotating metric */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-8 flex-wrap"
            >
              {metrics.map((m, i) => (
                <div
                  key={m.label}
                  style={{ opacity: i === activeMetric ? 1 : 0.35, transition: 'opacity 0.4s ease' }}
                >
                  <div style={{ color: m.color, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, textShadow: `0 0 16px ${m.color}60` }}>
                    {m.value}
                  </div>
                  <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.1em', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT: Platform mockup */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {/* Main card - dashboard preview */}
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                border: '1px solid rgba(59,130,246,0.2)',
                boxShadow: '0 0 80px rgba(59,130,246,0.12), 0 40px 80px rgba(0,0,0,0.6)',
                background: '#0A1628',
              }}
            >
              {/* Top bar */}
              <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.8)' }}>
                <div className="w-3 h-3 rounded-full" style={{ background: '#EF4444' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#22C55E' }} />
                <div className="flex-1 mx-4 h-6 rounded-lg px-3 flex items-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>loop.solutions/dashboard</span>
                </div>
                <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
                <span style={{ color: '#22C55E', fontSize: 10, fontFamily: DS.mono }}>LIVE</span>
              </div>

              {/* Dashboard content */}
              <div className="p-5" style={{ background: 'linear-gradient(160deg, #0A1628 0%, #060D1A 100%)' }}>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Dự án', value: '24', color: DS.blue, icon: <Layers size={13} /> },
                    { label: 'Doanh thu', value: '2.4B', color: DS.green, icon: <TrendingUp size={13} /> },
                    { label: 'LP tích lũy', value: '820K', color: DS.purple, icon: <Zap size={13} /> },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}20` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ color: s.color, opacity: 0.7 }}>{s.icon}</span>
                        <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{s.label}</span>
                      </div>
                      <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Chart area */}
                <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>DOANH THU THEO THÁNG</span>
                    <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>+28.4% ↑</span>
                  </div>
                  <svg width="100%" height="70" viewBox="0 0 300 70">
                    <defs>
                      <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,55 C30,45 60,60 90,40 C120,20 150,30 180,15 C210,5 240,20 270,10 L270,70 L0,70 Z" fill="url(#chart-grad)" />
                    <path d="M0,55 C30,45 60,60 90,40 C120,20 150,30 180,15 C210,5 240,20 270,10" fill="none" stroke="#3B82F6" strokeWidth="2" />
                    {[{x:0,y:55},{x:90,y:40},{x:180,y:15},{x:270,y:10}].map((p,i)=>(
                      <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3B82F6" />
                    ))}
                  </svg>
                </div>

                {/* Project list */}
                {[
                  { name: 'VNRetail Platform', status: 'Đang thực hiện', prog: 72, color: DS.blue },
                  { name: 'MedApp v3.0', status: 'Review', prog: 91, color: DS.amber },
                  { name: 'FinDash Enterprise', status: 'Hoàn thành', prog: 100, color: DS.green },
                ].map(p => (
                  <div key={p.name} className="flex items-center gap-3 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ color: DS.text2, fontSize: 11 }}>{p.name}</span>
                        <span style={{ color: p.color, fontSize: 10, fontFamily: DS.mono }}>{p.prog}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${p.prog}%`, background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating LP badge */}
            <motion.div
              className="absolute -top-6 -right-4 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(15,23,42,0.96)',
                border: '1px solid rgba(129,140,248,0.35)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(129,140,248,0.15)',
              }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 4 }}>LP ĐIỂM THƯỞNG HÔM NAY</div>
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: DS.purple }} />
                <span style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 18, fontWeight: 700, textShadow: '0 0 12px rgba(129,140,248,0.7)' }}>+2,450 LP</span>
              </div>
            </motion.div>

            {/* Floating rank card */}
            <motion.div
              className="absolute -bottom-5 -left-4 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(15,23,42,0.96)',
                border: '1px solid rgba(255,215,0,0.25)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 4 }}>RANK PROGRESSION</div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#FFD700', fontSize: 16 }}>★</span>
                <span style={{ color: '#FFD700', fontFamily: DS.heading, fontSize: 14, fontWeight: 700 }}>GOLD</span>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>Lv.12</span>
                <ArrowRight size={12} style={{ color: DS.text5 }} />
                <span style={{ color: '#14B8A6', fontFamily: DS.heading, fontSize: 14, fontWeight: 700 }}>PLATINUM</span>
              </div>
            </motion.div>

            {/* Glow effect */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 70%)', zIndex: -1 }} />
          </motion.div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2"
        style={{ transform: 'translateX(-50%)' }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div style={{ width: 24, height: 40, border: '2px solid rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4px 0' }}>
          <div style={{ width: 3, height: 10, background: DS.blue, borderRadius: 2 }} />
        </div>
      </motion.div>
    </section>
  );
}

// ── TICKER / MARQUEE ─────────────────────────────────────────────────────
function Marquee() {
  const items = [
    '✦ React & Next.js', '◈ Supabase', '✦ TypeScript', '◈ AWS', '✦ Figma to Code',
    '◈ React Native', '✦ Node.js', '◈ PostgreSQL', '✦ Docker', '◈ SEO Pro',
    '✦ CI/CD Pipeline', '◈ Tailwind CSS', '✦ Rust', '◈ BigQuery',
  ];
  const doubled = [...items, ...items];

  return (
    <div style={{ borderTop: `1px solid ${DS.border}`, borderBottom: `1px solid ${DS.border}`, overflow: 'hidden', padding: '14px 0' }}>
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((item, i) => (
          <span key={i} style={{ color: i % 2 === 0 ? DS.blue : DS.text4, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.15em', flexShrink: 0 }}>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── STATS SECTION ────────────────────────────────────────────────────────
function StatsSection() {
  const { t } = useI18n();
  const stats = [
    { value: 120, suffix: '+', label: t('landing.stats.projects'), icon: <Rocket size={22} />, color: DS.blue },
    { value: 98, suffix: '%', label: t('landing.stats.satisfaction'), icon: <Heart size={22} />, color: DS.green },
    { value: 7, suffix: '+', label: t('landing.stats.years'), icon: <Award size={22} />, color: DS.amber },
    { value: 50, suffix: '+', label: t('landing.stats.partners'), icon: <Users size={22} />, color: DS.purple },
    { value: 24, suffix: '/7', label: t('landing.stats.support'), icon: <Clock size={22} />, color: DS.cyan },
    { value: 99.9, suffix: '%', label: t('landing.stats.uptime'), icon: <Shield size={22} />, color: DS.red },
  ];

  return (
    <section className="py-20 px-6" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(2,6,23,0) 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center p-5 rounded-2xl"
              style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${DS.border}`, backdropFilter: 'blur(12px)' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ borderColor: `${s.color}40`, boxShadow: `0 0 20px ${s.color}15` }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, textShadow: `0 0 16px ${s.color}50` }}>
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </div>
              <div style={{ color: DS.text4, fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SERVICES SECTION ─────────────────────────────────────────────────────
function ServicesSection() {
  const services = [
    {
      icon: <Globe size={26} />,
      title: 'Thiết kế & Phát triển Web',
      desc: 'Website cao cấp, tối ưu chuyển đổi với React/Next.js. Từ landing page đến e-commerce phức tạp.',
      color: DS.blue,
      priceFrom: '15,000,000 VNĐ',
      lpReward: '500 LP / 10M VNĐ',
      tags: ['React', 'Next.js', 'TypeScript'],
      href: '/dich-vu',
    },
    {
      icon: <Code2 size={26} />,
      title: 'Phát triển App & SaaS',
      desc: 'Từ MVP đến enterprise. Mobile app, web app và nền tảng SaaS scalable cho hàng triệu người dùng.',
      color: DS.purple,
      priceFrom: '80,000,000 VNĐ',
      lpReward: '500 LP / 10M VNĐ',
      tags: ['React Native', 'Node.js', 'AWS'],
      href: '/dich-vu',
    },
    {
      icon: <BarChart3 size={26} />,
      title: 'Dashboard & Analytics',
      desc: 'Biến dữ liệu thành insight. Real-time dashboard, báo cáo tự động và data visualization.',
      color: DS.cyan,
      priceFrom: '25,000,000 VNĐ',
      lpReward: '500 LP / 10M VNĐ',
      tags: ['React', 'D3.js', 'BigQuery'],
      href: '/dich-vu',
    },
    {
      icon: <Target size={26} />,
      title: 'SEO & Digital Marketing',
      desc: 'Tăng trưởng organic bền vững. Technical SEO, content strategy và quảng cáo hiệu suất cao.',
      color: DS.green,
      priceFrom: '8,000,000 VNĐ/tháng',
      lpReward: '500 LP / 10M VNĐ',
      tags: ['SEO', 'Google Ads', 'Analytics'],
      href: '/dich-vu',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge label="DỊCH VỤ CHUYÊN NGHIỆP" />
          <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '0.05em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 14 }}>
            GIẢI PHÁP TOÀN DIỆN
          </h2>
          <p style={{ color: DS.text3, fontSize: 16, maxWidth: 540, margin: '0 auto', lineHeight: 1.8 }}>
            Mọi dịch vụ đều được thanh toán bằng VNĐ. Tích lũy LP điểm thưởng và nhận ưu đãi ngay từ dự án đầu tiên.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map((svc, i) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link to={svc.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <motion.div
                  className="h-full rounded-2xl p-7 cursor-pointer"
                  style={{
                    background: 'rgba(15,23,42,0.7)',
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${DS.border}`,
                  }}
                  whileHover={{
                    borderColor: `${svc.color}40`,
                    boxShadow: `0 8px 40px ${svc.color}15, 0 0 0 1px ${svc.color}15`,
                    y: -4,
                  }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-13 h-13 rounded-xl flex items-center justify-center" style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}30`, padding: 12 }}>
                      <span style={{ color: svc.color }}>{svc.icon}</span>
                    </div>
                    <ArrowRight size={16} style={{ color: svc.color, marginTop: 4, opacity: 0.6 }} />
                  </div>

                  <h3 style={{ color: DS.text, fontSize: 18, fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>{svc.title}</h3>
                  <p style={{ color: DS.text3, fontSize: 13.5, lineHeight: 1.8, marginBottom: 18 }}>{svc.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {svc.tags.map(t => (
                      <span key={t} style={{ color: svc.color, fontSize: 10, fontFamily: DS.mono, padding: '3px 8px', borderRadius: 4, background: `${svc.color}10`, border: `1px solid ${svc.color}20` }}>{t}</span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${DS.border}` }}>
                    <div>
                      <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>GIÁ TỪ (VNĐ)</div>
                      <div style={{ color: svc.color, fontSize: 14, fontWeight: 700 }}>{svc.priceFrom}</div>
                    </div>
                    <div className="text-right">
                      <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>ĐIỂM THƯỞNG LP</div>
                      <div style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>◈ {svc.lpReward}</div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/dat-lich" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, background: GRD.primary,
            color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 28px', borderRadius: 12,
            textDecoration: 'none', boxShadow: '0 0 30px rgba(129,140,248,0.35)',
          }}>
            <MousePointer size={15} />
            Đặt lịch tư vấn miễn phí — 8 bước dễ dàng
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── HOW IT WORKS ─────────────────────────────────────────────────────────
function ProcessSection() {
  const { t } = useI18n();
  const steps = [
    { num: '01', title: t('landing.process.step1Title'), desc: t('landing.process.step1Desc'), icon: <Users size={20} />, color: DS.blue },
    { num: '02', title: t('landing.process.step2Title'), desc: t('landing.process.step2Desc'), icon: <GitBranch size={20} />, color: DS.purple },
    { num: '03', title: t('landing.process.step3Title'), desc: t('landing.process.step3Desc'), icon: <Layers size={20} />, color: DS.cyan },
    { num: '04', title: t('landing.process.step4Title'), desc: t('landing.process.step4Desc'), icon: <Code2 size={20} />, color: DS.green },
    { num: '05', title: t('landing.process.step5Title'), desc: t('landing.process.step5Desc'), icon: <Rocket size={20} />, color: DS.amber },
  ];

  return (
    <section className="py-24 px-6" style={{ background: 'linear-gradient(160deg, rgba(15,23,42,0.5) 0%, rgba(2,6,23,0.5) 100%)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Badge label={t('landing.process.badge')} color={DS.cyan} />
          <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
            {t('landing.process.heading')}
          </h2>
          <p style={{ color: DS.text3, fontSize: 15 }}>{t('landing.process.subheading')}</p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-6 bottom-6" style={{ width: 2, background: 'linear-gradient(180deg, transparent, #3B82F6 20%, #818CF8 80%, transparent)', left: 27 }} />
          <div className="space-y-5">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="flex gap-6 p-5 rounded-2xl relative"
                style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${DS.border}`, backdropFilter: 'blur(12px)' }}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ borderColor: `${s.color}40`, boxShadow: `0 0 20px ${s.color}10` }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span style={{ color: s.color, fontFamily: DS.mono, fontSize: 10, letterSpacing: '0.2em' }}>STEP {s.num}</span>
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${s.color}20, transparent)` }} />
                  </div>
                  <div style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>{s.desc}</div>
                </div>
                <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 32, fontWeight: 900, opacity: 0.12, alignSelf: 'center', flexShrink: 0 }}>{s.num}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── LP SYSTEM SECTION (explained as rewards) ─────────────────────────────
function LPSystemSection() {
  const { t } = useI18n();
  const rankFlow = [
    { rank: 'IRON', color: '#9CA3AF', symbol: '⬡', desc: t('landing.lp.rankIron') },
    { rank: 'BRONZE', color: '#CD7F32', symbol: '◈', desc: t('landing.lp.rankBronze') },
    { rank: 'SILVER', color: '#CBD5E1', symbol: '◇', desc: t('landing.lp.rankSilver') },
    { rank: 'GOLD', color: '#FFD700', symbol: '★', desc: t('landing.lp.rankGold') },
    { rank: 'PLATINUM', color: '#14B8A6', symbol: '❋', desc: t('landing.lp.rankPlatinum') },
    { rank: 'RUBY', color: '#EF4444', symbol: '♦', desc: t('landing.lp.rankRuby') },
    { rank: 'DIAMOND', color: '#818CF8', symbol: '✦', desc: t('landing.lp.rankDiamond') },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <Badge label={t('landing.lp.badge')} color={DS.purple} />
            <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '0.05em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>
              {t('landing.lp.heading')}
            </h2>
            <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              {t('landing.lp.description')}
            </p>
            <div className="space-y-3 mb-8">
              {[
                { icon: <Zap size={15} />, text: t('landing.lp.perk1'), color: DS.blue },
                { icon: <Users size={15} />, text: t('landing.lp.perk2'), color: DS.purple },
                { icon: <Award size={15} />, text: t('landing.lp.perk3'), color: DS.green },
                { icon: <Sparkles size={15} />, text: t('landing.lp.perk4'), color: DS.amber },
              ].map(b => (
                <div key={b.text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${b.color}15`, border: `1px solid ${b.color}25` }}>
                    <span style={{ color: b.color }}>{b.icon}</span>
                  </div>
                  <span style={{ color: DS.text3, fontSize: 14, lineHeight: 1.6 }}>{b.text}</span>
                </div>
              ))}
            </div>
            <Link to="/khach-hang" style={{ background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 600, padding: '11px 24px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(129,140,248,0.3)' }}>
              {t('landing.lp.cta')} <ArrowRight size={15} />
            </Link>
          </motion.div>

          {/* Right: Rank progression */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="rounded-2xl p-7" style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${DS.border}`, backdropFilter: 'blur(12px)' }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 20 }}>{t('landing.lp.rankTableLabel')}</div>
              <div className="space-y-2.5">
                {rankFlow.map((r, i) => (
                  <motion.div
                    key={r.rank}
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: i === 3 ? `${r.color}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 3 ? `${r.color}30` : 'transparent'}` }}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <span style={{ color: r.color, fontSize: 22, textShadow: `0 0 10px ${r.color}50`, width: 28, textAlign: 'center' }}>{r.symbol}</span>
                    <div className="flex-1">
                      <div style={{ color: r.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, letterSpacing: '0.12em' }}>{r.rank}</div>
                      <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{t('landing.lp.rankNeed')}: {r.desc}</div>
                    </div>
                    {i === 3 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: `${r.color}20`, border: `1px solid ${r.color}40` }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
                        <span style={{ color: r.color, fontSize: 9, fontFamily: DS.mono }}>{t('landing.lp.rankYou')}</span>
                      </div>
                    )}
                    <div className="w-20 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (7 - i) * 15)}%`, background: r.color }} />
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6 }}>
                  {t('landing.lp.note')}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── PORTFOLIO PREVIEW ────────────────────────────────────────────────────
function PortfolioPreview() {
  const { t } = useI18n();
  const projects = [
    { id: 1, title: 'VNRetail Platform', tag: 'E-commerce SaaS', metric: '+320% doanh thu', img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=500&q=80', color: DS.blue },
    { id: 2, title: 'MedApp Vietnam', tag: 'Mobile Health App', metric: '200K downloads', img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=500&q=80', color: DS.purple },
    { id: 3, title: 'AnalyticsPro', tag: 'Dashboard SaaS', metric: '#1 market share', img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=500&q=80', color: DS.cyan },
    { id: 4, title: 'EduViet Portal', tag: 'EdTech Platform', metric: '10K students', img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=500&q=80', color: DS.green },
    { id: 5, title: 'StartupHub', tag: 'Corporate Website', metric: '+45% conversion', img: 'https://images.unsplash.com/photo-1588336443962-49d88df004a1?auto=format&fit=crop&w=500&q=80', color: DS.amber },
    { id: 6, title: 'FinDash Enterprise', tag: 'FinTech Dashboard', metric: '500+ tx/day', img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=500&q=80', color: DS.red },
  ];

  return (
    <section className="py-24 px-6" style={{ background: 'linear-gradient(160deg, rgba(15,23,42,0.3) 0%, rgba(2,6,23,0) 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
          <div>
            <Badge label={t('landing.portfolio.badge')} color={DS.cyan} />
            <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '0.05em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('landing.portfolio.heading')}
            </h2>
          </div>
          <Link to="/du-an" style={{ color: DS.blue, fontSize: 13, textDecoration: 'none', fontFamily: DS.mono, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6, border: `1px solid rgba(59,130,246,0.3)`, padding: '8px 16px', borderRadius: 8 }}>
            {t('landing.portfolio.viewAll')} <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              className="relative rounded-2xl overflow-hidden cursor-pointer group"
              style={{ border: `1px solid ${DS.border}` }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.015, borderColor: `${p.color}40` }}
            >
              <Link to={`/du-an/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ position: 'relative', overflow: 'hidden', height: 200 }}>
                  <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${p.color}cc, rgba(2,6,23,0.9))` }}>
                    <div className="text-center px-6">
                      <div style={{ color: '#fff', fontFamily: DS.heading, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>{p.title}</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 16 }}>{p.metric}</div>
                      <div style={{ color: '#fff', fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 14px', borderRadius: 6, display: 'inline-block' }}>
                        {t('landing.portfolio.viewDetails')} →
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4" style={{ background: DS.bgCard }}>
                  <div style={{ color: p.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 4 }}>{p.tag}</div>
                  <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{p.title}</div>
                  <div style={{ color: DS.green, fontSize: 12, fontFamily: DS.mono, marginTop: 4 }}>{p.metric}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── TESTIMONIALS ─────────────────────────────────────────────────────────
function TestimonialsSection() {
  const { t } = useI18n();
  const testimonials = [
    {
      name: 'Nguyễn Minh Tuấn', role: 'CEO, TechViet JSC', rank: 'GOLD', rankColor: '#FFD700', rankSymbol: '★',
      quote: 'LOOP Solutions đã giúp chúng tôi ra mắt SaaS platform trong 3 tháng. Chất lượng code vượt kỳ vọng, đội ngũ cực kỳ chuyên nghiệp. LP tích lũy giúp tôi tiết kiệm 18% hóa đơn dự án tiếp theo.',
    },
    {
      name: 'Trần Thu Hằng', role: 'Marketing Director, VNRetail', rank: 'SILVER', rankColor: '#CBD5E1', rankSymbol: '◇',
      quote: 'Hệ thống LP thực sự thú vị! Tôi tích lũy đủ điểm để giảm 15% cho dự án tiếp theo. Giải thích rõ ràng LP chỉ là điểm thưởng, không phải tiền — rất minh bạch và chuyên nghiệp.',
    },
    {
      name: 'Lê Quang Đức', role: 'Founder, Startup Hub', rank: 'PLATINUM', rankColor: '#14B8A6', rankSymbol: '❋',
      quote: 'Dashboard tracking real-time giúp tôi nắm rõ tiến độ mọi lúc. Không cần phải email hỏi liên tục. Giá cả VNĐ minh bạch, không phát sinh thêm. Tuyệt vời!',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <Badge label={t('landing.testimonials.badge')} color={DS.green} />
          <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('landing.testimonials.heading')}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              className="rounded-2xl p-7 flex flex-col"
              style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${DS.border}`, backdropFilter: 'blur(12px)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ borderColor: `${t.rankColor}30`, boxShadow: `0 0 30px ${t.rankColor}08` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[1,2,3,4,5].map(s => <Star key={s} size={13} style={{ color: DS.amber, fill: DS.amber }} />)}
              </div>
              <p style={{ color: DS.text2, fontSize: 13.5, lineHeight: 1.9, flex: 1, marginBottom: 20, fontStyle: 'italic' }}>
                "{t.quote}"
              </p>
              <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${DS.border}` }}>
                <div>
                  <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{t.role}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span style={{ color: t.rankColor, fontSize: 14 }}>{t.rankSymbol}</span>
                    <span style={{ color: t.rankColor, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{t.rank}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── ACADEMY TEASER ───────────────────────────────────────────────────────
function AcademyTeaser() {
  const { t } = useI18n();
  return (
    <section className="py-24 px-6" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.5) 0%, rgba(11,17,34,0.5) 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'React & Next.js', level: 'Intermediate', rating: 4.9, students: '2.4K', color: DS.blue },
                { title: 'UI/UX with Figma', level: 'Beginner', rating: 4.8, students: '1.8K', color: DS.purple },
                { title: 'Node.js API Pro', level: 'Advanced', rating: 4.9, students: '1.2K', color: DS.cyan },
                { title: 'DevOps & K8s', level: 'Advanced', rating: 4.7, students: '890', color: DS.green },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${c.color}20` }}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ borderColor: `${c.color}50` }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${c.color}15` }}>
                    <Play size={14} style={{ color: c.color }} />
                  </div>
                  <div style={{ color: DS.text, fontSize: 12, fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{c.title}</div>
                  <div style={{ color: c.color, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>{c.level}</div>
                  <div className="flex items-center gap-2">
                    <Star size={10} style={{ color: DS.amber, fill: DS.amber }} />
                    <span style={{ color: DS.amber, fontSize: 10, fontFamily: DS.mono }}>{c.rating}</span>
                    <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>({c.students})</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Badge label={t('landing.academy.badge')} color={DS.amber} />
            <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 900, letterSpacing: '0.05em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>
              {t('landing.academy.heading')}
            </h2>
            <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              {t('landing.academy.description')}
            </p>
            <div className="flex items-center gap-6 mb-8">
              {[{ val: '6+', label: t('landing.academy.statCourses') }, { val: '10K+', label: t('landing.academy.statStudents') }, { val: '4.9★', label: t('landing.academy.statRating') }].map(s => (
                <div key={s.label}>
                  <div style={{ color: DS.amber, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.val}</div>
                  <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <Link to="/hoc-vien" style={{ background: GRD.gold, color: '#000', fontSize: 14, fontWeight: 700, padding: '11px 24px', borderRadius: 10, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Play size={15} />
              {t('landing.academy.cta')}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── FINAL CTA ────────────────────────────────────────────────────────────
function FinalCTA() {
  const { t } = useI18n();
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.15) 0%, rgba(129,140,248,0.1) 50%, rgba(20,184,166,0.08) 100%)' }}
      />
      <div className="max-w-4xl mx-auto text-center relative">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <Badge label={t('landing.cta.badge')} />
          <h2 style={{ fontFamily: DS.heading, fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, letterSpacing: '0.05em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16, lineHeight: 1.15 }}>
            {t('landing.cta.heading')}
          </h2>
          <p style={{ color: DS.text3, fontSize: 16, lineHeight: 1.8, marginBottom: 40, maxWidth: 540, margin: '0 auto 40px' }}>
            {t('landing.cta.description')}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/dat-lich" style={{ background: GRD.primary, color: '#fff', fontSize: 16, fontWeight: 700, padding: '16px 36px', borderRadius: 16, textDecoration: 'none', boxShadow: '0 0 50px rgba(129,140,248,0.5), 0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '0.02em' }}>
              <Rocket size={18} />
              {t('landing.cta.ctaProject')}
            </Link>
            <Link to="/lien-he" style={{ color: DS.text2, fontSize: 15, padding: '16px 36px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none', background: 'rgba(255,255,255,0.04)' }}>
              {t('landing.cta.ctaContact')}
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-10">
            {[t('landing.cta.bullet1'), t('landing.cta.bullet2'), t('landing.cta.bullet3'), t('landing.cta.bullet4')].map(item => (
              <div key={item} className="flex items-center gap-2">
                <Check size={13} style={{ color: DS.green }} />
                <span style={{ color: DS.text4, fontSize: 12 }}>{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: DS.bg, fontFamily: DS.body }}>
      <AnimatedBg />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <Marquee />
        <StatsSection />
        <ServicesSection />
        <ProcessSection />
        <LPSystemSection />
        <PortfolioPreview />
        <TestimonialsSection />
        <AcademyTeaser />
        <FinalCTA />
      </div>
    </div>
  );
}
