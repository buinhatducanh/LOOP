import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn"),
  title: "LOOP API",
  description: "LOOP Agency API — Backend-only Next.js application",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
