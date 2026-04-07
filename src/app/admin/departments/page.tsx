"use client";

/**
 * Departments Admin Page — LOOP Solutions
 * Route: /admin/departments
 *
 * Full rewrite to match DESIGN LOOPS DepartmentTab (1,008 lines):
 * - 4 KPI cards + dept selector + full detail view
 * - OrgChart with 3 adaptive modes (tree ≤8 / grid 9-24 / squads 25+)
 * - DeptDetail: KPI + org chart + stats sidebar + rank distribution
 * - MemberList: paginated (12/page) + search + rank filter + sort
 * - AssignModal: bulk assignment with rank filter + select-all
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Building2, Users, Crown, ChevronRight, ChevronDown, ChevronUp,
  X, Save, Search, BarChart3, UserPlus, Layers,
  CheckSquare, Square,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type RankKey = "iron" | "bronze" | "silver" | "gold" | "platinum" | "ruby" | "diamond";

interface RankConfig {
  label: string;
  symbol: string;
  color: string;
  glowColor: string;
}

const RANKS: Record<RankKey, RankConfig> = {
  iron:     { label: "Iron",     symbol: "⬡", color: "#9CA3AF", glowColor: "rgba(156,163,175,0.3)" },
  bronze:   { label: "Bronze",   symbol: "◈", color: "#CD7F32", glowColor: "rgba(205,127,50,0.3)" },
  silver:   { label: "Silver",   symbol: "◇", color: "#CBD5E1", glowColor: "rgba(203,213,225,0.3)" },
  gold:     { label: "Gold",     symbol: "★", color: "#FFD700", glowColor: "rgba(255,215,0,0.3)" },
  platinum: { label: "Platinum", symbol: "❋", color: "#14B8A6", glowColor: "rgba(20,184,166,0.3)" },
  ruby:     { label: "Ruby",     symbol: "♦", color: "#EF4444", glowColor: "rgba(239,68,68,0.3)" },
  diamond:  { label: "Diamond",  symbol: "✦", color: "#818CF8", glowColor: "rgba(129,140,248,0.3)" },
};

const RANK_ORDER: Record<RankKey, number> = {
  diamond: 7, ruby: 6, platinum: 5, gold: 4, silver: 3, bronze: 2, iron: 1,
};
const RANK_KEYS: RankKey[] = ["diamond", "ruby", "platinum", "gold", "silver", "bronze", "iron"];

// Mock members
interface Member {
  id: number;
  name: string;
  role: string;
  rank: RankKey;
  level: number;
  img: string;
  lpBalance: number;
  lpEarned: number;
  missions: number;
}

const MOCK_MEMBERS: Member[] = [
  { id: 1, name: "Akira Tanaka", role: "CEO", rank: "diamond", level: 120, img: "https://i.pravatar.cc/150?img=1", lpBalance: 450000, lpEarned: 450000, missions: 18 },
  { id: 2, name: "Yuki Sato", role: "Marketing Lead", rank: "ruby", level: 96, img: "https://i.pravatar.cc/150?img=2", lpBalance: 220000, lpEarned: 220000, missions: 16 },
  { id: 3, name: "Min-jun Lee", role: "IT Lead", rank: "platinum", level: 88, img: "https://i.pravatar.cc/150?img=3", lpBalance: 180000, lpEarned: 180000, missions: 15 },
  { id: 4, name: "Wei Chen", role: "Senior Engineer", rank: "gold", level: 68, img: "https://i.pravatar.cc/150?img=4", lpBalance: 95000, lpEarned: 95000, missions: 12 },
  { id: 5, name: "Sora Kimura", role: "Frontend Dev", rank: "silver", level: 48, img: "https://i.pravatar.cc/150?img=5", lpBalance: 42000, lpEarned: 42000, missions: 9 },
  { id: 6, name: "Ryo Nakamura", role: "Backend Dev", rank: "silver", level: 42, img: "https://i.pravatar.cc/150?img=6", lpBalance: 38000, lpEarned: 38000, missions: 8 },
  { id: 7, name: "Hana Park", role: "Media Lead", rank: "bronze", level: 28, img: "https://i.pravatar.cc/150?img=7", lpBalance: 18000, lpEarned: 18000, missions: 6 },
  { id: 8, name: "Alex Nguyen", role: "Marketing Specialist", rank: "bronze", level: 22, img: "https://i.pravatar.cc/150?img=8", lpBalance: 12000, lpEarned: 12000, missions: 5 },
  { id: 9, name: "Linh Hoang", role: "Junior Dev", rank: "iron", level: 8, img: "https://i.pravatar.cc/150?img=9", lpBalance: 3200, lpEarned: 3200, missions: 2 },
  { id: 10, name: "Minh Tran", role: "QA Engineer", rank: "iron", level: 5, img: "https://i.pravatar.cc/150?img=10", lpBalance: 1800, lpEarned: 1800, missions: 1 },
];

// Dept config
interface DeptConfig {
  id: string;
  name: string;
  shortName: string;
  color: string;
  description: string;
  mission: string;
  headId: number;
  memberIds: number[];
  kpi: { label: string; value: string; color: string }[];
}

const INIT_DEPTS: DeptConfig[] = [
  {
    id: "marketing", name: "Phòng Marketing", shortName: "MKT",
    color: "#F59E0B",
    description: "Chiến lược thương hiệu, nội dung số, SEO/SEM và quản lý cộng đồng",
    mission: "Xây dựng nhận diện thương hiệu LOOP và thu hút khách hàng tiềm năng",
    headId: 2,
    memberIds: [2, 8, 9],
    kpi: [
      { label: "Chiến dịch active", value: "3", color: "#22C55E" },
      { label: "Reach tháng này", value: "124K", color: "#F59E0B" },
      { label: "Conversion rate", value: "3.2%", color: "#3B82F6" },
      { label: "Dự án đang làm", value: "4", color: "#818CF8" },
    ],
  },
  {
    id: "it", name: "Phòng IT", shortName: "IT",
    color: "#3B82F6",
    description: "Phát triển phần mềm, hạ tầng hệ thống, bảo mật và DevOps",
    mission: "Đảm bảo hạ tầng kỹ thuật ổn định và phát triển sản phẩm chất lượng cao",
    headId: 3,
    memberIds: [1, 3, 4, 5, 6, 9, 10],
    kpi: [
      { label: "Sprint velocity", value: "48 pts", color: "#3B82F6" },
      { label: "Bug fix rate", value: "94%", color: "#22C55E" },
      { label: "Uptime", value: "99.98%", color: "#14B8A6" },
      { label: "PR merged/tháng", value: "127", color: "#818CF8" },
    ],
  },
  {
    id: "media", name: "Phòng Media", shortName: "MDI",
    color: "#818CF8",
    description: "Sản xuất video, thiết kế đồ họa, photography và motion graphics",
    mission: "Tạo ra nội dung hình ảnh chất lượng cao, phục vụ brand và client",
    headId: 7,
    memberIds: [7, 8],
    kpi: [
      { label: "Video deliveries", value: "12", color: "#818CF8" },
      { label: "Design assets", value: "340+", color: "#3B82F6" },
      { label: "Client satisfaction", value: "4.8/5", color: "#22C55E" },
      { label: "Turnaround avg", value: "2.3d", color: "#F59E0B" },
    ],
  },
];

// ── MiniAvatar ───────────────────────────────────────────────────────────────

function _MiniAvatar({ id, size = 32, tooltip = true }: { id: number; size?: number; tooltip?: boolean }) {
  const m = MOCK_MEMBERS.find(x => x.id === id);
  const [showTip, setShowTip] = useState(false);
  if (!m) return null;
  const rc = RANKS[m.rank];
  return (
    <div
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      style={{ position: "relative", flexShrink: 0 }}
    >
      <div style={{
        width: size, height: size, borderRadius: "50%", overflow: "hidden",
        border: `2px solid ${rc.color}70`,
        boxShadow: `0 0 6px ${rc.glowColor}`,
      }}>
        <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {tooltip && showTip && (
        <div style={{
          position: "absolute", bottom: size + 4, left: "50%", transform: "translateX(-50%)",
          background: DS.bgCard, border: `1px solid ${rc.color}40`, borderRadius: 8,
          padding: "5px 10px", whiteSpace: "nowrap", zIndex: 99,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          <div style={{ color: DS.text, fontSize: 11, fontWeight: 700 }}>{m.name}</div>
          <div style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>{rc.symbol} {rc.label} Lv.{m.level}</div>
        </div>
      )}
    </div>
  );
}

// ── AvatarStack ──────────────────────────────────────────────────────────────

function AvatarStack({ ids, max = 5, size = 28 }: { ids: number[]; max?: number; size?: number }) {
  const shown = ids.slice(0, max);
  const rest = ids.length - shown.length;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((id, i) => {
        const m = MOCK_MEMBERS.find(x => x.id === id);
        if (!m) return null;
        const rc = RANKS[m.rank];
        return (
          <div key={id} style={{
            width: size, height: size, borderRadius: "50%", overflow: "hidden",
            border: `2px solid ${DS.bgCard}`,
            marginLeft: i === 0 ? 0 : -(size * 0.35),
            zIndex: shown.length - i, position: "relative",
            boxShadow: `0 0 4px ${rc.glowColor}`,
          }}>
            <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
      {rest > 0 && (
        <div style={{
          width: size, height: size, borderRadius: "50%",
          background: DS.bgCard2, border: `2px solid ${DS.border}`,
          marginLeft: -(size * 0.35),
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 0, position: "relative",
        }}>
          <span style={{ color: DS.text4, fontSize: size * 0.3, fontFamily: DS.mono, fontWeight: 700 }}>+{rest}</span>
        </div>
      )}
    </div>
  );
}

// ── OrgChart (3 modes) ────────────────────────────────────────────────────────

function OrgChart({ dept }: { dept: DeptConfig }) {
  const { color, headId, memberIds } = dept;
  const head = MOCK_MEMBERS.find(m => m.id === headId);
  const headRc = head ? RANKS[head.rank] : null;
  const subMembers = memberIds
    .filter(id => id !== headId)
    .map(id => MOCK_MEMBERS.find(m => m.id === id))
    .filter(Boolean) as Member[];

  const count = subMembers.length;

  // Group by role category
  const roleGroups = useMemo(() => {
    const groups: Record<string, Member[]> = {};
    subMembers.forEach(m => {
      const cat = m.role.includes("Dev") || m.role.includes("DevOps") || m.role.includes("QA") ? "Dev"
        : m.role.includes("Design") || m.role.includes("UI") ? "Design"
        : m.role.includes("Manager") || m.role.includes("Lead") || m.role.includes("PM") ? "Lead"
        : m.role.includes("Content") || m.role.includes("SEO") || m.role.includes("Market") ? "Marketing"
        : m.role.includes("Video") || m.role.includes("Photo") || m.role.includes("Media") ? "Media"
        : "Khác";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }, [subMembers]);

  if (!head || !headRc) return null;

  // Mode A: ≤ 8 sub-members → tree
  if (count <= 8) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Head */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ position: "relative" }}>
            <Crown size={14} style={{ position: "absolute", top: -8, right: -4, color: DS.amber, filter: `drop-shadow(0 0 4px ${DS.amber})`, zIndex: 10 }} />
            <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${DS.amber}`, boxShadow: `0 0 18px rgba(245,158,11,0.5)` }}>
              <img src={head.img} alt={head.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: DS.amber, fontSize: 11, fontWeight: 700 }}>{head.name.split(" ").slice(-1)[0]}</div>
            <div style={{ color: headRc.color, fontSize: 8, fontFamily: DS.mono }}>{headRc.symbol} {headRc.label}</div>
          </div>
        </div>

        {count > 0 && (
          <>
            <div style={{ width: 1, height: 16, background: `${color}40` }} />
            <div style={{ maxWidth: 520, width: "100%", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: "5%", right: "5%", height: 1, background: `${color}30` }} />
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20, paddingTop: 16 }}>
                {subMembers.map(m => {
                  const rc = RANKS[m.rank];
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: `2px solid ${rc.color}60`, boxShadow: `0 0 6px ${rc.glowColor}` }}>
                        <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ textAlign: "center", maxWidth: 68 }}>
                        <div style={{ color: DS.text3, fontSize: 9, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name.split(" ").slice(-1)[0]}</div>
                        <div style={{ color: rc.color, fontSize: 7, fontFamily: DS.mono }}>{rc.symbol} {rc.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Mode B: 9-24 sub-members → head card + compact grid
  if (count <= 24) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Head card */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: 12, background: `${DS.amber}08`, border: `1px solid ${DS.amber}30` }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Crown size={12} style={{ position: "absolute", top: -4, right: -3, color: DS.amber, zIndex: 10 }} />
            <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", border: `2px solid ${DS.amber}`, boxShadow: `0 0 14px rgba(245,158,11,0.4)` }}>
              <img src={head.img} alt={head.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
          <div>
            <div style={{ color: DS.amber, fontSize: 12, fontWeight: 700 }}>{head.name}</div>
            <div style={{ color: DS.text4, fontSize: 10 }}>{head.role}</div>
            <div style={{ color: headRc.color, fontSize: 8, fontFamily: DS.mono }}>{headRc.symbol} {headRc.label} Lv.{head.level}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ height: 24, width: 1, background: DS.border }} />
            <AvatarStack ids={subMembers.map(m => m.id)} max={4} size={24} />
            <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{count} nhân sự</span>
          </div>
        </div>

        {/* Compact avatar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 8, maxHeight: 280, overflowY: "auto" }}>
          {subMembers.map(m => {
            const rc = RANKS[m.rank];
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px", borderRadius: 12, background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", border: `2px solid ${rc.color}60`, boxShadow: `0 0 6px ${rc.glowColor}` }}>
                  <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ color: DS.text3, fontSize: 9, fontWeight: 600, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                  {m.name.split(" ").slice(-1)[0]}
                </div>
                <div style={{ color: rc.color, fontSize: 7, fontFamily: DS.mono }}>{rc.symbol} Lv.{m.level}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Mode C: 25+ → head + collapsible squads
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Head banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px", borderRadius: 12, background: `linear-gradient(135deg, ${DS.amber}12, transparent)`, border: `1px solid ${DS.amber}35` }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Crown size={14} style={{ position: "absolute", top: -5, right: -4, color: DS.amber, zIndex: 10 }} />
          <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${DS.amber}`, boxShadow: `0 0 18px rgba(245,158,11,0.5)` }}>
            <img src={head.img} alt={head.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: DS.amber, fontSize: 13, fontWeight: 700 }}>{head.name}</div>
          <div style={{ color: DS.text4, fontSize: 11 }}>{head.role} · Trưởng phòng</div>
          <div style={{ color: headRc.color, fontSize: 9, fontFamily: DS.mono, marginTop: 2 }}>{headRc.symbol} {headRc.label} Lv.{head.level}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: DS.text, fontSize: 18, fontFamily: DS.mono, fontWeight: 700 }}>{count}</div>
          <div style={{ color: DS.text5, fontSize: 9 }}>nhân sự</div>
        </div>
      </div>

      {/* Squad groups */}
      {Object.entries(roleGroups).map(([group, gMembers]) => (
        <SquadGroup key={group} label={group} color={color} members={gMembers} />
      ))}
    </div>
  );
}

