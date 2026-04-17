"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DS } from "@/lib/design-tokens";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { X, Check, Loader2 } from "lucide-react";
import { RANKS, getRankFromLevel, type RankKey } from "@/lib/rank/ranks";
import type { MemberExt, MemberStatus } from "@/app/admin/members/types";
import { STATUS_CFG } from "@/app/admin/members/types";

// ── Types & Constants ────────────────────────────────────────────────────────
export type TabPerm = "view" | "edit" | "none";

const SYSTEM_ROLES = [
  { id: "member", label: "Member", symbol: "⬡", color: "#94A3B8", desc: "Nhân viên thường", icon: "◉" },
  { id: "hr", label: "HR", symbol: "◈", color: "#14B8A6", desc: "Nhân sự & Tuyển dụng", icon: "◔" },
  { id: "project_manager", label: "PM", symbol: "◕", color: "#EC4899", desc: "Quản trị dự án", icon: "◉" },
  { id: "admin", label: "Admin", symbol: "★", color: "#4F7DF3", desc: "Quản trị hệ thống", icon: "◔" },
] as const;

const TAB_GROUPS = [
  {
    label: "Quản lý nhân sự", icon: "◎", color: "#22C55E",
    tabs: [
      { id: "overview", label: "Tổng quan" },
      { id: "members", label: "Thành viên" },
      { id: "departments", label: "Phòng ban" },
      { id: "notification_center", label: "Thông báo" },
      { id: "quests_events", label: "Nhiệm vụ" },
    ],
  },
  {
    label: "Dự án & Kanban", icon: "◕", color: "#F59E0B",
    tabs: [
      { id: "projects", label: "Dự án" },
      { id: "kanban", label: "Kanban" },
      { id: "figma_demos", label: "Figma Demos" },
      { id: "leaderboard_admin", label: "Bảng xếp hạng" },
      { id: "analytics", label: "Phân tích" },
    ],
  },
  {
    label: "Kinh doanh", icon: "◈", color: "#EC4899",
    tabs: [
      { id: "orders", label: "Đơn hàng" },
      { id: "quotation", label: "Báo giá" },
      { id: "clients", label: "Khách hàng" },
      { id: "revenue", label: "Doanh thu" },
      { id: "services", label: "Dịch vụ" },
    ],
  },
  {
    label: "Marketing & Media", icon: "◇", color: "#8B5CF6",
    tabs: [
      { id: "media", label: "Media" },
      { id: "blog", label: "Blog" },
      { id: "portfolio", label: "Portfolio" },
      { id: "projects_completed", label: "Dự án hoàn tất" },
    ],
  },
  {
    label: "Tài chính & LP", icon: "◔", color: "#FFD700",
    tabs: [
      { id: "lp", label: "LP" },
      { id: "lp_manage", label: "Quản lý LP" },
      { id: "revenue_split", label: "Chia doanh thu" },
      { id: "off_system_payments", label: "Chi ngoài HT" },
      { id: "income_tax", label: "Thuế" },
    ],
  },
  {
    label: "Học vấn & Khác", icon: "◉", color: "#4F7DF3",
    tabs: [
      { id: "academy", label: "Học vấn" },
      { id: "web_packages", label: "Gói Web" },
      { id: "effects", label: "Hiệu ứng" },
      { id: "settings", label: "Cài đặt" },
    ],
  },
];

const ROLE_DEFAULT_TABS: Record<string, string[]> = {
  member: ["overview", "notification_center", "leaderboard_admin", "academy", "quests_events"],
  hr: ["overview", "members", "departments", "notification_center", "quests_events", "academy", "lp_manage"],
  project_manager: ["overview", "orders", "clients", "quotation", "services", "revenue", "projects", "members", "departments", "notification_center", "leaderboard_admin", "lp_manage", "quests_events", "academy", "blog", "lp", "portfolio", "projects_completed", "kanban", "figma_demos", "analytics"],
  admin: ["*"],
};

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs);

