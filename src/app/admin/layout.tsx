import type { Metadata } from "next";
import "@/app/globals.css";
import { AdminShell } from "./components/admin-shell";
import { AdminAuthProvider } from "./components/admin-auth-provider";
import { AdminToaster } from "./components/admin-toaster";

export const metadata: Metadata = {
  title: { default: "Admin | LOOP", template: "%s | LOOP Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <AdminAuthProvider>
          <AdminShell>{children}</AdminShell>
          <AdminToaster />
        </AdminAuthProvider>
      </body>
    </html>
  );
}