function SquadGroup({ label, color, members: gMembers }: { label: string; color: string; members: Member[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: DS.bgCard2, border: "none", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
          <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{label.toUpperCase()}</span>
          <span style={{ color, fontSize: 10, fontFamily: DS.mono, background: `${color}15`, border: `1px solid ${color}30`, padding: "1px 6px", borderRadius: 4 }}>{gMembers.length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AvatarStack ids={gMembers.map(m => m.id)} max={5} size={22} />
          {open ? <ChevronUp size={13} style={{ color: DS.text5 }} /> : <ChevronDown size={13} style={{ color: DS.text5 }} />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6, padding: 12, background: DS.bgCard }}>
              {gMembers.map(m => {
                const rc = RANKS[m.rank];
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${rc.color}50`, flexShrink: 0 }}>
                      <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: DS.text3, fontSize: 10, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name.split(" ").slice(-1)[0]}</div>
                      <div style={{ color: rc.color, fontSize: 7, fontFamily: DS.mono }}>{rc.symbol} Lv.{m.level}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MemberList ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

type SortKey = "level" | "name" | "lp" | "rank";

function MemberList({ dept }: { dept: DeptConfig }) {
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState<RankKey | "all">("all");
  const [sort, setSort] = useState<SortKey>("level");
  const [page, setPage] = useState(1);

  const deptMembers = useMemo(() =>
    dept.memberIds.map(id => MOCK_MEMBERS.find(m => m.id === id)).filter(Boolean) as Member[],
    [dept.memberIds]
  );

  const filtered = useMemo(() => {
    let list = deptMembers;
    if (rankFilter !== "all") list = list.filter(m => m.rank === rankFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sort === "level") sorted.sort((a, b) => b.level - a.level);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "lp") sorted.sort((a, b) => b.lpBalance - a.lpBalance);
    else if (sort === "rank") sorted.sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
    return sorted;
  }, [deptMembers, rankFilter, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rankCounts = useMemo(() => {
    const counts: Partial<Record<RankKey, number>> = {};
    deptMembers.forEach(m => { counts[m.rank] = (counts[m.rank] ?? 0) + 1; });
    return counts;
  }, [deptMembers]);

  const handleFilter = (r: RankKey | "all") => { setRankFilter(r); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
      {/* Toolbar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── DANH SÁCH NHÂN SỰ </span>
            <span style={{ color: dept.color, marginLeft: 8 }}>({filtered.length}/{deptMembers.length})</span>
          </div>
          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <Layers size={11} style={{ color: DS.text5 }} />
            <select value={sort} onChange={e => { setSort(e.target.value as SortKey); setPage(1); }}
              style={{ background: "none", border: "none", outline: "none", color: DS.text4, fontSize: 11, fontFamily: DS.mono, cursor: "pointer" }}>
              <option value="level">Cấp độ</option>
              <option value="rank">Rank</option>
              <option value="lp">LP</option>
              <option value="name">Tên</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: DS.bgCard2, border: `1px solid ${DS.border}`, marginBottom: 12 }}>
          <Search size={13} style={{ color: DS.text5 }} />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm theo tên, chức vụ..."
            style={{ background: "none", border: "none", outline: "none", color: DS.text3, fontSize: 13, flex: 1 }} />
          {search && (
            <button onClick={() => handleSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text5, display: "flex" }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Rank filter chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button onClick={() => handleFilter("all")}
            style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontFamily: DS.mono, cursor: "pointer", border: `1px solid ${rankFilter === "all" ? dept.color : DS.border}`, background: rankFilter === "all" ? `${dept.color}15` : "none", color: rankFilter === "all" ? dept.color : DS.text5 }}>
            TẤT CẢ ({deptMembers.length})
          </button>
          {RANK_KEYS.filter(r => rankCounts[r]).map(r => {
            const rc = RANKS[r];
            const active = rankFilter === r;
            return (
              <button key={r} onClick={() => handleFilter(r)}
                style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontFamily: DS.mono, cursor: "pointer", border: `1px solid ${active ? rc.color : DS.border}`, background: active ? `${rc.color}15` : "none", color: active ? rc.color : DS.text5, display: "flex", alignItems: "center", gap: 4 }}>
                {rc.symbol} {rc.label} ({rankCounts[r]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {paginated.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: DS.text5, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Users size={32} />
          <span style={{ fontSize: 13 }}>Không tìm thấy nhân viên phù hợp</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 8 }}>
          {paginated.map(m => {
            const rc = RANKS[m.rank];
            const isHead = m.id === dept.headId;
            return (
              <motion.div
                key={m.id}
                whileHover={{ borderColor: `${rc.color}50`, x: 2 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12,
                  background: isHead ? `${DS.amber}06` : DS.bgCard2,
                  border: `1px solid ${isHead ? `${DS.amber}35` : DS.border}`,
                }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {isHead && <Crown size={10} style={{ position: "absolute", top: -4, right: -3, color: DS.amber, zIndex: 10 }} />}
                  <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", border: `2px solid ${isHead ? DS.amber : `${rc.color}80`}` }}>
                    <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: DS.text2, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                    {isHead && <span style={{ color: DS.amber, fontSize: 7, fontFamily: DS.mono, border: `1px solid ${DS.amber}30`, padding: "1px 4px", borderRadius: 3, background: `${DS.amber}10`, flexShrink: 0 }}>TRƯỞNG</span>}
                  </div>
                  <div style={{ color: DS.text5, fontSize: 10 }}>{m.role}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
                  <span style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>{rc.symbol} {rc.label}</span>
                  <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>Lv.{m.level}</span>
                  <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{(m.lpBalance / 1000).toFixed(1)}K LP</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DS.border}` }}>
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: "5px 12px", borderRadius: 8, background: "none", border: `1px solid ${DS.border}`, color: page === 1 ? DS.text5 : DS.text3, cursor: page === 1 ? "default" : "pointer", fontSize: 12 }}>
              ‹ Trước
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number | null;
              if (totalPages <= 7) pageNum = i + 1;
              else if (i === 0) pageNum = 1;
              else if (i === 6) pageNum = totalPages;
              else if (page <= 4) pageNum = i + 1;
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
              else {
                const offsets: (number | null)[] = [null, -2, -1, 0, 1, 2, null];
                const off = offsets[i];
                pageNum = off === null ? null : page + off;
              }
              if (pageNum === null) return <span key={i} style={{ color: DS.text5, fontSize: 11, padding: "0 4px" }}>…</span>;
              return (
                <button key={i} onClick={() => setPage(pageNum!)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: `1px solid ${page === pageNum ? dept.color : DS.border}`,
                    background: page === pageNum ? `${dept.color}15` : "none",
                    color: page === pageNum ? dept.color : DS.text4,
                    cursor: "pointer", fontSize: 11, fontFamily: DS.mono,
                  }}>
                  {pageNum}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: "5px 12px", borderRadius: 8, background: "none", border: `1px solid ${DS.border}`, color: page === totalPages ? DS.text5 : DS.text3, cursor: page === totalPages ? "default" : "pointer", fontSize: 12 }}>
              Sau ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────

