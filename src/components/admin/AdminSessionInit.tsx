"use client";

/**
 * AdminSessionInit — admin auth session bridge
 *
 * IMPORTANT: This component no longer calls loginAs() because that
 * causes "Cannot update a component while rendering" warnings and
 * potential infinite loops when combined with LoginForm.login().
 *
 * Session initialization flow:
 *   Login page: login() in authStore → sets Zustand store
 *   Admin pages: Zustand store already populated by login() — no re-init needed
 *
 * AdminSessionInit is kept (but does nothing) so that:
 *   1. If a user navigates directly to /admin/overview without logging in,
 *      the server layout redirects to login before this component renders.
 *   2. Layout renders this = user IS authenticated → store is already set.
 *
 * If Zustand store is empty on direct navigation (rare edge case),
 * AdminSidebar falls back to userRole prop from layout.
 */
export function AdminSessionInit() {
  // No-op: session is initialized by authStore.login() before redirect
  return null;
}
