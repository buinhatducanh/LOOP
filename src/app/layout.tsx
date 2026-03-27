/**
 * Root Layout — LOOP Solutions
 *
 * API-only app: minimal layout with no i18n.
 * The [locale] layout in app/[locale]/ handles FE pages with i18n.
 * Admin routes use their own minimal layout.
 */
import type { Metadata } from "next";
import "@/styles/figma-theme.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn"),
  title: "LOOP API",
  description: "LOOP Agency API — Backend-only Next.js application",
  robots: { index: false, follow: false },
};

// Root layout for API-only routes.
// FE pages use app/[locale]/layout.tsx which has NextIntlClientProvider.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
