import type { Metadata } from "next";
import { getServices } from "@/lib/db/queries";
import { services as mockServices } from "@/data/mockData";
import { ServicesPage } from "./services-page";

export const metadata: Metadata = {
  title: "Dịch vụ thiết kế Website | LOOP",
  description:
    "Dịch vụ thiết kế website doanh nghiệp, thương mại điện tử, landing page, ứng dụng web tùy chỉnh. Giá từ $499.",
  alternates: { canonical: "https://loop.vn/services" },
};

export default async function Page() {
  let services;
  try {
    const dbServices = await getServices();
    services = dbServices.length > 0 ? dbServices.map((s) => ({
      id: s.slug, icon: s.icon, title: s.title, shortDescription: s.shortDescription,
      longDescription: s.longDescription, features: s.features, technologies: s.technologies,
      startingPrice: s.startingPrice, deliveryTime: s.deliveryTime, category: s.category,
    })) : mockServices;
  } catch {
    services = mockServices;
  }
  return <ServicesPage services={services} />;
}
