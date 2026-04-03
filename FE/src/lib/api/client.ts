/**
 * API Client — FE → BE communication
 * Wraps fetch with auth token, error handling, and typed responses.
 * Auth token is read from localStorage (set by authStore after login/register).
 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getToken(): string | null {
  return localStorage.getItem("loop_auth_token");
}

function getAuthMethod(): string | null {
  return localStorage.getItem("loop_auth_method");
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    } as Record<string, string>,
    body: body != null ? JSON.stringify(body) : undefined,
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    let error = "Yêu cầu thất bại";
    try {
      const json = await res.json();
      error = json.error ?? error;
    } catch { /* ignore */ }
    throw new Error(error);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  const json = await res.json();
  return json as T;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  user: {
    userId: string;
    email: string;
    name: string;
    avatar: string | null;
    role: string;
    roles?: string[];
    permissions?: { resource: string; action: string; scope: string }[];
    roleLevel?: number;
  };
  token: string;
}

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  roles?: string[];
  permissions?: { resource: string; action: string; scope: string }[];
  roleLevel?: number;
  department?: string;
  teamMemberId?: string;
  accountType?: string;
  lpBalance?: number;
  level?: number;
  rank?: string;
  rankColor?: string;
}

export const apiClient = {
  // Auth
  login: (email: string, password: string, rememberMe?: boolean): Promise<LoginResponse> =>
    request<LoginResponse>("POST", "/api/admin/auth/login", { email, password, rememberMe }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    company?: string;
    rememberMe?: boolean;
  }): Promise<LoginResponse> =>
    request<LoginResponse>("POST", "/api/admin/auth/register", data),

  googleSignIn: () => {
    // Redirect browser to our Google OAuth initiation endpoint
    window.location.href = `${BASE}/api/admin/auth/google-signin`;
  },

  getSession: (): Promise<{ data: SessionUser }> =>
    request<{ data: SessionUser }>("GET", "/api/admin/auth/me"),

  logout: (): Promise<void> => request("POST", "/api/admin/auth/logout"),

  // Generic CRUD helpers
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const qs = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return request<T>("GET", `${path}${qs}`);
  },

  post<T>(path: string, data?: unknown): Promise<T> =>
    request<T>("POST", path, data),

  put<T>(path: string, data?: unknown): Promise<T> =>
    request<T>("PUT", path, data),

  patch<T>(path: string, data?: unknown): Promise<T> =>
    request<T>("PATCH", path, data),

  delete<T>(path: string): Promise<T> =>
    request<T>("DELETE", path),
};

// ── Token helpers ────────────────────────────────────────────────────────────

export function setAuthToken(token: string, rememberMe = false): void {
  localStorage.setItem("loop_auth_token", token);
  localStorage.setItem("loop_auth_method", "credentials");
  if (rememberMe) {
    localStorage.setItem("loop_auth_remember", "1");
  }
}

export function clearAuthToken(): void {
  localStorage.removeItem("loop_auth_token");
  localStorage.removeItem("loop_auth_method");
  // Keep loop_auth_remember so "remember me" checkbox stays checked on next load
}

export function hasStoredSession(): boolean {
  return !!localStorage.getItem("loop_auth_token");
}

export function isRememberMeEnabled(): boolean {
  return !!localStorage.getItem("loop_auth_remember");
}
