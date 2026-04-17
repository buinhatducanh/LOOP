import { DS } from "@/lib/design-tokens";
import { RANKS, type RankKey } from "@/lib/rank/ranks";

export const DEPARTMENTS_EN = ["Engineering", "Design", "Media", "Marketing", "Sales", "Finance", "HR"] as const;

export const DEPARTMENTS_VI: Record<string, string> = {
  engineering: "Phòng Kỹ thuật",
  design: "Phòng Thiết kế",
  media: "Phòng Media",
  marketing: "Phòng Marketing",
  sales: "Phòng Kinh doanh",
  finance: "Phòng Tài chính",
  hr: "Phòng Nhân sự",
};

export const TEAMS_VI: Record<string, string> = {
  Engineering: "Phòng Kỹ thuật",
  Design: "Phòng Thiết kế",
  Media: "Phòng Media",
  Marketing: "Phòng Marketing",
  Sales: "Phòng Kinh doanh",
  Finance: "Phòng Tài chính",
  HR: "Phòng Nhân sự",
};

export const DEPT_COLORS: Record<string, string> = {
  engineering: "#3B82F6",
  design: "#8B5CF6",
  media: "#EC4899",
  marketing: "#F59E0B",
  sales: "#22C55E",
  finance: "#14B8A6",
  hr: "#6366F1",
};

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function deptLabel(key?: string | null) {
  if (!key) return "—";
  const k = key.toLowerCase();
  return DEPARTMENTS_VI[k] ?? capitalize(key);
}

export function deptColor(key?: string | null) {
  if (!key) return DS.text4;
  return DEPT_COLORS[key.toLowerCase()] ?? DS.text4;
}

export const fmtLP = (n?: number) => {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
};

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export const xpPct = (currentXp?: number, maxXp?: number) => {
  const cur = currentXp ?? 0;
  const max = maxXp ?? 100;
  return max > 0 ? Math.min((cur / max) * 100, 100) : 0;
};

export const rCfg = (rank: string) => RANKS[rank as RankKey] ?? RANKS.iron;

export type TabPerm = "view" | "edit" | "none";

export function parseTabPerms(stored: string[]): Record<string, TabPerm> {
  const result: Record<string, TabPerm> = {};
  for (const t of stored) {
    if (t.endsWith(".view"))      result[t.slice(0, -5)] = "view";
    else if (t.endsWith(".edit")) result[t.slice(0, -5)] = "edit";
    else                         result[t] = "edit";
  }
  return result;
}

export function serializeTabPerms(perms: Record<string, "view" | "edit" | "none">): string[] {
  return Object.entries(perms)
    .filter(([, v]) => v !== "none")
    .flatMap(([tab, v]) => (v === "edit" ? [tab] : [`${tab}.view`]));
}
