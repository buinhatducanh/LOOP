/**
 * Shared TypeScript types for FE-BE API contract.
 *
 * Usage in FE:
 *   import type { Pagination, ApiError, SessionUser } from '@/types/api-contract'
 *   import type { Service, Order, TeamMember } from '@/types/models/content'
 *
 * All model types are in /types/models/ (87 models across 14 domain groups)
 * Regenerate: python gen_types.py
 */

// ─── Pagination ─────────────────────────────────────────────────────────────

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// ─── Response Wrappers ───────────────────────────────────────────────────

/** Single item response */
export type SingleResponse<T> = { data: T };

/** Paginated list response */
export type ListResponse<T> = { data: T[]; pagination: Pagination };

/** Discriminated union — use `'pagination' in response` to distinguish */
export type ApiResponse<T> = SingleResponse<T> | ListResponse<T>;

// ─── Error ──────────────────────────────────────────────────────────────

export type ApiError = {
  error: string;
  code?: string;
  details?: unknown;
};

// ─── Auth ─────────────────────────────────────────────────────────────

export type Permission = {
  resource: string;
  action: string;
  scope: string;
};

export type SessionUser = {
  userId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  roles: string[];
  permissions: Permission[];
  roleLevel: number;
  teamMemberId: string | null;
  accountType: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: SessionUser;
};

export type MeResponse = {
  user: SessionUser;
};

// ─── Request Inputs ────────────────────────────────────────────────────

export type CreateOrderInput = {
  packageId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  requirements?: string;
  status?: string;
  paymentStatus?: string;
  totalAmount?: number;
};

export type ContactFormInput = {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
};

export type PricingCalculatorInput = {
  selectedFeatureIds: string[];
  infraTierSlug?: string;
};

export type PricingCalculatorResult = {
  subtotal: number;
  infraCost: number;
  total: number;
  xpEarned: number;
  features: Record<string, unknown>[];
};
