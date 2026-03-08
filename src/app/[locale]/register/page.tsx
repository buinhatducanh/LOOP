import type { Metadata } from "next";
import { RegisterPage } from "./register-page";

export const metadata: Metadata = {
  title: "Đăng ký | LOOP",
  description: "Tạo tài khoản LOOP để bắt đầu dự án mới và quản lý yêu cầu dịch vụ.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RegisterPage />;
}
