import type { Metadata } from "next";
import { ContactPage } from "./contact-page";

export const metadata: Metadata = {
  title: "Liên hệ | LOOP",
  description:
    "Liên hệ LOOP để nhận tư vấn miễn phí. Hotline: +84 888 123 456, Email: hello@loop.vn. Đội ngũ sẽ phản hồi trong 24 giờ.",
  alternates: { canonical: "https://loop.vn/contact" },
};

export default function Page() {
  return <ContactPage />;
}
