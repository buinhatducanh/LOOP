"use client";

import { useState, useEffect } from "react";

/**
 * Returns true after the component mounts on the client.
 * Use this to avoid hydration mismatches when a component reads
 * browser-only state (localStorage, cookies, navigator, etc.)
 * at render time.
 *
 * @example
 * const mounted = useMounted();
 * const isAuth = mounted ? isAuthenticatedFromStore : false;
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
