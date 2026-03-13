"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Zap, LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

const navLinks = [
  { key: "home", path: "/" },
  { key: "services", path: "/services" },
  { key: "portfolio", path: "/portfolio" },
  { key: "pricing", path: "/pricing" },
  { key: "about", path: "/about" },
  { key: "contact", path: "/contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <motion.nav
      initial={false}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-gray-900/95 backdrop-blur-xl shadow-lg shadow-black/20 border-b border-white/5"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              LOOP
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${pathname === link.path
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                  }`}
              >
                {pathname === link.path && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-white/10 rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{t(link.key as any)}</span>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section + Language Switcher */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                    {user.avatar}
                  </div>
                  <span className="text-sm text-gray-300">{user.name}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-xl border border-white/10 shadow-xl shadow-black/20 overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      <div className="p-1">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        <Link
                          href="/dashboard"
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>{t('dashboard')}</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center space-x-1 px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('login')}</span>
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                >
                  {t('register')}
                </Link>
              </>
            )}
            <LanguageSwitcher />
          </div>

          {/* Mobile: Language Switcher + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-gray-900/98 backdrop-blur-xl border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${pathname === link.path
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {t(link.key as any)}
                </Link>
              ))}

              <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center space-x-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {t('dashboard')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/register"
                      className="block px-4 py-3 text-sm font-medium text-center text-white bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg"
                    >
                      {t('register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
