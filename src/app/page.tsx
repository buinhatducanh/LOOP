import type { Metadata } from "next";
import { HomePage } from "./home-page";

export const metadata: Metadata = {
  title: "LOOP - Thiết kế Website & App chuyên nghiệp",
  description:
    "Công ty LOOP chuyên thiết kế website thương mại, app di động, phần mềm quản lý. Cam kết SEO top Google, hiệu suất 95+. 150+ dự án, 98% hài lòng.",
  alternates: { canonical: "https://loop.vn" },
};

export default function Page() {
  return <HomePage />;
}
