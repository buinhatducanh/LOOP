import { Link, useLocation } from 'react-router-dom';
import { useI18n, useLocaleStore, LOCALE_FLAGS } from '@/i18n';
import { loadLocaleFont, injectFontClasses } from '@/i18n/fonts';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

const NAV_ITEMS = [
  { key: 'home', path: '/' },
  { key: 'services', path: '/dich-vu' },
  { key: 'portfolio', path: '/du-an' },
  { key: 'team', path: '/doi-ngu' },
  { key: 'academy', path: '/hoc-vien' },
  { key: 'blog', path: '/blog' },
  { key: 'contact', path: '/lien-he' },
] as const;

export function Navbar() {
  const { t } = useI18n();
  const { locale, setLocale } = useLocaleStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [showLang, setShowLang] = useState(false);

  async function handleLocaleChange(newLocale: typeof locale) {
    setLocale(newLocale);
    await loadLocaleFont(newLocale);
    injectFontClasses(newLocale);
    setShowLang(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
                style={{ fontFamily: 'Cinzel, serif' }}>
            LOOP
          </span>
          <span className="text-xs text-gray-400">Solutions</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'text-blue-400'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t(`navigation.${item.key}`)}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              {user.lpBalance !== undefined && (
                <span className="text-xs text-yellow-400 font-mono">
                  {user.lpBalance.toLocaleString()} LP
                </span>
              )}
              <Link
                to="/admin"
                className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {user.name}
              </Link>
              <button
                onClick={logout}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {t('common.logout')}
              </button>
            </div>
          ) : (
            <Link
              to="/dang-nhap"
              className="text-sm px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
            >
              {t('auth.login')}
            </Link>
          )}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLang(!showLang)}
              className="text-lg hover:opacity-80 transition-opacity"
              title={LOCALE_FLAGS[locale]}
            >
              {LOCALE_FLAGS[locale]}
            </button>
            {showLang && (
              <div className="absolute right-0 mt-2 w-36 bg-[#0F172A] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                {(['vi', 'en', 'ja', 'ko', 'zh'] as const).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${
                      loc === locale ? 'text-blue-400' : 'text-gray-300'
                    }`}
                  >
                    <span>{LOCALE_FLAGS[loc]}</span>
                    <span>{loc.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
