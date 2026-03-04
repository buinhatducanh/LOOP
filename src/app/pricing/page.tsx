import type { Metadata } from "next";
import { getPricingPlans } from "@/lib/db/queries";
import { pricingPlans as mockPlans } from "@/data/mockData";
import { PricingPage } from "./pricing-page";

export const metadata: Metadata = {
  title: "Bảng giá thiết kế Website | LOOP",
  description:
    "Bảng giá dịch vụ thiết kế website LOOP. Gói Basic từ $499, Standard $999, Premium $1999. Cam kết chất lượng, hiệu suất cao.",
  alternates: { canonical: "https://loop.vn/pricing" },
};

export default async function Page() {
  let plans;
  try {
    const dbPlans = await getPricingPlans();
    plans = dbPlans.length > 0 ? dbPlans.map((p) => ({
      id: p.slug, name: p.name, price: p.price, period: p.period,
      tagline: p.tagline, features: p.features, notIncluded: p.notIncluded,
      highlighted: p.highlighted, cta: p.cta, color: p.color,
    })) : mockPlans;
  } catch {
    plans = mockPlans;
  }
  return <PricingPage plans={plans} />;
}
