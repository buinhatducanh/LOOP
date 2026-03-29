/**
 * useApi — composable hook for consistent loading/error/data state.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(
 *     () => servicesService.getAdminServices(),
 *     [dep1, dep2]
 *   );
 *
 * Or with args:
 *   const { data, loading, error } = useApi(
 *     () => servicesService.getServiceBySlug(slug),
 *     [slug]
 *   );
 *
 * @param fn    — async function that returns T (or null/undefined while loading)
 * @param deps  — reactive deps (passed to useEffect) — re-fetches when changed
 * @param opts  — options
 *   - enabled:    false → skip the call entirely (default: true)
 *   - immediate:  true → call on mount (default: true)
 *   - onSuccess:  callback(data) when fetch succeeds
 *   - onError:    callback(error) when fetch fails
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Force a refetch (same deps) */
  refetch: () => void;
  /** Reset data + re-fetch from scratch */
  reset: () => void;
}

export interface UseApiOptions<T> {
  /** Skip the call entirely (default: true) */
  enabled?: boolean;
  /** Call immediately on mount (default: true) */
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  opts: UseApiOptions<T> = {},
): UseApiState<T> {
  const { enabled = true, immediate = true, onSuccess, onError } = opts;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled && immediate);
  const [error, setError] = useState<string | null>(null);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    try {
      const result = await fnRef.current();
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        onSuccess?.(result);
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Lỗi không xác định';
      setError(msg);
      onError?.(msg);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [enabled, ...deps]);

  useEffect(() => {
    if (immediate) void fetch();
  }, [enabled, immediate, ...deps]);

  const refetch = useCallback(() => {
    void fetch();
  }, [fetch]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(enabled);
    void fetch();
  }, [enabled, fetch]);

  return { data, loading, error, refetch, reset };
}
