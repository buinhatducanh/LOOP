"use client";

/**
 * Forces dark theme on the <html> element for admin pages.
 * Renders inside AdminLayout (inside root layout's <body>).
 * Must be a client component to access document.documentElement.
 */
export function AdminThemeOverride() {
  // Set dark theme on mount — overrides root layout's data-theme="light"
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  return null;
}
