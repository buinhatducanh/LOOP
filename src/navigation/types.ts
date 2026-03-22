/**
 * Navigation Type Definitions
 *
 * Re-exports all navigation types from sub-modules for clean imports.
 * Import from here instead of sub-modules for type safety.
 */

// Route definitions
export type {
  RouteConfig,
  AdminRouteConfig,
} from "./routes";

export type {
  AuthUser,
  AccessCheckResult,
} from "./guards";

export type {
  AuthStatus,
  AuthMethod,
  EdgeAuthResult,
} from "./middleware-auth";

export type {
  NavLinkProps,
  NavigateOptions,
  AppRouter,
} from "./router";

// Re-export constants
export {
  ROLE_LEVEL,
  ADMIN_ROUTES,
  ADMIN_PATH_TO_KEY,
  AUTH_ROUTES,
  PUBLIC_ROUTE_PATHS,
} from "./routes";

export {
  AUTH_COOKIES,
  LEGACY_ADMIN_REDIRECTS,
} from "./middleware-auth";
