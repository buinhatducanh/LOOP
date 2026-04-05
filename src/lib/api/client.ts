/**
 * API Client — LOOP Solutions
 *
 * Typed fetch wrapper for FE → BE API calls.
 * Reads auth-token cookie automatically and attaches it as Authorization header.
 * Re-uses the @/lib/api response shape conventions ({ data }, { data, pagination }, { error }).
 *
 * Usage:
 *   import { apiClient } from "@/lib/api/client"
 *   const { data } = await apiClient.get("/api/v1/services", { lang: "vi" })
 *   const { data } = await apiClient.post("/api/admin/auth/login", { email, password })
 *   const { data } = await apiClient.put(`/api/admin/services/${id}`, payload)
 *   const { data } = await apiClient.delete(`/api/admin/services/${id}`)
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

// ── Types ────────────────────────────────────────────────────────────────────

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
  /** Credentials (cookies) sent with request. Default: true for all */
  withCredentials?: boolean;
}

// ── Core fetch ───────────────────────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  const { params, throwOnError = true, withCredentials = true, ...fetchOptions } = options;

  // Build URL with query params
  let url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
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

  // Attach Bearer token from localStorage (set by login response).
  // This survives cross-origin redirects better than cookies alone.
  if (typeof window !== "undefined") {
    const storedToken = localStorage.getItem("loop-auth-token");
    if (storedToken) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${storedToken}`;
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

// ── Admin API client (always authenticated) ───────────────────────────────────

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
