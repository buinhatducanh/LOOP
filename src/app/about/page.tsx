import type { Metadata } from "next";
import { AboutPage } from "./about-page";

export const metadata: Metadata = {
  title: "Về chúng tôi | LOOP",
  description:
    "LOOP - Đội ngũ 50+ chuyên gia, 8+ năm kinh nghiệm thiết kế website và ứng dụng cho doanh nghiệp. Cam kết chất lượng, hiệu suất cao.",
  alternates: { canonical: "https://loop.vn/about" },
};

export default function Page() {
  return <AboutPage />;
}
