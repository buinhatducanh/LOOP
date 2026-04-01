/**
 * Root Layout — LOOP Solutions
 *
 * API-only app: minimal layout with no i18n.
 * The [locale] layout in app/[locale]/ handles FE pages with i18n.
 * Admin routes use their own minimal layout.
 */
import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn"),
  title: "LOOP Solutions",
  description: "LOOP Solutions — Professional Web & App Development. SEO-optimized, 95+ performance, 150+ projects delivered.",
  keywords: ["LOOP Solutions", "web design", "web app", "SaaS", "dashboard", "SEO", "agency Vietnam"],
  openGraph: {
    type: "website",
    siteName: "LOOP Solutions",
    title: "LOOP Solutions",
    description: "Professional Web & App Development — SEO-optimized, 95+ performance, 150+ projects delivered.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn",
    images: [
      {
        url: "/og-cover.jpg",
        width: 1200,
        height: 630,
        alt: "LOOP Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LOOP Solutions",
    description: "Professional Web & App Development — SEO-optimized, 95+ performance, 150+ projects delivered.",
    images: ["/og-cover.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
  },
  robots: { index: false, follow: false },
};

// Root layout for API-only routes.
// FE pages use app/[locale]/layout.tsx which has NextIntlClientProvider.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
