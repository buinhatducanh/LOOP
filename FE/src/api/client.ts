/**
 * LOOP Solutions — API Client
 * Fetch wrapper với auth header, error mapping, retry logic
 */
import { AuthUser } from '../store/authStore';

// ── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000/api';
const TOKEN_KEY = 'loop_token';
const USER_KEY = 'loop_user';
const REQUEST_TIMEOUT_MS = 15_000;

// ── Error class ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── User cache ───────────────────────────────────────────────────────────────
export function cacheUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore quota errors
  }
}

export function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// ── Core request ─────────────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    clearTimeout(timeout);

    // Handle auth errors
    if (res.status === 401) {
      clearToken();
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/dang-nhap')) {
        window.location.href = '/dang-nhap';
      }
      throw new ApiError('Phiên đăng nhập hết hạn', 401, 'UNAUTHORIZED');
    }

    if (res.status === 403) {
      throw new ApiError('Bạn không có quyền thực hiện thao tác này', 403, 'FORBIDDEN');
    }

    if (!res.ok) {
      let msg = `Lỗi ${res.status}`;
      let code: string | undefined;
      try {
        const json = await res.json();
        msg = json.error ?? msg;
        code = json.code;
      } catch {
        // use default
      }
      throw new ApiError(msg, res.status, code);
    }

    // Handle empty responses
    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Yêu cầu bị timeout, vui lòng thử lại', 408, 'TIMEOUT');
    }
    throw err;
  }
}

// ── Retry helper ──────────────────────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delayMs = 500
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0 && isRetryable(err)) {
      await sleep(delayMs);
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

function isRetryable(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status >= 500 || err.status === 408;
  }
  return false;
}

// ── Public API client ────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, useRetry = false) => {
    const fn = () => request<T>(path);
    return useRetry ? withRetry(fn) : fn();
  },

  post: <T>(path: string, body: unknown, useRetry = false) => {
    const fn = () => request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return useRetry ? withRetry(fn) : fn();
  },

  put: <T>(path: string, body: unknown, useRetry = false) => {
    const fn = () => request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return useRetry ? withRetry(fn) : fn();
  },

  patch: <T>(path: string, body: unknown, useRetry = false) => {
    const fn = () => request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return useRetry ? withRetry(fn) : fn();
  },

  delete: <T>(path: string, useRetry = false) => {
    const fn = () => request<T>(path, { method: 'DELETE' });
    return useRetry ? withRetry(fn) : fn();
  },
};

export default api;
