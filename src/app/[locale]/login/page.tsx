import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPage } from "./login-page";

export const metadata: Metadata = {
  title: "Đăng nhập | LOOP",
  description: "Đăng nhập vào tài khoản LOOP để quản lý dự án và truy cập bảng điều khiển.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
