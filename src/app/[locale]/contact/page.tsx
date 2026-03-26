/**
 * Contact Page — LOOP Solutions
 * Phase 0 i18n: wired to POST /api/contact
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ContactForm } from "./_components/ContactForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";
  return {
    title: "Liên hệ - Báo giá dịch vụ web",
    alternates: { canonical: `${baseUrl}/${locale}/contact` },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("ContactPage");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "5rem 2rem 4rem",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <span style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.2)",
            color: "white",
            padding: "0.25rem 1rem",
            borderRadius: "9999px",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}>
            {t("badge")}
          </span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem", lineHeight: 1.2 }}>
            {t("heroTitle1")} <span style={{ color: "#fbbf24" }}>{t("heroHighlight")}</span>
          </h1>
          <p style={{ fontSize: "1.125rem", opacity: 0.9, maxWidth: "540px", margin: "0 auto" }}>
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Main content */}
      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "3rem 1.5rem",
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: "2.5rem",
        alignItems: "start",
      }}>
        {/* Form */}
        <ContactForm t={t} />

        {/* Info sidebar */}
        <aside style={{
          background: "white",
          borderRadius: "1rem",
          padding: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          position: "sticky",
          top: "2rem",
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "#111827" }}>
            {t("infoTitle")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <InfoRow label={t("infoEmail")} value="hello@loop.company" />
            <InfoRow label={t("infoPhone")} value="+84 28 7100 1234" />
            <InfoRow label={t("infoAddress")} value="123 Nguyễn Huệ, Q.1, TP.HCM" />
            <InfoRow label={t("infoHours")} value={t("infoHoursValue")} />
          </div>

          {/* Service quick links */}
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Dịch vụ
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {["Web App", "Mobile", "AI/ML", "Branding"].map((s) => (
                <span key={s} style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.8125rem",
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: "0.8125rem", color: "#6b7280", marginBottom: "0.125rem" }}>{label}</p>
      <p style={{ fontSize: "0.9375rem", color: "#111827", fontWeight: 500 }}>{value}</p>
    </div>
  );
}
