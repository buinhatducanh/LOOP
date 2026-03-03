import type { Metadata } from "next";
import { ServicesPage } from "./services-page";

export const metadata: Metadata = {
  title: "Dịch vụ thiết kế Website | LOOP",
  description:
    "Dịch vụ thiết kế website doanh nghiệp, thương mại điện tử, landing page, ứng dụng web tùy chỉnh. Giá từ $499.",
  alternates: { canonical: "https://loop.vn/services" },
};

export default function Page() {
  return <ServicesPage />;
}
