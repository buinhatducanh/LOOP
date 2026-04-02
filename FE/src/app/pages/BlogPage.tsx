import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Search, Clock, User, ArrowRight } from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useI18n } from '../hooks/useI18n';
import { useLocaleStore } from '../store/localeStore';
import { BLOG_POSTS } from '../data/locales';

// Static color map for blog categories
const catColors: Record<string, string> = {
  Design: DS.blue, Tech: DS.cyan, Marketing: DS.green,
  DevOps: DS.amber, 'LP System': DS.purple,
};

// Per-locale category labels (all-categories filter)
const CATS: Record<string, string> = {
  vi: 'Tất cả', en: 'All', ja: 'すべて', ko: '전체', zh: '全部',
};

export default function BlogPage() {
  const { t } = useI18n();
  const locale = useLocaleStore(s => s.locale);
  const POSTS = BLOG_POSTS[locale] ?? BLOG_POSTS.vi;

  const [activeCat, setActiveCat] = useState(CATS[locale]);
  const [search, setSearch] = useState('');
  const featured = POSTS.find(p => p.featured)!;
  const filtered = POSTS.filter(p =>
    !p.featured &&
    (activeCat === CATS[locale] || p.cat === activeCat) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>
      {/* Header */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.22em' }}>BLOG & INSIGHTS</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 38, fontWeight: 900, letterSpacing: '0.05em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
            {t('blog.title')}
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>{t('blog.subtitle')}</p>
        </div>
      </section>

      {/* Featured post */}
      <section className="px-6 mb-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 cursor-pointer"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
            whileHover={{ borderColor: `${DS.blue}40`, boxShadow: `0 8px 40px rgba(59,130,246,0.12)` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ height: 320, overflow: 'hidden' }}>
              <img src={featured.img} alt={featured.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2.5 py-1 rounded-full" style={{ background: `${catColors[featured.cat] || DS.blue}15`, border: `1px solid ${catColors[featured.cat] || DS.blue}30`, color: catColors[featured.cat] || DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>
                  ★ {t('blog.featured')} · {featured.cat}
                </span>
              </div>
              <h2 style={{ color: DS.text, fontSize: 22, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>{featured.title}</h2>
              <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5" style={{ color: DS.text4, fontSize: 12 }}>
                    <User size={12} /> {t('blog.by')} {featured.author}
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: DS.text4, fontSize: 12 }}>
                    <Clock size={12} /> {featured.time}
                  </div>
                </div>
                <Link to={`/blog/${featured.id}`} style={{ color: DS.blue, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontFamily: DS.mono }}>
                  {t('blog.readMore')} <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters + Search */}
      <section className="px-6 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {[CATS[locale], ...Array.from(new Set(POSTS.map(p => p.cat)))].map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                style={{ padding: '7px 16px', borderRadius: 30, fontSize: 12, cursor: 'pointer', background: activeCat === cat ? GRD.primary : 'transparent', border: activeCat === cat ? 'none' : `1px solid ${DS.border}`, color: activeCat === cat ? '#fff' : DS.text3, transition: 'all 0.2s' }}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <Search size={14} style={{ color: DS.text4 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('blog.searchPlaceholder')}
              style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, width: 200, fontFamily: DS.body }} />
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post, i) => (
            <Link key={post.id} to={`/blog/${post.id}`} style={{ textDecoration: 'none' }}>
            <motion.div className="rounded-2xl overflow-hidden cursor-pointer group"
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ borderColor: `${post.color}40`, boxShadow: `0 8px 24px ${post.color}15` }}
            >
              <div style={{ height: 180, overflow: 'hidden' }}>
                <img src={post.img} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ color: catColors[post.cat] || post.color, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', padding: '2px 8px', borderRadius: 4, background: `${catColors[post.cat] || post.color}15`, border: `1px solid ${catColors[post.cat] || post.color}25` }}>
                    {post.cat.toUpperCase()}
                  </span>
                </div>
                <h3 style={{ color: DS.text, fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.title}
                </h3>
                <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <div className="flex items-center gap-3">
                    <span style={{ color: DS.text4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} />{t('blog.by')} {post.author}</span>
                    <span style={{ color: DS.text4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{post.time}</span>
                  </div>
                  <span style={{ color: post.color, fontSize: 11, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 4 }}>{t('blog.readMore')} <ArrowRight size={11} /></span>
                </div>
              </div>
            </motion.div>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div style={{ color: DS.text4, fontSize: 40, marginBottom: 12 }}>◎</div>
            <div style={{ color: DS.text3, fontSize: 14 }}>{t('common.noResults')}</div>
          </div>
        )}
      </section>
    </div>
  );
}