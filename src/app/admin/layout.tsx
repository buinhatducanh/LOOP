/**
 * Admin Layout — LOOP Solutions
 *
 * Dark-themed admin shell wrapping all /admin/* pages.
 * Provides React Query context, auth session, and Figma dark nav layout.
 *
 * NOTE: This layout renders INSIDE the root app/layout.tsx <body>.
 * It must NOT include <html> or <body> tags — those are in the root layout only.
 *
 * Auth guard (server-side):
 * - On EVERY request, verify the JWT cookie server-side BEFORE rendering.
 * - Expired/invalid token → redirect to /admin/login.
 * - AuthGuard (client-side) still runs for per-session expiry handling.
 *
 * Session flow:
 * Full page load: layout.tsx verifies JWT → AdminLayout renders
 * Soft navigation: Zustand hydrated → AuthGuard allows → re-verify on next /me
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { COOKIES } from "@/lib/auth/edge";
import { QueryProvider } from "@/lib/query/provider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminI18nProvider } from "@/i18n/admin/AdminI18nProvider";
import { AuthGuard } from "@/components/admin/AuthGuard";
import { SessionHydrator } from "./SessionHydrator";
import { MemberStatsPanel } from "@/components/shared/MemberStatsPanel";
import { AdminSessionHydrator, type HydrationPayload } from "./AdminSessionHydrator";
import "@/styles/globals.css";

/**
 * Server-side auth verification — runs on EVERY /admin/* request.
 *
 * Fix (2026-04-15): Block expired JWT tokens at the page level.
 * The middleware only checks accountType (customer vs staff), not token expiry.
 * API routes verify properly (return 401), but the page HTML was being
 * rendered (200 OK) before AuthGuard client-side kicked in — exposing the
 * admin UI with an expired token.
 *
 * Solution: Verify the JWT signature + expiry here using full jwtVerify().
 * Only renders the admin UI if the token is cryptographically valid AND not expired.
 */
async function verifyAdminSession(): Promise<Record<string, unknown> | null> {
    // Prevent loop: /admin/login is also caught by this layout!
    const reqHeaders = await headers();
    if (reqHeaders.get("x-pathname") === "/admin/login") {
        return null; // Let AuthGuard and the page handle logic, do NOT force redirect
    }

    // Read token from HttpOnly cookie (server-side, no localStorage dependency)
    const cookieStore = await cookies();
    const token =
        cookieStore.get(COOKIES.STAFF_TOKEN)?.value ??
        cookieStore.get("auth-token")?.value ??
        null;

    if (!token) {
        redirect("/admin/login?reason=expired");
    }

    // Require JWT_SECRET (or AUTH_SECRET as fallback for local dev)
    const secret = process.env.JWT_SECRET ?? process.env.AUTH_SECRET;
    if (!secret) {
        console.error("[AdminLayout] JWT_SECRET not configured — blocking access");
        redirect("/admin/login?reason=expired");
    }

    // Full JWT verification: signature + expiry check via jose
    // jwtVerify checks exp, nbf, iat, iss, aud automatically
    let payload: Record<string, unknown>;
    try {
        const { payload: verifiedPayload } = await jwtVerify(
            token,
            new TextEncoder().encode(secret),
            { algorithms: ["HS256"] }
        );
        payload = verifiedPayload as Record<string, unknown>;
    } catch {
        // Token is invalid (malformed), signature mismatch, or expired — redirect to login
        redirect("/admin/login?reason=expired");
        return null; // unreachable but satisfies TypeScript
    }

    // Verify account type is staff (belt-and-suspenders with middleware)
    const acc = payload.acc as string | undefined;
    if (acc === "customer") {
        redirect("/admin/login?reason=expired");
    }

    return payload;
}

const dmSans = DM_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
    variable: "--font-dm-sans",
});

const plusJakarta = Plus_Jakarta_Sans({
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
    // CRITICAL: Verify session on EVERY request before rendering
    const verifiedPayload = await verifyAdminSession();

    // Build hydration payload from verified JWT
    // token is needed for localStorage sync in AdminSessionHydrator
    const cookieStore = await cookies();
    const rawToken =
        cookieStore.get(COOKIES.STAFF_TOKEN)?.value ??
        cookieStore.get("auth-token")?.value ??
        "";
    const hydrationPayload: HydrationPayload | null = verifiedPayload
        ? {
            userId: String(verifiedPayload.sub ?? ""),
            email: String(verifiedPayload.eml ?? verifiedPayload.email ?? ""),
            name: String(verifiedPayload.nam ?? verifiedPayload.name ?? "User"),
            role: String(verifiedPayload.rol ?? verifiedPayload.role ?? "member"),
            roleLevel: Number(verifiedPayload.rl ?? verifiedPayload.roleLevel ?? 5),
            accountType: (verifiedPayload.acc as "staff" | "customer") ?? "staff",
            roles: (verifiedPayload.rls ?? verifiedPayload.roles ?? []) as string[],
            token: rawToken,
        }
        : null;

    return (
        <QueryProvider>
            <AdminI18nProvider>
                {/*
                 * CRITICAL: AdminSessionHydrator MUST be OUTSIDE AuthGuard.
                 *
                 * Problem: During SSR, Zustand store is empty. AuthGuard renders
                 * AdminLoginModal (blocked) BEFORE AdminSessionHydrator's useEffect runs.
                 * The browser shows the login modal → blank/black screen.
                 *
                 * Solution: Render AdminSessionHydrator OUTSIDE AuthGuard so it runs
                 * first (during client hydration), setting isAuthenticated=true and
                 * sessionHydrated=true BEFORE AuthGuard's useEffect check runs.
                 *
                 * SSR: AdminSessionHydrator returns null (no-op). Server renders
                 * the admin shell HTML (correct). AuthGuard sees empty Zustand → null.
                 *
                 * CSR: AdminSessionHydrator useEffect runs first, sets store.
                 * AuthGuard useEffect sees isAuthenticated=true → renders children.
                 */}
                <AdminSessionHydrator payload={hydrationPayload} />
                <SessionHydrator />
                <MemberStatsPanel />
                <AuthGuard>
                    {/* Sidebar reads session from Zustand store — no prop needed */}
                    <AdminSidebar />
                    {/* Main area */}
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            minHeight: "100vh",
                            background: "var(--figma-bg, #0C0C14)",
                            color: "var(--figma-text, #fff)",
                            fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
                        }}
                        className="transition-all duration-300 ml-0 lg:ml-[260px]"
                    >
                        <AdminTopbar />
                        <main 
                            className="p-4 lg:p-0"
                            style={{ flex: 1, overflowY: "auto" }}
                        >
                            {children}
                        </main>
                    </div>
                </AuthGuard>
            </AdminI18nProvider>
        </QueryProvider>
    );
}