/**
 * Khach hang (Customer Portal) Page — LOOP Solutions
 * Route: /vi/khach-hang, /en/khach-hang, /ja/khach-hang, /ko/khach-hang, /zh/khach-hang
 * Redirects to /admin (customer accesses portal via admin dashboard)
 */
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function KhachHangPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect("/admin");
}
