/**
 * Shared TypeScript types for FE-BE contract.
 *
 * FE can copy this entire /types folder directly into their repo.
 * All types are pure TypeScript — no path aliases, no imports from app code.
 *
 * Usage:
 *   import { Pagination, ApiResponse, ApiError } from './api/response'
 *   import type { Service, Order } from './models/content'
 *   import type { SessionUser } from './api/auth'
 *
 * Or use the barrel:
 *   import type { Pagination, Service, Order, SessionUser } from './index'
 */

// Re-export all model groups
export * from "./models/auth";
export * from "./models/users";
export * from "./models/content";
export * from "./models/team";
export * from "./models/commerce";
export * from "./models/pricing";
export * from "./models/services";
export * from "./models/landing";
export * from "./models/customer";
export * from "./models/referral";
export * from "./models/project";
export * from "./models/education";
export * from "./models/gamification";
export * from "./models/analytics";
