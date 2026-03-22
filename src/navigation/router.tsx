/**
 * Central Navigation Router Utility
 *
 * All navigation in the app should go through this module.
 *
 * Two navigation systems:
 *   - Admin routes (/admin/*) → plain next/navigation (no locale prefix)
 *   - Public routes (/vi/*, /en/*) → next-intl/navigation (locale-aware)
 *
 * Usage:
 *   import { NavLink, useAppRouter } from "@/navigation/router";
 *   <NavLink href="/admin" isAdmin>Dashboard</NavLink>
 *   const { navigate, replace } = useAppRouter();
 *   navigate("/admin/dashboard", { isAdmin: true });
 */

import { useRouter as useNextIntlRouter, Link as NextIntlLink } from "@/i18n/routing";
import type { ComponentProps } from "react";
import { useRouter as useNextRouter } from "next/navigation";

// ─── Link ─────────────────────────────────────────────────────────────────────

export interface NavLinkProps extends Omit<ComponentProps<typeof NextIntlLink>, "href" | "locale"> {
  href: string;
  /** If true: admin route — no locale prefix is added */
  isAdmin?: boolean;
}

/**
 * Unified Link component for all navigation.
 * Use `isAdmin` for /admin/* routes to prevent locale prefix.
 */
export function NavLink({ href, isAdmin, ...props }: NavLinkProps) {
  if (isAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <NextIntlLink href={href} locale={false as any} {...props} />;
  }
  return <NextIntlLink href={href} {...props} />;
}

/** Shorthand for admin links */
export function AdminLink(props: Omit<NavLinkProps, "isAdmin">) {
  return <NavLink {...props} isAdmin />;
}

// ─── Typed Router ─────────────────────────────────────────────────────────────

export interface NavigateOptions {
  isAdmin?: boolean;
}

export interface AppRouter {
  /** Navigate to a path (client-side) */
  navigate: (href: string, options?: NavigateOptions) => void;
  /** Replace current history entry (client-side) */
  replace: (href: string, options?: NavigateOptions) => void;
}

/** Hook for client-side navigation */
export function useAppRouter(): AppRouter {
  const intlRouter = useNextIntlRouter();
  const nextRouter = useNextRouter();

  return {
    navigate(href: string, options?: NavigateOptions) {
      if (options?.isAdmin) {
        nextRouter.push(href);
        return;
      }
      intlRouter.push(href);
    },

    replace(href: string, options?: NavigateOptions) {
      if (options?.isAdmin) {
        nextRouter.replace(href);
        return;
      }
      intlRouter.replace(href);
    },
  };
}

// Re-export plain helpers for convenience
export { getLoginRedirectUrl, getAccessDeniedRedirect } from "./utils";
