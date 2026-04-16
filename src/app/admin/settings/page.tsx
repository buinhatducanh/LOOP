"use client";

/**
 * Settings Admin Page — LOOP Solutions
 * Route: /admin/settings
 * Wire: /api/admin/settings + /api/admin/settings/locales + /api/admin/team/members/me
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PaymentSettingsSection } from "./PaymentSettingsSection";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { useAuthStore } from "@/app/store/authStore";
import {
  Settings, RefreshCw, Check, Shield, Globe, Bell, Database,
  Languages, User, Save, Loader2, CheckCircle2, CreditCard,
} from "lucide-react";

type Setting = {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
};

type Locale = {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isEnabled: boolean;
  isDefault: boolean;
  order: number;
};

type MemberProfile = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
  github?: string | null;
  website?: string | null;
  department?: string;
  role?: string;
  rank?: string;
  level?: number;
  joinedDate?: string;
  memberExpertise?: { expertise: { name: string }; level: number }[];
};

type MyAccountForm = {
  name: string;
  avatar: string;
  phone: string;
  bio: string;
  location: string;
  facebook: string;
  linkedin: string;
  github: string;
  website: string;
};

const SETTING_SECTIONS = [
  { key: "my-account",   label: "My Account",  icon: <User size={14} /> },
  { key: "general",      label: "General",       icon: <Globe size={14} /> },
  { key: "locales",      label: "Locales",      icon: <Languages size={14} /> },
  { key: "notifications",label: "Notifications",icon: <Bell size={14} /> },
  { key: "security",     label: "Security",     icon: <Shield size={14} /> },
  { key: "system",       label: "System",       icon: <Database size={14} /> },
 { key: "payments", label: "Thanh Toán", icon: <CreditCard size={14} /> },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
        background: checked ? DS.green : DS.border,
        transition: "background 0.2s",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

function LocaleRow({ locale, onToggle, onSetDefault, saving }: {
  locale: Locale;
  onToggle: (code: string, enabled: boolean) => void;
  onSetDefault: (code: string) => void;
  saving?: boolean;
}) {
  const { t } = useAdminTranslations();
  return (
    <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{locale.code === "vi" ? "🇻🇳" : locale.code === "en" ? "🇬🇧" : locale.code === "ja" ? "🇯🇵" : locale.code === "ko" ? "🇰🇷" : "🇨🇳"}</span>
          <div>
            <div style={{ color: DS.text, fontSize: 13, fontWeight: 500 }}>{locale.name}</div>
            <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>{locale.nativeName}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text5, background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 6, padding: "2px 8px", display: "inline-block" }}>
          {locale.code}
        </div>
      </td>
      <td style={{ padding: "10px 12px" }}>
        {locale.isDefault ? (
          <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.green, background: "rgba(34,197,94,0.1)", border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 6, padding: "2px 8px" }}>
            {t("settings.default")}
          </span>
        ) : (
          <button
            onClick={() => onSetDefault(locale.code)}
            disabled={saving}
            style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text5, background: "transparent", border: `1px solid ${DS.border}`, borderRadius: 6, padding: "2px 8px", cursor: saving ? "not-allowed" : "pointer" }}
          >
            {t("settings.setDefault")}
          </button>
        )}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <Toggle checked={locale.isEnabled} onChange={(v) => onToggle(locale.code, v)} />
      </td>
    </tr>
  );
}

function LocaleManagement() {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: Locale[] }>({
    queryKey: ["admin", "settings", "locales"],
    queryFn: () => adminApi.get("/api/admin/settings/locales"),
  });

  const seedMutation = useMutation({
    mutationFn: () => adminApi.post("/api/admin/settings/locales/seed", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings", "locales"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Seed failed"); },
  });

  const locales: Locale[] = data?.data ?? [];

  const toggleLocale = (code: string, enabled: boolean) => {
    const updated = locales.map(l => l.code === code ? { ...l, isEnabled: enabled } : l);
    qc.setQueryData(["admin", "settings", "locales"], { data: updated });
    // Optimistic update + API call
    adminApi.post("/api/admin/settings/locales", { locales: updated }).then(() =>
      qc.invalidateQueries({ queryKey: ["admin", "settings", "locales"] })
    );
  };

  const setDefault = (code: string) => {
    const updated = locales.map(l => ({ ...l, isDefault: l.code === code }));
    qc.setQueryData(["admin", "settings", "locales"], { data: updated });
    adminApi.post("/api/admin/settings/locales", { locales: updated }).then(() =>
      qc.invalidateQueries({ queryKey: ["admin", "settings", "locales"] })
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div style={{ color: DS.text2, fontSize: 13, fontWeight: 500 }}>{t("settings.localesTitle")}</div>
          <div style={{ color: DS.text5, fontSize: 11, marginTop: 2 }}>{t("settings.localesDesc")}</div>
        </div>
        <button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          style={{ padding: "6px 12px", background: seedMutation.isPending ? DS.text4 : "rgba(59,130,246,0.1)", border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 8, color: seedMutation.isPending ? DS.text4 : DS.blue, cursor: seedMutation.isPending ? "not-allowed" : "pointer", fontSize: 11, fontFamily: DS.mono }}
        >
          {seedMutation.isPending ? t("common.loading") : t("settings.seedLocales")}
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : locales.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: DS.text4, fontSize: 13 }}>
          <Languages size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>{t("settings.noLocales")}</div>
          <div style={{ fontSize: 11, color: DS.text5, marginTop: 4 }}>{t("settings.seedHint")}</div>
        </div>
      ) : (
        <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${DS.border}`, background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>LANGUAGE</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>CODE</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>DEFAULT</th>
                <th style={{ padding: "8px 12px", textAlign: "center", color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>ENABLED</th>
              </tr>
            </thead>
            <tbody>
              {locales.map(l => (
                <LocaleRow
                  key={l.id}
                  locale={l}
                  onToggle={toggleLocale}
                  onSetDefault={setDefault}
                  saving={seedMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingRow({ setting, onSave, saving }: { setting: Setting; onSave: (key: string, value: string) => void; saving?: boolean }) {
  const { t } = useAdminTranslations();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(setting.value);

  const handleSave = () => {
    onSave(setting.key, value);
    setEditing(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${DS.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: DS.text, fontSize: 13, fontWeight: 500 }}>{setting.key}</div>
        {setting.description && (
          <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{setting.description}</div>
        )}
      </div>
      {editing ? (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            style={{ background: DS.bg, border: `1px solid ${DS.blue}60`, borderRadius: 8, padding: "4px 10px", color: DS.text, fontSize: 12, fontFamily: DS.mono, outline: "none", width: 200 }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "4px 10px", background: saving ? DS.text4 : "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 8, color: saving ? DS.text4 : DS.green, cursor: saving ? "not-allowed" : "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}
          >
            <Check size={11} /> {t("common.save")}
          </button>
          <button
            onClick={() => { setValue(setting.value); setEditing(false); }}
            style={{ padding: "4px 8px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text4, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}
          >
            {t("common.cancel")}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{ padding: "4px 10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: DS.blue, cursor: "pointer", fontSize: 11, fontFamily: DS.mono }}
        >
          {t("common.edit")}
        </button>
      )}
    </div>
  );
}

const ALL_ADMIN_TABS = [
 { id: "overview", group: "core", label: "Tổng quan" },
 { id: "orders", group: "core", label: "Đơn hàng" },
 { id: "members", group: "core", label: "Nhân sự" },
 { id: "departments", group: "core", label: "Phòng ban" },
 { id: "projects", group: "project", label: "Dự án" },
 { id: "services", group: "project", label: "Dịch vụ" },
 { id: "quotation", group: "project", label: "Báo giá" },
 { id: "portfolio", group: "project", label: "Portfolio" },
 { id: "projects_completed", group: "project", label: "Dự án hoàn thành" },
 { id: "academy", group: "edu", label: "Học viện" },
 { id: "blog", group: "edu", label: "Blog" },
 { id: "media", group: "edu", label: "Media" },
 { id: "revenue", group: "finance", label: "Doanh thu" },
 { id: "clients", group: "finance", label: "Khách hàng" },
 { id: "lp", group: "finance", label: "LP" },
 { id: "lp_manage", group: "finance", label: "Quản lý LP" },
 { id: "income_tax", group: "finance", label: "Thuế" },
 { id: "web_packages", group: "finance", label: "Gói Web" },
 { id: "effects", group: "system", label: "Hiệu ứng" },
 { id: "notification_center", group: "system", label: "Thông báo" },
 { id: "settings", group: "system", label: "Cài đặt" },
 { id: "quests_events", group: "system", label: "Quest & Events" },
 { id: "leaderboard_admin", group: "system", label: "Bảng xếp hạng" },
 { id: "analytics", group: "system", label: "Phân tích" },
 { id: "figma_demos", group: "system", label: "Figma Demos" },
 { id: "kanban", group: "system", label: "Kanban" },
 { id: "revenue_split", group: "finance", label: "Chia doanh thu" },
 { id: "off_system_payments", group: "finance", label: "Chi phí ngoài" },
];

const TAB_GROUPS: Record<string, string> = {
 core: "Core", project: "Dự án", edu: "Giáo dục", finance: "Tài chính", system: "Hệ thống",
};

const DEPARTMENTS = [
 { key: "engineering", label: "Kỹ thuật" },
 { key: "design", label: "Thiết kế" },
 { key: "media", label: "Media" },
 { key: "marketing", label: "Marketing" },
 { key: "sales", label: "Kinh doanh" },
 { key: "finance", label: "Tài chính" },
 { key: "hr", label: "Nhân sự" },
 { key: "management", label: "Quản lý" },
];

const SYSTEM_ROLES = [
 { key: "member", label: "Member", level: 6 },
 { key: "qa", label: "QA", level: 5 },
 { key: "media", label: "Media", level: 4 },
 { key: "project_manager", label: "PM", level: 3 },
 { key: "hr", label: "HR", level: 2 },
 { key: "admin", label: "Admin", level: 1 },
 { key: "super_admin", label: "Super Admin", level: 0 },
 { key: "ceo", label: "CEO", level: -1 },
];

type MemberPerm = {
 memberId: string;
 name: string;
 role: string;
 roleLevel: number;
 departmentId: string | null;
 isDeptHead: boolean;
 tabPermissions: string[];
};

type MemberRow = {
 id: string;
 name: string;
 role: string;
 roleLevel: number;
 departmentId: string | null;
 isDeptHead: boolean;
 tabPermissions: string[];
 avatar?: string | null;
};

function PermissionsManagement() {
 const { t } = useAdminTranslations();
 const qc = useQueryClient();
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [search, setSearch] = useState("");
 const [saving, setSaving] = useState(false);
 const [success, setSuccess] = useState(false);
 const [error, setError] = useState("");

 const { data: membersData, isLoading: membersLoading } = useQuery<{ data: MemberRow[]; pagination: unknown }>({
 queryKey: ["admin", "permissions", "members"],
 queryFn: () => adminApi.get("/api/admin/team?limit=100"),
 });

 const { data: permData, isLoading: permLoading } = useQuery<{ data: MemberPerm }>({
 queryKey: ["admin", "permissions", "member", selectedId],
 queryFn: () => adminApi.get("/api/admin/permissions?memberId=" + selectedId),
 enabled: !!selectedId,
 });

 const members: MemberRow[] = membersData?.data ?? [];
 const perm: MemberPerm | undefined = permData?.data;

 const filtered = members.filter(m =>
 !search || (m.name ?? "").toLowerCase().includes(search.toLowerCase()) || (m.role ?? "").toLowerCase().includes(search.toLowerCase())
 );

 const [localPerms, setLocalPerms] = useState<string[]>([]);
 const [localDept, setLocalDept] = useState<string | null>(null);
 const [localDeptHead, setLocalDeptHead] = useState(false);
 const [localRole, setLocalRole] = useState("member");

 useEffect(() => {
 if (perm) {
 setLocalPerms(perm.tabPermissions ?? []);
 setLocalDept(perm.departmentId ?? null);
 setLocalDeptHead(perm.isDeptHead ?? false);
 setLocalRole(perm.role ?? "member");
 }
 }, [perm]);

 const toggleTab = (tabId: string) => {
 setLocalPerms(prev => prev.includes(tabId) ? prev.filter(t => t !== tabId) : [...prev, tabId]);
 };

 const toggleAll = () => {
 if (localPerms.length === ALL_ADMIN_TABS.length) {
 setLocalPerms([]);
 } else {
 setLocalPerms(ALL_ADMIN_TABS.map(t => t.id));
 }
 };

 const handleSave = async () => {
 if (!selectedId) return;
 setSaving(true);
 setError("");
 try {
 await adminApi.put("/api/admin/permissions/" + selectedId, {
 tabPermissions: localPerms,
 departmentId: localDept,
 isDeptHead: localDeptHead,
 systemRole: localRole,
 });
 setSuccess(true);
 qc.invalidateQueries({ queryKey: ["admin", "permissions", "member", selectedId] });
 qc.invalidateQueries({ queryKey: ["admin", "permissions", "members"] });
 setTimeout(() => setSuccess(false), 3000);
 } catch (err: unknown) {
 setError(err instanceof Error ? err.message : "Lưu thất bại");
 } finally {
 setSaving(false);
 }
 };

 const hasChanges = perm && (
 JSON.stringify([...localPerms].sort()) !== JSON.stringify([...(perm.tabPermissions ?? [])].sort()) ||
 localDept !== (perm.departmentId ?? null) ||
 localDeptHead !== (perm.isDeptHead ?? false) ||
 localRole !== (perm.role ?? "member")
 );

 return (
 <div>
 {/* Header */}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
 <div>
 <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
 Phân quyền Admin
 </div>
 <div style={{ color: DS.text4, fontSize: 11 }}>
 Chọn nhân viên bên trái để gán tab permissions
 </div>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 {success && (
 <motion.div
 initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
 style={{ display: "flex", alignItems: "center", gap: 4, color: DS.green, fontSize: 12, fontFamily: DS.mono }}
 >
 <CheckCircle2 size={13} /> Đã lưu
 </motion.div>
 )}
 <button
 onClick={handleSave}
 disabled={saving || !hasChanges}
 style={{
 display: "flex", alignItems: "center", gap: 6,
 padding: "6px 14px",
 background: saving || !hasChanges ? DS.text4 : DS.green,
 border: "none", borderRadius: 8, color: "#fff",
 fontSize: 12, fontWeight: 600, cursor: saving || !hasChanges ? "not-allowed" : "pointer",
 opacity: saving || !hasChanges ? 0.5 : 1,
 }}
 >
 {saving ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Đang lưu...</> : <><Save size={12} /> Lưu thay đổi</>}
 </button>
 </div>
 </div>

 {/* Two-column layout */}
 <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1rem" }}>
 {/* Member list */}
 <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, overflow: "hidden" }}>
 <div style={{ padding: "10px 12px", borderBottom: `1px solid ${DS.border}`, background: "rgba(255,255,255,0.02)" }}>
 <input
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Tìm tên hoặc role..."
 style={{
 width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`,
 borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none",
 }}
 />
 </div>
 <div style={{ maxHeight: 500, overflowY: "auto" }}>
 {membersLoading ? (
 <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
 <div style={{ width: 20, height: 20, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
 </div>
 ) : filtered.length === 0 ? (
 <div style={{ textAlign: "center", padding: "1.5rem", color: DS.text4, fontSize: 12 }}>Không tìm thấy</div>
 ) : filtered.map(m => {
 const isActive = selectedId === m.id;
 return (
 <button
 key={m.id}
 onClick={() => { setSelectedId(m.id); setError(""); setSuccess(false); }}
 style={{
 width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
 background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
 border: "none", borderBottom: `1px solid ${DS.border}`,
 borderLeft: isActive ? `2px solid ${DS.blue}` : "2px solid transparent",
 cursor: "pointer", textAlign: "left",
 }}
 >
 <div style={{
 width: 32, height: 32, borderRadius: "50%",
 background: isActive ? DS.blue : DS.bgCard,
 border: `1px solid ${isActive ? DS.blue : DS.border}`,
 display: "flex", alignItems: "center", justifyContent: "center",
 fontSize: 12, fontWeight: 700, color: isActive ? "#fff" : DS.text3, flexShrink: 0,
 overflow: "hidden",
 }}>
 {m.avatar ? <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (m.name?.charAt(0)?.toUpperCase() ?? "?")}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ color: isActive ? DS.blue : DS.text2, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
 {m.name ?? "—"}
 </div>
 <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
 {m.role ?? "member"}
 </div>
 </div>
 {m.isDeptHead && <span style={{ fontSize: 14 }}>👑</span>}
 </button>
 );
 })}
 </div>
 </div>

 {/* Permission editor */}
 {selectedId ? (
 permLoading ? (
 <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 48 }}>
 <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
 </div>
 ) : perm ? (
 <div>
 {/* Member info banner */}
 <div style={{
 display: "flex", alignItems: "center", gap: 12, padding: "0.875rem",
 background: "rgba(59,130,246,0.06)", border: `1px solid rgba(59,130,246,0.15)`,
 borderRadius: 10, marginBottom: "1rem",
 }}>
 <div style={{
 width: 44, height: 44, borderRadius: "50%",
 background: DS.blue, border: `2px solid ${DS.blue}60`,
 display: "flex", alignItems: "center", justifyContent: "center",
 fontSize: 16, fontWeight: 800, color: "#fff",
 overflow: "hidden", flexShrink: 0,
 }}>
 {perm.name?.charAt(0)?.toUpperCase() ?? "?"}
 </div>
 <div>
 <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{perm.name}</div>
 <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
 <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.blue, background: "rgba(59,130,246,0.1)", border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 6, padding: "1px 8px" }}>
 {perm.role ?? "member"}
 </span>
 {perm.isDeptHead && (
 <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.amber, background: "rgba(234,179,8,0.1)", border: `1px solid rgba(234,179,8,0.2)`, borderRadius: 6, padding: "1px 8px" }}>
 👑 Trưởng phòng
 </span>
 )}
 </div>
 </div>
 </div>

 {/* System Role */}
 <div style={{ marginBottom: "1rem" }}>
 <label style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
 SYSTEM ROLE
 </label>
 <select
 value={localRole}
 onChange={e => setLocalRole(e.target.value)}
 style={{
 width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
 borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none",
 cursor: "pointer",
 }}
 >
 {SYSTEM_ROLES.map(r => (
 <option key={r.key} value={r.key}>{r.label} (level {r.level})</option>
 ))}
 </select>
 </div>

 {/* Department */}
 <div style={{ marginBottom: "1rem" }}>
 <label style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
 PHÒNG BAN
 </label>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {DEPARTMENTS.map(d => (
 <button
 key={d.key}
 onClick={() => setLocalDept(localDept === d.key ? null : d.key)}
 style={{
 padding: "4px 10px", fontSize: 11, fontFamily: DS.mono,
 background: localDept === d.key ? "rgba(59,130,246,0.15)" : DS.bg,
 border: `1px solid ${localDept === d.key ? DS.blue : DS.border}`,
 borderRadius: 6, color: localDept === d.key ? DS.blue : DS.text3,
 cursor: "pointer",
 }}
 >
 {d.label}
 </button>
 ))}
 </div>
 </div>

 {/* Dept Head toggle */}
 <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
 <Toggle checked={localDeptHead} onChange={v => setLocalDeptHead(v)} />
 <span style={{ color: DS.text2, fontSize: 13 }}>Trưởng phòng</span>
 </div>

 {/* Tab permissions */}
 <div>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
 <label style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>
 TAB PERMISSIONS
 </label>
 <button
 onClick={toggleAll}
 style={{
 fontSize: 10, fontFamily: DS.mono, color: DS.blue,
 background: "transparent", border: "none", cursor: "pointer",
 }}
 >
 {localPerms.length === ALL_ADMIN_TABS.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
 </button>
 </div>

 {Object.entries(TAB_GROUPS).map(([group, groupLabel]) => {
 const tabs = ALL_ADMIN_TABS.filter(t => t.group === group);
 return (
 <div key={group} style={{ marginBottom: "0.875rem" }}>
 <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.05em", marginBottom: "0.375rem", paddingLeft: 2 }}>
 {groupLabel}
 </div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {tabs.map(tab => {
 const checked = localPerms.includes(tab.id);
 return (
 <button
 key={tab.id}
 onClick={() => toggleTab(tab.id)}
 style={{
 padding: "4px 10px", fontSize: 11, fontFamily: DS.mono,
 background: checked ? "rgba(59,130,246,0.15)" : DS.bg,
 border: `1px solid ${checked ? DS.blue : DS.border}`,
 borderRadius: 6, color: checked ? DS.blue : DS.text3,
 cursor: "pointer",
 transition: "all 0.15s",
 }}
 >
 {checked && "✓ "}
 {tab.label}
 </button>
 );
 })}
 </div>
 </div>
 );
 })}

 <div style={{ color: DS.text4, fontSize: 11, marginTop: "0.5rem" }}>
 {localPerms.length} / {ALL_ADMIN_TABS.length} tabs được phép
 </div>
 </div>

 {error && (
 <div style={{ marginTop: "0.875rem", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem" }}>
 {error}
 </div>
 )}
 </div>
 ) : (
 <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 48, color: DS.text4, fontSize: 13 }}>
 Không tìm thấy thông tin
 </div>
 )
 ) : (
 <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 64, gap: 12, background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10 }}>
 <Shield size={40} style={{ color: DS.text4, opacity: 0.4 }} />
 <div style={{ color: DS.text4, fontSize: 13, textAlign: "center" }}>
 Chọn một nhân viên để gán phân quyền
 </div>
 </div>
 )}
 </div>
 </div>
 );
}


export default function SettingsPage() {
  const { t } = useAdminTranslations();
  const [section, setSection] = useState("general");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminApi.get<{ data: Setting[] }>("/api/admin/settings"),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await adminApi.put(`/api/admin/settings/${key}`, { value });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Lưu thất bại"); },
  });

  const settings = data?.data ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            {t("settings.title")}
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {settings.length} {t("settings.settingCount")}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["admin", "settings"] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
        >
          <RefreshCw size={13} /> {t("common.refresh")}
        </button>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.5rem" }}>
        {/* Section nav */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "0.5rem" }}>
          {SETTING_SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: section === s.key ? "rgba(59,130,246,0.1)" : "transparent",
                border: section === s.key ? `1px solid rgba(59,130,246,0.3)"` : "1px solid transparent",
                color: section === s.key ? DS.blue : DS.text3,
                fontSize: 13,
                fontFamily: DS.mono,
                cursor: "pointer",
                textAlign: "left",
                marginBottom: 2,
              }}
            >
              <span style={{ opacity: section === s.key ? 1 : 0.6 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Settings list */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          {section === "my-account" ? (
            <MyAccountSection />
          ) : section === "locales" ? (
            <LocaleManagement />
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                <Settings size={14} style={{ color: DS.blue }} />
                <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: 0, textTransform: "capitalize" }}>{section}</h3>
              </div>

              {isLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                  <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : settings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: DS.text4, fontSize: 13 }}>
                  <Settings size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div>{t("settings.empty")}</div>
                </div>
              ) : (
                settings
                  .filter(s => s.key.startsWith(section))
                  .map(s => <SettingRow key={s.id} setting={s} saving={saveMutation.isPending} onSave={(key, value) => saveMutation.mutate({ key, value })} />)
              )}

              {section === "payments" && (
 <PaymentSettingsSection />
 )}
 {!isLoading && settings.filter(s => s.key.startsWith(section)).length === 0 && settings.length > 0 && (
                <div>
                  {settings.map(s => <SettingRow key={s.id} setting={s} saving={saveMutation.isPending} onSave={(key, value) => saveMutation.mutate({ key, value })} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── My Account Section ─────────────────────────────────────────────────────────

function MyAccountSection() {
  const _t = useAdminTranslations();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: MemberProfile }>({
    queryKey: ["admin", "my-account"],
    queryFn: () => adminApi.get("/api/admin/team/members/me"),
    enabled: !!user?.teamMemberId,
  });

  const [form, setForm] = useState<MyAccountForm>({
    name: "",
    avatar: "",
    phone: "",
    bio: "",
    location: "",
    facebook: "",
    linkedin: "",
    github: "",
    website: "",
  });
  const [originalForm, setOriginalForm] = useState<MyAccountForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Populate form when profile loads
  useEffect(() => {
    if (data?.data) {
      const p = data.data;
      const f: MyAccountForm = {
        name: p.name ?? "",
        avatar: p.avatar ?? "",
        phone: p.phone ?? "",
        bio: p.bio ?? "",
        location: p.location ?? "",
        facebook: p.facebook ?? "",
        linkedin: p.linkedin ?? "",
        github: p.github ?? "",
        website: p.website ?? "",
      };
      setForm(f);
      setOriginalForm(f);
    }
  }, [data]);

  const hasChanges = originalForm !== null && JSON.stringify(form) !== JSON.stringify(originalForm);

  const updateField = (field: keyof MyAccountForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError("");

    try {
      await adminApi.put("/api/admin/team/members/me", form);
      setSuccess(true);
      setOriginalForm(form);
      qc.invalidateQueries({ queryKey: ["admin", "my-account"] });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (!user?.teamMemberId) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 0", color: DS.text4 }}>
        <User size={40} style={{ marginBottom: "1rem", opacity: 0.4 }} />
        <div style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>Tài khoản chưa được liên kết với hồ sơ nhân viên</div>
        <div style={{ fontSize: "0.75rem", color: DS.text5 }}>Vui lòng liên hệ HR để được hỗ trợ.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const profile = data?.data;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <User size={14} color={DS.blue} />
          <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: 0 }}>Hồ sơ cá nhân</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {success && (
            <motion.div
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 4, color: DS.green, fontSize: 12, fontFamily: DS.mono }}
            >
              <CheckCircle2 size={13} /> Đã lưu
            </motion.div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px",
              background: saving || !hasChanges ? DS.text4 : DS.green,
              border: "none", borderRadius: 8, color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: saving || !hasChanges ? "not-allowed" : "pointer",
              opacity: saving || !hasChanges ? 0.5 : 1,
            }}
          >
            {saving ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Đang lưu...</> : <><Save size={12} /> Lưu thay đổi</>}
          </button>
        </div>
      </div>

      {/* Profile Banner */}
      {profile && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "1rem", borderRadius: 12,
          background: "rgba(59,130,246,0.06)", border: `1px solid rgba(59,130,246,0.15)`,
          marginBottom: "1.25rem",
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: "rgba(59,130,246,0.15)",
            border: `2px solid rgba(59,130,246,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, fontFamily: DS.heading, color: DS.blue,
            overflow: "hidden", flexShrink: 0,
          }}>
            {form.avatar ? (
              <img src={form.avatar} alt={form.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              form.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DS.text, marginBottom: "0.25rem" }}>{profile.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {profile.role && (
                <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.blue, background: "rgba(59,130,246,0.1)", border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 6, padding: "1px 8px" }}>
                  {profile.role}
                </span>
              )}
              {profile.rank && (
                <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.amber, background: "rgba(245,158,11,0.1)", border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 6, padding: "1px 8px" }}>
                  {profile.rank}
                </span>
              )}
              {profile.department && (
                <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text5, background: "rgba(255,255,255,0.04)", border: `1px solid ${DS.border}`, borderRadius: 6, padding: "1px 8px" }}>
                  {profile.department}
                </span>
              )}
              {profile.level && (
                <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text5 }}>
                  Level {profile.level}
                </span>
              )}
            </div>
            {profile.memberExpertise && profile.memberExpertise.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: "0.375rem", flexWrap: "wrap" }}>
                {profile.memberExpertise.slice(0, 4).map((exp, i) => (
                  <span key={i} style={{ fontSize: 10, color: DS.text4, fontFamily: DS.mono }}>
                    {exp.expertise.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 1.5rem" }}>
        {/* Avatar URL */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: "0.375rem" }}>AVATAR URL</label>
          <input
            value={form.avatar}
            onChange={(e) => updateField("avatar", e.target.value)}
            placeholder="https://..."
            style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none" }}
          />
        </div>

        {/* Name */}
        <div>
          <label style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: "0.375rem" }}>TÊN HIỂN THỊ</label>
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Nguyễn Văn A"
            style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none" }}
          />
        </div>

        {/* Phone */}
        <div>
          <label style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: "0.375rem" }}>SỐ ĐIỆN THOẠI</label>
          <input
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="0909 xxx xxx"
            style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none" }}
          />
        </div>

        {/* Location */}
        <div>
          <label style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: "0.375rem" }}>ĐỊA ĐIỂM</label>
          <input
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            placeholder="TP. Hồ Chí Minh"
            style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none" }}
          />
        </div>

        {/* Bio */}
        <div>
          <label style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: "0.375rem" }}>BIO</label>
          <input
            value={form.bio}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Mô tả ngắn về bản thân..."
            style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none" }}
          />
        </div>

        {/* Social Links — full width */}
        <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
          <div style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: "0.75rem" }}>LIÊN KẾT MẠNG XÃ HỘI</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: "0.25rem" }}>Facebook</label>
              <input
                value={form.facebook}
                onChange={(e) => updateField("facebook", e.target.value)}
                placeholder="facebook.com/username"
                style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "7px 12px", color: DS.text, fontSize: 12, outline: "none" }}
              />
            </div>
            <div>
              <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: "0.25rem" }}>LinkedIn</label>
              <input
                value={form.linkedin}
                onChange={(e) => updateField("linkedin", e.target.value)}
                placeholder="linkedin.com/in/username"
                style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "7px 12px", color: DS.text, fontSize: 12, outline: "none" }}
              />
            </div>
            <div>
              <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: "0.25rem" }}>GitHub</label>
              <input
                value={form.github}
                onChange={(e) => updateField("github", e.target.value)}
                placeholder="github.com/username"
                style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "7px 12px", color: DS.text, fontSize: 12, outline: "none" }}
              />
            </div>
            <div>
              <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: "0.25rem" }}>Website</label>
              <input
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://..."
                style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "7px 12px", color: DS.text, fontSize: 12, outline: "none" }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: "1rem", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem" }}>
          {error}
        </div>
      )}

      {/* Read-only info */}
      {profile && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", borderRadius: 10, background: DS.bg, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: "0.75rem" }}>THÔNG TIN HỆ THỐNG (CHỈ ĐỌC)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            {[
              ["Email", profile.email],
              ["Phòng ban", profile.department ?? "—"],
              ["Vai trò", profile.role ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>{label}</div>
                <div style={{ color: DS.text2, fontSize: 12 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
