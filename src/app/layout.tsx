/**
 * Root Layout — LOOP Solutions
 *
 * The ONE layout in the tree that provides <html> and <body>.
 * All other layouts (app/[locale]/layout.tsx, app/admin/layout.tsx) render
 * their content inside {children} here and must NOT include <html>/<body>.
 *
 * Route groups:
 * (root) → renders inside this layout's <body>
 * [locale]/ → public FE pages (with i18n)
 * admin/ → dark admin dashboard
 */
import type { Metadata } from "next";
import "@/styles/globals.css";

const LOCALES = ["vi", "en", "ja", "ko", "zh"];
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

export const metadata: Metadata = {
 metadataBase: new URL(BASE_URL),
 title: "LOOP Solutions",
 description: "LOOP Solutions — Professional Web & App Development. SEO-optimized, 95+ performance, 150+ projects delivered.",
 keywords: ["LOOP Solutions", "web design", "web app", "SaaS", "dashboard", "SEO", "agency Vietnam"],
 openGraph: {
 type: "website",
 siteName: "LOOP Solutions",
 title: "LOOP Solutions",
 description: "Professional Web & App Development — SEO-optimized, 95+ performance, 150+ projects delivered.",
 url: BASE_URL,
 images: LOCALES.map((locale) => ({
 url: `${BASE_URL}/api/og?type=home&locale=${locale}`,
 width: 1200,
 height: 630,
 alt: "LOOP Solutions",
 locale,
 })),
 },
 twitter: {
 card: "summary_large_image",
 title: "LOOP Solutions",
 description: "Professional Web & App Development — SEO-optimized, 95+ performance, 150+ projects delivered.",
 images: [`${BASE_URL}/api/og?type=home&locale=vi`],
 },
 icons: {
 icon: [
 { url: "/favicon.svg", type: "image/svg+xml" },
 { url: "/favicon.ico" },
 ],
 },
 robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
 <html lang="vi" suppressHydrationWarning>
 <body style={{ overflowX: "hidden", overflowY: "auto" }}>{children}</body>
 </html>
 );
}
