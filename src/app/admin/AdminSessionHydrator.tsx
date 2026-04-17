"use client";

/**
 * AdminSessionHydrator — hydrates Zustand auth store from server-verified JWT payload.
 *
 * Problem: After Google OAuth, the JWT is set as an HttpOnly cookie by the server.
 * The Zustand store is empty (no localStorage persisted state), so AuthGuard sees
 * isAuthenticated=false and renders a blank screen (AdminLoginModal).
 *
 * Solution:
 * 1. AdminLayout (server component) verifies the JWT cookie server-side.
 * 2. Passes the decoded payload to this client component.
 * 3. This component immediately sets sessionHydrated=true (so AuthGuard allows render).
 * 4. Then calls /me API to get the full session and populate the store.
 * 5. Syncs the token to localStorage for adminApi (which reads from localStorage).
 */

import { useEffect, useRef } from "react";
import { useAuthStore, type AdminTab } from "@/app/store/authStore";

export interface HydrationPayload {
    userId: string;
    email: string;
    name: string;
    role: string;
    roleLevel: number;
    accountType: "staff" | "customer";
    roles: string[];
    token: string;
}

interface Props {
    payload: HydrationPayload | null;
}

function mapRoleLevelToUserRole(roleLevel: number, accountType: "staff" | "customer"): string {
    if (accountType === "customer") return "client";
    if (roleLevel <= 1) return "admin";
    if (roleLevel === 2) return "hr";
    if (roleLevel === 3) return "project_manager";
    if (roleLevel === 4) return "media";
    if (roleLevel === 5) return "qa";
    if (roleLevel === 6) return "member";
    return "guest";
}