function AssignModal({ dept, onClose, onSave }: { dept: DeptConfig; onClose: () => void; onSave: (ids: number[], headId: number) => void }) {
  const [selectedIds, setSelectedIds] = useState<number[]>(dept.memberIds);
  const [headId, setHeadId] = useState(dept.headId);
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState<RankKey | "all">("all");

  const toggleId = (id: number) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (!next.includes(headId) && next.length > 0) setHeadId(next[0] ?? id);
      return next;
    });
  };

  const filteredAll = useMemo(() => {
    let list = [...MOCK_MEMBERS];
    if (rankFilter !== "all") list = list.filter(m => m.rank === rankFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
    }
    return list.sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
  }, [rankFilter, search]);

  const selectAll = () => setSelectedIds(prev => {
    const toAdd = filteredAll.map(m => m.id).filter(id => !prev.includes(id));
    return [...prev, ...toAdd];
  });
  const deselectAll = () => setSelectedIds(prev => prev.filter(id => !filteredAll.some(m => m.id === id)));
  const allSelected = filteredAll.every(m => selectedIds.includes(m.id));

  const rankCounts: Partial<Record<RankKey, number>> = {};
  MOCK_MEMBERS.forEach(m => { rankCounts[m.rank] = (rankCounts[m.rank] ?? 0) + 1; });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.90)", backdropFilter: "blur(10px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${dept.color}30`, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── PHÂN CÔNG NHÂN SỰ</div>
            <div style={{ color: dept.color, fontSize: 15, fontWeight: 700, marginTop: 2 }}>{dept.name}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ padding: "4px 12px", borderRadius: 9999, background: `${dept.color}15`, border: `1px solid ${dept.color}30` }}>
              <span style={{ color: dept.color, fontFamily: DS.mono, fontSize: 12, fontWeight: 700 }}>{selectedIds.length} đã chọn</span>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Head selector */}
          <div>
            <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 8, letterSpacing: "0.12em" }}>
              TRƯỞNG PHÒNG (chọn từ danh sách đã chọn)
            </label>
            <select value={headId} onChange={e => setHeadId(Number(e.target.value))}
              style={{ width: "100%", background: DS.bgCard2, border: `1px solid ${dept.color}40`, borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none" }}>
              {selectedIds.map(id => {
                const m = MOCK_MEMBERS.find(x => x.id === id);
                if (!m) return null;
                const rc = RANKS[m.rank];
                return <option key={id} value={id}>{rc.symbol} {m.name} — {m.role} (Lv.{m.level})</option>;
              })}
            </select>
          </div>

          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <Search size={13} style={{ color: DS.text5 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Tìm trong ${MOCK_MEMBERS.length} thành viên...`}
              style={{ background: "none", border: "none", outline: "none", color: DS.text3, fontSize: 13, flex: 1 }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text5 }}><X size={12} /></button>}
          </div>

          {/* Rank filter */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <button onClick={() => setRankFilter("all")}
              style={{ padding: "2px 9px", borderRadius: 20, fontSize: 9, fontFamily: DS.mono, cursor: "pointer", border: `1px solid ${rankFilter === "all" ? dept.color : DS.border}`, background: rankFilter === "all" ? `${dept.color}15` : "none", color: rankFilter === "all" ? dept.color : DS.text5 }}>
              TẤT CẢ
            </button>
            {RANK_KEYS.filter(r => rankCounts[r]).map(r => {
              const rc = RANKS[r];
              const active = rankFilter === r;
              return (
                <button key={r} onClick={() => setRankFilter(active ? "all" : r)}
                  style={{ padding: "2px 9px", borderRadius: 20, fontSize: 9, fontFamily: DS.mono, cursor: "pointer", border: `1px solid ${active ? rc.color : DS.border}`, background: active ? `${rc.color}15` : "none", color: active ? rc.color : DS.text5 }}>
                  {rc.symbol} {rc.label}
                </button>
              );
            })}
          </div>

          {/* Bulk actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
              Hiển thị {filteredAll.length} / {MOCK_MEMBERS.length} thành viên
            </span>
            <button onClick={() => allSelected ? deselectAll() : selectAll()}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: allSelected ? DS.red : dept.color, fontSize: 11, fontFamily: DS.mono }}>
              {allSelected ? <Square size={13} /> : <CheckSquare size={13} />}
              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
          </div>

          {/* Member grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredAll.map(m => {
              const rc = RANKS[m.rank];
              const sel = selectedIds.includes(m.id);
              const isHead = headId === m.id;
              return (
                <div key={m.id} onClick={() => toggleId(m.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 12, cursor: "pointer",
                    background: sel ? `${rc.color}08` : "rgba(255,255,255,0.01)",
                    border: `1px solid ${sel ? `${rc.color}35` : DS.border}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", border: `2px solid ${rc.color}${sel ? "80" : "25"}`, flexShrink: 0 }}>
                    <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: sel ? DS.text : DS.text3, fontSize: 12, fontWeight: sel ? 600 : 400 }}>{m.name}</span>
                      {isHead && <Crown size={9} style={{ color: DS.amber, flexShrink: 0 }} />}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>{m.role}</div>
                  </div>
                  <div style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono, flexShrink: 0 }}>{rc.symbol} {rc.label}</div>
                  {/* Checkbox */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, border: `2px solid ${sel ? dept.color : DS.border}`,
                    background: sel ? dept.color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {sel && <div style={{ width: 8, height: 6, borderLeft: "2px solid #fff", borderBottom: "2px solid #fff", transform: "rotate(-45deg) translate(1px,-1px)" }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={() => { onSave(selectedIds, headId); onClose(); }}
            style={{
              flex: 2, background: selectedIds.length === 0 ? DS.bgCard2 : GRD.primary,
              color: selectedIds.length === 0 ? DS.text5 : "#fff",
              border: "none", borderRadius: 10, padding: "10px",
              cursor: selectedIds.length === 0 ? "default" : "pointer",
              fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            <Save size={14} /> Lưu phân công ({selectedIds.length})
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── DeptDetail ────────────────────────────────────────────────────────────────

function DeptDetail({ dept, onAssign }: { dept: DeptConfig; onAssign: () => void }) {
  const head = MOCK_MEMBERS.find(m => m.id === dept.headId);
  const headRank = head ? RANKS[head.rank] : null;
  const deptMembers = dept.memberIds.map(id => MOCK_MEMBERS.find(m => m.id === id)).filter(Boolean) as Member[];
  const avgLevel = deptMembers.length > 0 ? Math.round(deptMembers.reduce((s, m) => s + m.level, 0) / deptMembers.length) : 0;
  const totalLP = deptMembers.reduce((s, m) => s + m.lpEarned, 0);

  const rankDist = useMemo(() => {
    const dist: Partial<Record<RankKey, number>> = {};
    deptMembers.forEach(m => { dist[m.rank] = (dist[m.rank] ?? 0) + 1; });
    return dist;
  }, [deptMembers]);

  const maxRankCount = Math.max(...Object.values(rankDist).map(v => v ?? 0), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div style={{ background: DS.bgCard, border: `1px solid ${dept.color}30`, borderRadius: 16, padding: "1.25rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top right, ${dept.color}08, transparent 55%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `${dept.color}15`, border: `1px solid ${dept.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} style={{ color: dept.color }} />
            </div>
            <div>
              <div style={{ color: dept.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── PHÒNG BAN</div>
              <div style={{ color: DS.text, fontSize: 18, fontWeight: 700 }}>{dept.name}</div>
              <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{dept.description}</div>
            </div>
          </div>
          <button onClick={onAssign}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 12, background: `${dept.color}12`, border: `1px solid ${dept.color}30`, color: dept.color, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            <UserPlus size={13} /> Phân công
          </button>
        </div>
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}` }}>
          <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>SỨ MỆNH: </span>
          <span style={{ color: DS.text3, fontSize: 12, fontStyle: "italic" }}>{dept.mission}</span>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {dept.kpi.map(k => (
          <div key={k.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ color: k.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{k.value}</div>
            <div style={{ color: DS.text4, fontSize: 11, marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Org chart + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "1.25rem", flexWrap: "wrap" }}>
        {/* Org chart */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── SƠ ĐỒ TỔ CHỨC</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={11} style={{ color: DS.text5 }} />
              <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                {deptMembers.length <= 8 ? "Tree" : deptMembers.length <= 24 ? "Grid" : "Squads"} mode
              </span>
            </div>
          </div>
          <OrgChart dept={dept} />
        </div>

        {/* Stats sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Head info */}
          {head && headRank && (
            <div style={{ background: DS.bgCard, border: `1px solid ${DS.amber}25`, borderRadius: 16, padding: "1rem" }}>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 10 }}>TRƯỞNG PHÒNG</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: `2px solid ${DS.amber}`, boxShadow: `0 0 10px rgba(245,158,11,0.4)` }}>
                  <img src={head.img} alt={head.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <div style={{ color: DS.amber, fontSize: 13, fontWeight: 700 }}>{head.name}</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>{head.role}</div>
                  <div style={{ color: headRank.color, fontSize: 9, fontFamily: DS.mono }}>{headRank.symbol} {headRank.label} Lv.{head.level}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${DS.border}` }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ color: DS.amber, fontFamily: DS.heading, fontSize: 16, fontWeight: 700 }}>{head.missions}</div>
                  <div style={{ color: DS.text5, fontSize: 9 }}>Missions</div>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ color: DS.green, fontFamily: DS.heading, fontSize: 16, fontWeight: 700 }}>{(head.lpEarned / 1000).toFixed(0)}K</div>
                  <div style={{ color: DS.text5, fontSize: 9 }}>LP Earned</div>
                </div>
              </div>
            </div>
          )}

          {/* Team stats */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 10 }}>THỐNG KÊ PHÒNG</div>
            {[
              { label: "Tổng nhân sự", value: deptMembers.length, color: DS.text3 },
              { label: "Cấp độ trung bình", value: `Lv.${avgLevel}`, color: dept.color },
              { label: "Tổng LP đã kiếm", value: `${(totalLP / 1000).toFixed(0)}K`, color: DS.purple },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, paddingBottom: 8, borderBottom: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text4, fontSize: 12 }}>{s.label}</span>
                <span style={{ color: s.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Rank distribution */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 10 }}>PHÂN BỔ RANK</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RANK_KEYS.filter(r => rankDist[r]).map(r => {
                const rc = RANKS[r];
                const count = rankDist[r] ?? 0;
                const pct = (count / maxRankCount) * 100;
                return (
                  <div key={r} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: rc.color, fontSize: 8, fontFamily: DS.mono, width: 52, flexShrink: 0 }}>{rc.symbol} {rc.label}</span>
                    <div style={{ flex: 1, height: 5, background: DS.border, borderRadius: 99, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        style={{ height: "100%", background: rc.color, borderRadius: 3 }}
                      />
                    </div>
                    <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, width: 14, textAlign: "right", flexShrink: 0 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Member list */}
      <MemberList dept={dept} />
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<DeptConfig[]>(INIT_DEPTS);
  const [selectedId, setSelectedId] = useState("it");
  const [assignDept, setAssignDept] = useState<DeptConfig | null>(null);

  const selected = depts.find(d => d.id === selectedId) ?? depts[0];
  const totalMembers = [...new Set(depts.flatMap(d => d.memberIds))].length;
  const avgMembers = Math.round(depts.reduce((s, d) => s + d.memberIds.length, 0) / depts.length);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Phòng ban
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {depts.length} phòng ban · Cấu trúc RBAC · Sơ đồ tổ chức
          </p>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Tổng phòng ban", value: depts.length, color: DS.blue, icon: <Building2 size={18} /> },
          { label: "Tổng nhân sự", value: totalMembers, color: DS.green, icon: <Users size={18} /> },
          { label: "TB nhân sự/phòng", value: avgMembers, color: DS.amber, icon: <BarChart3 size={18} /> },
          { label: "Trưởng phòng", value: depts.length, color: DS.purple, icon: <Crown size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dept selector + detail */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem", alignItems: "start" }}>
        {/* Left: dept list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── PHÒNG BAN</div>
          </div>
          {depts.map(d => {
            const isSelected = selectedId === d.id;
            const head = MOCK_MEMBERS.find(m => m.id === d.headId);
            const headRank = head ? RANKS[head.rank] : null;
            return (
              <motion.div
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                whileHover={{ borderColor: `${d.color}35` }}
                style={{
                  padding: "1rem", borderRadius: 16, cursor: "pointer",
                  background: DS.bgCard,
                  border: `1px solid ${isSelected ? `${d.color}50` : DS.border}`,
                  boxShadow: isSelected ? `0 0 20px ${d.color}10` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${d.color}15`, border: `1px solid ${d.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Building2 size={18} style={{ color: d.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: d.color, fontSize: 13, fontWeight: 700 }}>{d.name}</div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{d.memberIds.length} nhân sự</div>
                  </div>
                  {isSelected && <ChevronRight size={14} style={{ color: d.color, flexShrink: 0 }} />}
                </div>

                {/* Avatar stack */}
                <div style={{ marginBottom: 8 }}>
                  <AvatarStack ids={d.memberIds.filter(id => id !== d.headId)} max={4} size={22} />
                </div>

                {head && headRank && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8, borderTop: `1px solid ${DS.border}` }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${headRank.color}40` }}>
                      <img src={head.img} alt={head.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <span style={{ color: DS.text5, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{head.name}</span>
                    <Crown size={9} style={{ color: DS.amber, flexShrink: 0 }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Right: detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {selected && <DeptDetail dept={selected} onAssign={() => setAssignDept(selected)} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Assign modal */}
      <AnimatePresence>
        {assignDept && (
          <AssignModal
            dept={assignDept}
            onClose={() => setAssignDept(null)}
            onSave={(ids, headId) => {
              setDepts(prev => prev.map(d => d.id === assignDept.id ? { ...d, memberIds: ids, headId } : d));
              setAssignDept(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
