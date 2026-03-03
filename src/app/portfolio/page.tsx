import type { Metadata } from "next";
import { PortfolioPage } from "./portfolio-page";

export const metadata: Metadata = {
  title: "Dự án đã thực hiện | LOOP",
  description:
    "Xem các dự án website, ứng dụng web đã hoàn thành bởi LOOP. 150+ dự án, 98% khách hàng hài lòng. E-commerce, SaaS, corporate.",
  alternates: { canonical: "https://loop.vn/portfolio" },
};

export default function Page() {
  return <PortfolioPage />;
}
