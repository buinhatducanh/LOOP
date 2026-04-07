"use client";

/**
 * Shell — wraps page content with SiteHeader/SiteFooter.
 * Conditionally hides header on pages that need a clean/full-screen layout.
 */
import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

const HIDE_HEADER_PATHS = [
  "/dang-nhap/client-onboarding",
];

export function Shell({ children, locale }: { children: React.ReactNode; locale: string }) {
  const pathname = usePathname();
  const showHeader = !HIDE_HEADER_PATHS.some((p) => pathname.endsWith(p));

  return (
    <>
      {showHeader && <SiteHeader locale={locale} />}
      <div style={{ flex: 1 }}>
        {children}
      </div>
      {showHeader && <SiteFooter locale={locale} />}
    </>
  );
}
