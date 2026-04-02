/**
 * Media Booking Page — LOOP Solutions
 * Route: /[locale]/media
 * Status: coming-soon placeholder (real component pending)
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("seo");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: t("mediaTitle"),
    description: t("mediaDescription"),
    alternates: { canonical: `${baseUrl}/${locale}/media` },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MediaBookingPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("MediaPage");

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}
    >
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, #000 70%, transparent 110%)",
        }}
      />
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
        style={{ width: "600px", height: "600px", background: "rgba(99,102,241,0.15)", borderRadius: "50%", filter: "blur(120px)" }}
      />

      <div className="relative z-10 px-6">
        <span
          className="mb-6 inline-block rounded-full border px-4 py-1 text-sm font-medium"
          style={{ background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.4)", color: "#a5b4fc" }}
        >
          {t("badge")}
        </span>

        <h1
          className="mb-4 font-heading text-5xl font-black tracking-tight text-white sm:text-6xl"
          style={{ lineHeight: 1.1 }}
        >
          {t("heroTitle")}
        </h1>

        <p
          className="mx-auto mb-8 max-w-xl text-lg"
          style={{ color: "#94a3b8", lineHeight: 1.7 }}
        >
          {t("heroDesc")}
        </p>

        {/* Feature cards */}
        <div
          className="mx-auto mb-10 grid gap-4 sm:grid-cols-3"
          style={{ maxWidth: "700px" }}
        >
          {[t("feat1"), t("feat2"), t("feat3")].map((feat, i) => (
            <div
              key={i}
              className="rounded-xl border p-4 text-sm"
              style={{
                background: "rgba(15,23,42,0.8)",
                borderColor: "#1e293b",
                color: "#cbd5e1",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="mb-2 flex items-center justify-center">
                <svg
                  className="h-5 w-5"
                  style={{ color: "#818cf8" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {feat}
            </div>
          ))}
        </div>

        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90"
          style={{ background: "#6366f1", color: "white" }}
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
