"use client";

import { useState, useEffect, useCallback } from "react";
import { RankKey } from "@/components/team/teamRanks";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RankData {
  level: number;
  currentXp: number;
  maxXp: number;
  rank: RankKey;
  totalLp: number;
  color: string;
  symbol: string;
  tier: number;
}

export interface LeaderboardEntry extends RankData {
  id: string;
  name: string;
  role: string;
  image: string | null;
  slug: string;
}

// ── useRank — single member ───────────────────────────────────────────────────

/**
 * Fetches real rank data for a specific team member from the leaderboard API.
 * Returns null data when memberId is not provided (graceful no-op).
 */
export function useRank(memberId?: string) {
  const [data, setData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetch(`/api/admin/rank/leaderboard?memberId=${encodeURIComponent(memberId)}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.data ?? null);
        setLoading(false);
      })
      .catch(() => {
        setData(null);
        setLoading(false);
      });
  }, [memberId]);

  return { data, loading };
}

// ── useLeaderboard — ranked list ──────────────────────────────────────────────

export type SortKey = "rank" | "level" | "lp";
export type SortOrder = "asc" | "desc";

export interface UseLeaderboardOptions {
  sort?: SortKey;
  order?: SortOrder;
  limit?: number;
  /** Query parameters that, when changed, trigger a refetch. */
  deps?: unknown[];
}

/**
 * Fetches the global rank leaderboard from the API.
 * `refetch()` allows manual invalidation (e.g., after an LP award approval).
 */
export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  const { sort = "rank", order = "desc", limit = 20, deps = [] } = options;

  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(() => {
    const url = `/api/admin/rank/leaderboard?sort=${sort}&order=${order}&limit=${limit}`;
    return fetch(url).then((r) => r.json());
  }, [sort, order, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    fetch_()
      .then((d) => {
        setData(d.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        setData([]);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch_, ...deps]);

  const refetch = useCallback(() => {
    fetch_()
      .then((d) => setData(d.data ?? []))
      .catch(() => {/* silent */});
  }, [fetch_]);

  return { data, loading, refetch };
}
