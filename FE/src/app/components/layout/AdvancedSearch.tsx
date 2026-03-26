/**
 * AdvancedSearch — Smart search overlay for LOOP Solutions
 * Animated suggestion pills · Rotating placeholder · Category results
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight, Globe, Code2, BarChart3, TrendingUp, BookOpen, Phone, Zap, Star, Building2, Cpu } from 'lucide-react';
import { Link } from 'react-router';
import { DS } from './ds';

// ── Convert hex color to rgba() ────────────────────────────────────────────────
function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Search suggestion data ─────────────────────────────────────────────────────

const PLACEHOLDER_CYCLE = [
  'Thiết kế web nhà hàng...',
  'Gói website spa làm đẹp...',
  'Nhận tư vấn miễn phí...',
  'Khóa học digital marketing...',
  'Web nhà thuốc, phòng khám...',
  'Phát triển app mobile...',
  'SEO lên top Google...',
  'Website khách sạn resort...',
];

interface SearchResult {
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  category: string;
}

const ALL_RESULTS: SearchResult[] = [
  // Web Packages
  { label: 'Web Nhà hàng', desc: 'Dùng thử 3-5 ngày, kích hoạt trong 2h', href: '/dich-vu', icon: '🍜', color: '#F59E0B', category: 'Gói Web' },
  { label: 'Web Spa & Làm đẹp', desc: 'Đặt lịch online, gallery dịch vụ', href: '/dich-vu', icon: '💆', color: '#818CF8', category: 'Gói Web' },
  { label: 'Web Nhà thuốc', desc: 'Tra cứu thuốc, đặt hàng online', href: '/dich-vu', icon: '💊', color: '#22C55E', category: 'Gói Web' },
  { label: 'Web Café & Trà sữa', desc: 'Menu, không gian, order takeaway', href: '/dich-vu', icon: '☕', color: '#D97706', category: 'Gói Web' },
  { label: 'Web Khách sạn', desc: 'Đặt phòng, gallery, amenities', href: '/dich-vu', icon: '🏨', color: '#3B82F6', category: 'Gói Web' },
  { label: 'Web Gym & Fitness', desc: 'Đăng ký thành viên, lịch tập', href: '/dich-vu', icon: '💪', color: '#EF4444', category: 'Gói Web' },
  { label: 'Web Bất động sản', desc: 'Tìm kiếm BĐS, virtual tour 360°', href: '/dich-vu', icon: '🏠', color: '#14B8A6', category: 'Gói Web' },
  { label: 'Web Phòng khám', desc: 'Đặt lịch khám, hồ sơ bác sĩ', href: '/dich-vu', icon: '🏥', color: '#06B6D4', category: 'Gói Web' },
  { label: 'Web Shop Thời trang', desc: 'Catalog, giỏ hàng, thanh toán', href: '/dich-vu', icon: '👗', color: '#EC4899', category: 'Gói Web' },
  // Services
  { label: 'Thiết kế & Phát triển Website', desc: 'Website tùy chỉnh theo thương hiệu', href: '/dich-vu', icon: <Globe size={15} />, color: '#3B82F6', category: 'Dịch vụ' },
  { label: 'Phát triển App & SaaS', desc: 'Mobile app, web app enterprise', href: '/dich-vu', icon: <Code2 size={15} />, color: '#818CF8', category: 'Dịch vụ' },
  { label: 'Dashboard & Data Analytics', desc: 'Real-time dashboard, báo cáo tự động', href: '/dich-vu', icon: <BarChart3 size={15} />, color: '#14B8A6', category: 'Dịch vụ' },
  { label: 'SEO & Digital Marketing', desc: 'Lên top Google trong 3-6 tháng', href: '/dich-vu', icon: <TrendingUp size={15} />, color: '#22C55E', category: 'Dịch vụ' },
  // Other
  { label: 'Tư vấn miễn phí', desc: 'Đặt lịch meeting 30 phút', href: '/dat-lich', icon: <Phone size={15} />, color: '#F59E0B', category: 'Tư vấn' },
  { label: 'Khóa học Digital Marketing', desc: 'Học online, chứng chỉ quốc tế', href: '/hoc-vien', icon: <BookOpen size={15} />, color: '#818CF8', category: 'Học viện' },
  { label: 'Xem dự án đã làm', desc: 'Portfolio 50+ dự án thực tế', href: '/du-an', icon: <Star size={15} />, color: '#F59E0B', category: 'Portfolio' },
  { label: 'Về đội ngũ LOOP', desc: '27 chuyên gia hàng đầu', href: '/doi-ngu', icon: <Building2 size={15} />, color: '#14B8A6', category: 'Về chúng tôi' },
];

// ── Animated suggestion pills ──────────────────────────────────────────────────

const PILL_GROUPS = [
  { label: 'Thiết kế web', color: '#3B82F6', icon: <Globe size={11} /> },
  { label: 'Nhận tư vấn', color: '#22C55E', icon: <Phone size={11} /> },
  { label: 'Khóa học', color: '#818CF8', icon: <BookOpen size={11} /> },
  { label: 'Web nhà hàng', color: '#F59E0B', icon: '🍜' },
  { label: 'Web spa', color: '#C084FC', icon: '💆' },
  { label: 'Phát triển App', color: '#14B8A6', icon: <Cpu size={11} /> },
  { label: 'SEO Google', color: '#22C55E', icon: <TrendingUp size={11} /> },
  { label: 'Web khách sạn', color: '#60A5FA', icon: '🏨' },
  { label: 'Web gym', color: '#EF4444', icon: '💪' },
  { label: 'Dashboard', color: '#06B6D4', icon: <BarChart3 size={11} /> },
  { label: 'Web phòng khám', color: '#2DD4BF', icon: '🏥' },
  { label: 'LP & Bảng giá', color: '#F59E0B', icon: <Zap size={11} /> },
  { label: 'Web thời trang', color: '#EC4899', icon: '👗' },
  { label: 'Web BĐS', color: '#14B8A6', icon: '🏠' },
  { label: 'Xem portfolio', color: '#818CF8', icon: <Star size={11} /> },
];

interface AdvancedSearchProps {
  open: boolean;
  onClose: () => void;
}

export function AdvancedSearch({ open, onClose }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder text
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % PLACEHOLDER_CYCLE.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, [open]);

  // Auto-focus
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  // Filter results
  const results = query.trim().length > 0
    ? ALL_RESULTS.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.desc.toLowerCase().includes(query.toLowerCase()) ||
        r.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const handlePillClick = useCallback((label: string) => {
    setQuery(label);
    inputRef.current?.focus();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center"
          style={{ paddingTop: 72 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.96)', backdropFilter: 'blur(16px)' }} />

          {/* Search container */}
          <motion.div
            className="relative w-full max-w-2xl px-4"
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Input box */}
            <div
              className="flex items-center gap-3 px-5 py-4 rounded-2xl"
              style={{
                background: '#0F172A',
                border: '1px solid rgba(59,130,246,0.4)',
                boxShadow: '0 0 40px rgba(59,130,246,0.15), 0 25px 60px rgba(0,0,0,0.5)',
              }}
            >
              <Search size={20} style={{ color: '#3B82F6', flexShrink: 0 }} />
              <div className="flex-1 relative overflow-hidden">
                {/* Animated placeholder */}
                {!query && (
                  <AnimatePresence mode="wait">
                    {placeholderVisible && (
                      <motion.span
                        key={placeholderIdx}
                        className="absolute inset-0 flex items-center pointer-events-none"
                        style={{ color: DS.text5, fontSize: 16 }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                      >
                        {PLACEHOLDER_CYCLE[placeholderIdx]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{
                    background: 'none', border: 'none', outline: 'none',
                    color: DS.text, fontSize: 16, width: '100%',
                    caretColor: '#3B82F6', position: 'relative', zIndex: 1,
                  }}
                />
              </div>
              {query ? (
                <button
                  onClick={() => setQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text5, display: 'flex', flexShrink: 0 }}
                >
                  <X size={18} />
                </button>
              ) : (
                <div className="px-2 py-1 rounded-md" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>ESC</span>
                </div>
              )}
            </div>

            {/* Search results */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  className="mt-2 rounded-2xl overflow-hidden"
                  style={{ background: '#0F172A', border: `1px solid ${DS.border}`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {results.map((r, i) => (
                    <Link
                      key={i}
                      to={r.href}
                      onClick={onClose}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <motion.div
                        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                        style={{ borderBottom: i < results.length - 1 ? `1px solid ${DS.border}` : 'none' }}
                        whileHover={{ backgroundColor: 'rgba(59,130,246,0.06)' }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                          style={{ background: `${r.color}15`, border: `1px solid ${r.color}25` }}
                        >
                          <span style={{ color: r.color }}>{r.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                          <div style={{ color: DS.text5, fontSize: 11 }}>{r.desc}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span style={{ color: r.color, fontSize: 10, fontFamily: DS.mono, background: `${r.color}12`, padding: '2px 8px', borderRadius: 6 }}>
                            {r.category}
                          </span>
                          <ArrowRight size={13} style={{ color: DS.text5 }} />
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Suggestion pills — when no query */}
            {!query && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14, textAlign: 'center' }}>
                  ── GỢI Ý TÌM KIẾM
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {PILL_GROUPS.map((pill, i) => (
                    <motion.button
                      key={pill.label}
                      onClick={() => handlePillClick(pill.label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200"
                      style={{
                        borderWidth: 1,
                        borderStyle: 'solid',
                        color: pill.color,
                        fontSize: 12,
                        fontFamily: DS.mono,
                        outline: 'none',
                        backgroundColor: hexRgba(pill.color, 0.063),
                        borderColor: hexRgba(pill.color, 0.145),
                        boxShadow: `0 0 0px ${hexRgba(pill.color, 0)}`,
                        ['--hover-bg' as string]: hexRgba(pill.color, 0.125),
                        ['--hover-border' as string]: hexRgba(pill.color, 0.376),
                        ['--hover-shadow' as string]: `0 0 12px ${hexRgba(pill.color, 0.188)}`,
                      }}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: i * 0.03, type: 'spring', stiffness: 200 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onHoverStart={(e) => {
                        const el = e.target as HTMLElement;
                        el.style.backgroundColor = el.style.getPropertyValue('--hover-bg');
                        el.style.borderColor = el.style.getPropertyValue('--hover-border');
                        el.style.boxShadow = el.style.getPropertyValue('--hover-shadow');
                      }}
                      onHoverEnd={(e) => {
                        const el = e.target as HTMLElement;
                        el.style.backgroundColor = hexRgba(pill.color, 0.063);
                        el.style.borderColor = hexRgba(pill.color, 0.145);
                        el.style.boxShadow = `0 0 0px ${hexRgba(pill.color, 0)}`;
                      }}
                    >
                      <span className="flex items-center" style={{ color: pill.color }}>
                        {typeof pill.icon === 'string' ? pill.icon : pill.icon}
                      </span>
                      {pill.label}
                    </motion.button>
                  ))}
                </div>

                {/* Category shortcuts */}
                <div className="grid grid-cols-2 gap-2 mt-6">
                  {[
                    { label: 'Xem tất cả Gói Web', href: '/dich-vu', color: '#3B82F6', icon: <Globe size={14} /> },
                    { label: 'Đặt lịch tư vấn ngay', href: '/dat-lich', color: '#22C55E', icon: <Phone size={14} /> },
                    { label: 'Học viện & Khóa học', href: '/hoc-vien', color: '#818CF8', icon: <BookOpen size={14} /> },
                    { label: 'Portfolio dự án', href: '/du-an', color: '#F59E0B', icon: <Star size={14} /> },
                  ].map((s, i) => (
                    <Link key={i} to={s.href} onClick={onClose} style={{ textDecoration: 'none' }}>
                      <motion.div
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl cursor-pointer transition-colors duration-200"
                        style={{ borderWidth: 1, borderStyle: 'solid', backgroundColor: hexRgba(s.color, 0.031), borderColor: hexRgba(s.color, 0.125) }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + i * 0.05 }}
                        whileHover={{ x: 2 }}
                        onHoverStart={(e) => {
                          const el = (e.target as HTMLElement).closest('[style]') as HTMLElement;
                          if (el) {
                            el.style.backgroundColor = hexRgba(s.color, 0.082);
                            el.style.borderColor = hexRgba(s.color, 0.251);
                          }
                        }}
                        onHoverEnd={(e) => {
                          const el = (e.target as HTMLElement).closest('[style]') as HTMLElement;
                          if (el) {
                            el.style.backgroundColor = hexRgba(s.color, 0.031);
                            el.style.borderColor = hexRgba(s.color, 0.125);
                          }
                        }}
                      >
                        <span style={{ color: s.color }}>{s.icon}</span>
                        <span style={{ color: s.color, fontSize: 13, fontWeight: 500 }}>{s.label}</span>
                        <ArrowRight size={13} style={{ color: s.color, marginLeft: 'auto' }} />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {query && results.length === 0 && (
              <motion.div
                className="mt-4 py-10 flex flex-col items-center gap-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <div style={{ fontSize: 32 }}>🔍</div>
                <div style={{ color: DS.text3, fontSize: 14 }}>Không tìm thấy kết quả cho &quot;{query}&quot;</div>
                <Link to="/lien-he" onClick={onClose} style={{ textDecoration: 'none' }}>
                  <div style={{ color: DS.blue, fontSize: 13, textDecoration: 'underline', cursor: 'pointer' }}>
                    Liên hệ để được tư vấn trực tiếp →
                  </div>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}