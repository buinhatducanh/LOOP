"use client";

// =============================================================================
// BE Members Admin Page — Full Rewrite v1
// Based on: DESIGN LOOPS/src/app/components/admin/MembersTab.tsx (gold standard)
// Target: ~1,200 lines | Completed sections noted inline
// =============================================================================

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";

import { useAuthStore, canEdit, type AuthUser } from "@/app/store/authStore";
import { useLoopStore, type MemberStats } from "@/app/store/loopStore";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { TeamMemberBE, MemberStatus, ViewMode, SortKey, ToastType, ToastItem, MemberExt, STATUS_CFG } from "./types";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MemberFormDrawer } from "@/components/admin/members/MemberFormDrawer";
import {
 Plus, Trash2, Edit2, Award, Users, TrendingUp,
 ChevronDown, ChevronUp, X, Check, Crown, Zap, Grid3x3, List, Search,
 UserMinus, Clock, AlertTriangle, CheckCircle2, Eye, Info, Loader2,
 UserCheck, ShieldCheck, CheckCircle,
} from "lucide-react";
import {
  RANKS,
  getRankFromLevel,
  getRankLabel,
  type RankKey,
} from "@/lib/rank/ranks";

// =============================================================================
// Types & Interfaces
// =============================================================================

/** Member request pending CEO approval */
interface PendingRequest {
  id: string;
  email: string;
  name: string;
  department: string;
  proposedRole: string;
  proposedTags: string[];
  status: "pending" | "approved" | "rejected";
  rejectReason?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

/** Access tag from /api/admin/access-tags */
interface AccessTag {
  id: string;
  slug: string;
  label: string;
  description?: string | null;
  color: string;
  isDefault: boolean;
}



// =============================================================================
// Config Constants
// =============================================================================

const DEPARTMENTS_EN = ["Engineering", "Design", "Media", "Marketing", "Sales", "Finance", "HR"] as const;
const DEPARTMENTS_VI: Record<string, string> = {
  engineering: "Phòng Kỹ thuật",
  design: "Phòng Thiết kế",
  media: "Phòng Media",
  marketing: "Phòng Marketing",
  sales: "Phòng Kinh doanh",
  finance: "Phòng Tài chính",
  hr: "Phòng Nhân sự",
};
const TEAMS_VI: Record<string, string> = {
  Engineering: "Phòng Kỹ thuật",
  Design: "Phòng Thiết kế",
  Media: "Phòng Media",
  Marketing: "Phòng Marketing",
  Sales: "Phòng Kinh doanh",
  Finance: "Phòng Tài chính",
  HR: "Phòng Nhân sự",
};
const DEPT_COLORS: Record<string, string> = {
  engineering: "#3B82F6",
  design: "#8B5CF6",
  media: "#EC4899",
  marketing: "#F59E0B",
  sales: "#22C55E",
  finance: "#14B8A6",
  hr: "#6366F1",
};

function deptLabel(key?: string | null) {
  if (!key) return "—";
  return key;
}
function deptColor(key?: string | null) {
  if (!key) return DS.text4;
  // Reverse lookup: full name → key → color
  const reverseNameMap: Record<string, string> = {
    "Phòng Kỹ thuật": "engineering",
    "Phòng Thiết kế": "design",
    "Phòng Media": "media",
    "Phòng Marketing": "marketing",
    "Phòng Kinh doanh": "sales",
    "Phòng Tài chính": "finance",
    "Phòng Nhân sự": "hr",
  };
  const resolved = reverseNameMap[key] ?? key.toLowerCase();
  return DEPT_COLORS[resolved] ?? DS.text4;
}

const fmtLP = (n?: number) => {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

// =============================================================================
// Helpers
// =============================================================================

/** XP progress percentage 0–100 (for template strings like `${xpPct}%`) */
const xpPct = (currentXp?: number, maxXp?: number) => {
  const cur = currentXp ?? 0;
  const max = maxXp ?? 100;
  return max > 0 ? Math.min((cur / max) * 100, 100) : 0;
};

/** Rank shorthand used inside map callbacks — 'cfg' local in each block */
const rCfg = (rank: string) => RANKS[rank as RankKey] ?? RANKS.iron;

function toMemberExt(raw: TeamMemberBE): MemberExt {
  const level = raw.level ?? 1;
  const rankKey = getRankFromLevel(level);
  const rankLabel = getRankLabel(rankKey);

  // ── Derive rank history from lpTransactions (source: "rank_up") ──────────
  const rankHistory = (raw.lpTransactions ?? [])
    .filter((tx) => tx.source === "rank_up")
    .map((tx) => {
      const match = tx.description?.match(/\[RANK UP\]\s*(\w+)\s*→\s*(\w+)\s*:\s*(.+)/);
      return {
        date: tx.createdAt,
        from: (match?.[1] ?? "iron") as RankKey,
        to: (match?.[2] ?? "unknown") as RankKey,
        reason: match?.[3] ?? tx.description ?? "",
      };
    });

  // ── Derive mission logs from lpTransactions (task/quest/order sources) ───
  const missionLogs = (raw.lpTransactions ?? [])
    .filter((tx) => tx.source !== "rank_up" && tx.status === "completed" && tx.amount !== 0)
    .slice(0, 10)
    .map((tx) => ({
      date: tx.createdAt,
      task: tx.description ?? tx.source ?? "Task completed",
      lpEarned: Math.max(tx.amount, 0),
    }));

  return {
    ...raw,
    rank: rankLabel,
    level,
    currentXp: raw.currentXp ?? 0,
    maxXp: raw.maxXp ?? 100,
    totalApprovedLp: raw.totalApprovedLp ?? 0,
    availableLp: raw.availableLp ?? 0,
    lockedLp: raw.lockedLp ?? 0,
    isActive: raw.isActive ?? true,
    status: raw.isActive ? "active" : "inactive",
    team: raw.department ? capitalize(raw.department) : "Engineering",
    joinedDate: raw.joinedDate ?? raw.createdAt,
    missionsCompleted: raw.missionsCompleted ?? Math.floor(Math.random() * 50),
    topSkill: raw.memberExpertise?.[0]?.name ?? "Design",
    rankHistory,
    missionLogs,
    lpEarned: raw.totalApprovedLp ?? 0,
    lpSpent: raw.lockedLp ?? 0,
  };
}

/** Transform TeamMemberBE → loopStore.MemberStats for the global stats panel */
function toMemberStats(raw: TeamMemberBE): MemberStats {
  const level = raw.level ?? 1;
  const rankKey = getRankFromLevel(level);
  const rankLabel = getRankLabel(rankKey);
  const ext = toMemberExt(raw);
  return {
    id: raw.id,
    slug: raw.id, // slug falls back to id for admin context
    name: raw.name,
    role: raw.role ?? "Member",
    avatar: raw.avatar ?? null,
    email: raw.email,
    rank: rankLabel.toLowerCase(),
    level,
    currentXp: raw.currentXp ?? 0,
    maxXp: raw.maxXp ?? 100,
    availableLp: raw.availableLp ?? 0,
    lockedLp: raw.lockedLp ?? 0,
    department: raw.department ?? "engineering",
    systemRole: raw.systemRole ?? "member",
    skills: raw.memberExpertise?.map((e) => e.name) ?? [],
    achievements: [],
    rankHistory: ext.rankHistory as MemberStats["rankHistory"],
    missionLogs: ext.missionLogs as MemberStats["missionLogs"],
    missionsCompleted: ext.missionsCompleted,
    totalApprovedLp: raw.totalApprovedLp ?? 0,
    teamTag: ext.team,
    status: ext.status,
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toNumber(v?: string | number | null) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

// =============================================================================
// AdminMembersPage — Main Component
// =============================================================================

export default function AdminMembersPage() {
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const setActiveMember = useLoopStore((s) => s.setActiveMember);
  const editing = canEdit(role); // admin or hr — can add/edit members
  const canDelete = role === "admin";        // only admin — can delete members
  const canAwardLP = role === "admin";       // only admin — can award LP
  const canApprove = role === "admin";       // only admin — can approve pending requests

  // ── State ──────────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "all">("all");
  const [rankFilter, setRankFilter] = useState<RankKey | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [detailMember, setDetailMember] = useState<MemberExt | null>(null);
  const [lpMember, setLpMember] = useState<MemberExt | null>(null);
  const [bulkMembers, setBulkMembers] = useState<MemberExt[]>([]);
  const [formMember, setFormMember] = useState<MemberExt | null>(null); // null = closed | MemberExt = edit mode
 const [showAddModal, setShowAddModal] = useState(false); // add mode flag
 const closeAllForms = () => { setFormMember(null); setShowAddModal(false); };
  const [deleteMember, setDeleteMember] = useState<MemberExt | null>(null);
  // Pending requests state (CEO/Admin only)
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedRole, setSelectedRole] = useState<string>("member");
  
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Toast
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastRef = useRef(0);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: ToastType = "success") => {
    const id = ++toastRef.current;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // ── Fetch members ──────────────────────────────────────────────────────────
  const { data: rawData, isLoading } = useQuery({
    queryKey: qk.adminMembers(),
    queryFn: () => adminApi.get<{ data: TeamMemberBE[]; pagination?: unknown }>("/api/admin/team?limit=100"),
  });

  // ── Fetch departments ─────────────────────────────────────────────────────────
  const { data: deptRes } = useQuery({
    queryKey: ["admin_departments"],
    queryFn: () => adminApi.get<{
      data: { id: string; key: string; name: string; shortName: string; color: string; memberCount: number; members: unknown[] }[];
    }>("/api/admin/departments?limit=100"),
  });

  // deptId → { key, name } map (for resolving department names)
  const deptIdMap = useMemo(() => {
    const depts = deptRes && "data" in deptRes ? (deptRes as { data: { id: string; key: string; name: string; shortName: string; color: string }[] }).data : [];
    return new Map(depts.map((d) => [d.id, d]));
  }, [deptRes]);

  // dept key → { key, name } map (for resolving from scalar department field)
  const deptKeyMap = useMemo(() => {
    const depts = deptIdMap.size > 0
      ? Array.from(deptIdMap.values())
      : deptRes && "data" in deptRes ? (deptRes as { data: { id: string; key: string; name: string }[] }).data : [];
    return new Map(depts.map((d) => [d.key, d]));
  }, [deptIdMap, deptRes]);

  // List of departments for the drawer dropdown
  const departments = useMemo(() => {
    const depts = deptRes && "data" in deptRes ? (deptRes as { data: { id: string; key: string; name: string }[] }).data : [];
    return depts;
  }, [deptRes]);

  const members: MemberExt[] = useMemo(() => {
    const arr = rawData && "data" in rawData ? (rawData as { data: TeamMemberBE[] }).data : (Array.isArray(rawData) ? rawData : []);
    return arr.map((m) => {
      // Resolve correct department display name using deptId (FK) first, then dept (scalar) as fallback
      const deptName = (() => {
        if (m.departmentId && deptIdMap.size > 0) {
          const byId = deptIdMap.get(m.departmentId);
          if (byId) return byId.name;
        }
        const byKey = deptKeyMap.get(m.department ?? "");
        if (byKey) return byKey.name;
        return m.department ?? "engineering";
      })();
      return toMemberExt({ ...m, team: deptName } as TeamMemberBE);
    });
  }, [rawData, deptIdMap, deptKeyMap]);

  // ── Filter + Sort ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let m = members;

    if (search.trim()) {
      const q = search.toLowerCase();
      m = m.filter(
        (x) => x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q)
      );
    }
    if (teamFilter !== "All") m = m.filter((x) => x.team === teamFilter);
    if (statusFilter !== "all") m = m.filter((x) => x.status === statusFilter);
    if (rankFilter !== "All") {
      const rk = rankFilter;
      m = m.filter((x) => getRankFromLevel(x.level ?? 1) === rk);
    }

    return [...m].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "level") cmp = (a.level ?? 1) - (b.level ?? 1);
      else if (sortKey === "lpBalance") cmp = (a.availableLp ?? 0) - (b.availableLp ?? 0);
      else if (sortKey === "missions") cmp = a.missionsCompleted - b.missionsCompleted;
      else if (sortKey === "rank") {
        const rankOrder = ["iron","bronze","silver","gold","platinum","ruby","diamond"];
        cmp = rankOrder.indexOf(getRankFromLevel(a.level ?? 1)) - rankOrder.indexOf(getRankFromLevel(b.level ?? 1));
      } else if (sortKey === "role") {
        const aRoles = (a.roles && a.roles.length > 0 ? a.roles : [a.systemRole ?? a.role ?? ""]).sort();
        const bRoles = (b.roles && b.roles.length > 0 ? b.roles : [b.systemRole ?? b.role ?? ""]).sort();
        cmp = aRoles[0].localeCompare(bRoles[0]);
      } else if (sortKey === "team") cmp = (a.team ?? "").localeCompare(b.team ?? "");
      return sortAsc ? cmp : -cmp;
    });
  }, [members, search, teamFilter, statusFilter, rankFilter, sortKey, sortAsc]);

  // ── KPI stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = members.length;
    const totalLp = members.reduce((s, m) => s + (m.availableLp ?? 0), 0);
    const top = members.reduce<MemberExt | null>(
      (best, m) => ((!best || (m.availableLp ?? 0) > (best.availableLp ?? 0)) ? m : best), null
    );
    const avgLevel = total > 0 ? Math.round(members.reduce((s, m) => s + (m.level ?? 1), 0) / total) : 0;
    return { total, totalLp, top, avgLevel };
  }, [members]);

  // ── Rank distribution ─────────────────────────────────────────────────────
  const rankDist = useMemo(() => {
    const map = new Map<RankKey, number>();
    members.forEach((m) => {
      const rk = getRankFromLevel(m.level ?? 1);
      map.set(rk, (map.get(rk) ?? 0) + 1);
    });
    return map;
  }, [members]);

  // ── Select all ──────────────────────────────────────────────────────────────
  const allSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));

  // =============================================================================
  // Mutations
  // =============================================================================

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminApi.post("/api/admin/team", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.adminMembers() });
      showToast("Thêm thành viên thành công");
      closeAllForms();
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message ?? "Thêm thành viên thất bại";
      showToast(msg, "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      adminApi.put<{ data: TeamMemberBE } & { _diag?: { persistedLevel?: number; persistedRank?: string; updateDataKeys?: string[]; persistedCurrentXp?: number; persistedAvailableLp?: number } }>(`/api/admin/team/${id}`, body),
    onSuccess: (res) => {
      // Patch cache with fresh data from API
      queryClient.setQueryData<{ data: TeamMemberBE[] }>(
        qk.adminMembers(),
        (old) => {
          if (!old?.data) return old;
          const updated = res && "data" in res ? (res as { data: TeamMemberBE }).data : null;
          if (!updated) return old;
          return {
            ...old,
            data: old.data.map((m) => (m.id === updated.id ? toMemberExt(updated) : m)),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: qk.adminMembers() });
      const diag = res && "_diag" in res ? (res as { _diag?: { persistedLevel?: number; persistedRank?: string; updateDataKeys?: string[]; persistedCurrentXp?: number; persistedAvailableLp?: number } })._diag : null;
      const diagMsg = diag
        ? ` [rank=${diag.persistedRank}, level=${diag.persistedLevel}, xp=${diag.persistedCurrentXp}, lp=${diag.persistedAvailableLp}, keys=${diag.updateDataKeys?.join(",")}]`
        : "";
      showToast("Cập nhật thành viên thành công" + diagMsg);
      setFormMember(null);
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message ?? "Cập nhật thất bại";
      showToast(msg, "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/team/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.adminMembers() });
      showToast("Xóa thành viên thành công");
      setDeleteMember(null);
    },
    onError: (err: unknown) => {
      const msg = (err as Error)?.message ?? "Xóa thất bại";
      showToast(msg, "error");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => adminApi.delete(`/api/admin/team/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.adminMembers() });
      showToast(`Đã xóa ${selectedIds.size} thành viên`);
      setSelectedIds(new Set());
    },
    onError: () => showToast("Xóa hàng loạt thất bại", "error"),
  });

  const lpMutation = useMutation({
    mutationFn: (body: { memberId: string; amount: number; description: string }) =>
      adminApi.post("/api/admin/lp-transactions", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.adminMembers() });
      showToast("Điều chỉnh LP thành công");
      setLpMember(null);
    },
    onError: () => showToast("Điều chỉnh LP thất bại", "error"),
  });

  const bulkLpMutation = useMutation({
    mutationFn: (body: { memberId: string; amount: number; description: string }) =>
      adminApi.post("/api/admin/lp-transactions", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.adminMembers() });
      showToast(`Đã cập nhật LP cho ${bulkMembers.length} thành viên`);
      setBulkMembers([]);
      setSelectedIds(new Set());
    },
    onError: () => showToast("Bulk LP thất bại", "error"),
  });

  const isMutating =
    createMutation.isPending || updateMutation.isPending ||
    deleteMutation.isPending || lpMutation.isPending || bulkLpMutation.isPending ||
    bulkDeleteMutation.isPending;

  // ── Pending requests ─────────────────────────────────────────────────────────
  // canApprove already declared at top-level (role === "admin")

  const pendingQuery = useQuery({
    queryKey: ["admin", "pending-requests"],
    queryFn: () => adminApi.get<{ data: PendingRequest[] }>("/api/admin/team/members/pending?status=pending"),
    enabled: editing,
  });

  const accessTagsQuery = useQuery({
    queryKey: ["admin", "access-tags"],
    queryFn: () => adminApi.get<{ data: AccessTag[] }>("/api/admin/access-tags"),
    enabled: editing,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, finalRole, finalTags }: { id: string; finalRole?: string; finalTags?: string[] }) =>
      adminApi.post(`/api/admin/team/members/pending/${id}/approve`, { finalRole, finalTags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.adminMembers() });
      queryClient.invalidateQueries({ queryKey: ["admin", "pending-requests"] });
      showToast("Đã duyệt nhân viên thành công");
      setShowApprovalModal(false);
      setPendingRequest(null);
    },
    onError: () => showToast("Duyệt thất bại", "error"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.post(`/api/admin/team/members/pending/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pending-requests"] });
      showToast("Đã từ chối");
      setShowApprovalModal(false);
      setPendingRequest(null);
    },
    onError: () => showToast("Từ chối thất bại", "error"),
  });

  const pendingCount = pendingQuery.data && "data" in pendingQuery.data
    ? (pendingQuery.data as { data: PendingRequest[] }).data.length
    : 0;

  const allTags: AccessTag[] = accessTagsQuery.data && "data" in accessTagsQuery.data
    ? (accessTagsQuery.data as { data: AccessTag[] }).data
    : [];

  function openApprovalModal(req: PendingRequest) {
    setPendingRequest(req);
    setSelectedRole(req.proposedRole);
    setSelectedTags(new Set(req.proposedTags));
    setRejectReason("");
    setApprovalNotes("");
    setShowApprovalModal(true);
  }

  function toggleTag(slug: string) {
    setSelectedTags((prev) => {
      const n = new Set(prev);
      n.has(slug) ? n.delete(slug) : n.add(slug);
      return n;
    });
  }

  // ── Toggle select ───────────────────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  // =============================================================================
  // JSX Helpers
  // =============================================================================

  function StatusBadge_({ status }: { status: MemberStatus }) {
    const cfg = STATUS_CFG[status];
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 8px", borderRadius: 20,
        backgroundColor: cfg.color + "22",
        border: `1px solid ${cfg.color}55`,
        fontFamily: DS.mono, fontSize: 10, color: cfg.color, whiteSpace: "nowrap",
      }}>
        {cfg.icon}
        <span style={{ display: "inline-block", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis" }}>
          {cfg.label}
        </span>
      </div>
    );
  }

  // =============================================================================
  // MiniStats
  // =============================================================================

  function MiniStat_({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
  }) {
    return (
      <div style={{
        background: DS.bgCard, borderRadius: 12,
        border: `1px solid ${DS.border}`,
        padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          backgroundColor: color + "20",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, color,
        }}>{icon}</div>
        <div>
          <div style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {label}
          </div>
          <div style={{ fontFamily: DS.heading, fontSize: 20, color: DS.text, lineHeight: 1.2, marginTop: 2 }}>
            {value}
          </div>
          {sub && <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3, marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
    );
  }

  // =============================================================================
  // Rank Distribution Bar
  // =============================================================================

  function RankBar_() {
    const ranks: RankKey[] = ["iron","bronze","silver","gold","platinum","ruby","diamond"];
    const total = members.length || 1;
    return (
      <div style={{
        background: DS.bgCard, borderRadius: 12,
        border: `1px solid ${DS.border}`,
        padding: "12px 16px",
      }}>
        <div style={{
          fontFamily: DS.mono, fontSize: 10, color: DS.text2,
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
        }}>
          PHÂN BỔ THEO HẠNG
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ranks.map((rk) => {
            const count = rankDist.get(rk) ?? 0;
            const pct = Math.round((count / total) * 100);
            const cfg = RANKS[rk];
            const active = rankFilter === rk;
            return (
              <button
                key={rk}
                onClick={() => setRankFilter((f) => f === rk ? "All" : rk)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 20,
                  border: active ? `1px solid ${cfg.color}` : `1px solid ${DS.border}`,
                  backgroundColor: active ? cfg.color + "22" : "transparent",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: 12 }}>{cfg.symbol}</span>
                <span style={{
                  fontFamily: DS.mono, fontSize: 10, color: active ? cfg.color : DS.text3,
                }}>
                  {cfg.label} {count}
                </span>
                <span style={{
                  fontFamily: DS.mono, fontSize: 9, color: DS.text3,
                  backgroundColor: DS.border, borderRadius: 8,
                  padding: "1px 5px",
                }}>
                  {pct}%
                </span>
              </button>
            );
          })}
          {rankFilter !== "All" && (
            <button
              onClick={() => setRankFilter("All")}
              style={{
                padding: "4px 10px", borderRadius: 20,
                border: `1px solid ${DS.border}`, backgroundColor: "transparent",
                cursor: "pointer", color: DS.text3, fontFamily: DS.mono, fontSize: 10,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <X size={10} /> Xóa lọc
            </button>
          )}
        </div>
      </div>
    );
  }

  // =============================================================================
  // MemberTableRow
  // Grid card
  function MemberCard_({ m }: { m: MemberExt }) {
    const rankKey = getRankFromLevel(m.level ?? 1);
    const cfg = RANKS[rankKey];
    const pct = (m.maxXp && m.maxXp > 0 ? (m.currentXp ?? 0) / m.maxXp : 0) * 100;
    const checked = selectedIds.has(m.id);
    const roles = m.roles && m.roles.length > 0 ? m.roles : (m.systemRole ? [m.systemRole] : []);
    const primaryRole = roles[0] ?? "member";
    const roleColors: Record<string, string> = {
      ceo: "#FFD700", super_admin: "#6B3DF5", admin: DS.blue,
      hr: "#14B8A6", project_manager: "#EC4899", media: "#F59E0B",
      qa: "#22C55E", member: DS.text3,
    };
    const rc = roleColors[primaryRole] ?? DS.text3;
    const isCeo = primaryRole === "ceo";
    const isAdmin = primaryRole === "super_admin" || primaryRole === "admin";
    const roleLabel = isCeo ? "CEO"
      : isAdmin ? capitalize(primaryRole)
      : m.team ? `Trưởng phòng ${m.team}`
      : capitalize(primaryRole);

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          background: DS.bgCard,
          border: `1px solid ${checked ? DS.blue : DS.border}`,
          borderRadius: 12, padding: 16,
          position: "relative", overflow: "hidden",
          boxShadow: checked ? `0 0 0 1px ${DS.blue}44, 0 4px 16px ${DS.blue}11` : "none",
        }}
      >
        {/* Rank stripe */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`,
        }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            backgroundColor: cfg.color + "33",
            border: `2px solid ${cfg.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: DS.heading, fontSize: 16, color: cfg.color,
            overflow: "hidden",
          }}>
            {m.avatar ? (
              <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : m.name.slice(0, 2).toUpperCase()}
          </div>
          <div
            onClick={() => toggleSelect(m.id)}
            style={{
              width: 18, height: 18, borderRadius: 4, cursor: "pointer",
              border: `1.5px solid ${checked ? DS.blue : DS.text3}`,
              backgroundColor: checked ? DS.blue + "33" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {checked && <Check size={11} color={DS.blue} />}
          </div>
        </div>

        <div style={{ fontFamily: DS.heading, fontSize: 14, color: DS.text, marginBottom: 2 }}>
          {m.name}
        </div>
        <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3, marginBottom: 2 }}>
          {m.email}
        </div>
        <div style={{
          fontFamily: DS.mono, fontSize: 10, color: rc,
          backgroundColor: rc + "15",
          border: `1px solid ${rc}33`,
          borderRadius: 8, padding: "1px 6px",
          display: "inline-flex", flexWrap: "wrap", gap: 4, marginBottom: 8,
        }}>
          {isCeo && <span style={{ color: "#FFD700", fontSize: 11, fontWeight: 700 }}>👑 CEO</span>}
          {isAdmin && <span style={{ color: rc, fontSize: 9 }}>{capitalize(primaryRole)}</span>}
          {!isCeo && !isAdmin && (
            <span style={{ color: rc, fontSize: 9 }}>
              {m.team ? `Trưởng phòng ${m.team}` : deptLabel(m.team)}
            </span>
          )}
          {!isCeo && !isAdmin && (
            <span style={{ color: deptColor(m.team), fontSize: 9, marginLeft: 2 }}>
              · {deptLabel(m.team)}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
          <span style={{ fontSize: 13 }}>{cfg.symbol}</span>
          <span style={{ fontFamily: DS.mono, fontSize: 11, color: cfg.color }}>{cfg.label}</span>
          <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3 }}>· Lv.{m.level}</span>
        </div>

        {/* XP bar */}
        <div style={{ height: 4, borderRadius: 2, backgroundColor: DS.border, marginBottom: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
            borderRadius: 2,
          }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: DS.mono, fontSize: 12, color: DS.amber }}>{fmtLP(m.availableLp ?? 0)} LP</div>
            <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3 }}>{m.missionsCompleted} missions</div>
          </div>
          <StatusBadge_ status={m.status} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
          <button onClick={() => { setActiveMember(toMemberStats(m), { x: 0, y: 0 }); }} style={smallBtn(DS.blue)}>
            <Eye size={12} /> Stats
          </button>
          {canAwardLP && (
            <button onClick={() => setLpMember(m)} style={smallBtn(DS.amber)}>
              <Award size={12} /> LP
            </button>
          )}
          {editing && (
            <button onClick={() => setFormMember(m)} style={smallBtn(DS.purple)}>
              <Edit2 size={12} /> Sửa
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // =============================================================================
  // MemberDetailModal
  // =============================================================================

  function MemberDetailModal_({ m }: { m: MemberExt }) {
    const rankKey = getRankFromLevel(m.level ?? 1);
    const cfg = RANKS[rankKey];
    const pct = (m.maxXp && m.maxXp > 0 ? (m.currentXp ?? 0) / m.maxXp : 0) * 100;

    const skills = m.memberExpertise?.map((e) => e.name) ?? [m.topSkill, "React", "TypeScript", "Design"];
    const skills2 = ["Design", "Frontend", "React", "Communication"];
    const allSkills = skills.length > 0 ? skills : skills2;

    return (
      <motion.div
        key="detail-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setDetailMember(null)}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          backdropFilter: "blur(4px)",
        }}
      >
        <motion.div
          key="detail-panel"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: DS.bg, borderRadius: 16,
            border: `1px solid ${DS.border}`,
            width: "100%", maxWidth: 640,
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${DS.border}`,
          }}
        >
          {/* Banner */}
          <div style={{
            height: 120, borderRadius: "16px 16px 0 0",
            background: `linear-gradient(135deg, ${cfg.color}33, ${cfg.color}11)`,
            borderBottom: `1px solid ${cfg.color}33`,
            position: "relative",
          }}>
            {/* Banner blur accent */}
            <div style={{
              position: "absolute", top: -20, right: -20, width: 200, height: 200,
              borderRadius: "50%", background: `${cfg.color}22`, filter: "blur(40px)",
            }} />
            <div style={{
              position: "absolute", bottom: -32, left: 24,
              width: 72, height: 72, borderRadius: "50%",
              backgroundColor: cfg.color + "33",
              border: `3px solid ${cfg.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: DS.heading, fontSize: 22, color: cfg.color,
              overflow: "hidden", zIndex: 1,
            }}>
              {m.avatar ? (
                <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : m.name.slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={() => setDetailMember(null)}
              style={{
                position: "absolute", top: 12, right: 12,
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: DS.text,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: "40px 24px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: DS.heading, fontSize: 20, color: DS.text, margin: 0 }}>
                  {m.name}
                </h2>
                <div style={{ fontFamily: DS.mono, fontSize: 12, color: DS.text3, marginTop: 2 }}>
                  {m.email}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span style={{ fontSize: 14 }}>{cfg.symbol}</span>
                  <span style={{ fontFamily: DS.mono, fontSize: 12, color: cfg.color }}>
                    {cfg.label} · Level {m.level}
                  </span>
                  <StatusBadge_ status={m.status} />
                </div>
              </div>
              {editing && (
                <button onClick={() => { setDetailMember(null); setFormMember(m); }} style={smallBtn(DS.purple)}>
                  <Edit2 size={12} /> Sửa
                </button>
              )}
            </div>

            {/* XP Bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3, textTransform: "uppercase" }}>
                  Kinh nghiệm
                </span>
                <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text2 }}>
                  {m.currentXp ?? 0} / {m.maxXp ?? 100} XP
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, backgroundColor: DS.border, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${pct}%`,
                  background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
                  borderRadius: 4, transition: "width 0.5s ease",
                }} />
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "LP Khả dụng", value: fmtLP(m.availableLp ?? 0), color: DS.amber },
                { label: "LP Bị khóa", value: fmtLP(m.lockedLp ?? 0), color: DS.text3 },
                { label: "Nhiệm vụ", value: String(m.missionsCompleted), color: DS.green },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: DS.bgCard, borderRadius: 8,
                  border: `1px solid ${DS.border}`, padding: "10px 12px",
                }}>
                  <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontFamily: DS.mono, fontSize: 18, color, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Phòng ban + Role display */}
            <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                fontFamily: DS.mono, fontSize: 10, color: DS.text2,
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                Phân loại
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{
                  background: DS.bgCard, borderRadius: 8,
                  border: `1px solid ${DS.border}`, padding: "8px 12px", flex: 1, minWidth: 120,
                }}>
                  <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase" }}>Phòng ban</div>
                  <div style={{ fontFamily: DS.mono, fontSize: 12, color: deptColor(m.team), marginTop: 2 }}>
                    {deptLabel(m.team)}
                  </div>
                </div>
                <div style={{
                  background: DS.bgCard, borderRadius: 8,
                  border: `1px solid ${DS.border}`, padding: "8px 12px", flex: 1, minWidth: 120,
                }}>
                  <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, textTransform: "uppercase" }}>Vai trò</div>
                  <div style={{ fontFamily: DS.mono, fontSize: 12, color: DS.text, marginTop: 2 }}>
                    {(() => {
                      const roles = m.roles && m.roles.length > 0 ? m.roles : (m.systemRole ? [m.systemRole] : []);
                      const primaryRole = roles[0] ?? "member";
                      const isCeo = primaryRole === "ceo";
                      const isAdmin = primaryRole === "super_admin" || primaryRole === "admin";
                      return isCeo ? "CEO"
                        : isAdmin ? capitalize(primaryRole)
                        : m.team ? `Trưởng phòng ${m.team}`
                        : capitalize(m.role ?? primaryRole);
                    })()}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3, alignSelf: "center", marginRight: 4 }}>
                  Phân quyền:
                </div>
                {(m.roles && m.roles.length > 0 ? m.roles : (m.systemRole ? [m.systemRole] : [])).map((r) => {
                  const roleColors: Record<string, string> = {
                    ceo: "#FFD700", super_admin: "#6B3DF5", admin: DS.blue,
                    hr: "#14B8A6", project_manager: "#EC4899", media: "#F59E0B",
                    qa: "#22C55E", member: DS.text3,
                  };
                  const color = roleColors[r] ?? DS.text3;
                  return (
                    <span key={r} style={{
                      fontFamily: DS.mono, fontSize: 10, color,
                      backgroundColor: color + "22",
                      border: `1px solid ${color}55`,
                      borderRadius: 6, padding: "3px 8px",
                    }}>
                      {r === "ceo" ? "👑 CEO" : r === "super_admin" ? "👑 Super Admin" : capitalize(r)}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: DS.mono, fontSize: 10, color: DS.text2,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
              }}>
                Kỹ năng
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {allSkills.map((s, i) => (
                  <span key={i} style={{
                    padding: "3px 10px", borderRadius: 20,
                    backgroundColor: DS.purple + "22",
                    border: `1px solid ${DS.purple}44`,
                    fontFamily: DS.mono, fontSize: 11, color: DS.purple,
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Rank history */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: DS.mono, fontSize: 10, color: DS.text2,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
              }}>
                Lịch sử hạng
              </div>
              {m.rankHistory.length === 0 ? (
                <div style={{
                  background: DS.bgCard, borderRadius: 8,
                  border: `1px solid ${DS.border}`, padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Info size={14} color={DS.text3} />
                  <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text3 }}>
                    Chưa có lịch sử thăng hạng
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {m.rankHistory.map((h, i) => {
                    const fromR = RANKS[h.from as RankKey];
                    const toR = RANKS[h.to as RankKey];
                    return (
                      <div key={i} style={{
                        background: DS.bgCard, borderRadius: 8,
                        border: `1px solid ${DS.border}`, padding: "8px 12px",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <span style={{ fontSize: 12 }}>{fromR.symbol}</span>
                        <span style={{ color: DS.text3, fontSize: 12 }}>→</span>
                        <span style={{ fontSize: 12 }}>{toR.symbol}</span>
                        <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3, flex: 1 }}>
                          {h.reason}
                        </span>
                        <span style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text3 }}>
                          {fmtDate(h.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Missions */}
            <div>
              <div style={{
                fontFamily: DS.mono, fontSize: 10, color: DS.text2,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
              }}>
                Nhiệm vụ gần đây
              </div>
              {m.missionLogs.length === 0 ? (
                <div style={{
                  background: DS.bgCard, borderRadius: 8,
                  border: `1px solid ${DS.border}`, padding: "12px 16px",
                  fontFamily: DS.mono, fontSize: 11, color: DS.text3,
                }}>
                  Chưa có dữ liệu nhiệm vụ
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {m.missionLogs.slice(0, 5).map((log, i) => (
                    <div key={i} style={{
                      background: DS.bgCard, borderRadius: 8,
                      border: `1px solid ${DS.border}`, padding: "8px 12px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text }}>{log.task}</span>
                      <span style={{ fontFamily: DS.mono, fontSize: 10, color: DS.amber }}>+{log.lpEarned} LP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // =============================================================================
  // LPAwardModal
  // =============================================================================

  function LPAwardModal_({ m }: { m: MemberExt }) {
    const [mode, setMode] = useState<"award" | "deduct">("award");
    const [amount, setAmount] = useState<string>("");
    const [custom, setCustom] = useState(false);
    const AWARD_PRESETS = [500, 1000, 2000, 5000, 10000];
    const DEDUCT_PRESETS = [500, 1000, 2000];
    const presets = mode === "award" ? AWARD_PRESETS : DEDUCT_PRESETS;

    const num = toNumber(amount);
    const preview = mode === "award"
      ? (m.availableLp ?? 0) + num
      : Math.max(0, (m.availableLp ?? 0) - num);

    const handlePreset = (v: number) => {
      setAmount(String(v));
      setCustom(false);
    };

    const handleSubmit = () => {
      if (!num || num <= 0) return;
      lpMutation.mutate({
        memberId: m.id,
        amount: num,
        description: `${mode === "award" ? "Award" : "Deduct"} LP: ${num} LP`,
      });
    };

    return (
      <ModalWrapper onClose={() => setLpMember(null)} title={`Điều chỉnh LP — ${m.name}`}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["award", "deduct"] as const).map((m2) => (
            <button
              key={m2}
              onClick={() => { setMode(m2); setAmount(""); }}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                border: `1px solid ${mode === m2 ? (m2 === "award" ? DS.green : DS.red) : DS.border}`,
                backgroundColor: mode === m2 ? (m2 === "award" ? DS.green : DS.red) + "22" : "transparent",
                color: mode === m2 ? (m2 === "award" ? DS.green : DS.red) : DS.text3,
                fontFamily: DS.mono, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {m2 === "award" ? "Thưởng LP" : "Trừ LP"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {presets.map((v) => (
            <button
              key={v}
              onClick={() => handlePreset(v)}
              style={{
                padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${DS.border}`,
                backgroundColor: amount === String(v) ? DS.blue + "22" : "transparent",
                color: amount === String(v) ? DS.blue : DS.text2,
                fontFamily: DS.mono, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {fmtLP(v)}
            </button>
          ))}
          <button
            onClick={() => { setCustom(true); setAmount(""); }}
            style={{
              padding: "6px 14px", borderRadius: 8,
              border: `1px solid ${DS.border}`,
              backgroundColor: custom ? DS.blue + "22" : "transparent",
              color: custom ? DS.blue : DS.text3,
              fontFamily: DS.mono, fontSize: 12, cursor: "pointer",
            }}
          >
            Tùy chỉnh
          </button>
        </div>

        {custom && (
          <div style={{ marginBottom: 12 }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Nhập số LP"
              min={1}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${DS.border}`,
                backgroundColor: DS.bgCard, color: DS.text,
                fontFamily: DS.mono, fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Preview */}
        <div style={{
          background: DS.bgCard, borderRadius: 8,
          border: `1px solid ${DS.border}`, padding: "12px 16px",
          marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3, textTransform: "uppercase" }}>
              LP hiện tại
            </div>
            <div style={{ fontFamily: DS.mono, fontSize: 16, color: DS.text }}>
              {fmtLP(m.availableLp ?? 0)}
            </div>
          </div>
          <div style={{ color: DS.text3, fontSize: 20 }}>→</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3, textTransform: "uppercase" }}>
              LP sau điều chỉnh
            </div>
            <div style={{ fontFamily: DS.mono, fontSize: 16, color: num > 0 ? (mode === "award" ? DS.green : DS.amber) : DS.text }}>
              {num > 0 ? fmtLP(preview) : "—"}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!num || lpMutation.isPending}
          style={{
            width: "100%", padding: "12px",
            borderRadius: 10, border: "none",
            backgroundColor: num > 0 ? (mode === "award" ? DS.green : DS.amber) : DS.border,
            color: num > 0 ? "#000" : DS.text3,
            fontFamily: DS.heading, fontSize: 13, cursor: num > 0 ? "pointer" : "not-allowed",
            opacity: lpMutation.isPending ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {lpMutation.isPending && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          {mode === "award" ? "Thưởng" : "Trừ"} {fmtLP(num)} LP
        </button>
      </ModalWrapper>
    );
  }

  // =============================================================================
  // BulkLPModal
  // =============================================================================

  function BulkLPModal_() {
    const [mode, setMode] = useState<"award" | "deduct">("award");
    const [amount, setAmount] = useState<string>("");
    const PRESETS = [500, 1000, 2000, 5000];
    const num = toNumber(amount);
    const total = bulkMembers.length * num;

    const handleSubmit = () => {
      if (!num || bulkMembers.length === 0) return;
      bulkMembers.forEach((m) => {
        bulkLpMutation.mutate({
          memberId: m.id,
          amount: num,
          description: `Bulk LP ${mode}: ${num} LP`,
        });
      });
    };

    return (
      <ModalWrapper onClose={() => { setBulkMembers([]); }} title={`Bulk LP — ${bulkMembers.length} thành viên`}>
        <div style={{
          background: DS.blue + "22", borderRadius: 8,
          border: `1px solid ${DS.blue}44`, padding: "10px 14px",
          marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
        }}>
          <Users size={16} color={DS.blue} />
          <span style={{ fontFamily: DS.mono, fontSize: 12, color: DS.blue }}>
            {bulkMembers.length} thành viên đã chọn
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["award", "deduct"] as const).map((m2) => (
            <button
              key={m2}
              onClick={() => setMode(m2)}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                border: `1px solid ${mode === m2 ? (m2 === "award" ? DS.green : DS.red) : DS.border}`,
                backgroundColor: mode === m2 ? (m2 === "award" ? DS.green : DS.red) + "22" : "transparent",
                color: mode === m2 ? (m2 === "award" ? DS.green : DS.red) : DS.text3,
                fontFamily: DS.mono, fontSize: 12, cursor: "pointer",
              }}
            >
              {m2 === "award" ? "Thưởng" : "Trừ"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {PRESETS.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              style={{
                padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${amount === String(v) ? DS.blue : DS.border}`,
                backgroundColor: amount === String(v) ? DS.blue + "22" : "transparent",
                color: amount === String(v) ? DS.blue : DS.text2,
                fontFamily: DS.mono, fontSize: 12, cursor: "pointer",
              }}
            >
              {fmtLP(v)}
            </button>
          ))}
        </div>

        {num > 0 && (
          <div style={{
            background: DS.bgCard, borderRadius: 8,
            border: `1px solid ${DS.border}`, padding: "10px 14px", marginBottom: 16,
            fontFamily: DS.mono, fontSize: 12, color: DS.text,
            display: "flex", justifyContent: "space-between",
          }}>
            <span>{bulkMembers.length} × {fmtLP(num)} =</span>
            <span style={{ color: mode === "award" ? DS.green : DS.amber }}>
              {mode === "award" ? "+" : "-"}{fmtLP(total)} LP
            </span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!num || bulkMembers.length === 0 || bulkLpMutation.isPending}
          style={{
            width: "100%", padding: "12px", borderRadius: 10, border: "none",
            backgroundColor: num > 0 ? (mode === "award" ? DS.green : DS.amber) : DS.border,
            color: num > 0 ? "#000" : DS.text3,
            fontFamily: DS.heading, fontSize: 13, cursor: num > 0 ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {bulkLpMutation.isPending && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
          Xác nhận {mode === "award" ? "thưởng" : "trừ"} LP
        </button>
      </ModalWrapper>
    );
  }

  // =============================================================================
  // MemberFormModal — Redesigned v3 (2026-04-10)
  // Layout: 2-column — left sidebar (role preview) | right: 4 form tabs
  // Phân quyền: System Role preset → auto-fill tabs, tùy chỉnh thêm bớt
  

  function ApprovalModal_() {
    if (!pendingRequest) return null;
    const req = pendingRequest;
    const isProcessing = approveMutation.isPending || rejectMutation.isPending;

    const defaultTags = allTags.filter((t) => t.isDefault).map((t) => t.slug);
    const customTags = allTags.filter((t) => !t.isDefault);

    return (
      <ModalWrapper onClose={() => !isProcessing && setShowApprovalModal(false)} title="Phê duyệt nhân sự">
        <div style={{ maxWidth: 560 }}>
          {/* Header icon */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShieldCheck size={22} color={DS.green} />
            </div>
            <div>
              <h2 style={{ fontFamily: DS.heading, fontSize: 16, color: DS.text, margin: 0 }}>
                Phê duyệt nhân sự
              </h2>
              <p style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text3, margin: "2px 0 0" }}>
                Xem xét hồ sơ và gán quyền truy cập
              </p>
            </div>
          </div>

          {/* Member info */}
          <div style={{
            background: DS.bg, borderRadius: 10,
            border: `1px solid ${DS.border}`,
            padding: "12px 16px", marginBottom: 20,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
              <InfoRow label="Họ tên" value={req.name} />
              <InfoRow label="Email" value={req.email} />
              <InfoRow label="Phòng ban" value={capitalize(req.department)} />
              <InfoRow label="Dự kiến" value={capitalize(req.proposedRole)} />
            </div>
            {req.proposedTags.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {req.proposedTags.map((t) => (
                  <span key={t} style={{
                    padding: "2px 8px", borderRadius: 20,
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    fontFamily: DS.mono, fontSize: 10, color: DS.blue,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* System Role selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block", fontFamily: DS.mono, fontSize: 11,
              color: DS.text3, letterSpacing: "0.08em",
              marginBottom: 8, textTransform: "uppercase",
            }}>
              Gán System Role
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["member", "media", "qa", "project_manager", "admin", "super_admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  disabled={isProcessing}
                  style={{
                    padding: "8px 10px", borderRadius: 8, border: "none",
                    background: selectedRole === r ? DS.blue : DS.bgCard,
                    color: selectedRole === r ? "#fff" : DS.text3,
                    fontFamily: DS.mono, fontSize: 11, cursor: "pointer",
                    transition: "all 0.15s",
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  {capitalize(r)}
                </button>
              ))}
            </div>
          </div>

          {/* Access Tags */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block", fontFamily: DS.mono, fontSize: 11,
              color: DS.text3, letterSpacing: "0.08em",
              marginBottom: 8, textTransform: "uppercase",
            }}>
              Access Tags
            </label>
            {/* Default tags (always included) */}
            {customTags.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text4, marginBottom: 6 }}>
                  Tags tuỳ chỉnh (CEO gán)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {customTags.map((t) => {
                    const isSelected = selectedTags.has(t.slug) || defaultTags.includes(t.slug);
                    return (
                      <button
                        key={t.slug}
                        onClick={() => !defaultTags.includes(t.slug) && toggleTag(t.slug)}
                        disabled={isProcessing || defaultTags.includes(t.slug)}
                        style={{
                          padding: "5px 10px", borderRadius: 20,
                          border: `1.5px solid ${isSelected ? t.color : DS.border}`,
                          background: isSelected ? `${t.color}18` : "transparent",
                          color: isSelected ? t.color : DS.text4,
                          fontFamily: DS.mono, fontSize: 11, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                          transition: "all 0.15s",
                          opacity: isProcessing ? 0.5 : 1,
                        }}
                      >
                        {isSelected && <Check size={10} />}
                        {defaultTags.includes(t.slug) && <span style={{ opacity: 0.6, fontSize: 9 }}>🔒</span>}
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Default tags summary */}
            <div style={{
              padding: "8px 12px", borderRadius: 8,
              background: "rgba(20,184,166,0.08)",
              border: "1px solid rgba(20,184,166,0.2)",
              fontFamily: DS.mono, fontSize: 11, color: "#14B8A6",
            }}>
              🔒 Mặc định: {defaultTags.join(", ")} (tự động cấp cho mọi member)
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block", fontFamily: DS.mono, fontSize: 11,
              color: DS.text3, letterSpacing: "0.08em",
              marginBottom: 8, textTransform: "uppercase",
            }}>
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="VD: Onboarding tháng 4/2026..."
              disabled={isProcessing}
              style={{
                width: "100%", minHeight: 60,
                background: DS.bg, border: `1px solid ${DS.border}`,
                borderRadius: 8, padding: "8px 12px",
                color: DS.text, fontFamily: DS.mono, fontSize: 12,
                resize: "vertical", outline: "none",
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            {/* Reject */}
            <div style={{ flex: 1 }}>
              <button
                onClick={() => {
                  const reason = prompt("Lý do từ chối (bắt buộc):");
                  if (!reason) return;
                  setRejectReason(reason);
                  rejectMutation.mutate({ id: req.id, reason });
                }}
                disabled={isProcessing}
                style={{
                  width: "100%", padding: "10px",
                  borderRadius: 10, border: `1px solid rgba(239,68,68,0.4)`,
                  background: "rgba(239,68,68,0.08)",
                  color: DS.red, fontFamily: DS.mono, fontSize: 13,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                {isProcessing && rejectMutation.isPending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <X size={14} />}
                Từ chối
              </button>
            </div>
            {/* Approve */}
            <div style={{ flex: 2 }}>
              <button
                onClick={() => {
                  approveMutation.mutate({
                    id: req.id,
                    finalRole: selectedRole,
                    finalTags: Array.from(selectedTags),
                  });
                }}
                disabled={isProcessing}
                style={{
                  width: "100%", padding: "10px",
                  borderRadius: 10, border: "none",
                  background: isProcessing ? "rgba(34,197,94,0.6)" : DS.green,
                  color: "#fff", fontFamily: DS.mono, fontSize: 13,
                  fontWeight: 700,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {isProcessing && approveMutation.isPending ? (
                  <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Đang xử lý...</>
                ) : (
                  <><CheckCircle size={14} /> Duyệt &amp; Kích hoạt</>
                )}
              </button>
            </div>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  // Helper
  function InfoRow({ label, value }: { label: string; value: string }) {
    return (
      <div>
        <div style={{ fontFamily: DS.mono, fontSize: 9, color: DS.text4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        <div style={{ fontFamily: DS.mono, fontSize: 12, color: DS.text2, marginTop: 2 }}>{value}</div>
      </div>
    );
  }

  // =============================================================================
  // DeleteConfirmModal
  // =============================================================================

  function DeleteConfirmModal_({ m }: { m: MemberExt }) {
    const rankKey = getRankFromLevel(m.level ?? 1);
     RANKS[rankKey];

    return (
      <ModalWrapper onClose={() => setDeleteMember(null)} title="Xác nhận xóa">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px",
            backgroundColor: DS.red + "22",
            border: `2px solid ${DS.red}66`,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {m.avatar ? (
              <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: DS.heading, fontSize: 20, color: DS.red }}>
                {m.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <h3 style={{ fontFamily: DS.heading, fontSize: 18, color: DS.text, margin: "0 0 4px" }}>
            {m.name}
          </h3>
          <p style={{ fontFamily: DS.mono, fontSize: 12, color: DS.text3, margin: 0 }}>
            {m.email}
          </p>
        </div>

        <div style={{
          background: DS.red + "11", borderRadius: 8,
          border: `1px solid ${DS.red}33`, padding: "12px 14px",
          marginBottom: 20,
          fontFamily: DS.mono, fontSize: 12, color: DS.red,
          textAlign: "center",
        }}>
          Hành động này không thể hoàn tác. Thành viên sẽ bị xóa vĩnh viễn.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setDeleteMember(null)}
            style={{
              flex: 1, padding: "10px", borderRadius: 8,
              border: `1px solid ${DS.border}`, background: "transparent",
              color: DS.text2, fontFamily: DS.heading, fontSize: 13, cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => deleteMutation.mutate(m.id)}
            disabled={deleteMutation.isPending}
            style={{
              flex: 2, padding: "10px", borderRadius: 8, border: "none",
              background: DS.red, color: "#fff",
              fontFamily: DS.heading, fontSize: 13, cursor: "pointer",
              opacity: deleteMutation.isPending ? 0.7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {deleteMutation.isPending && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            Xóa thành viên
          </button>
        </div>
      </ModalWrapper>
    );
  }

  // =============================================================================
  // ModalWrapper — shared overlay + panel
  // =============================================================================

  function ModalWrapper({
    children, onClose, title, wide = false, disabled = false,
  }: {
    children: React.ReactNode; onClose: () => void; title: string; wide?: boolean; disabled?: boolean;
  }) {
    return (
      <motion.div
        key="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={disabled ? undefined : onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: disabled ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          backdropFilter: "blur(4px)",
          cursor: disabled ? "wait" : "default",
        }}
      >
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: DS.bg, borderRadius: 16,
            border: `1px solid ${DS.border}`,
            width: "100%", maxWidth: wide ? 560 : 440,
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: `0 24px 80px rgba(0,0,0,0.6)`,
            position: "relative",
          }}
        >
          {/* Loading overlay */}
          {disabled && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              background: "rgba(2,6,23,0.7)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              borderRadius: 16,
            }}>
              <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: DS.blue }} />
              <div style={{ color: DS.text3, fontFamily: DS.mono, fontSize: 11, marginTop: 12 }}>
                Đang lưu...
              </div>
            </div>
          )}

          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 20px", borderBottom: `1px solid ${DS.border}`,
          }}>
            <h3 style={{ fontFamily: DS.heading, fontSize: 16, color: DS.text, margin: 0 }}>
              {title}
            </h3>
            <button
              onClick={disabled ? undefined : onClose}
              disabled={disabled}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: DS.bgCard, border: `1px solid ${DS.border}`,
                cursor: disabled ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: disabled ? DS.text5 : DS.text3,
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <X size={14} />
            </button>
          </div>
          {/* Body */}
          <div style={{ padding: "20px" }}>
            {children}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // =============================================================================
  // Shared style helpers
  // =============================================================================

  function iconBtn(hoverColor: string, _fillColor?: string): React.CSSProperties {
    return {
      width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer",
      backgroundColor: "transparent", color: hoverColor,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.15s",
    };
  }

  function smallBtn(color: string): React.CSSProperties {
    return {
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 6,
      border: `1px solid ${color}55`, backgroundColor: color + "15",
      color, fontFamily: DS.mono, fontSize: 10, cursor: "pointer",
    };
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1px solid ${DS.border}`,
    backgroundColor: DS.bgCard, color: DS.text,
    fontFamily: DS.mono, fontSize: 13, outline: "none",
    boxSizing: "border-box",
    ...(isMutating ? { opacity: 0.5, cursor: "not-allowed" } : {}),
  };

  function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <div style={{
          fontFamily: DS.mono, fontSize: 10, color: DS.text2,
          textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5,
        }}>
          {label}
        </div>
        {children}
      </div>
    );
  }

  // =============================================================================
  // Main JSX
  // =============================================================================

  return (
    <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: DS.bg }}>
      {/* Toast notifications */}
      <div style={{
        position: "fixed", top: 20, right: 20, zIndex: 999,
        display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none",
      }}>
        <AnimatePresence>
          {toasts.map((t) => {
            const colors: Record<ToastType, string> = {
              success: DS.green, error: DS.red, info: DS.blue, warning: DS.amber,
            };
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                style={{
                  padding: "10px 16px", borderRadius: 10,
                  backgroundColor: DS.bgCard,
                  border: `1px solid ${colors[t.type]}55`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${colors[t.type]}22`,
                  display: "flex", alignItems: "center", gap: 8,
                  fontFamily: DS.mono, fontSize: 12, color: DS.text,
                  minWidth: 240, maxWidth: 360,
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  backgroundColor: colors[t.type], flexShrink: 0,
                }} />
                {t.msg}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 24, color: DS.text, margin: 0 }}>
            Thành viên
          </h1>
          <p style={{ fontFamily: DS.mono, fontSize: 12, color: DS.text3, margin: "4px 0 0" }}>
            {isLoading ? "Đang tải..." : `${filtered.length} / ${members.length} thành viên`}
          </p>
        </div>
        {editing && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 18px", borderRadius: 10, border: "none",
              backgroundColor: DS.blue, color: "#fff",
              fontFamily: DS.heading, fontSize: 13, cursor: "pointer",
            }}
          >
            <Plus size={16} /> Thêm thành viên
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12, marginBottom: 16,
      }}>
        <MiniStat_
          icon={<Users size={20} />}
          label="Tổng thành viên"
          value={String(stats.total)}
          color={DS.blue}
        />
        <MiniStat_
          icon={<TrendingUp size={20} />}
          label="LP lưu hành"
          value={fmtLP(stats.totalLp)}
          color={DS.amber}
        />
        <MiniStat_
          icon={<Crown size={20} />}
          label="Top LP"
          value={stats.top?.name ?? "—"}
          sub={stats.top ? `${fmtLP(stats.top.availableLp ?? 0)} LP` : undefined}
          color={DS.purple}
        />
        <MiniStat_
          icon={<Zap size={20} />}
          label="Level trung bình"
          value={String(stats.avgLevel)}
          color={DS.green}
        />
      </div>

      {/* Rank Distribution */}
      <RankBar_ />

      {/* Pending Approvals Banner (CEO/Admin only) */}
      {canApprove && (
        <div style={{
          background: "rgba(234,179,8,0.08)",
          border: "1px solid rgba(234,179,8,0.3)",
          borderRadius: 12,
          padding: "14px 18px",
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(234,179,8,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <UserCheck size={18} color={DS.amber} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: DS.mono, fontSize: 11, color: DS.amber, fontWeight: 700, letterSpacing: "0.08em" }}>
              NHÂN SỰ CHỜ DUYỆT
            </div>
            <div style={{ fontFamily: DS.mono, fontSize: 12, color: DS.text2, marginTop: 2 }}>
              {pendingQuery.isLoading
                ? "Đang tải..."
                : pendingCount > 0
                  ? `${pendingCount} nhân viên đang chờ bạn phê duyệt`
                  : "Không có nhân viên nào chờ duyệt"}
            </div>
          </div>
          {pendingCount > 0 && (
            <button
              onClick={() => {
                const pending = pendingQuery.data && "data" in pendingQuery.data
                  ? (pendingQuery.data as { data: PendingRequest[] }).data
                  : [];
                if (pending.length > 0) openApprovalModal(pending[0]);
              }}
              disabled={pendingQuery.isLoading}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                border: "none",
                background: DS.amber,
                color: "#000",
                fontFamily: DS.mono, fontSize: 12, fontWeight: 700,
                cursor: pendingQuery.isLoading ? "not-allowed" : "pointer",
                opacity: pendingQuery.isLoading ? 0.6 : 1,
              }}
            >
              {pendingQuery.isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <ShieldCheck size={14} />}
              Duyệt ngay
            </button>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{
        background: DS.bgCard, borderRadius: 12,
        border: `1px solid ${DS.border}`,
        padding: "12px 16px", marginTop: 16,
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
      }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: DS.text3 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email…"
            style={{
              width: "100%", padding: "7px 10px 7px 30px", borderRadius: 8,
              border: `1px solid ${DS.border}`,
              backgroundColor: DS.bg, color: DS.text,
              fontFamily: DS.mono, fontSize: 12, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Team filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {["All", ...Object.values(DEPARTMENTS_VI)].map((t) => (
            <button
              key={t}
              onClick={() => setTeamFilter(t)}
              style={{
                padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${teamFilter === t ? DS.blue : DS.border}`,
                backgroundColor: teamFilter === t ? DS.blue + "22" : "transparent",
                color: teamFilter === t ? DS.blue : DS.text3,
                fontFamily: DS.mono, fontSize: 11, transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MemberStatus | "all")}
          style={{
            padding: "6px 10px", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${DS.border}`,
            backgroundColor: DS.bg, color: DS.text2,
            fontFamily: DS.mono, fontSize: 11,
          }}
        >
          <option value="all">Tất cả trạng thái</option>
          {(Object.keys(STATUS_CFG) as MemberStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_CFG[s].label}</option>
          ))}
        </select>

        {/* Bulk actions — right side */}
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
          {/* Select all */}
          <button
            onClick={() => {
              if (allSelected) setSelectedIds(new Set());
              else setSelectedIds(new Set(filtered.map((m) => m.id)));
            }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 14px", borderRadius: 8,
              border: `1px solid ${DS.blue}44`,
              backgroundColor: allSelected ? DS.blue + "22" : "transparent",
              color: allSelected ? DS.blue : DS.text3,
              fontFamily: DS.mono, fontSize: 11, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Check size={12} />
            {allSelected ? "Bỏ chọn tất cả" : `Chọn tất cả (${filtered.length})`}
          </button>

          {/* Bulk LP — admin only */}
          {canAwardLP && selectedIds.size > 0 && (
            <button
              onClick={() => {
                const sel = members.filter((m) => selectedIds.has(m.id));
                setBulkMembers(sel);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${DS.amber}55`, backgroundColor: DS.amber + "15",
                color: DS.amber, fontFamily: DS.mono, fontSize: 11, cursor: "pointer",
              }}
            >
              <Award size={13} /> Bulk LP ({selectedIds.size})
            </button>
          )}

          {/* Bulk delete — admin only */}
          {canDelete && selectedIds.size > 0 && (
            <button
              onClick={() => {
                if (!confirm(`Xóa ${selectedIds.size} thành viên đã chọn?\nHành động này không thể hoàn tác.`)) return;
                bulkDeleteMutation.mutate(Array.from(selectedIds));
              }}
              disabled={bulkDeleteMutation.isPending}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${DS.red}55`, backgroundColor: DS.red + "15",
                color: DS.red, fontFamily: DS.mono, fontSize: 11, cursor: "pointer",
                opacity: bulkDeleteMutation.isPending ? 0.6 : 1,
              }}
            >
              {bulkDeleteMutation.isPending
                ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                : <Trash2 size={12} />}
              Xóa ({selectedIds.size})
            </button>
          )}

          {/* View mode toggle */}
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${viewMode === "table" ? DS.blue : DS.border}`,
                backgroundColor: viewMode === "table" ? DS.blue + "22" : "transparent",
                color: viewMode === "table" ? DS.blue : DS.text3,
                display: "flex", alignItems: "center",
              }}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${viewMode === "grid" ? DS.blue : DS.border}`,
                backgroundColor: viewMode === "grid" ? DS.blue + "22" : "transparent",
                color: viewMode === "grid" ? DS.blue : DS.text3,
                display: "flex", alignItems: "center",
              }}
            >
              <Grid3x3 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginTop: 16 }}>
        {isLoading ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 60, color: DS.text3,
          }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 60, color: DS.text3,
            fontFamily: DS.mono, fontSize: 13,
          }}>
            Không tìm thấy thành viên nào
          </div>
        ) : viewMode === "table" ? (
          /* ── Table View ── */
          <div style={{
            background: DS.bgCard, borderRadius: 12,
            border: `1px solid ${DS.border}`, overflow: "hidden",
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {[
                      { key: "name" as SortKey, label: "Thành viên" },
                      { key: "role" as SortKey, label: "Vai trò" },
                      { key: "rank" as SortKey, label: "Hạng" },
                      { key: "level" as SortKey, label: "Level" },
                      { key: "lpBalance" as SortKey, label: "LP" },
                      { key: "missions" as SortKey, label: "Nhiệm vụ" },
                      { key: "team" as SortKey, label: "Phòng ban" },
                    ].map((col) => {
                      const active = sortKey === col.key;
                      return (
                        <th
                          key={col.key}
                          onClick={() => {
                            if (sortKey === col.key) setSortAsc((a) => !a);
                            else { setSortKey(col.key); setSortAsc(true); }
                          }}
                          style={{
                            padding: "10px 14px", cursor: "pointer", userSelect: "none",
                            fontFamily: DS.mono, fontSize: 10, fontWeight: 700,
                            color: active ? DS.blue : DS.text3,
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            textAlign: "left", whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {col.label}
                            {active ? (sortAsc ? <ChevronUp size={11} /> : <ChevronDown size={11} />) : null}
                          </span>
                        </th>
                      );
                    })}
                    <th style={{ padding: "10px 14px", fontFamily: DS.mono, fontSize: 10, color: DS.text3, textTransform: "uppercase" }}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const rankKey = getRankFromLevel(m.level ?? 1);
                    const cfg = RANKS[rankKey];
                    const checked = selectedIds.has(m.id);
                    const roles = m.roles && m.roles.length > 0 ? m.roles : (m.systemRole ? [m.systemRole] : []);
                    const primaryRole = roles[0] ?? "member";
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setDetailMember(m)}
                        style={{
                          borderBottom: `1px solid ${DS.border}22`,
                          backgroundColor: checked ? DS.blue + "0a" : "transparent",
                          cursor: "pointer",
                          transition: "background-color 0.15s",
                        }}
                      >
                        <td style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            onClick={(e) => { e.stopPropagation(); toggleSelect(m.id); }}
                            style={{
                              width: 16, height: 16, borderRadius: 4, cursor: "pointer",
                              border: `1.5px solid ${checked ? DS.blue : DS.text3}`,
                              backgroundColor: checked ? DS.blue + "33" : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {checked && <Check size={10} color={DS.blue} />}
                          </div>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: cfg.color + "33", border: `1.5px solid ${cfg.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DS.heading, fontSize: 11, color: cfg.color, overflow: "hidden", flexShrink: 0 }}>
                            {m.avatar ? <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : m.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontFamily: DS.heading, fontSize: 13, color: DS.text }}>{m.name}</div>
                            <div style={{ fontFamily: DS.mono, fontSize: 10, color: DS.text3 }}>{m.email}</div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text2 }}>
                            {primaryRole}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontFamily: DS.mono, fontSize: 11, color: cfg.color }}>
                            {cfg.symbol} {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text2 }}>{m.level}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text2 }}>{(m.availableLp ?? 0).toLocaleString()}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text2 }}>{m.missionsCompleted}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text2 }}>{m.team || "—"}</span>
                        </td>
                        <td style={{ padding: "10px 14px", display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailMember(m); }}
                            style={{ ...smallBtn(DS.blue), padding: "4px 8px" }}
                          >
                            <Eye size={11} />
                          </button>
                          {editing && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setFormMember(m); }}
                              style={{ ...smallBtn(DS.purple), padding: "4px 8px" }}
                            >
                              <Edit2 size={11} />
                            </button>
                          )}
                          {canAwardLP && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setLpMember(m); }}
                              style={{ ...smallBtn(DS.amber), padding: "4px 8px" }}
                            >
                              <Award size={11} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Grid View ── */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}>
            {filtered.map((m) => (
              <MemberCard_ key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showApprovalModal && <ApprovalModal_ key="modal-approval" />}
        {detailMember && <MemberDetailModal_ key="modal-detail" m={detailMember} />}
        {lpMember && <LPAwardModal_ key="modal-award" m={lpMember} />}
        {bulkMembers.length > 0 && <BulkLPModal_ key="modal-bulk" />}
        <MemberFormDrawer
          key="modal-form"
          isOpen={showAddModal || !!formMember}
          isAdd={showAddModal}
          member={formMember}
          departments={departments}
          onClose={closeAllForms}
          onSubmit={(body, isAddMode, id) => {
            if (isAddMode) createMutation.mutate(body);
            else if (id) updateMutation.mutate({ id, body });
          }}
          isMutating={createMutation.isPending || updateMutation.isPending}
        />
        {deleteMember && <DeleteConfirmModal_ key="modal-delete" m={deleteMember} />}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { opacity: 0.4; }
      `}</style>
    </div>
  );
}

