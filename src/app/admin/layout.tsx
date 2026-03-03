import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | LOOP",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
