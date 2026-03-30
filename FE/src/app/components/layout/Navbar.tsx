import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Zap, Search, ChevronRight, Sparkles, User, LogOut, Shield, Settings, ChevronDown } from 'lucide-react';
import { DS, GRD, NAV_LINKS } from './ds';
import { AdvancedSearch } from './AdvancedSearch';
import { useAuthStore, DEMO_USERS } from '../../store/authStore';
import { useLocaleStore, SUPPORTED_LOCALES, LOCALE_LABELS, LOCALE_FLAGS } from '../../store/localeStore';
import { useI18n } from '../../../i18n/sync.tsx';
import { injectFontClasses, applyLocaleFont } from '../../../i18n/fonts';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

/* ── Compact inline search bar ───────────────────────────────────────────── */
function InlineSearchBar({ onOpen }: { onOpen: () => void }) {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent);
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-2 cursor-pointer transition-all duration-200"
      style={{
        background: rgba('#FFFFFF', 0.03), border: `1px solid ${rgba('#FFFFFF', 0.07)}`,
        borderRadius: 10, padding: '5px 10px', color: DS.text5, minWidth: 180,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = rgba(DS.blue, 0.3); e.currentTarget.style.background = rgba(DS.blue, 0.04); }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = rgba('#FFFFFF', 0.07); e.currentTarget.style.background = rgba('#FFFFFF', 0.03); }}
    >
      <Search size={13} style={{ color: DS.text5, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: DS.text5, flex: 1, textAlign: 'left', whiteSpace: 'nowrap' }}>{t("navigation.search", "Tìm kiếm...")}</span>
      <kbd style={{ display: 'inline-flex', alignItems: 'center', gap: 1, background: rgba('#FFFFFF', 0.04), border: `1px solid ${rgba('#FFFFFF', 0.08)}`, borderRadius: 4, padding: '1px 5px', fontSize: 9, color: DS.text5, fontFamily: DS.mono, lineHeight: 1.4 }}>
        {isMac ? '⌘' : 'Ctrl+'}K
      </kbd>
    </button>
  );
}

