import type { Metadata } from "next";
import PricingCalculatorContent from "./pricing-calculator";

export const metadata: Metadata = {
  title: "Tùy chỉnh Báo giá Website | LOOP",
  description:
    "Tự cấu hình website theo nhu cầu với các tính năng và cấp độ tùy chọn. Nhận báo giá tức thì.",
};

export default function PricingCalculatorPage() {
  return <PricingCalculatorContent />;
}
