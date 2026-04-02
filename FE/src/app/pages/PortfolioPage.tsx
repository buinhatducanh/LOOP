import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useI18n } from '@/hooks/useI18n';

const PROJECTS = [
  { id: 1, title: 'VNRetail Platform', tag: 'E-commerce SaaS', cat: 'SaaS', metric1: '+320%', m1label: 'Doanh thu', metric2: '50K', m2label: 'Users', img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=600&q=80', color: DS.blue, tags: ['React', 'Node.js', 'AWS'] },
  { id: 2, title: 'MedApp Vietnam', tag: 'Mobile Health App', cat: 'App', metric1: '4.9★', m1label: 'App Store', metric2: '200K', m2label: 'Downloads', img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=600&q=80', color: DS.purple, tags: ['React Native', 'Firebase'] },
  { id: 3, title: 'AnalyticsPro Dashboard', tag: 'Data Analytics SaaS', cat: 'SaaS', metric1: '#1', m1label: 'Market Share', metric2: '99.9%', m2label: 'Uptime', img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=600&q=80', color: DS.cyan, tags: ['React', 'Python', 'BigQuery'] },
  { id: 4, title: 'EduViet Portal', tag: 'EdTech Platform', cat: 'Website', metric1: '10K', m1label: 'Students', metric2: '+180%', m2label: 'Engagement', img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=600&q=80', color: DS.green, tags: ['Next.js', 'Supabase', 'Tailwind'] },
  { id: 5, title: 'StartupHub Landing', tag: 'Corporate Website', cat: 'Website', metric1: '98', m1label: 'PageSpeed', metric2: '+45%', m2label: 'Conversion', img: 'https://images.unsplash.com/photo-1588336443962-49d88df004a1?auto=format&fit=crop&w=600&q=80', color: DS.amber, tags: ['React', 'Framer Motion'] },
  { id: 6, title: 'FinDash Enterprise', tag: 'FinTech Dashboard', cat: 'SaaS', metric1: '$2M', m1label: 'Managed', metric2: '500+', m2label: 'Transactions/day', img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=600&q=80', color: DS.red, tags: ['React', 'Rust', 'PostgreSQL'] },
];

export default function PortfolioPage() {
  const { t } = useI18n();
  const [active, setActive] = useState('Tất cả');
  const filtered = active === 'Tất cả' ? PROJECTS : PROJECTS.filter(p => p.cat === active);

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>
      {/* Header */}
      <section className="py-20 px-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(129,140,248,0.07) 0%, transparent 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}>
            <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.22em' }}>{t('portfolio.badge')}</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 40, fontWeight: 900, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 14 }}>
            {t('portfolio.heroTitle')}
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>{t('portfolio.heroDesc')}</p>
        </div>
      </section>

      {/* Filter */}
      <div className="flex justify-center gap-3 pb-10 flex-wrap px-6">
        {[
          { key: 'all', label: t('portfolio.categories.all') },
          { key: 'Website', label: t('portfolio.categories.web') },
          { key: 'App', label: t('portfolio.categories.app') },
          { key: 'SaaS', label: t('portfolio.categories.design') },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            style={{
              padding: '8px 20px',
              borderRadius: 30,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              background: active === key ? GRD.primary : 'transparent',
              border: active === key ? 'none' : `1px solid ${DS.border}`,
              color: active === key ? '#fff' : DS.text3,
              boxShadow: active === key ? '0 0 16px rgba(129,140,248,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              className="rounded-2xl overflow-hidden cursor-pointer group"
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              whileHover={{ scale: 1.015, borderColor: `${p.color}40`, boxShadow: `0 8px 32px ${p.color}20` }}
              layout
            >
              {/* Image */}
              <div style={{ position: 'relative', overflow: 'hidden', height: 200 }}>
                <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${p.color}cc, rgba(2,6,23,0.9))` }}
                >
                  <Link
                    to={`/du-an/${p.id}`}
                    style={{ color: '#fff', fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.4)', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {t('portfolio.viewProject')} <ArrowRight size={12} />
                  </Link>
                </div>
                {/* Category badge */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg" style={{ background: 'rgba(2,6,23,0.85)', border: `1px solid ${p.color}40`, backdropFilter: 'blur(8px)' }}>
                  <span style={{ color: p.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.1em' }}>{p.tag}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{p.title}</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl text-center" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <div style={{ color: p.color, fontFamily: DS.heading, fontSize: 18, fontWeight: 700 }}>{p.metric1}</div>
                    <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{p.m1label}</div>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <div style={{ color: p.color, fontFamily: DS.heading, fontSize: 18, fontWeight: 700 }}>{p.metric2}</div>
                    <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{p.m2label}</div>
                  </div>
                </div>
                <Link to={`/du-an/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: p.color, fontSize: 12, fontFamily: DS.mono, textDecoration: 'none', letterSpacing: '0.1em' }}>
                  {t('portfolio.viewProjectLink')} <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6" style={{ background: 'rgba(15,23,42,0.4)', borderTop: `1px solid ${DS.border}` }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 style={{ fontFamily: DS.heading, fontSize: 28, fontWeight: 900, color: DS.text, marginBottom: 12 }}>{t('portfolio.ctaTitle')}</h2>
          <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{t('portfolio.ctaDesc')}</p>
          <Link to="/lien-he" style={{ background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 28px', borderRadius: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 0 24px rgba(129,140,248,0.35)' }}>
            {t('portfolio.ctaButton')} <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
