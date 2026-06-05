"use client";

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { ArrowUpRight, TrendingUp, Users, BarChart3, Globe, Zap } from 'lucide-react';
import { LP2Navbar } from '@/app/landing2/sections/LP2Navbar';

const INTER = "'Inter', 'Instrument Sans', system-ui, sans-serif";

const FEATURED = {
  name: 'Luxe Commerce',
  industry: 'Thương Mại Điện Tử Cao Cấp',
  description:
    'Nền tảng thương mại điện tử hàng hiệu với trải nghiệm mua sắm đẳng cấp, tích hợp AI personalization và 3D product viewer.',
  tech: ['Next.js 14', 'Three.js', 'Framer Motion', 'Stripe', 'Sanity CMS'],
  stats: [
    { label: 'Doanh Thu', value: '+340%', icon: TrendingUp },
    { label: 'Conversion', value: '+280%', icon: BarChart3 },
    { label: 'Người Dùng', value: '+195%', icon: Users },
  ],
  image:
    'https://images.unsplash.com/photo-1487014679447-9f8336841d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
};

const PROJECTS = [
  {
    id: 1,
    name: 'Nova Analytics',
    industry: 'SaaS · Phân Tích Dữ Liệu',
    tech: ['React', 'D3.js', 'Python', 'AWS'],
    stat: '+240%',
    statLabel: 'User Growth',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    accent: '#3B82F6',
    size: 'large' as const,
    pos: { top: '4%', left: '0', width: '42%' },
    rotate: -1.8,
    z: 20,
  },
  {
    id: 2,
    name: 'Maison Mode',
    industry: 'Fashion · E-commerce',
    tech: ['Next.js', 'Shopify Plus', 'Tailwind'],
    stat: '+180%',
    statLabel: 'Doanh Số',
    image:
      'https://images.unsplash.com/photo-1539278383962-a7774385fa02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    accent: '#EC4899',
    size: 'medium' as const,
    pos: { top: '0', left: '35%', width: '32%' },
    rotate: 1.4,
    z: 30,
  },
  {
    id: 3,
    name: 'TechVision Pro',
    industry: 'B2B · Technology',
    tech: ['Vue 3', 'Node.js', 'PostgreSQL'],
    stat: '+310%',
    statLabel: 'Qualified Leads',
    image:
      'https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    accent: '#8B5CF6',
    size: 'small' as const,
    pos: { top: '2%', right: '0', width: '24%' },
    rotate: -0.8,
    z: 20,
  },
  {
    id: 4,
    name: 'Savor Digital',
    industry: 'F&B · Ẩm Thực',
    tech: ['React Native', 'Firebase', 'Stripe'],
    stat: '+420%',
    statLabel: 'Đơn Hàng',
    image:
      'https://images.unsplash.com/photo-1556742205-e10c9486e506?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    accent: '#F59E0B',
    size: 'medium' as const,
    pos: { bottom: '2%', left: '6%', width: '34%' },
    rotate: 1.6,
    z: 25,
  },
  {
    id: 5,
    name: 'Aura Marketing',
    industry: 'Digital Marketing Agency',
    tech: ['WordPress', 'HubSpot', 'GA4', 'Meta Ads'],
    stat: '+290%',
    statLabel: 'Organic Traffic',
    image:
      'https://images.unsplash.com/photo-1702047063975-0841a0621b5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    accent: '#10B981',
    size: 'large' as const,
    pos: { bottom: '0%', right: '0', width: '43%' },
    rotate: -1.2,
    z: 28,
  },
];

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 8 + 10,
        delay: Math.random() * 6,
        opacity: Math.random() * 0.4 + 0.1,
      }))
    );
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background:
              p.id % 3 === 0
                ? 'rgba(139,92,246,0.5)'
                : p.id % 3 === 1
                  ? 'rgba(59,130,246,0.5)'
                  : 'rgba(168,85,247,0.4)',
            opacity: p.opacity,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-8, 8, -8],
            opacity: [p.opacity * 0.5, p.opacity, p.opacity * 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function BackgroundEffects() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large aurora orbs */}
      <motion.div
        className="absolute"
        style={{
          top: '-20%',
          left: '10%',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(167,139,250,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, 8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute"
        style={{
          top: '30%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(96,165,250,0.1) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{ scale: [1, 1.08, 1], rotate: [0, -6, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute"
        style={{
          bottom: '-10%',
          left: '30%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at center, rgba(236,72,153,0.07) 0%, rgba(167,139,250,0.05) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />

      {/* Holographic crystal sphere */}
      <motion.div
        className="absolute"
        style={{
          top: '8%',
          right: '8%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background:
            'conic-gradient(from 0deg, rgba(167,139,250,0.3), rgba(96,165,250,0.3), rgba(236,72,153,0.25), rgba(167,139,250,0.3))',
          boxShadow:
            '0 0 40px rgba(139,92,246,0.15), inset 0 0 30px rgba(255,255,255,0.4)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.6)',
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner sphere highlight */}
      <div
        className="absolute"
        style={{
          top: 'calc(8% + 18px)',
          right: 'calc(8% + 18px)',
          width: 84,
          height: 84,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 35% 35%, rgba(255,255,255,0.7) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Metallic liquid blob */}
      <motion.div
        className="absolute"
        style={{
          bottom: '15%',
          left: '5%',
          width: 80,
          height: 80,
          background:
            'radial-gradient(ellipse at 40% 40%, rgba(203,213,225,0.8) 0%, rgba(148,163,184,0.5) 50%, transparent 70%)',
          borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
          filter: 'blur(2px)',
          border: '1px solid rgba(255,255,255,0.8)',
        }}
        animate={{
          borderRadius: [
            '60% 40% 70% 30% / 50% 60% 40% 50%',
            '40% 60% 30% 70% / 60% 40% 60% 40%',
            '60% 40% 70% 30% / 50% 60% 40% 50%',
          ],
          rotate: [0, 20, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Light streak lines */}
      <div
        className="absolute"
        style={{
          top: '20%',
          left: '0',
          right: '0',
          height: '1px',
          background:
            'linear-gradient(to right, transparent, rgba(167,139,250,0.2), rgba(96,165,250,0.3), rgba(167,139,250,0.2), transparent)',
          opacity: 0.6,
        }}
      />
      <div
        className="absolute"
        style={{
          top: '65%',
          left: '0',
          right: '0',
          height: '1px',
          background:
            'linear-gradient(to right, transparent, rgba(96,165,250,0.15), rgba(167,139,250,0.25), rgba(96,165,250,0.15), transparent)',
          opacity: 0.5,
        }}
      />

      <FloatingParticles />
    </div>
  );
}

function GlassCard({
  project,
  delay = 0,
}: {
  project: any;
  delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className="absolute cursor-pointer group"
      style={{
        ...project.pos,
        zIndex: hovered ? 50 : project.z,
        transformOrigin: 'center center',
      }}
      initial={{ opacity: 0, y: 50, scale: 0.92, rotate: project.rotate }}
      animate={
        inView
          ? { opacity: 1, y: 0, scale: 1, rotate: project.rotate }
          : { opacity: 0, y: 50, scale: 0.92, rotate: project.rotate }
      }
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: -14,
        scale: 1.03,
        rotate: 0,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Holographic border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{ zIndex: -1 }}
        animate={{
          boxShadow: hovered
            ? `0 0 0 1.5px ${project.accent}80, 0 20px 60px ${project.accent}30, 0 8px 20px rgba(0,0,0,0.08)`
            : `0 4px 20px rgba(100,80,200,0.06), 0 1px 4px rgba(0,0,0,0.04)`,
        }}
        transition={{ duration: 0.35 }}
      />

      {/* Card body */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow:
            '0 4px 24px rgba(100,80,200,0.07), 0 1px 2px rgba(255,255,255,0.9) inset',
        }}
      >
        {/* Thumbnail */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: '16/9',
            background: '#f0f4ff',
          }}
        >
          <motion.img
            src={project.image}
            alt={project.name}
            className="w-full h-full object-cover"
            animate={{ scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Overlay gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }}
          />
          {/* Light sweep on hover */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: hovered ? '200% center' : '-100% center' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          {/* Stat badge */}
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full"
            style={{
              background: `${project.accent}18`,
              border: `1px solid ${project.accent}40`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span
              style={{
                fontFamily: INTER,
                fontSize: '11px',
                fontWeight: 700,
                color: project.accent,
                letterSpacing: '0.02em',
              }}
            >
              {project.stat} {project.statLabel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className="truncate"
                style={{
                  fontFamily: INTER,
                  fontSize: project.size === 'small' ? '14px' : '15px',
                  fontWeight: 700,
                  color: '#09090b',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}
              >
                {project.name}
              </h3>
              <p
                style={{
                  fontFamily: INTER,
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#717182',
                  marginTop: '2px',
                  letterSpacing: '0.01em',
                }}
              >
                {project.industry}
              </p>
            </div>
            <motion.div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: `${project.accent}15`,
                border: `1px solid ${project.accent}30`,
              }}
              animate={{ scale: hovered ? 1.15 : 1, rotate: hovered ? 45 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowUpRight size={14} color={project.accent} strokeWidth={2.5} />
            </motion.div>
          </div>

          {project.size !== 'small' && (
            <div className="flex flex-wrap gap-1 mt-3">
              {project.tech.slice(0, 3).map((t: string) => (
                <span
                  key={t}
                  style={{
                    fontFamily: INTER,
                    fontSize: '10px',
                    fontWeight: 500,
                    color: 'var(--muted-foreground)',
                    background: 'rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: '6px',
                    padding: '2px 7px',
                    letterSpacing: '0.01em',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FeaturedProject({ project }: { project: any }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 120, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), { stiffness: 120, damping: 20 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto"
      style={{ maxWidth: '900px', perspective: '1200px' }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background:
            'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1), rgba(236,72,153,0.1))',
          filter: 'blur(30px)',
          transform: 'scale(1.04)',
          zIndex: -1,
        }}
      />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouse}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="cursor-pointer"
      >
        {/* Holographic border */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.5), rgba(236,72,153,0.4), rgba(139,92,246,0.5))',
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: hovered ? 1 : 0.5,
            transition: 'opacity 0.4s ease',
          }}
        />

        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow:
              '0 24px 64px rgba(100,80,200,0.12), 0 8px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(255,255,255,0.95) inset',
          }}
        >
          {/* Browser mockup header */}
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{
              background: 'rgba(248,248,252,0.9)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex gap-1.5">
              {['#FF5F57', '#FFBD2E', '#28CA41'].map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div
              className="flex-1 mx-4 h-6 rounded-md flex items-center px-3"
              style={{
                background: 'rgba(0,0,0,0.05)',
                maxWidth: '360px',
              }}
            >
              <Globe size={10} color="#717182" className="mr-1.5" />
              <span
                style={{
                  fontFamily: INTER,
                  fontSize: '11px',
                  color: '#717182',
                }}
              >
                {project.slug}.loops.vn
              </span>
            </div>
          </div>

          {/* Screenshot */}
          <div className="relative" style={{ aspectRatio: '16/9' }}>
            <motion.img
              src={project.image}
              alt={project.name}
              className="w-full h-full object-cover"
              animate={{ scale: hovered ? 1.03 : 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.08) 100%)',
              }}
            />
            {/* Holographic sweep */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)',
              }}
              animate={{ x: hovered ? '100%' : '-100%' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Bottom info bar */}
          <div className="px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(139,92,246,0.1)',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: INTER,
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#7C3AED',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Dự Án Nổi Bật
                    </span>
                  </div>
                </div>
                <h3
                  style={{
                    fontFamily: INTER,
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#09090b',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.2,
                  }}
                >
                  {project.name}
                </h3>
                <p
                  style={{
                    fontFamily: INTER,
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#717182',
                    marginTop: '4px',
                  }}
                >
                  {project.industry}
                </p>
              </div>

              <div className="flex gap-5">
                {project.stats.map((s: any) => (
                  <div key={s.label} className="text-center">
                    <div
                      style={{
                        fontFamily: INTER,
                        fontSize: '24px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontFamily: INTER,
                        fontSize: '10px',
                        fontWeight: 500,
                        color: '#717182',
                        marginTop: '3px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              {project.tech.map((t: string) => (
                <span
                  key={t}
                  style={{
                    fontFamily: INTER,
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#717182',
                    background: 'rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    padding: '3px 10px',
                  }}
                >
                  {t}
                </span>
              ))}
              <motion.button
                className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full"
                style={{
                  fontFamily: INTER,
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#7C3AED',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  cursor: 'pointer',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                Xem Case Study
                <ArrowUpRight size={12} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating label */}
      <motion.div
        className="absolute -top-4 -right-4 px-4 py-2 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 8px 24px rgba(100,80,200,0.12)',
          zIndex: 10,
        }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span style={{ fontFamily: INTER, fontSize: '12px', fontWeight: 600, color: '#09090b' }}>
            Live Project
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionHeader() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className="relative text-center"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Aurora beam behind title */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(167,139,250,0.15) 0%, rgba(96,165,250,0.1) 40%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />

      <motion.div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
        style={{
          background: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.2)',
          backdropFilter: 'blur(10px)',
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Zap size={12} color="#7C3AED" strokeWidth={2.5} />
        <span
          style={{
            fontFamily: INTER,
            fontSize: '12px',
            fontWeight: 600,
            color: '#7C3AED',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Portfolio · Case Study
        </span>
      </motion.div>

      <motion.h2
        className="relative"
        style={{
          fontFamily: INTER,
          fontSize: 'clamp(52px, 8vw, 96px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 0.95,
          color: '#09090b',
          marginBottom: '0.3em',
        }}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, delay: 0.15 }}
      >
        Dự Án
        <br />
        <span
          style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 45%, #8B5CF6 80%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Tiêu Biểu
        </span>
      </motion.h2>

      <motion.p
        style={{
          fontFamily: INTER,
          fontSize: 'clamp(14px, 1.5vw, 17px)',
          fontWeight: 400,
          color: '#717182',
          maxWidth: '540px',
          margin: '0 auto',
          lineHeight: 1.7,
          letterSpacing: '0.01em',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.25 }}
      >
        Những website và chiến dịch marketing đã góp phần tăng trưởng doanh nghiệp thực tế.
      </motion.p>

      {/* Decorative line */}
      <motion.div
        className="mx-auto mt-8"
        style={{ width: 60, height: 2, borderRadius: 2, background: 'linear-gradient(to right, #7C3AED, #3B82F6)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.35 }}
      />
    </motion.div>
  );
}

function AsymmetricGallery({ items }: { items: any[] }) {
  const ref = useRef(null);
  const containerHeight = Math.max(680, Math.ceil(items.length / 5) * 650) + 'px';

  return (
    <div ref={ref} className="relative w-full" style={{ height: containerHeight }}>
      {items.map((project, i) => (
        <GlassCard key={project.id} project={project} delay={i * 0.12 + 0.1} />
      ))}
    </div>
  );
}

const PRESETS = [
  {
    accent: '#3B82F6',
    size: 'large' as const,
    pos: { top: '4%', left: '0', width: '42%' },
    rotate: -1.8,
    z: 20,
  },
  {
    accent: '#EC4899',
    size: 'medium' as const,
    pos: { top: '0%', left: '35%', width: '32%' },
    rotate: 1.4,
    z: 30,
  },
  {
    accent: '#8B5CF6',
    size: 'small' as const,
    pos: { top: '2%', right: '0', width: '24%' },
    rotate: -0.8,
    z: 20,
  },
  {
    accent: '#F59E0B',
    size: 'medium' as const,
    pos: { top: '52%', left: '6%', width: '34%' },
    rotate: 1.6,
    z: 25,
  },
  {
    accent: '#10B981',
    size: 'large' as const,
    pos: { top: '48%', right: '0', width: '43%' },
    rotate: -1.2,
    z: 28,
  },
];

export function PortfolioLungLo({
  locale,
  settings,
  projects = [],
}: {
  locale: string;
  settings: Record<string, string>;
  projects?: any[];
}) {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const fgY = useTransform(scrollYProgress, [0, 1], ['0%', '-6%']);

  // Override the global dark body background (#0C0C14) with white for this page
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#09090b';
    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, []);

  // 1. Determine featured project (from db if exists, otherwise fallback to mock FEATURED)
  const dbFeatured = projects.find((p) => p.isCaseStudy) || projects[0];

  const featured = dbFeatured
    ? {
        id: dbFeatured.id,
        slug: dbFeatured.slug,
        name: dbFeatured.title,
        industry: dbFeatured.industry || dbFeatured.category || 'Technology',
        description: dbFeatured.description || '',
        tech: dbFeatured.techStack && dbFeatured.techStack.length > 0 ? dbFeatured.techStack : ['Next.js', 'Tailwind CSS'],
        stats: [
          { label: dbFeatured.roiMetric || 'Hiệu quả', value: dbFeatured.primaryMetric || '+150%', icon: TrendingUp },
          { label: 'Năm Triển Khai', value: dbFeatured.year || '2026', icon: BarChart3 },
          { label: 'Khách Hàng', value: dbFeatured.client || 'Đối Tác', icon: Users },
        ],
        image: dbFeatured.image || 'https://images.unsplash.com/photo-1487014679447-9f8336841d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
      }
    : {
        name: 'Luxe Commerce',
        industry: 'Thương Mại Điện Tử Cao Cấp',
        description:
          'Nền tảng thương mại điện tử hàng hiệu với trải nghiệm mua sắm đẳng cấp, tích hợp AI personalization và 3D product viewer.',
        tech: ['Next.js 14', 'Three.js', 'Framer Motion', 'Stripe', 'Sanity CMS'],
        stats: [
          { label: 'Doanh Thu', value: '+340%', icon: TrendingUp },
          { label: 'Conversion', value: '+280%', icon: BarChart3 },
          { label: 'Người Dùng', value: '+195%', icon: Users },
        ],
        image:
          'https://images.unsplash.com/photo-1487014679447-9f8336841d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
      };

  // 2. Determine gallery projects (exclude featured, fallback to PROJECTS if empty)
  const dbGallery = dbFeatured
    ? projects.filter((p) => p.id !== dbFeatured.id)
    : projects;

  const galleryItems =
    dbGallery.length > 0
      ? dbGallery.map((p, i) => {
          const presetIndex = i % 5;
          const group = Math.floor(i / 5);
          const preset = PRESETS[presetIndex];

          const pos = { ...preset.pos };
          if ('top' in pos && pos.top) {
            pos.top = `calc(${pos.top} + ${group * 650}px)`;
          }

          return {
            id: p.id,
            slug: p.slug,
            name: p.title,
            industry: p.industry || p.category || 'Technology',
            tech: p.techStack && p.techStack.length > 0 ? p.techStack : ['React', 'Next.js'],
            stat: p.primaryMetric || '+120%',
            statLabel: p.roiMetric || 'Tăng trưởng',
            image: p.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
            accent: preset.accent,
            size: preset.size,
            pos,
            rotate: preset.rotate,
            z: preset.z,
          };
        })
      : PROJECTS.map((p) => {
          const presetIndex = (p.id - 1) % 5;
          const group = Math.floor((p.id - 1) / 5);
          const preset = PRESETS[presetIndex];

          const pos = { ...preset.pos };
          if ('top' in pos && pos.top) {
            pos.top = `calc(${pos.top} + ${group * 650}px)`;
          }

          return {
            ...p,
            pos,
            accent: preset.accent,
            size: preset.size,
            rotate: preset.rotate,
            z: preset.z,
          };
        });

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', fontFamily: "'Inter', 'Instrument Sans', system-ui, sans-serif" }}>
      {/* Landing Page Navbar */}
      <LP2Navbar locale={locale} settings={settings} />

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: '#ffffff',
          minHeight: '100vh',
          padding: '160px 0 120px', // Extra padding-top so content clears the fixed topbar + navbar
        }}
      >
        {/* Parallax background */}
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <BackgroundEffects />
        </motion.div>

        <motion.div
          className="relative"
          style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(24px,4vw,64px)', y: fgY }}
        >
          {/* Header */}
          <div style={{ marginBottom: '80px' }}>
            <SectionHeader />
          </div>

          {/* Section label */}
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="h-px flex-1"
              style={{
                background: 'linear-gradient(to right, rgba(139,92,246,0.3), transparent)',
                maxWidth: '40px',
              }}
            />
            <span
              style={{
                fontFamily: INTER,
                fontSize: '11px',
                fontWeight: 600,
                color: '#717182',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Featured Work
            </span>
            <div
              className="h-px"
              style={{
                width: '40px',
                background: 'linear-gradient(to left, rgba(139,92,246,0.3), transparent)',
              }}
            />
          </motion.div>

          {/* Featured Project */}
          <div style={{ marginBottom: '100px' }}>
            <FeaturedProject project={featured} />
          </div>

          {/* Gallery label */}
          <motion.div
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-px"
                style={{
                  width: '40px',
                  background: 'linear-gradient(to right, rgba(139,92,246,0.3), transparent)',
                }}
              />
              <span
                style={{
                  fontFamily: INTER,
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#717182',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                All Projects
              </span>
            </div>
            <span
              style={{
                fontFamily: INTER,
                fontSize: '12px',
                fontWeight: 500,
                color: '#717182',
              }}
            >
              {galleryItems.length} dự án
            </span>
          </motion.div>

          {/* Asymmetric Gallery */}
          <AsymmetricGallery items={galleryItems} />

          {/* Bottom CTA */}
          <motion.div
            className="flex justify-center mt-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              onClick={() => {
                // Smooth scroll back to top or navigate back home
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="relative flex items-center gap-3 px-8 py-4 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139,92,246,0.25)',
                boxShadow: '0 8px 32px rgba(139,92,246,0.12)',
                cursor: 'pointer',
              }}
              whileHover={{
                scale: 1.04,
                boxShadow: '0 12px 40px rgba(139,92,246,0.2)',
                transition: { duration: 0.3 },
              }}
              whileTap={{ scale: 0.98 }}
            >
              <span
                style={{
                  fontFamily: INTER,
                  fontSize: '14px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.01em',
                }}
              >
                Trở Lên Đầu Trang
              </span>
              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                <ArrowUpRight size={16} color="#7C3AED" strokeWidth={2.5} style={{ transform: 'rotate(-45deg)' }} />
              </motion.div>
            </motion.button>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
