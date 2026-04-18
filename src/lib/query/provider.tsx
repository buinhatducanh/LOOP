"use client";

/**
 * React Query Provider — LOOP Solutions
 *
 * Client-side query/mutation state for admin pages and interactive public pages.
 * Wraps the app with QueryClientProvider.
 *
 * Usage (in admin layout):
 *   import { QueryProvider } from "@/lib/query/provider"
 *
 *   export default function AdminLayout({ children }) {
 *     return <QueryProvider>{children}</QueryProvider>
 *   }
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default stale time: 30 seconds for admin data
            staleTime: 30 * 1000,
            // Never cache failed queries
            retry: 1,
            // Refetch on window focus for admin data
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ── Query keys factory ────────────────────────────────────────────────────────
// Centralized query key constants for cache management.

export const qk = {
  // Auth
  me: ["auth", "me"] as const,

  // Public content
  services: (lang?: string) => ["services", { lang }] as const,
  service: (slug: string, lang?: string) => ["services", slug, { lang }] as const,
  projects: (lang?: string) => ["projects", { lang }] as const,
  project: (slug: string, lang?: string) => ["projects", slug, { lang }] as const,
  team: (lang?: string) => ["team", { lang }] as const,
  teamMember: (slug: string, lang?: string) => ["team", slug, { lang }] as const,
  blogPosts: (lang?: string) => ["blog-posts", { lang }] as const,
  blogPost: (slug: string) => ["blog-posts", slug] as const,
  testimonials: (lang?: string) => ["testimonials", { lang }] as const,

  // Admin — orders
  orders: (params?: Record<string, string | number>) => ["admin", "orders", params] as const,
  order: (id: string) => ["admin", "orders", id] as const,

  // Admin — content
  adminServices: (params?: Record<string, string | number>) => ["admin", "services", params] as const,
  adminServiceTiers: (params?: Record<string, string>) => ["admin", "service-tiers", params] as const,
  adminSeoFeatures: (params?: Record<string, string>) => ["admin", "pricing", "features", params] as const,
  adminProjects: (params?: Record<string, string | number>) => ["admin", "projects", params] as const,
  adminBlogPosts: (params?: Record<string, string | number>) => ["admin", "blog-posts", params] as const,
  adminTeam: () => ["admin", "team"] as const,
  adminMembers: (params?: Record<string, string | number>) => ["admin", "team", params] as const,

  // Admin — LP
  lpTransactions: (params?: Record<string, string | number>) => ["admin", "lp", "transactions", params] as const,
  lpLeaderboard: () => ["admin", "lp", "leaderboard"] as const,

  // Admin — dashboard
  dashboard: () => ["admin", "dashboard"] as const,
  dashboardCharts: () => ["admin", "dashboard", "charts"] as const,

  // Academy
  courses: () => ["academy", "courses"] as const,
  course: (id: string) => ["academy", "courses", id] as const,
} as const;
