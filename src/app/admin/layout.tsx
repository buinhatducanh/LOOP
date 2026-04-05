/**
 * Admin Layout — LOOP Solutions
 *
 * Dark-themed admin shell wrapping all /admin/* pages.
 * Provides React Query context, auth session, and Figma dark nav layout.
 *
 * Auth guard: redirects to /{locale}/dang-nhap if no session.
 *
 * Session pattern: server layout reads session (server-side),
 * passes it down as props. No Zustand store needed for admin auth —
 * this avoids "setState during render" issues from AdminSessionInit.
 */

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { getSession } from "@/lib/auth/permissions";
import { mapRoleLevelToUserRole } from "@/app/store/authStore";
import { QueryProvider } from "@/lib/query/provider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminI18nProvider } from "@/i18n/admin/AdminI18nProvider";
import { SessionHydrator } from "./SessionHydrator";
import "@/styles/globals.css";

const dmSansFont = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

// Re-export so other admin pages can import this type
export type { SessionUser } from "@/lib/auth/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    const cookieStore = await cookies();
    const locale = cookieStore.get("NEXT_LOCALE")?.value ?? "vi";
    redirect(`/${locale}/dang-nhap`);
  }

  // Derive display role from roleLevel (1-to-1 mapping)
  const roleLevel = session.roleLevel ?? 1;
  const accountType = session.accountType ?? "staff";
  const displayRole = mapRoleLevelToUserRole(roleLevel, accountType);

  return (
    <html lang="vi" suppressHydrationWarning className={`dark ${dmSansFont.className} ${headingFont.className}`}>
      <body
        style={{
          margin: 0,
          display: "flex",
          minHeight: "100vh",
          background: "var(--figma-bg, #020617)",
          color: "var(--figma-text, #fff)",
          fontFamily: "var(--font-dm-sans), DM Sans, system-ui, sans-serif",
        }}
      >
        <QueryProvider>
          <AdminI18nProvider>
          <SessionHydrator />
          {/* Sidebar — receives session data as props, no Zustand store needed */}
          <AdminSidebar
            userName={session.name}
            userAvatar={session.avatar ?? undefined}
            userRole={displayRole}
            userRank={session.rank}
            userLpBalance={session.availableLp}
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
            {/* Page content — pass session to pages that need it */}
            <main style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
              {children}
            </main>
          </div>
          </AdminI18nProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
