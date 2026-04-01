/**
 * LOOP Solutions — API Client
 * Single source of truth for all API calls.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
const TOKEN_KEY = 'loop_token';
const REQUEST_TIMEOUT_MS = 15_000;

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

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

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      let code: string | undefined;

      try {
        const body = await res.json();
        message = body.error ?? message;
        code = body.code;
      } catch {
        // ignore parse error
      }

      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/dang-nhap';
      }

      throw new ApiError(message, res.status, code);
    }

    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { BASE_URL };