function extractShortName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminSessionHydrator({ payload }: Props) {
    const hydrated = useRef(false);

    useEffect(() => {
        console.log("[DEBUG] AdminSessionHydrator: payload =", payload ? {
            userId: payload.userId,
            roleLevel: payload.roleLevel,
            accountType: payload.accountType,
            tokenLen: payload.token.length,
        } : null);

        if (!payload || hydrated.current) {
            console.log("[DEBUG] AdminSessionHydrator: SKIP — no payload or already hydrated");
            return;
        }
        hydrated.current = true;

        const feRole = mapRoleLevelToUserRole(payload.roleLevel, payload.accountType);
        const p = payload;

        console.log("[DEBUG] AdminSessionHydrator: STEP 1 — Hydrate Zustand immediately", { feRole, accountType: p.accountType });
        // Step 1: Immediately set sessionHydrated=true so AuthGuard allows render
        useAuthStore.setState({
            isAuthenticated: true,
            accountType: p.accountType,
            role: feRole as "admin" | "hr" | "project_manager" | "media" | "qa" | "member" | "client" | "guest",
            sessionHydrated: true,
            tokenExpiry: Date.now() + 15 * 60 * 1000,
        });

        // Step 2: Sync token to localStorage (adminApi reads from localStorage)
        if (typeof window !== "undefined") {
            try {
                localStorage.setItem("loop-staff-token", p.token);
                console.log("[DEBUG] AdminSessionHydrator: STEP 2 — Token synced to localStorage, len =", p.token.length);
            } catch (e) {
                console.warn("[DEBUG] AdminSessionHydrator: localStorage FAILED:", e);
            }
        }

        // Step 3: Fetch full session with retry for Neon cold-start
        let retries = 0;
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 2000;

        function doFetch() {
            console.log(`[DEBUG] AdminSessionHydrator: STEP 3 — Calling /me (attempt ${retries + 1})`);
            fetch("/api/admin/auth/me", { credentials: "include" })
                .then((res) => {
                    console.log(`[DEBUG] AdminSessionHydrator: /me response status = ${res.status}`);
                    if (!res.ok) {
                        if (res.status === 401 && retries < MAX_RETRIES) {
                            retries++;
                            console.warn(`[DEBUG] AdminSessionHydrator: /me 401 → retry ${retries}/${MAX_RETRIES}`);
                            setTimeout(doFetch, RETRY_DELAY);
                            return;
                        }
                        throw new Error(`HTTP ${res.status}`);
                    }
                    return res.json() as Promise<{ user: Record<string, unknown> }>;
                })
                .then((data) => {
                    if (!data) return;
                    console.log("[DEBUG] AdminSessionHydrator: /me SUCCESS", { hasUser: !!data.user });
                    const session = data.user;
                    const authUser = {
                        id: String(session.userId ?? p.userId),
                        name: String(session.name ?? p.name),
                        shortName: extractShortName(String(session.name ?? p.name)),
                        email: String(session.email ?? p.email),
                        avatar:
                            (session.avatar as string | null) ??
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(String(session.name ?? p.email))}`,
                        role: feRole as "admin" | "hr" | "project_manager" | "media" | "qa" | "member" | "client" | "guest",
                        accountType: p.accountType,
                        _department: session._department as string | undefined,
                        departmentKey: session.departmentKey as string | undefined,
                        isDeptHead: session.isDeptHead as boolean | undefined,
                        tabPermissions: session.tabPermissions as string[] | undefined,
                        rank: session.rank as string | undefined,
                        rankColor: session.rankColor as string | undefined,
                        lpBalance: (session.lpBalance as number) ?? 0,
                        level: (session.level as number) ?? 1,
                        beRoleLevel: p.roleLevel,
                        isOnboarded: session.isOnboarded as boolean | undefined,
                        teamMemberId: session.teamMemberId as string | null | undefined,
                        accessTags: session.accessTags as string[] | undefined,
                    };

                    const accessibleTabs: AdminTab[] | "all" = (() => {
                        if (feRole === "admin") return "all";
                        if (feRole === "hr") return ["overview", "members", "departments", "notification_center", "quests_events", "academy", "lp_manage"] as AdminTab[];
                        if (feRole === "project_manager") return ["overview", "orders", "clients", "quotation", "services", "revenue", "projects", "members", "departments", "notification_center", "leaderboard_admin", "lp_manage", "quests_events", "academy", "blog", "lp", "portfolio"] as AdminTab[];
                        if (feRole === "media") return ["media", "blog", "orders", "projects", "clients", "academy", "services", "leaderboard_admin", "quests_events", "overview", "portfolio", "revenue"] as AdminTab[];
                        if (feRole === "qa") return ["projects", "notification_center", "orders", "clients", "members", "academy", "leaderboard_admin", "overview", "lp"] as AdminTab[];
                        if (feRole === "member") return ["overview", "notification_center", "leaderboard_admin", "academy", "quests_events"] as AdminTab[];
                        return [];
                    })();

                    useAuthStore.setState({
                        user: authUser,
                        isAuthenticated: true,
                        role: feRole as "admin" | "hr" | "project_manager" | "media" | "qa" | "member" | "client" | "guest",
                        accountType: p.accountType,
                        _department: authUser._department,
                        departmentKey: authUser.departmentKey,
                        isDeptHead: authUser.isDeptHead,
                        tabPermissions: authUser.tabPermissions,
                        accessibleTabs,
                        sessionHydrated: true,
                        tokenExpiry: Date.now() + 15 * 60 * 1000,
                    });
                })
                .catch((err) => {
                    console.warn("[AdminSessionHydrator] /me failed:", err);
                    // Token is valid (server verified it). Keep optimistic auth state.
                    useAuthStore.setState({
                        user: {
                            id: p.userId,
                            name: p.name,
                            shortName: extractShortName(p.name),
                            email: p.email,
                            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(p.email)}`,
                            role: feRole as "admin" | "hr" | "project_manager" | "media" | "qa" | "member" | "client" | "guest",
                            accountType: p.accountType,
                            lpBalance: 0,
                            level: 1,
                        },
                        isAuthenticated: true,
                        role: feRole as "admin" | "hr" | "project_manager" | "media" | "qa" | "member" | "client" | "guest",
                        accountType: p.accountType,
                        accessibleTabs: (feRole === "admin" ? "all" : []) as AdminTab[] | "all",
                        sessionHydrated: true,
                        tokenExpiry: Date.now() + 15 * 60 * 1000,
                    });
                });
        }

        doFetch();
    }, [payload]);

    return null;
}
