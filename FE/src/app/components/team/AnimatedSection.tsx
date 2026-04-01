/**
 * AnimatedSection — Scroll-triggered reveal wrapper
 * Uses Intersection Observer for performant scroll-based animations.
 * Supports 3 tiers with different animation intensities.
 */

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';

export type Tier = 1 | 2 | 3;

interface AnimatedSectionProps {
  children: ReactNode;
  tier?: Tier;
  className?: string;
  /** Delay offset for stagger children (ms) */
  staggerDelay?: number;
  /** Override animation config */
  animate?: boolean;
}

// ── Tier animation configs ─────────────────────────────────────────────
const TIER_CONFIG = {
  1: {
    // Leadership: cinematic reveal — slow, majestic
    initial: { opacity: 0, y: 70, scale: 0.92 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    viewportMargin: '-80px',
  },
  2: {
    // Core team: professional reveal — confident
    initial: { opacity: 0, y: 40, scale: 0.96 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    viewportMargin: '-50px',
  },
  3: {
    // Specialists: efficient fade — quick
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' as const },
    viewportMargin: '-30px',
  },
} as const;

// ── Stagger children config ───────────────────────────────────────────
const STAGGER_DELAY_BASE = {
  1: 0.12,
  2: 0.07,
  3: 0.04,
} as const;

export function AnimatedSection({
  children,
  tier = 3,
  className,
  staggerDelay,
  animate = true,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!animate) { setInView(true); return; }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: TIER_CONFIG[tier].viewportMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [tier, animate]);

  const cfg = TIER_CONFIG[tier];
  const delay = staggerDelay ?? STAGGER_DELAY_BASE[tier];

  if (!animate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={cfg.initial}
      animate={inView ? cfg.whileInView : cfg.initial}
      transition={{
        ...cfg.transition,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerContainer — animates direct children with staggered delays ──
interface StaggerContainerProps {
  children: ReactNode;
  tier?: Tier;
  className?: string;
  staggerChildren?: number;
}

export function StaggerContainer({
  children,
  tier = 2,
  className,
  staggerChildren = 0.06,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseDelay = STAGGER_DELAY_BASE[tier];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerChildren ?? baseDelay / 2,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Child variant for use inside StaggerContainer ──────────────────────
export function StaggerChild({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
      }}
    >
      {children}
    </motion.div>
  );
}
