/**
 * Admin Layout — LOOP Solutions
 *
 * Dark-themed admin shell wrapping all /admin/* pages.
 * Provides React Query context, auth session, and Figma dark nav layout.
 *
 * Auth guard: redirects to /admin/login if no session.
 */

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/permissions";
import { QueryProvider } from "@/lib/query/provider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import "@/styles/figma-theme.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    // "dark" class for Figma dark theme
    <html lang="vi" suppressHydrationWarning className="dark">
      <body
        style={{
          margin: 0,
          display: "flex",
          minHeight: "100vh",
          background: "var(--figma-bg, #020617)",
          color: "var(--figma-text, #fff)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <QueryProvider>
          {/* Sidebar */}
          <AdminSidebar
            userName={session.name}
            userAvatar={session.avatar ?? undefined}
            userRole={session.role}
          />
          {/* Main area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              marginLeft: 260, // sidebar width
              minHeight: "100vh",
            }}
          >
            {/* Topbar */}
            <AdminTopbar
              userName={session.name}
              userEmail={session.email}
              userAvatar={session.avatar ?? undefined}
            />
            {/* Page content */}
            <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
