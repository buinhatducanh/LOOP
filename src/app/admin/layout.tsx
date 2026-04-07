/**
 * Admin Layout — LOOP Solutions
 *
 * Dark-themed admin shell wrapping all /admin/* pages.
 * Provides React Query context, auth session, and Figma dark nav layout.
 *
 * NOTE: This layout renders INSIDE the root app/layout.tsx <body>.
 * It must NOT include <html> or <body> tags — those are in the root layout only.
 *
 * Auth guard: AuthGuard client component reads Zustand store (localStorage-backed).
 * We deliberately do NOT call getSession() here — it runs server-side and fails
 * on soft navigations (sidebar Link clicks) because HttpOnly cookies aren't
 * reliably forwarded. AuthGuard handles auth client-side instead.
 *
 * Session flow:
 *   Full page load: Middleware validates cookie server-side → AdminLayout renders
 *   Soft navigation: AuthGuard checks Zustand store → allows or redirects
 */

import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "@/lib/query/provider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminI18nProvider } from "@/i18n/admin/AdminI18nProvider";
import { AuthGuard } from "@/components/admin/AuthGuard";
import { SessionHydrator } from "./SessionHydrator";
import "@/styles/globals.css";

 DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

 Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

// Re-export so other admin pages can import this type
export type { SessionUser } from "@/lib/auth/permissions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AdminI18nProvider>
        <AuthGuard>
          <SessionHydrator />
          {/* Sidebar + Topbar read session from Zustand store */}
          <AdminSidebar userName="" userRole="admin" />
          {/* Main area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              marginLeft: 260,
              minHeight: "100vh",
              background: "var(--figma-bg, #020617)",
              color: "var(--figma-text, #fff)",
              fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
            }}
          >
            <AdminTopbar userName="" userEmail="" />
            <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
              {children}
            </main>
          </div>
        </AuthGuard>
      </AdminI18nProvider>
    </QueryProvider>
  );
}
