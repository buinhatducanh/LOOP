"use client";

import Script from "next/script";
import { usePathname } from "@/i18n/routing";

const PROPERTY_ID = "69b41637063f791c37e4d891";
const WIDGET_ID = "1jjjndita";

const ADMIN_PREFIXES = ["/admin", "/vi/admin", "/en/admin"];

function isAdminRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Tawk.to chat widget — only shown to public visitors.
 * NOT shown on admin routes, NOT shown to logged-in staff.
 */
export function TawktoChat() {
  const pathname = usePathname();

  // Synchronous check — prevents widget from briefly rendering on admin pages
  // during hydration (which would add an unwanted chat bubble).
  if (isAdminRoute(pathname)) return null;

  return (
    <Script id="tawk-widget" strategy="lazyOnload">
      {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src='https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}';
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
        })();
      `}
    </Script>
  );
}
