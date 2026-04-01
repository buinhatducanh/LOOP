/**
 * StatCard — Shared animated KPI card for admin dashboards.
 * Used by OverviewTab and AnalyticsTab.
 * Animation triggers on scroll-into-view via IntersectionObserver.
 */
import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DS } from '../layout/ds';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, sub, color, icon, trend, trendUp }: StatCardProps) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <motion.div
      ref={ref}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ borderColor: `${color}40`, boxShadow: `0 0 24px ${color}12` }}
    >
      {/* Ambient glow top-right */}
      <div
        className="absolute pointer-events-none"
        style={{ top: -30, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${color}08`, filter: 'blur(20px)' }}
      />

      <div className="flex items-start justify-between mb-4">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
          animate={inView ? {
            boxShadow: [`0 0 0px ${color}00`, `0 0 14px ${color}50`, `0 0 0px ${color}00`],
          } : {}}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
        >
          <span style={{ color }}>{icon}</span>
        </motion.div>

        {trend && (
          <div className="flex items-center gap-1" style={{ color: trendUp ? DS.green : DS.red, fontSize: 12 }}>
            {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend}
          </div>
        )}
      </div>

      <div style={{ color, fontFamily: DS.heading, fontSize: 26, fontWeight: 700, textShadow: `0 0 12px ${color}50`, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ color: DS.text3, fontSize: 13, marginTop: 6 }}>{label}</div>
      {sub && <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 3 }}>{sub}</div>}

      {/* Animated bottom bar — fires when card enters viewport */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
        initial={{ width: '0%' }}
        animate={{ width: inView ? '100%' : '0%' }}
        transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
      />
    </motion.div>
  );
}
