/**
 * API Client — LOOP Solutions
 *
 * Typed fetch wrapper for FE → BE API calls.
 *
 * Token strategy:
 *   - Public routes (/api/v1/*, /api/admin/auth/login, etc.): NO auth header.
 *     Cookies are set server-side via POST response.
 *   - Authenticated routes: use adminApi which sends cookies via withCredentials.
 *     The Bearer token from localStorage is intentionally NOT used by default —
 *     it can carry a stale/expired token and cause 401 on fresh logins.
 *
 * Usage:
 *   import { apiClient } from "@/lib/api/client"
 *   const { data } = await apiClient.get("/api/v1/services", { lang: "vi" })
 *   const { data } = await apiClient.post("/api/admin/auth/login", { email, password })
 *   const { data } = await apiClient.put(`/api/admin/services/${id}`, payload)
 *   const { data } = await apiClient.delete(`/api/admin/services/${id}`)
 *
 * For authenticated admin calls, prefer adminApi (uses cookies).
 */

const _BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

// ── Types ───────────────────────────────────────────────────────────────────

export type ApiErrorResponse = {
  error: string;
  code?: string;
};

export type ApiSuccessSingle<T> = { data: T };
export type ApiSuccessList<T> = { data: T[]; pagination: Pagination };
export type ApiResponse<T> = ApiSuccessSingle<T> | ApiSuccessList<T>;

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export interface ApiClientOptions extends RequestInit {
  /** Query params appended to URL */
  params?: Record<string, string | number | boolean | undefined>;
  /** Throw on non-2xx instead of returning error response */
  throwOnError?: boolean;
  /** Credentials (cookies) sent with request. Default: false for apiClient (public), true for adminApi */
  withCredentials?: boolean;
}

// ── Core fetch ───────────────────────────────────────────────────────────────

/**
 * Skip Bearer token on these public/auth endpoints to avoid stale token 401s
 * on fresh login attempts when localStorage still holds an old expired token.
 */
const AUTH_SKIP_PATTERNS = [
  "/api/admin/auth/login",
  "/api/admin/auth/register",
  "/api/auth/login",
  "/api/auth/verify-otp",
  "/api/auth/reset-password",
  "/api/auth/forgot-password",
  "/api/auth/google-signin",
  "/api/auth/google-callback",
];

/**
 * Get the correct localStorage token key based on the API endpoint.
 * Split auth: staff routes → loop-staff-token, customer routes → loop-customer-token.
 */
function getTokenKey(endpoint: string): "loop-staff-token" | "loop-customer-token" | null {
  // Staff routes: /api/admin/* and /api/portal/staff-* (if any)
  if (endpoint.startsWith("/api/admin/")) return "loop-staff-token";
  // Customer routes: /api/portal/* (excl. staff-specific)
  if (endpoint.startsWith("/api/portal/")) return "loop-customer-token";
  // Default: try staff token first (most common case)
  return "loop-staff-token";
}

function shouldAttachBearer(endpoint: string): boolean {
  // Skip Bearer for auth endpoints — they should not receive the stale token
  if (AUTH_SKIP_PATTERNS.some((p) => endpoint.includes(p))) return false;
  return true;
}

async function apiFetch<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { params, throwOnError = true, withCredentials = false, ...fetchOptions } = options;

  // Use relative URL so it always matches the current server port.
  let url = endpoint.startsWith("http")
    ? endpoint
    : endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) searchParams.set(key, String(value));
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...fetchOptions.headers,
  };

  // Attach Bearer token from localStorage for authenticated routes.
  // Split auth: choose correct key per endpoint type (Option C).
  // Skip for auth endpoints to prevent stale-token 401 on fresh login attempts.
  if (shouldAttachBearer(endpoint) && typeof window !== "undefined") {
    const key = getTokenKey(endpoint);
    if (key) {
      const storedToken = localStorage.getItem(key);
      if (storedToken) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${storedToken}`;
      }
    }
  }

  const init: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: withCredentials ? "include" : "omit",
  };

  const res = await fetch(url, init);

  if (!res.ok) {
    let errorPayload: ApiErrorResponse;
    try {
      errorPayload = await res.json();
    } catch {
      errorPayload = { error: `HTTP ${res.status} — ${res.statusText}` };
    }

    if (throwOnError) {
      const err = new Error(errorPayload.error ?? "API error") as Error & {
        status: number;
        code?: string;
      };
      err.status = res.status;
      err.code = errorPayload.code;
      throw err;
    }

    // IMPORTANT: return the parsed error object so callers can read error details.
    // Do NOT call res.json() again — the body is already consumed.
    return { error: errorPayload.error, code: errorPayload.code } as T;
  }

  return res.json() as Promise<T>;
}

// ── Public API client (no auth required) ─────────────────────────────────────

export const apiClient = {
  async get<T>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "GET" });
  },

  async post<T>(
    endpoint: string,
    body?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async put<T>(
    endpoint: string,
    body?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async delete<T>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "DELETE" });
  },
};

// ── Admin API client (always authenticated — uses cookies) ──────────────────

export const adminApi = {
  async get<T>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "GET", withCredentials: true });
  },

  async post<T>(
    endpoint: string,
    body?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      withCredentials: true,
    });
  },

  async put<T>(
    endpoint: string,
    body?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      withCredentials: true,
    });
  },

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      withCredentials: true,
    });
  },

  async delete<T>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "DELETE", withCredentials: true });
  },
};
