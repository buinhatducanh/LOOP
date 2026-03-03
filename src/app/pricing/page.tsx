import type { Metadata } from "next";
import { PricingPage } from "./pricing-page";

export const metadata: Metadata = {
  title: "Bảng giá thiết kế Website | LOOP",
  description:
    "Bảng giá dịch vụ thiết kế website LOOP. Gói Basic từ $499, Standard $999, Premium $1999. Cam kết chất lượng, hiệu suất cao.",
  alternates: { canonical: "https://loop.vn/pricing" },
};

export default function Page() {
  return <PricingPage />;
}
