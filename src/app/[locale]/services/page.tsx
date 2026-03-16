import type { Metadata } from "next";
import { getDualServicesData } from "@/lib/db/queries";
import { ServicesPage } from "./services-page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isVi = locale === "vi";

  return {
    title: isVi ? "Dịch Vụ Website | LOOP" : "Website Services | LOOP",
    description: isVi
      ? "Chọn giải pháp web phù hợp: Mẫu website sẵn có hoặc thiết kế theo yêu cầu riêng"
      : "Choose your perfect web solution: Ready-to-use templates or custom design & build",
    alternates: { canonical: `https://loop.vn/${locale}/services` },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let templates: Awaited<ReturnType<typeof getDualServicesData>>["templates"] = [];
  let attributes: Awaited<ReturnType<typeof getDualServicesData>>["attributes"] = [];

  try {
    const data = await getDualServicesData();
    templates = data.templates;
    attributes = data.attributes;
  } catch (error) {
    console.error("Error loading services data:", error);
    // Fallback to empty — page sẽ hiển thị trạng thái trống
  }

  return <ServicesPage locale={locale} templates={templates} attributes={attributes} />;
}