export function parseTabPerms(stored: string[]): Record<string, TabPerm> {
  const result: Record<string, TabPerm> = {};
  for (const t of stored) {
    if (t.endsWith(".view")) result[t.slice(0, -5)] = "view";
    else if (t.endsWith(".edit")) result[t.slice(0, -5)] = "edit";
    else result[t] = "edit";
  }
  return result;
}

export function serializeTabPerms(perms: Record<string, TabPerm>): string[] {
  return Object.entries(perms)
    .filter(([, v]) => v !== "none")
    .flatMap(([tab, v]) => v === "edit" ? [tab] : [`${tab}.view`]);
}

// ── Drawer Component ─────────────────────────────────────────────────────────────

export interface MemberFormDrawerProps {
  isOpen: boolean;
  isAdd: boolean;
  member: MemberExt | null;
  onClose: () => void;
  onSubmit: (body: Record<string, unknown>, isAdd: boolean, formMemberId?: string) => void;
  isMutating: boolean;
}

export function MemberFormDrawer({
  isOpen,
  isAdd,
  member,
  onClose,
  onSubmit,
  isMutating,
}: MemberFormDrawerProps) {
  const [tab, setTab] = useState<0 | 1 | 2 | 3>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [team, setTeam] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarPublicId, setAvatarPublicId] = useState("");
  const [bio, setBio] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [systemRole, setSystemRole] = useState<string>("member");
  const [tabPerms, setTabPerms] = useState<Record<string, TabPerm>>({});
  const [level, setLevel] = useState("1");
  const [currentXp, setCurrentXp] = useState("0");
  const [rankManuallySet, setRankManuallySet] = useState(false);
  const [rankKey, setRankKey] = useState<RankKey>("iron");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [status, setStatus] = useState<MemberStatus>("active");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      const src = member;
      setName(src?.name ?? "");
      setEmail(src?.email ?? "");
      setPhone(src?.phone ?? "");
      setTeam(src?.team ?? "");
      setAvatar(src?.avatar ?? "");
      setAvatarPublicId((src as unknown as Record<string, unknown>)?.imagePublicId as string ?? "");
      setBio(src?.bio ?? "");
      setRoleInput(src?.role ?? "");
      setSystemRole(src?.roles?.[0] ?? src?.systemRole ?? "member");
      setTabPerms(parseTabPerms(src?.tabPermissions ?? []));
      setLevel(String(src?.level ?? 1));
      setCurrentXp(String(src?.currentXp ?? 0));
      setRankKey(src ? getRankFromLevel(src.level ?? 1) : "iron");
      setSkills(src?.memberExpertise?.map((e) => e.name) ?? []);
      setStatus(src?.status ?? "active");
      setTab(0);
      setErrorMsg("");
      setRankManuallySet(false);
    }
  }, [isOpen, member, isAdd]);

  const TABS = [
    { id: 0, label: "Thông tin", symbol: "◉" },
    { id: 1, label: "Phân quyền", symbol: "★" },
    { id: 2, label: "Hạng & LP", symbol: "◕" },
    { id: 3, label: "Kỹ năng", symbol: "◈" },
  ] as const;

  const lvlNum = parseInt(level) || 1;
  const rankCfg = RANKS[rankKey];
  const sysRoleCfg = SYSTEM_ROLES.find((r) => r.id === systemRole) ?? SYSTEM_ROLES[0];

  const applyRolePreset = (roleId: string) => {
    setSystemRole(roleId);
    const defaults = ROLE_DEFAULT_TABS[roleId] ?? [];
    if (roleId === "admin") {
      const all: Record<string, TabPerm> = {};
      ALL_TABS.forEach((t) => { all[t.id] = "edit"; });
      setTabPerms(all);
    } else {
      const next: Record<string, TabPerm> = {};
      ALL_TABS.forEach((t) => {
        next[t.id] = defaults.includes(t.id) ? "edit" : "none";
      });
      setTabPerms(next);
    }
  };

  const cycleTab = (tabId: string) => {
    const cur = tabPerms[tabId] ?? "none";
    const next: Record<string, TabPerm> = { ...tabPerms };
    next[tabId] = cur === "none" ? "edit" : cur === "edit" ? "view" : "none";
    setTabPerms(next);
  };

  const handleSubmit = () => {
    setErrorMsg("");
    if (!name.trim() || !email.trim()) { 
      setErrorMsg("Vui lòng nhập tên và email"); 
      return; 
    }
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    const base: Record<string, unknown> = {
      name: name.trim(), email: email.trim(), role: roleInput.trim(),
      roles: [systemRole],
      tabPermissions: serializeTabPerms(tabPerms),
      slug,
      phone: phone.trim() || null, bio: bio.trim() || null,
      avatar: avatar.trim() || null,
      imagePublicId: avatarPublicId || null,
      department: team,
      isActive: status === "active",
      memberExpertise: skills.map((s) => ({ name: s })),
    };

    if (!isAdd && member) {
      const editBody: Record<string, unknown> = {
        ...base,
        ...(rankManuallySet ? {
          level: parseInt(level) || 1,
          currentXp: parseInt(currentXp) || 0,
          rank: rankKey,
          forceRank: true,
        } : {}),
      };
      onSubmit(editBody, false, member.id);
    } else {
      const createBody: Record<string, unknown> = {
        ...base,
        level: parseInt(level) || 1,
        currentXp: parseInt(currentXp) || 0,
      };
      onSubmit(createBody, true);
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const activeTabCount = Object.values(tabPerms).filter((v) => v !== "none").length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99990, display: "flex", justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              width: "100%", maxWidth: 640,
              background: DS.bg, borderLeft: `1px solid ${DS.border}`,
              height: "100vh", display: "flex", flexDirection: "column",
              position: "relative", zIndex: 99991,
              boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "20px 24px", borderBottom: `1px solid ${DS.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: DS.bgCard,
            }}>
              <div>
                <h2 style={{ fontFamily: DS.heading, fontSize: 18, color: DS.text, margin: 0 }}>
                  {isAdd ? "Thêm thành viên mới" : "Chỉnh sửa thành viên"}
                </h2>
                <div style={{ fontFamily: DS.mono, fontSize: 12, color: DS.text3, marginTop: 4 }}>
                  {isAdd ? "Thiết lập hồ sơ nhân sự" : name}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent", border: "none", color: DS.text3, cursor: "pointer",
                  padding: 8, display: "flex", alignItems: "center", borderRadius: "50%",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = DS.border)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div style={{ padding: "12px 24px", background: "rgba(220, 38, 38, 0.1)", color: "#EF4444", fontSize: 13, borderBottom: `1px solid rgba(220, 38, 38, 0.2)` }}>
                {errorMsg}
              </div>
            )}

            {/* Content Scrollable */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              
              {/* Main Tabs Navigation */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${DS.border}`, overflowX: "auto" }}>
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      flex: 1, minWidth: 100, padding: "10px 16px", borderRadius: 12,
                      border: `1px solid ${tab === t.id ? DS.blue : DS.border}`,
                      backgroundColor: tab === t.id ? DS.blue + "22" : "transparent",
                      color: tab === t.id ? DS.blue : DS.text2,
                      fontFamily: DS.mono, fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                      cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap"
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{t.symbol}</span> {t.label}
                  </button>
                ))}
              </div>

              {/* TABS CONTENT */}
              <div style={{ minHeight: "60vh" }}>
                
                {tab === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      <ImageUpload
                        value={avatar}
                        onChange={(url, pubId) => { setAvatar(url); setAvatarPublicId(pubId ?? ""); }}
                        label="Avatar nhân sự" folder="loop_avatars" aspectRatio="square"
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 12 }}>
                          {(["active", "inactive", "on-leave", "probation"] as MemberStatus[]).map((s) => (
                            <button
                              key={s} onClick={() => setStatus(s)}
                              style={{
                                flex: 1, padding: "8px", borderRadius: 8,
                                border: `1px solid ${status === s ? STATUS_CFG[s].color : DS.border}`,
                                backgroundColor: status === s ? STATUS_CFG[s].color + "22" : "transparent",
                                color: status === s ? STATUS_CFG[s].color : DS.text3,
                                fontFamily: DS.mono, fontSize: 11, cursor: "pointer",
                              }}
                            >
                              {STATUS_CFG[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, color: DS.text2, fontSize: 12, fontFamily: DS.mono }}>Họ tên *</label>
                        <input value={name} onChange={(e) => setName(e.target.value)}
                          style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: DS.text, outline: "none" }}
                          placeholder="Nguyễn Văn A" />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, color: DS.text2, fontSize: 12, fontFamily: DS.mono }}>Email *</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isAdd} type="email"
                          style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${DS.border}`, background: isAdd ? DS.bgCard : DS.border, color: isAdd ? DS.text : DS.text3, outline: "none" }}
                          placeholder="email@loops.vn" />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, color: DS.text2, fontSize: 12, fontFamily: DS.mono }}>Điện thoại</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)}
                          style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: DS.text, outline: "none" }}
                          placeholder="0912..." />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, color: DS.text2, fontSize: 12, fontFamily: DS.mono }}>Phòng ban</label>
                        <input value={team} onChange={(e) => setTeam(e.target.value)}
                          style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: DS.text, outline: "none" }}
                          placeholder="engineering, design..." />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", marginBottom: 6, color: DS.text2, fontSize: 12, fontFamily: DS.mono }}>Chức danh thực tế</label>
                        <input value={roleInput} onChange={(e) => setRoleInput(e.target.value)}
                          style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: DS.text, outline: "none" }}
                          placeholder="Ví dụ: Frontend Lead, QC Engineer..." />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ display: "block", marginBottom: 6, color: DS.text2, fontSize: 12, fontFamily: DS.mono }}>Tiểu sử / Ghi chú</label>
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                          style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: DS.text, outline: "none", minHeight: 80, resize: "vertical" }}
                          placeholder="Thông tin thêm về nhân sự..." />
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Role Selection */}
                    <div>
                      <h4 style={{ color: DS.text, fontSize: 14, marginBottom: 12 }}>Nhóm Quyền Hệ Thống</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {SYSTEM_ROLES.map((r) => (
                          <div
                            key={r.id} onClick={() => applyRolePreset(r.id)}
                            style={{
                              padding: "16px", borderRadius: 12, cursor: "pointer",
                              border: `1px solid ${systemRole === r.id ? r.color : DS.border}`,
                              backgroundColor: systemRole === r.id ? r.color + "11" : DS.bgCard,
                              display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s"
                            }}
                          >
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: r.color + "22", color: r.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                              {r.icon}
                            </div>
                            <div>
                              <div style={{ color: systemRole === r.id ? r.color : DS.text, fontWeight: 600, fontSize: 14 }}>{r.label}</div>
                              <div style={{ color: DS.text3, fontSize: 11, marginTop: 2 }}>{r.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <h4 style={{ color: DS.text, fontSize: 14, margin: 0 }}>Cấp quyền chi tiết Tab ({activeTabCount}/{ALL_TABS.length})</h4>
                      <div style={{ fontSize: 11, color: DS.text3 }}>Kích 1 lần: Xem · Kích 2 lần: Sửa</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {TAB_GROUPS.map((g) => (
                        <div key={g.label} style={{ background: DS.bgCard, borderRadius: 12, border: `1px solid ${DS.border}`, padding: 16 }}>
                          <div style={{ color: g.color, fontSize: 12, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                            <span>{g.icon}</span> {g.label}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {g.tabs.map((t) => {
                              const v = tabPerms[t.id] ?? "none";
                              const c = v === "none" ? DS.border : v === "view" ? DS.amber : DS.green;
                              return (
                                <button
                                  key={t.id} onClick={() => cycleTab(t.id)}
                                  style={{
                                    padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                                    border: `1px solid ${c}`, backgroundColor: v !== "none" ? c + "22" : "transparent",
                                    color: v === "none" ? DS.text3 : v === "view" ? DS.amber : DS.green,
                                    fontSize: 11, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 6,
                                  }}
                                >
                                  {v === "none" && <X size={10} />}
                                  {v === "view" && <span style={{ fontSize: 10 }}>👁</span>}
                                  {v === "edit" && <Check size={10} />}
                                  {t.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {tab === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ background: "rgba(236,72,153,0.05)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 12, padding: "16px", color: DS.pink, fontSize: 12, lineHeight: 1.5 }}>
                      ⚠  Hệ thống tự động tính Level và Rank dựa trên số dư LP. Nếu bạn thiết lập Rank tĩnh (thủ công) tại đây, nó sẽ ghi đè hệ thống tự động cho đến khi có giao dịch LP mới.
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, color: DS.text2, fontSize: 12 }}>Level hiện tại</label>
                      <input type="number" value={level} onChange={(e) => { setLevel(e.target.value); setRankManuallySet(true); }}
                        style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: DS.text, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 6, color: DS.text2, fontSize: 12 }}>XP Tích lũy</label>
                      <input type="number" value={currentXp} onChange={(e) => { setCurrentXp(e.target.value); setRankManuallySet(true); }}
                        style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: DS.text, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 12, color: DS.text2, fontSize: 12 }}>Hạng (Rank)</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {(Object.entries(RANKS) as [RankKey, { label: string, color: string, symbol: string }][]).map(([k, cfg]) => (
                          <div
                            key={k} onClick={() => { setRankKey(k); setRankManuallySet(true); }}
                            style={{
                              padding: "12px", borderRadius: 8, cursor: "pointer",
                              border: `1px solid ${rankKey === k ? cfg.color : DS.border}`,
                              backgroundColor: rankKey === k ? cfg.color + "11" : DS.bgCard,
                              display: "flex", alignItems: "center", gap: 8,
                            }}
                          >
                            <span style={{ fontSize: 16 }}>{cfg.symbol}</span>
                            <span style={{ color: rankKey === k ? cfg.color : DS.text3, fontSize: 13, fontFamily: DS.mono }}>{cfg.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                     <div>
                      <label style={{ display: "block", marginBottom: 6, color: DS.text2, fontSize: 12, fontFamily: DS.mono }}>Danh sách thẻ Kỹ năng</label>
                      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <input
                          value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && skillInput.trim()) {
                              e.preventDefault();
                              if (!skills.includes(skillInput.trim())) setSkills([...skills, skillInput.trim()]);
                              setSkillInput("");
                            }
                          }}
                          placeholder="Ví dụ: ReactJS, Figma, SEO..."
                          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.bgCard, color: DS.text, outline: "none" }}
                        />
                        <button
                          onClick={() => {
                            if (skillInput.trim() && !skills.includes(skillInput.trim())) setSkills([...skills, skillInput.trim()]);
                            setSkillInput("");
                          }}
                          style={{ padding: "0 16px", borderRadius: 8, background: DS.blue, color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
                        >
                          Thêm
                        </button>
                      </div>
                      
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "16px", background: DS.bgCard, borderRadius: 12, border: `1px solid ${DS.border}`, minHeight: 100 }}>
                        {skills.length === 0 && <div style={{ color: DS.text4, fontSize: 12, margin: "auto" }}>Chưa có kỹ năng nào</div>}
                        {skills.map((s) => (
                          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: DS.blue + "22", border: `1px solid ${DS.blue}55`, color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>
                            {s}
                            <button onClick={() => setSkills(skills.filter((x) => x !== s))} style={{ background: "transparent", border: "none", color: DS.blue, cursor: "pointer", padding: 0, display: "flex" }}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "20px 24px", borderTop: `1px solid ${DS.border}`,
              display: "flex", justifyContent: "flex-end", gap: 12,
              background: DS.bgCard,
            }}>
              <button
                onClick={onClose}
                disabled={isMutating}
                style={{
                  padding: "12px 24px", borderRadius: 8, border: "none",
                  backgroundColor: "transparent", color: DS.text3,
                  fontFamily: DS.heading, fontSize: 14, cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isMutating}
                style={{
                  padding: "12px 24px", borderRadius: 8, border: "none",
                  backgroundColor: DS.blue, color: "#fff",
                  fontFamily: DS.heading, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  boxShadow: `0 4px 12px ${DS.blue}44`
                }}
              >
                {isMutating && <Loader2 size={16} className="animate-spin" />}
                {isAdd ? "Tạo nhân viên" : "Lưu thay đổi"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
