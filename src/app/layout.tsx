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
  title: "LOOP Solutions — Server-first + AI-driven + Edge-ready",
  description: "LOOP Solutions platform with server-first architecture, AI-driven workflows, and edge-ready delivery.",
  keywords: ["LOOP Solutions", "server-first", "ai-driven", "edge-ready", "web", "app", "seo", "media"],
  openGraph: {
    type: "website",
    siteName: "LOOP Solutions",
    title: "LOOP Solutions — Server-first + AI-driven + Edge-ready",
    description: "Server-first architecture, AI-driven execution, edge-ready delivery for scalable digital products.",
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
    title: "LOOP Solutions — Server-first + AI-driven + Edge-ready",
    description: "Server-first architecture, AI-driven execution, edge-ready delivery for scalable digital products.",
    images: ["/og-cover.jpg"],
  },
  robots: { index: false, follow: false },
};

// Root layout for API-only routes.
// FE pages use app/[locale]/layout.tsx which has NextIntlClientProvider.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
