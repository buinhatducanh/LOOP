import type { Metadata } from "next";
import { AdminShell } from "./components/admin-shell";
import { AdminToaster } from "./components/admin-toaster";
import { requireAdmin } from "@/navigation/server-guards";

export const metadata: Metadata = {
  title: { default: "Admin | LOOP", template: "%s | LOOP Admin" },
  robots: { index: false, follow: false },
};

// Server-side auth guard: redirect unauthenticated users before rendering.
// This is defense-in-depth — edge middleware already blocks most, but this catches edge bypasses.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Run auth check at the server level (uses Prisma + JWT verify)
  await requireAdmin();

  return (
    <>
      <AdminShell>{children}</AdminShell>
      <AdminToaster />
    </>
  );
}