/* ── User Avatar Menu ────────────────────────────────────────────────────── */
function UserAvatarMenu({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user, isAuthenticated, logout, loginAs } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  if (!isAuthenticated || !user) {
    return (
      <Link to="/dang-nhap" className="flex items-center gap-1.5"
        style={{ color: DS.text4, fontSize: 12, padding: '5px 12px', borderRadius: 8, border: `1px solid ${rgba('#FFFFFF', 0.07)}`, textDecoration: 'none', transition: 'all 0.15s ease' }}
        onMouseEnter={e => { e.currentTarget.style.color = DS.text; e.currentTarget.style.borderColor = rgba('#FFFFFF', 0.18); }}
        onMouseLeave={e => { e.currentTarget.style.color = DS.text4; e.currentTarget.style.borderColor = rgba('#FFFFFF', 0.07); }}
      >
        <User size={14} /> <span className="hidden xl:inline">{t("navigation.login", "Đăng nhập")}</span>
      </Link>
    );
  }

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: { label: 'ADMIN', color: '#818CF8' },
    manager: { label: t("admin.title", "TRƯỞNG PHÒNG"), color: '#F59E0B' },
    staff: { label: t("admin.title", "NHÂN VIÊN"), color: '#14B8A6' },
    client: { label: t("admin.customer", "KHÁCH HÀNG"), color: DS.blue },
  };
  const rl = roleLabels[user.role] ?? { label: user.role, color: DS.text4 };

  const quickSwitch = [
    { key: 'admin', label: 'Admin', icon: '👑' },
    { key: 'manager_media', label: `${t("team.title", "Đội ngũ")} Media`, icon: '📸' },
    { key: 'manager_marketing', label: `${t("team.title", "Đội ngũ")} Marketing`, icon: '📈' },
    { key: 'staff', label: t("auth.login", "Nhân viên"), icon: '👤' },
    { key: 'client', label: t("admin.customer", "Khách hàng"), icon: '🧑‍💼' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 cursor-pointer transition-all duration-150"
        style={{ background: rgba('#FFFFFF', 0.03), border: `1px solid ${rgba('#FFFFFF', 0.08)}`, borderRadius: 10, padding: '3px 10px 3px 3px' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = rgba(rl.color, 0.3); }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = rgba('#FFFFFF', 0.08); }}
      >
        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${rgba(rl.color, 0.5)}` }}>
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        </div>
        <div className="hidden xl:block text-left">
          <div style={{ color: DS.text, fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{user.shortName}</div>
          <div style={{ color: rl.color, fontSize: 8, fontFamily: DS.mono, letterSpacing: '0.08em' }}>{rl.label}</div>
        </div>
        <ChevronDown size={11} style={{ color: DS.text5, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute top-full right-0 mt-2 rounded-xl overflow-hidden"
            style={{ background: rgba(DS.bgCard, 0.98), border: `1px solid ${rgba(DS.blue, 0.12)}`, backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.55)', width: 260, zIndex: 60 }}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {/* User info */}
            <div className="p-4" style={{ borderBottom: `1px solid ${rgba('#FFFFFF', 0.05)}` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `2px solid ${rgba(rl.color, 0.5)}`, boxShadow: `0 0 10px ${rgba(rl.color, 0.2)}` }}>
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>{user.email}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 rounded" style={{ background: rgba(rl.color, 0.12), color: rl.color, fontSize: 8, fontFamily: DS.mono, fontWeight: 700 }}>{rl.label}</span>
                    {user.rank && <span style={{ color: user.rankColor ?? DS.text4, fontSize: 8, fontFamily: DS.mono }}>{user.rank.toUpperCase()}</span>}
                  </div>
                </div>
              </div>
              {/* LP badge */}
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ background: rgba(DS.purple, 0.06), border: `1px solid ${rgba(DS.purple, 0.12)}` }}>
                <Zap size={12} style={{ color: DS.purple }} />
                <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{user.lpBalance.toLocaleString()} LP</span>
                <span style={{ color: DS.text5, fontSize: 10, marginLeft: 'auto' }}>Lv.{user.level}</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-1.5" style={{ borderBottom: `1px solid ${rgba('#FFFFFF', 0.05)}` }}>
              {[
                ...(user.role !== 'client' ? [{ to: '/admin', icon: <Shield size={13} />, label: t("admin.title", "Admin Dashboard"), color: DS.purple }] : []),
                { to: '/khach-hang', icon: <Sparkles size={13} />, label: user.role === 'client' ? t("customer.dashboard", "Dashboard") : t("admin.customer", "Customer Portal"), color: DS.blue },
                { to: '#settings', icon: <Settings size={13} />, label: t("customer.settings", "Cài đặt tài khoản"), color: DS.text4 },
              ].map(item => (
                <button key={item.to} onClick={() => { setOpen(false); if (item.to.startsWith('/')) onNavigate(item.to); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: DS.text3, fontSize: 12 }}
                  onMouseEnter={e => { e.currentTarget.style.background = rgba('#FFFFFF', 0.04); }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ color: item.color }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            {/* Quick role switch (demo) */}
            <div className="p-2" style={{ borderBottom: `1px solid ${rgba('#FFFFFF', 0.05)}` }}>
              <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, letterSpacing: '0.2em', padding: '4px 8px', marginBottom: 2 }}>SWITCH ACCOUNT (DEMO)</div>
              <div className="grid grid-cols-1 gap-0.5">
                {quickSwitch.map(s => (
                  <button key={s.key} onClick={() => { loginAs(DEMO_USERS[s.key]); setOpen(false); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all duration-150"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: DS.text4, fontSize: 11 }}
                    onMouseEnter={e => { e.currentTarget.style.background = rgba('#FFFFFF', 0.04); }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 13 }}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Logout */}
            <div className="p-1.5">
              <button onClick={() => { logout(); setOpen(false); onNavigate('/'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: DS.red, fontSize: 12 }}
                onMouseEnter={e => { e.currentTarget.style.background = rgba(DS.red, 0.06); }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={13} /> {t("navigation.logout", "Đăng xuất")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ── NAVBAR ──────────────────────────────────────────────────────────────
   ═══════════════════════════════════════════════════════════════════════ */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { locale, setLocale: setStoreLocale } = useLocaleStore();
  const { t, setLocale } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Inject font classes and apply locale font on mount
  useEffect(() => {
    injectFontClasses();
    applyLocaleFont(locale);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle locale change — sync both store and i18n
  const handleLocaleChange = useCallback((newLocale: typeof locale) => {
    setStoreLocale(newLocale);
    setLocale(newLocale);
    applyLocaleFont(newLocale);
    // Persist to localStorage
    localStorage.setItem('loop_locale', newLocale);
    // Update URL
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && SUPPORTED_LOCALES.includes(parts[0] as typeof SUPPORTED_LOCALES[number])) {
      parts[0] = newLocale;
      navigate(`/${parts.join('/')}`);
    } else {
      navigate(`/${newLocale}`);
    }
  }, [location.pathname, navigate, setLocale, setStoreLocale]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false); };
    if (langOpen) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [langOpen]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(v => !v); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const withLocale = (href: string) => {
    if (href.startsWith('/admin') || href.startsWith('/khach-hang') || href.startsWith('/nhan-vien') || href.startsWith('/dang-')) {
      return href;
    }
    if (href === '/') return `/${locale}`;
    return `/${locale}${href}`;
  };

  const active = (href: string) => location.pathname === withLocale(href);

  const PRIMARY_COUNT = 5;
  const primaryLinks = NAV_LINKS.slice(0, PRIMARY_COUNT);
  const moreLinks = NAV_LINKS.slice(PRIMARY_COUNT);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    if (moreOpen) document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [moreOpen]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(2,6,23,0.96)' : 'rgba(2,6,23,0.55)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? `1px solid ${rgba(DS.blue, 0.12)}` : '1px solid transparent',
        }}
      >
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #3B82F6 30%, #818CF8 70%, transparent)' }} />

        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between" style={{ height: 56 }}>
          {/* Logo */}
          <Link to={`/${locale}`} className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div style={{ width: 32, height: 32 }}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <defs>
                  <linearGradient id="nLg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1D4ED8" /><stop offset=".5" stopColor="#818CF8" /><stop offset="1" stopColor="#14B8A6" />
                  </linearGradient>
                  <filter id="nGl"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="url(#nLg)" opacity=".1" />
                <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="url(#nLg)" strokeWidth="1.5" fill="none" />
                <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="url(#nLg)" filter="url(#nGl)" fontFamily="Georgia,serif">∞</text>
              </svg>
            </div>
            <div className="hidden sm:block">
              <div style={{ lineHeight: 1.1 }}>
                <span style={{ color: DS.text, fontFamily: DS.heading, fontSize: 13, fontWeight: 900, letterSpacing: '0.12em' }}>LOOP </span>
                <span style={{ background: 'linear-gradient(135deg,#818CF8,#14B8A6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: DS.heading, fontSize: 13, fontWeight: 900, letterSpacing: '0.12em' }}>SOLUTIONS</span>
              </div>
              <div style={{ color: DS.text5, fontSize: 7, fontFamily: DS.mono, letterSpacing: '0.25em', marginTop: 1 }}>DIGITAL AGENCY OS</div>
            </div>
          </Link>

          {/* Desktop center nav */}
          <div className="hidden lg:flex items-center gap-0.5 mx-4">
            {primaryLinks.map(link => (
              <Link key={link.href} to={withLocale(link.href)}
                style={{
                  color: active(link.href) ? DS.blue : DS.text4, fontSize: 12.5,
                  fontWeight: active(link.href) ? 600 : 500, padding: '5px 10px', borderRadius: 7,
                  background: active(link.href) ? rgba(DS.blue, 0.08) : 'transparent',
                  textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s ease', position: 'relative',
                }}
                onMouseEnter={e => { if (!active(link.href)) { e.currentTarget.style.color = DS.text2; e.currentTarget.style.background = rgba('#FFFFFF', 0.03); } }}
                onMouseLeave={e => { if (!active(link.href)) { e.currentTarget.style.color = DS.text4; e.currentTarget.style.background = 'transparent'; } }}
              >
                {/* Translation key format: "namespace.key" */}
                {link.label.includes('.') ? t(link.label, link.label) : link.label}
                {active(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: 14, height: 2, borderRadius: 1, background: DS.blue, boxShadow: `0 0 6px ${DS.blue}` }} />
                )}
              </Link>
            ))}

            {moreLinks.length > 0 && (
              <div className="relative" ref={moreRef}>
                <button onClick={() => setMoreOpen(v => !v)}
                  className="flex items-center gap-1 cursor-pointer transition-all duration-150"
                  style={{ color: moreLinks.some(l => active(l.href)) ? DS.blue : DS.text4, fontSize: 12.5, fontWeight: 500, padding: '5px 10px', borderRadius: 7, background: moreOpen ? rgba('#FFFFFF', 0.04) : 'transparent', border: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = DS.text2; }}
                  onMouseLeave={e => { if (!moreOpen) e.currentTarget.style.color = moreLinks.some(l => active(l.href)) ? DS.blue : DS.text4; }}
                >
                  {t("navigation.more", "Thêm")}
                  <motion.span animate={{ rotate: moreOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
                    <ChevronRight size={12} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {moreOpen && (
                    <motion.div className="absolute top-full right-0 mt-2 py-1.5 rounded-xl overflow-hidden"
                      style={{ background: rgba(DS.bgCard, 0.98), border: `1px solid ${rgba(DS.blue, 0.12)}`, backdropFilter: 'blur(20px)', boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${rgba('#FFFFFF', 0.03)}`, minWidth: 160 }}
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      {moreLinks.map(link => (
                        <Link key={link.href} to={withLocale(link.href)} onClick={() => setMoreOpen(false)}
                          className="flex items-center gap-2 transition-all duration-150"
                          style={{ color: active(link.href) ? DS.blue : DS.text3, fontSize: 12.5, padding: '8px 14px', textDecoration: 'none', background: active(link.href) ? rgba(DS.blue, 0.06) : 'transparent' }}
                          onMouseEnter={e => { e.currentTarget.style.background = rgba('#FFFFFF', 0.04); e.currentTarget.style.color = DS.text; }}
                          onMouseLeave={e => { e.currentTarget.style.background = active(link.href) ? rgba(DS.blue, 0.06) : 'transparent'; e.currentTarget.style.color = active(link.href) ? DS.blue : DS.text3; }}
                        >
                          {link.label}
                          {active(link.href) && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: DS.blue }} />}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Desktop right actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Locale switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1.5 cursor-pointer transition-all duration-150"
                style={{
                  color: DS.text4, fontSize: 11, padding: '5px 10px',
                  borderRadius: 8, background: langOpen ? rgba(DS.blue, 0.06) : 'transparent',
                  border: `1px solid ${langOpen ? rgba(DS.blue, 0.2) : 'transparent'}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = DS.text2; e.currentTarget.style.background = rgba('#FFFFFF', 0.03); }}
                onMouseLeave={e => { if (!langOpen) { e.currentTarget.style.color = DS.text4; e.currentTarget.style.background = 'transparent'; } }}
              >
                <span style={{ fontSize: 14 }}>{LOCALE_FLAGS[locale]}</span>
                <span style={{ fontSize: 11 }}>{LOCALE_LABELS[locale]}</span>
                <motion.span animate={{ rotate: langOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
                  <ChevronRight size={10} />
                </motion.span>
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    className="absolute top-full right-0 mt-1.5 py-1.5 rounded-xl overflow-hidden"
                    style={{
                      background: rgba(DS.bgCard, 0.98), border: `1px solid ${rgba(DS.blue, 0.12)}`,
                      backdropFilter: 'blur(20px)', boxShadow: `0 12px 40px rgba(0,0,0,0.5)`,
                      minWidth: 160, zIndex: 60,
                    }}
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    {SUPPORTED_LOCALES.map(loc => (
                      <button
                        key={loc}
                        onClick={() => {
                          handleLocaleChange(loc);
                          setLangOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 transition-all duration-150"
                        style={{
                          background: loc === locale ? rgba(DS.blue, 0.08) : 'transparent',
                          border: 'none', cursor: 'pointer',
                          color: loc === locale ? DS.blue : DS.text3, fontSize: 12,
                        }}
                        onMouseEnter={e => { if (loc !== locale) e.currentTarget.style.background = rgba('#FFFFFF', 0.04); }}
                        onMouseLeave={e => { if (loc !== locale) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontSize: 15 }}>{LOCALE_FLAGS[loc]}</span>
                        <span style={{ fontWeight: loc === locale ? 600 : 400 }}>{LOCALE_LABELS[loc]}</span>
                        {loc === locale && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: DS.blue }} />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <InlineSearchBar onOpen={() => setSearchOpen(true)} />

            {/* LP badge */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                style={{ background: rgba(DS.purple, 0.08), border: `1px solid ${rgba(DS.purple, 0.18)}` }}>
                <Zap size={10} style={{ color: DS.purple }} />
                <span style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                  {user.lpBalance >= 1000 ? `${(user.lpBalance / 1000).toFixed(1)}K` : user.lpBalance}
                </span>
              </div>
            )}

            {/* User Avatar Menu */}
            <UserAvatarMenu onNavigate={navigate} />
          </div>

          {/* Mobile right */}
          <div className="lg:hidden flex items-center gap-1.5">
            {isAuthenticated && user && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                style={{ background: rgba(DS.purple, 0.08), border: `1px solid ${rgba(DS.purple, 0.15)}` }}>
                <Zap size={9} style={{ color: DS.purple }} />
                <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                  {user.lpBalance >= 1000 ? `${(user.lpBalance / 1000).toFixed(1)}K` : user.lpBalance}
                </span>
              </div>
            )}

            {/* Mobile user avatar */}
            {isAuthenticated && user ? (
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                style={{ border: `1.5px solid ${rgba(user.rankColor ?? DS.blue, 0.4)}`, cursor: 'pointer', padding: 0 }}>
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </button>
            ) : (
              <Link to="/dang-nhap" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${rgba('#FFFFFF', 0.08)}`, background: rgba('#FFFFFF', 0.03), color: DS.text4, textDecoration: 'none' }}>
                <User size={15} />
              </Link>
            )}

            <button onClick={() => setSearchOpen(true)}
              style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: `1px solid ${rgba('#FFFFFF', 0.08)}`, background: rgba('#FFFFFF', 0.03), color: DS.text4, cursor: 'pointer' }}>
              <Search size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)' }} onClick={() => setMobileOpen(false)} />
            <motion.div className="absolute top-14 left-3 right-3 rounded-2xl overflow-hidden"
              style={{ background: rgba(DS.bgCard, 0.98), border: `1px solid ${rgba(DS.blue, 0.1)}`, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
              initial={{ y: -16, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -16, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* User info (mobile) */}
              {isAuthenticated && user && (
                <div className="p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${rgba('#FFFFFF', 0.05)}` }}>
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `2px solid ${rgba(user.rankColor ?? DS.blue, 0.4)}` }}>
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                    <div style={{ color: DS.text4, fontSize: 10 }}>{user.email}</div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: rgba(DS.purple, 0.08) }}>
                    <Zap size={9} style={{ color: DS.purple }} />
                    <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{user.lpBalance.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="px-4 pt-3 pb-2">
                <button onClick={() => { setMobileOpen(false); setTimeout(() => setSearchOpen(true), 100); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer"
                  style={{ background: rgba('#FFFFFF', 0.03), border: `1px solid ${rgba('#FFFFFF', 0.06)}`, color: DS.text5, fontSize: 13 }}>
                  <Search size={14} /><span style={{ flex: 1, textAlign: 'left' }}>{t("navigation.search", "Tìm kiếm nhanh...")}</span>
                  <kbd style={{ fontSize: 9, fontFamily: DS.mono, color: DS.text5, background: rgba('#FFFFFF', 0.04), borderRadius: 3, padding: '1px 4px' }}>⌘K</kbd>
                </button>
              </div>

              <div className="mx-4 h-px" style={{ background: rgba('#FFFFFF', 0.05) }} />

              {/* Links */}
              <div className="p-2 grid grid-cols-2 gap-1">
                {NAV_LINKS.map(link => (
                  <Link key={link.href} to={withLocale(link.href)}
                    className="flex items-center gap-2 rounded-xl transition-all duration-150"
                    style={{ color: active(link.href) ? DS.blue : DS.text3, fontSize: 13, padding: '10px 12px', textDecoration: 'none', background: active(link.href) ? rgba(DS.blue, 0.08) : 'transparent' }}>
                    {active(link.href) && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DS.blue, boxShadow: `0 0 4px ${DS.blue}` }} />}
                    {link.label.includes('.') ? t(link.label, link.label) : link.label}
                  </Link>
                ))}
              </div>

              <div className="mx-4 h-px" style={{ background: rgba('#FFFFFF', 0.05) }} />

              {/* CTA row */}
              <div className="p-3 flex gap-2">
                {isAuthenticated && user ? (
                  <>
                    {user.role !== 'client' && (
                      <Link to="/admin" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                        style={{ color: DS.purple, fontSize: 13, textDecoration: 'none', border: `1px solid ${rgba(DS.purple, 0.2)}`, background: rgba(DS.purple, 0.06) }}>
                        <Shield size={13} /> {t("admin.title", "Admin")}
                      </Link>
                    )}
                    <Link to="/khach-hang" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                      style={{ background: GRD.primary, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: `0 0 16px ${rgba(DS.purple, 0.3)}` }}>
                      <Sparkles size={13} /> {t("customer.dashboard", "Dashboard")}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/dang-nhap" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                      style={{ color: DS.text3, fontSize: 13, textDecoration: 'none', border: `1px solid ${rgba('#FFFFFF', 0.08)}`, background: rgba('#FFFFFF', 0.02) }}>
                      <LogIn size={13} /> {t("navigation.login", "Đăng nhập")}
                    </Link>
                    <Link to="/dang-ky" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                      style={{ background: GRD.primary, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: `0 0 16px ${rgba(DS.purple, 0.3)}` }}>
                      <Sparkles size={13} /> {t("auth.register", "Đăng ký")}
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdvancedSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
