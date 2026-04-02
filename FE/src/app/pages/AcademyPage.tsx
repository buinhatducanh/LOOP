import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import {
  Search, Star, Clock, Users, Play, BookOpen, ArrowRight, Zap,
  ChevronDown, Filter, ChevronRight, X,
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useI18n } from '@/hooks/useI18n';
import { useLocaleStore } from '@/store/localeStore';
import { ACADEMY_DATA } from '../data/locales';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// Static course data (images, colors, numbers — don't translate)
const COURSE_STATIC = [
  { id: 1, instructorImg: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=60&h=60&crop=faces', img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=500&q=80', color: DS.blue, featured: true, tags: ['React', 'Next.js', 'TypeScript'] },
  { id: 2, instructorImg: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=60&h=60&crop=faces', img: 'https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=500&q=80', color: DS.purple, featured: false, tags: ['Figma', 'Tailwind', 'UX'] },
  { id: 3, instructorImg: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=60&h=60&crop=faces', img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=500&q=80', color: DS.cyan, featured: false, tags: ['Node.js', 'PostgreSQL', 'Docker'] },
  { id: 4, instructorImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=60&h=60&crop=faces', img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=500&q=80', color: DS.green, featured: false, tags: ['K8s', 'Docker', 'AWS'] },
  { id: 5, instructorImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&h=60&crop=faces', img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=500&q=80', color: DS.amber, featured: false, tags: ['SEO', 'Content', 'Growth'] },
  { id: 6, instructorImg: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=60&h=60&crop=faces', img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=500&q=80', color: DS.red, featured: false, tags: ['Rust', 'Go', 'Performance'] },
];

// Static instructor data
const INSTRUCTORS_STATIC = [
  { name: 'Akira Sato', rank: 'Diamond', img: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=100&h=100&crop=faces', rankColor: '#7DD3FC' },
  { name: 'Rin Nakamura', rank: 'Ruby', img: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=100&h=100&crop=faces', rankColor: '#FB7185' },
  { name: 'Mei Lin', rank: 'Ruby', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&crop=faces', rankColor: '#FB7185' },
  { name: 'Ryo Hashimoto', rank: 'Diamond', img: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=100&h=100&crop=faces', rankColor: '#7DD3FC' },
];

const levelColor: Record<string, string> = {
  Beginner: DS.green, Intermediate: DS.blue, Advanced: DS.amber, Expert: DS.red,
};

// ── Payment Modal ───────────────────────────────────────────────────────────
function PaymentModal({ courseId, lpBalance, onClose }: {
  courseId: number;
  lpBalance: number;
  onClose: () => void;
}) {
  const locale = useLocaleStore(s => s.locale);
  const { courses } = ACADEMY_DATA[locale] ?? ACADEMY_DATA.vi;
  const staticCourses = COURSE_STATIC;
  const allCourses = mergeCourses(courses, staticCourses);
  const course = allCourses.find(c => c.id === courseId)!;
  const { t } = useI18n();
  const [payMode, setPayMode] = useState<'vnd' | 'lp-partial' | 'lp-full'>('vnd');
  const [enrolled, setEnrolled] = useState(false);
  const lpPartialMax = Math.min(Math.floor(course.price * 0.5 / 500) * 1000, lpBalance);
  const lpSaved = Math.round(lpPartialMax / 1000) * 500_000;
  const partialRemain = course.price - lpSaved;
  const canFullLP = lpBalance >= course.lpPrice;

  if (enrolled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-10 rounded-3xl max-w-sm w-full" style={{ background: DS.bgCard, border: `1px solid ${DS.green}40` }}>
          <div className="text-5xl mb-5">🎉</div>
          <div style={{ color: DS.green, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{t('academy.payment.successTitle')}</div>
          <div style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            {t('academy.payment.lpEarned', { lp: String(course.lpReward) })}
          </div>
          <button onClick={onClose} style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
            {t('academy.detail.enrollNow')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{t('academy.payment.title')}</div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Course info */}
          <div className="flex gap-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
              <img src={course.img} alt={course.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <div style={{ color: DS.text, fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{course.title}</div>
              <div style={{ color: DS.text4, fontSize: 12, marginTop: 3 }}>👤 {course.instructor}</div>
            </div>
          </div>

          {/* Payment mode */}
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 8 }}>{t('academy.payment.title').toUpperCase()}</div>

          {/* Full VND */}
          <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: payMode === 'vnd' ? 'rgba(59,130,246,0.08)' : 'transparent', border: `1px solid ${payMode === 'vnd' ? DS.blue + '40' : DS.border}` }}>
            <input type="radio" checked={payMode === 'vnd'} onChange={() => setPayMode('vnd')} style={{ accentColor: DS.blue }} />
            <div className="flex-1">
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{t('academy.payment.fullVnd')}</div>
              <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: 20, fontWeight: 900 }}>{fmtVND(course.price)}</div>
            </div>
          </label>

          {/* VND + LP partial */}
          {lpPartialMax >= 1000 && (
            <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: payMode === 'lp-partial' ? 'rgba(129,140,248,0.08)' : 'transparent', border: `1px solid ${payMode === 'lp-partial' ? DS.purple + '40' : DS.border}` }}>
              <input type="radio" checked={payMode === 'lp-partial'} onChange={() => setPayMode('lp-partial')} style={{ accentColor: DS.purple }} />
              <div className="flex-1">
                <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{t('academy.payment.mixedPayment')}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 13 }}>-{lpPartialMax.toLocaleString('vi-VN')} LP</span>
                  <span style={{ color: DS.text4, fontSize: 12 }}>+</span>
                  <span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13 }}>{fmtVND(partialRemain)}</span>
                </div>
                <div style={{ color: DS.green, fontSize: 11, marginTop: 2 }}>{t('academy.payment.maxLpNote')} {fmtVND(lpSaved)}</div>
              </div>
            </label>
          )}

          {/* Full LP */}
          <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: payMode === 'lp-full' ? 'rgba(245,158,11,0.08)' : 'transparent', border: `1px solid ${payMode === 'lp-full' ? DS.amber + '40' : DS.border}`, opacity: canFullLP ? 1 : 0.5 }}>
            <input type="radio" checked={payMode === 'lp-full'} onChange={() => canFullLP && setPayMode('lp-full')} disabled={!canFullLP} style={{ accentColor: DS.amber }} />
            <div className="flex-1">
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{t('academy.payment.fullLp')} ◈</div>
              <div style={{ color: DS.amber, fontFamily: DS.mono, fontSize: 16, fontWeight: 700 }}>{course.lpPrice.toLocaleString('vi-VN')} LP</div>
              {!canFullLP && <div style={{ color: DS.red, fontSize: 11, marginTop: 2 }}>{t('academy.payment.insufficientLp')} ({lpBalance.toLocaleString('vi-VN')} LP)</div>}
            </div>
          </label>

          {/* LP balance indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)' }}>
            <div style={{ color: DS.text4, fontSize: 12 }}>{t('academy.payment.balance')}</div>
            <div style={{ color: DS.purple, fontFamily: DS.mono, fontWeight: 700 }}>{lpBalance.toLocaleString('vi-VN')} LP</div>
          </div>

          {/* LP reward note */}
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <Zap size={12} style={{ color: DS.green, flexShrink: 0 }} />
            <div style={{ color: DS.text4, fontSize: 12 }}>
              {t('academy.detail.lpReward', { lp: String(course.lpReward) })}
            </div>
          </div>

          <button onClick={() => setEnrolled(true)} style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 24px rgba(129,140,248,0.35)' }}>
            {t('academy.payment.confirmEnroll')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function AcademyPage() {
  const { t } = useI18n();
  const locale = useLocaleStore(s => s.locale);
  const { courses, cats, sorts, levelVN, paths, faqs, instructors } = ACADEMY_DATA[locale] ?? ACADEMY_DATA.vi;

  const [activeCat, setActiveCat] = useState(cats[0]);
  const [activeLevel, setActiveLevel] = useState(cats[0]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [payModal, setPayModal] = useState<number | null>(null);

  const USER_LP = 15_200;

  // Merge static (img/color) with locale (title/desc) course data
  const mergeCourses = (localeCourses: typeof courses, staticCourses: typeof COURSE_STATIC) =>
    localeCourses.map((c, i) => ({ ...c, ...staticCourses[i] }));

  const allCourses = mergeCourses(courses, COURSE_STATIC);
  const featured = allCourses[0];
  const otherCourses = allCourses.slice(1);

  let filtered = otherCourses.filter(c =>
    (activeCat === cats[0] || c.cat === activeCat) &&
    (activeLevel === cats[0] || c.level === activeLevel) &&
    (c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase()))
  );

  // Sort
  if (sort === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  else if (sort === 'students') filtered = [...filtered].sort((a, b) => b.students - a.students);
  else if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (sort === 'newest') filtered = [...filtered].reverse();

  const hasFilters = activeCat !== cats[0] || activeLevel !== cats[0];

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center relative" style={{ background: 'linear-gradient(180deg, rgba(129,140,248,0.08) 0%, transparent 80%)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full" style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}>
            <BookOpen size={11} style={{ color: DS.purple }} />
            <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.22em' }}>LOOP ACADEMY</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 14 }}>
            {t('academy.hero.title')}
          </h1>
          <p style={{ color: DS.text3, fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
            {t('academy.hero.subtitle')}
          </p>

          {/* Search */}
          <div className="flex items-center gap-3 max-w-xl mx-auto px-5 py-3 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(129,140,248,0.2)', backdropFilter: 'blur(12px)' }}>
            <Search size={16} style={{ color: DS.text4 }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('academy.hero.searchPlaceholder')}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text, fontSize: 15, fontFamily: DS.body }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
            )}
            <button style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t('academy.hero.searchBtn')}</button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
            {[
              { val: '6+', label: t('academy.hero.statsCourses'), icon: '📚' },
              { val: '10.2K', label: t('academy.hero.statsStudents'), icon: '👥' },
              { val: '4.9★', label: t('academy.hero.statsRating'), icon: '⭐' },
              { val: '100%', label: t('academy.hero.statsRealWorld'), icon: '⚡' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.icon} {s.val}</div>
                <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LP Banner ────────────────────────────────────────────────────── */}
      <section className="px-6 mb-10">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl p-5 flex items-center gap-5 flex-wrap" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(129,140,248,0.25)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.3)' }}>
              <Zap size={22} style={{ color: DS.purple }} />
            </div>
            <div className="flex-1 min-w-60">
              <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{t('academy.lpBanner.title', { lp: USER_LP.toLocaleString('vi-VN') })}</div>
              <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.6 }}>
                {t('academy.lpBanner.subtitle')} <span style={{ color: DS.purple }}>{t('academy.lpBanner.discountNote')}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{USER_LP.toLocaleString('vi-VN')} LP</div>
              <div style={{ color: DS.text4, fontSize: 11 }}>{t('academy.lpBanner.discountLabel')} {fmtVND(Math.floor(USER_LP / 1000) * 500_000)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured course ──────────────────────────────────────────────── */}
      <section className="px-6 mb-12">
        <div className="max-w-6xl mx-auto">
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 16 }}>{t('academy.featured.sectionLabel')}</div>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.18) 0%, rgba(15,23,42,0.9) 100%)', border: '1.5px solid rgba(59,130,246,0.35)', boxShadow: '0 0 40px rgba(59,130,246,0.08)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            {/* Image */}
            <div style={{ position: 'relative', overflow: 'hidden', height: 300 }}>
              <img src={featured.img} alt={featured.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(2,6,23,0.5) 0%, transparent 100%)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.85)', boxShadow: '0 0 24px rgba(59,130,246,0.5)' }}>
                  <Play size={22} style={{ color: '#fff', fill: '#fff', marginLeft: 3 }} />
                </div>
              </div>
              {/* Tags */}
              <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
                {featured.tags.map(t => (
                  <span key={t} style={{ color: DS.blue, background: 'rgba(2,6,23,0.85)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontFamily: DS.mono, backdropFilter: 'blur(8px)' }}>{t}</span>
                ))}
              </div>
            </div>
            {/* Info */}
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span style={{ color: DS.blue, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em', padding: '2px 8px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>{featured.cat.toUpperCase()}</span>
                <span style={{ color: levelColor[featured.level], fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', padding: '2px 8px', borderRadius: 4, background: `${levelColor[featured.level]}15` }}>{levelVN[featured.level].toUpperCase()}</span>
                <span style={{ color: DS.amber, fontSize: 9, fontFamily: DS.mono, padding: '2px 8px', borderRadius: 4, background: `${DS.amber}12` }}>★ {t('academy.featured.featuredBadge')}</span>
              </div>
              <h2 style={{ color: DS.text, fontSize: 22, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>{featured.title}</h2>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} style={{ color: DS.amber, fill: DS.amber }} />)}
                  <span style={{ color: DS.amber, fontSize: 13, fontFamily: DS.mono, marginLeft: 4, fontWeight: 700 }}>{featured.rating}</span>
                  <span style={{ color: DS.text4, fontSize: 12 }}>({featured.reviews})</span>
                </div>
              </div>
              <div className="flex items-center gap-5 mb-5 flex-wrap">
                <div className="flex items-center gap-1.5" style={{ color: DS.text3, fontSize: 12 }}><Users size={13} />{featured.students.toLocaleString()} {t('academy.featured.students')}</div>
                <div className="flex items-center gap-1.5" style={{ color: DS.text3, fontSize: 12 }}><Clock size={13} />{featured.duration} · {featured.lectures} {t('academy.featured.baihoc')}</div>
              </div>
              {/* Instructor mini */}
              <div className="flex items-center gap-2 mb-5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}` }}>
                <img src={featured.instructorImg} alt={featured.instructor} className="w-8 h-8 rounded-lg object-cover" style={{ border: `1.5px solid ${DS.blue}50` }} />
                <div>
                  <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{featured.instructor}</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>{featured.instructorRole}</div>
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: 26, fontWeight: 700 }}>
                    {fmtVND(featured.price)}
                  </div>
                  <div style={{ color: DS.text5, fontSize: 12, textDecoration: 'line-through' }}>{fmtVND(featured.price * 1.3)}</div>
                  <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>◈ {t('academy.featured.orLp', { lp: featured.lpPrice.toLocaleString() })}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPayModal(featured.id)} style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {t('academy.featured.registerBtn')} <Zap size={13} />
                  </button>
                  <Link to={`/hoc-vien/${featured.id}`} style={{ background: 'rgba(59,130,246,0.1)', color: DS.blue, border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '12px 16px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                    {t('academy.featured.viewBtn')} <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Learning Paths ───────────────────────────────────────────────── */}
      <section className="px-6 mb-14" style={{ background: 'rgba(15,23,42,0.5)' }}>
        <div className="max-w-6xl mx-auto py-12">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 6 }}>{t('academy.paths.sectionLabel')}</div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.06em' }}>{t('academy.paths.sectionTitle')}</h2>
            </div>
            <div style={{ color: DS.text4, fontSize: 13 }}>{t('academy.paths.subtitle')}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {paths.map((path, i) => (
              <motion.div key={path.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-5 cursor-pointer group"
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                whileHover={{ borderColor: `${path.color}50`, boxShadow: `0 8px 24px ${path.color}10`, y: -4 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${path.color}15`, border: `1px solid ${path.color}30` }}>
                    <span style={{ color: path.color, fontSize: 22 }}>{path.icon}</span>
                  </div>
                  <div>
                    <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{path.title}</div>
                    <div style={{ color: path.color, fontSize: 10, fontFamily: DS.mono }}>{path.difficulty}</div>
                  </div>
                </div>
                <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>{path.desc}</p>
                {/* Steps */}
                <div className="space-y-2 mb-5">
                  {path.steps.map((step, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${path.color}20`, border: `1px solid ${path.color}40` }}>
                        <span style={{ color: path.color, fontSize: 9, fontFamily: DS.mono }}>{si + 1}</span>
                      </div>
                      <span style={{ color: step.includes('Coming Soon') ? DS.text5 : DS.text3, fontSize: 12 }}>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <div className="flex items-center gap-3">
                    <span style={{ color: DS.text4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{path.duration} {t('academy.paths.hours')}</span>
                    <span style={{ color: DS.purple, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}><Zap size={11} />+{path.totalLP} LP</span>
                  </div>
                  <span style={{ color: path.color, fontSize: 11, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {t('academy.paths.viewPath')} <ChevronRight size={11} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <section className="px-6 mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap flex-1">
              {cats.map(cat => (
                <button key={cat} onClick={() => setActiveCat(cat)}
                  style={{ padding: '7px 16px', borderRadius: 30, fontSize: 12, cursor: 'pointer', background: activeCat === cat ? GRD.primary : 'transparent', border: activeCat === cat ? 'none' : `1px solid ${DS.border}`, color: activeCat === cat ? '#fff' : DS.text3, transition: 'all 0.2s' }}>
                  {cat}
                </button>
              ))}
            </div>
            {/* Level + Sort */}
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: hasFilters ? 'rgba(59,130,246,0.12)' : DS.bgCard, border: `1px solid ${hasFilters ? DS.blue + '40' : DS.border}`, color: hasFilters ? DS.blue : DS.text3, fontSize: 12, cursor: 'pointer' }}>
                <Filter size={13} />{t('academy.filters.filterBtn')} {hasFilters && `(${(activeCat !== cats[0] ? 1 : 0) + (activeLevel !== cats[0] ? 1 : 0)})`}
              </button>
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                {sorts.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
                  <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>{t('academy.filters.levelLabel')}</div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.keys(levelColor).map(l => (
                      <button key={l} onClick={() => setActiveLevel(l === cats[0] ? cats[0] : l)}
                        style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: activeLevel === l ? `${levelColor[l] ?? DS.blue}20` : 'transparent', border: `1px solid ${activeLevel === l ? (levelColor[l] ?? DS.blue) + '60' : DS.border}`, color: activeLevel === l ? (levelColor[l] ?? DS.blue) : DS.text3 }}>
                        {l === 'Beginner' ? cats[0] : levelVN[l]}
                      </button>
                    ))}
                  </div>
                  {hasFilters && (
                    <button onClick={() => { setActiveCat(cats[0]); setActiveLevel(cats[0]); }}
                      style={{ marginTop: 12, color: DS.red, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={12} /> {t('academy.filters.clearFilters')}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Course grid ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>
              {t('academy.courseGrid.header', { count: String(filtered.length), search: search ? ` for "${search}"` : '' })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((course, i) => (
                <motion.div key={course.id} className="rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ borderColor: `${course.color}40`, boxShadow: `0 8px 24px ${course.color}12`, y: -4 }}>
                  {/* Image */}
                  <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                    <img src={course.img} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: 'rgba(2,6,23,0.65)' }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${course.color}cc` }}>
                        <Play size={18} style={{ color: '#fff', fill: '#fff', marginLeft: 2 }} />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span style={{ color: course.color, background: 'rgba(2,6,23,0.85)', border: `1px solid ${course.color}40`, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontFamily: DS.mono, backdropFilter: 'blur(8px)' }}>{course.cat.toUpperCase()}</span>
                    </div>
                    {course.lpPrice <= USER_LP && (
                      <div className="absolute top-3 right-3">
                        <span style={{ color: DS.purple, background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 6, padding: '2px 7px', fontSize: 9, fontFamily: DS.mono, backdropFilter: 'blur(8px)' }}>◈ {t('academy.courseCard.lpOk')}</span>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span style={{ color: levelColor[course.level], fontSize: 9, fontFamily: DS.mono, padding: '2px 6px', borderRadius: 4, background: `${levelColor[course.level]}15`, border: `1px solid ${levelColor[course.level]}30` }}>{levelVN[course.level].toUpperCase()}</span>
                    </div>
                    <h3 style={{ color: DS.text, fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</h3>
                    {/* Instructor mini */}
                    <div className="flex items-center gap-2 mb-3">
                      <img src={course.instructorImg} alt={course.instructor} className="w-6 h-6 rounded-lg object-cover" style={{ border: `1px solid ${course.color}40` }} />
                      <span style={{ color: DS.text4, fontSize: 12 }}>{course.instructor}</span>
                    </div>
                    {/* Rating + meta */}
                    <div className="flex items-center gap-1 mb-4">
                      <Star size={12} style={{ color: DS.amber, fill: DS.amber }} />
                      <span style={{ color: DS.amber, fontSize: 12, fontWeight: 700 }}>{course.rating}</span>
                      <span style={{ color: DS.text4, fontSize: 11 }}>({course.reviews})</span>
                      <span style={{ color: DS.text5, marginLeft: 8, fontSize: 11 }}>{course.students.toLocaleString()} {t('academy.courseCard.students')} · {course.duration}</span>
                    </div>
                    {/* Price row */}
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                      <div>
                        <div style={{ color: course.color, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>
                          {fmtVND(course.price)}
                        </div>
                        <div style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>
                          ◈ {course.lpPrice.toLocaleString()} LP · {t('academy.courseCard.lpPrice', { lp: String(course.lpReward) })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPayModal(course.id)}
                          style={{ background: `${course.color}18`, border: `1px solid ${course.color}40`, borderRadius: 8, padding: '6px 10px', color: course.color, fontSize: 11, cursor: 'pointer', fontFamily: DS.mono }}>
                          {t('academy.courseCard.registerBtn')}
                        </button>
                        <Link to={`/hoc-vien/${course.id}`} style={{ background: 'transparent', border: `1px solid ${DS.border}`, borderRadius: 8, padding: '6px 10px', color: DS.text4, fontSize: 11, cursor: 'pointer', fontFamily: DS.mono, textDecoration: 'none' }}>
                          {t('academy.courseCard.viewBtn')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <div style={{ color: DS.text4, fontSize: 40, marginBottom: 12 }}>◎</div>
              <div style={{ color: DS.text3, fontSize: 14, marginBottom: 8 }}>{t('academy.courseGrid.empty')}</div>
              <button onClick={() => { setSearch(''); setActiveCat(cats[0]); setActiveLevel(cats[0]); }}
                style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.mono }}>
                {t('academy.courseGrid.clearFilters')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Instructors ──────────────────────────────────────────────────── */}
      <section className="px-6 py-14" style={{ background: 'rgba(15,23,42,0.6)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 8 }}>{t('academy.instructors.sectionLabel')}</div>
            <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.06em' }}>{t('academy.instructors.sectionTitle')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {instructors.map((ins, i) => {
              const staticIns = INSTRUCTORS_STATIC.find(s => s.name === ins.name) ?? INSTRUCTORS_STATIC[0];
              return (
              <motion.div key={ins.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-5 rounded-2xl text-center cursor-pointer"
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                whileHover={{ borderColor: `${staticIns.rankColor}40`, y: -4 }}>
                <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3" style={{ border: `2px solid ${staticIns.rankColor}60`, boxShadow: `0 0 16px ${staticIns.rankColor}25` }}>
                  <img src={staticIns.img} alt={ins.name} className="w-full h-full object-cover" />
                </div>
                <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{ins.name}</div>
                <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{ins.role}</div>
                <div style={{ color: staticIns.rankColor, fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>✦ {ins.rank.toUpperCase()}</div>
                <div className="flex items-center justify-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.text4, fontSize: 11 }}>📚 {ins.courses} {t('academy.instructors.courses')}</span>
                  <span style={{ color: DS.text4, fontSize: 11 }}>👥 {ins.students.toLocaleString()} {t('academy.instructors.students')}</span>
                </div>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 8 }}>{t('academy.faq.sectionLabel')}</div>
            <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.06em' }}>{t('academy.faq.sectionTitle')}</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${openFaq === i ? DS.blue + '40' : DS.border}` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5"
                  style={{ background: openFaq === i ? 'rgba(59,130,246,0.06)' : DS.bgCard, border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{faq.q}</span>
                  <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} style={{ flexShrink: 0, color: DS.text4 }}>
                    <ChevronDown size={16} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5" style={{ color: DS.text3, fontSize: 13, lineHeight: 1.8, borderTop: `1px solid ${DS.border}`, paddingTop: 16 }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-12" style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.2), rgba(129,140,248,0.1))', border: '1px solid rgba(129,140,248,0.25)' }}>
          <div style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 11, letterSpacing: '0.2em', marginBottom: 12 }}>{t('academy.cta.label')}</div>
          <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 12 }}>
            {t('academy.cta.title')}
          </h2>
          <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
            {t('academy.cta.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/dat-lich" style={{ background: GRD.primary, color: '#fff', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 24px rgba(129,140,248,0.35)' }}>
              {t('academy.cta.bookFree')} <ArrowRight size={14} />
            </Link>
            <Link to="/hoc-vien/1" style={{ background: 'transparent', color: DS.text3, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '12px 24px', fontSize: 14, textDecoration: 'none' }}>
              {t('academy.cta.viewAll')}
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <AnimatePresence>
        {payModal && (
          <PaymentModal courseId={payModal} lpBalance={USER_LP} onClose={() => setPayModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
