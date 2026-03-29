/**
 * LocaleGuard — React Router v7 SPA Locale Routing
 *
 * Responsibilities:
 * 1. Extract locale from URL path (/:locale/*)
 * 2. Redirect bare paths (/) → /:locale/ using detection order:
 *      URL param → localStorage → Accept-Language → 'vi'
 * 3. Sync extracted locale → localeStore (so all components re-render)
 * 4. Render child routes normally (Outlet)
 *
 * Used as a layout wrapper in routes.tsx.
 */
import { useEffect } from "react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router";
import { useLocaleStore, SUPPORTED_LOCALES, normalizeLocale, type Locale } from "../../store/localeStore";

/** Detect the best locale using Accept-Language header (browser only) */
function detectLocaleFromBrowser(): Locale {
  if (typeof navigator === "undefined") return "vi";
  const browserLang = navigator.language.slice(0, 2).toLowerCase();
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }
  return "vi";
}

export default function LocaleGuard() {
  const { locale: urlLocale } = useParams<{ locale: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setLocale } = useLocaleStore();

  useEffect(() => {
    const pathname = location.pathname;

    // Case 1: Root path "/" → redirect to locale
    if (pathname === "/" || pathname === "") {
      // Priority: localStorage → Accept-Language → 'vi'
      const stored = normalizeLocale(
        typeof window !== "undefined" ? localStorage.getItem("loop_locale") : null
      );
      const detected =
        stored !== "vi"
          ? stored
          : typeof window !== "undefined"
          ? detectLocaleFromBrowser()
          : "vi";
      navigate(`/${detected}`, { replace: true });
      setLocale(detected);
      return;
    }

    // Case 2: Path has locale segment in URL
    if (urlLocale && SUPPORTED_LOCALES.includes(urlLocale as Locale)) {
      const locale = urlLocale as Locale;
      setLocale(locale);
      // Sync to localStorage for persistence across navigation
      if (typeof window !== "undefined") {
        localStorage.setItem("loop_locale", locale);
      }
      return;
    }

    // Case 3: No locale in URL (shouldn't happen with correct routing,
    //         but redirect just in case)
    const stored = normalizeLocale(
      typeof window !== "undefined" ? localStorage.getItem("loop_locale") : null
    );
    const base = pathname.startsWith("/") ? pathname : `/${pathname}`;
    navigate(`/${stored}${base}`, { replace: true });
    setLocale(stored);
  }, [urlLocale, location.pathname, navigate, setLocale]);

  // Don't render children until locale is resolved
  if (!urlLocale || !SUPPORTED_LOCALES.includes(urlLocale as Locale)) {
    return null;
  }

  return <Outlet />;
}
