"use client";

/**
 * Departments Admin Page — LOOP Solutions
 * Route: /admin/departments
 *
 * Departments are defined as role categories (not a DB model).
 * This page manages the department structure used in authStore RBAC.
 * See: src/app/store/authStore.ts DEPT_TABS mapping.
 */

import { useState } from "react";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { Building2, Users, Plus, Edit2, Trash2, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

type Department = {
  id: string;
  name: string;
  nameVi: string;
  color: string;
  icon: string;
  memberCount: number;
  tabAccess: string[];
};

// ── Static department config (source of truth) ──────────────────────────
// These match DEPT_TABS in authStore.ts — keep in sync when adding tabs.

const DEPT_COLORS: Record<string, string> = {
  engineering: "#3B82F6",
  design: "#8B5CF6",
  media: "#EC4899",
  marketing: "#F59E0B",
  sales: "#22C55E",
  finance: "#14B8A6",
  hr: "#EF4444",
  management: "#818CF8",
};

const DEPT_ICONS: Record<string, string> = {
  engineering: "⌖",
  design: "✦",
  media: "◉",
  marketing: "◐",
  sales: "◎",
  finance: "$",
  hr: "♦",
  management: "⬢",
};

const DEPT_LABELS: Record<string, string> = {
  engineering: "Kỹ thuật",
  design: "Thiết kế",
  media: "Media",
  marketing: "Marketing",
  sales: "Kinh doanh",
  finance: "Tài chính",
  hr: "Nhân sự",
  management: "Ban giám đốc",
};

const DEPT_TABS: Record<string, string[]> = {
  engineering: ["overview", "orders", "projects", "members", "notification_center"],
  design: ["overview", "orders", "projects", "portfolio", "members", "notification_center"],
  media: ["overview", "media", "orders", "projects", "members", "notification_center"],
  marketing: ["overview", "blog", "academy", "clients", "services", "notification_center"],
  sales: ["overview", "orders", "clients", "quotation", "services", "revenue", "notification_center"],
  finance: ["overview", "revenue", "lp", "lp_manage", "income_tax", "web_packages", "orders", "notification_center"],
  hr: ["overview", "members", "departments", "notification_center"],
  management: ["overview", "orders", "members", "departments", "projects", "revenue", "clients", "notification_center", "quests_events"],
};

// ── Mock data (replace with real API when Department model exists) ──────
const INIT_DEPTS: Department[] = [
  { id: "engineering", name: "Engineering", nameVi: "Kỹ thuật", color: DEPT_COLORS.engineering, icon: DEPT_ICONS.engineering, memberCount: 8, tabAccess: DEPT_TABS.engineering },
  { id: "design", name: "Design", nameVi: "Thiết kế", color: DEPT_COLORS.design, icon: DEPT_ICONS.design, memberCount: 5, tabAccess: DEPT_TABS.design },
  { id: "media", name: "Media", nameVi: "Media", color: DEPT_COLORS.media, icon: DEPT_ICONS.media, memberCount: 4, tabAccess: DEPT_TABS.media },
  { id: "marketing", name: "Marketing", nameVi: "Marketing", color: DEPT_COLORS.marketing, icon: DEPT_ICONS.marketing, memberCount: 3, tabAccess: DEPT_TABS.marketing },
  { id: "sales", name: "Sales", nameVi: "Kinh doanh", color: DEPT_COLORS.sales, icon: DEPT_ICONS.sales, memberCount: 4, tabAccess: DEPT_TABS.sales },
  { id: "finance", name: "Finance", nameVi: "Tài chính", color: DEPT_COLORS.finance, icon: DEPT_ICONS.finance, memberCount: 2, tabAccess: DEPT_TABS.finance },
  { id: "hr", name: "HR", nameVi: "Nhân sự", color: DEPT_COLORS.hr, icon: DEPT_ICONS.hr, memberCount: 2, tabAccess: DEPT_TABS.hr },
  { id: "management", name: "Management", nameVi: "Ban giám đốc", color: DEPT_COLORS.management, icon: DEPT_ICONS.management, memberCount: 3, tabAccess: DEPT_TABS.management },
];

// ── Department Card ────────────────────────────────────────────────────

function DeptCard({
  dept,
  onEdit,
}: {
  dept: Department;
  onEdit: (dept: Department) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, borderColor: `${dept.color}60` }}
      transition={{ duration: 0.2 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${dept.color}30`,
        borderRadius: 12,
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        cursor: "default",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${dept.color}15`,
              border: `1px solid ${dept.color}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              color: dept.color,
              flexShrink: 0,
            }}
          >
            {dept.icon}
          </div>
          <div>
            <div
              style={{
                color: DS.text,
                fontFamily: DS.heading,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.04em",
              }}
            >
              {dept.nameVi}
            </div>
            <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{dept.name}</div>
          </div>
        </div>
        <button
          onClick={() => onEdit(dept)}
          style={{
            background: "rgba(59,130,246,0.1)",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 8,
            padding: "4px 8px",
            cursor: "pointer",
            color: DS.blue,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Edit2 size={12} />
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <div
          style={{
            flex: 1,
            background: `${dept.color}0a`,
            border: `1px solid ${dept.color}15`,
            borderRadius: 8,
            padding: "0.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ color: dept.color, fontSize: 18, fontWeight: 700, fontFamily: DS.heading }}>
            {dept.memberCount}
          </div>
          <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>thành viên</div>
        </div>
        <div
          style={{
            flex: 1,
            background: `${dept.color}0a`,
            border: `1px solid ${dept.color}15`,
            borderRadius: 8,
            padding: "0.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ color: dept.color, fontSize: 18, fontWeight: 700, fontFamily: DS.heading }}>
            {dept.tabAccess.length}
          </div>
          <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>tab quyền</div>
        </div>
      </div>

      {/* Color indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: dept.color,
            boxShadow: `0 0 6px ${dept.color}`,
            flexShrink: 0,
          }}
        />
        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>
          ID: {dept.id}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function DepartmentsPage() {
  const [depts, setDepts] = useState<Department[]>(INIT_DEPTS);
  const [editTarget, setEditTarget] = useState<Department | null>(null);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Phòng ban
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {depts.length} phòng ban · Cấu trúc RBAC theo DEPT_TABS trong authStore
          </p>
        </div>
      </div>

      {/* Note */}
      <div
        style={{
          background: "rgba(59,130,246,0.06)",
          border: `1px solid rgba(59,130,246,0.2)`,
          borderRadius: 10,
          padding: "0.875rem 1rem",
          marginBottom: "1.25rem",
          fontSize: 12,
          color: DS.text3,
          fontFamily: DS.body,
        }}
      >
        💡 Departments được định nghĩa trong code tại{" "}
        <code style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 11 }}>
          src/app/store/authStore.ts DEPT_TABS
        </code>
        . Thêm/sửa department → cập nhật cả <code style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 11 }}>authStore</code> và{" "}
        <code style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 11 }}>DEPT_LABELS</code>.
      </div>

      {/* Department Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {depts.map((dept) => (
          <DeptCard key={dept.id} dept={dept} onEdit={setEditTarget} />
        ))}
      </div>

      {/* Stats footer */}
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: DS.bgCard,
            border: `1px solid ${DS.border}`,
            borderRadius: 10,
            padding: "0.75rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Users size={14} style={{ color: DS.blue }} />
          <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>
            Tổng thành viên:{" "}
          </span>
          <span style={{ color: DS.text, fontWeight: 700, fontSize: 14, fontFamily: DS.heading }}>
            {depts.reduce((sum, d) => sum + d.memberCount, 0)}
          </span>
        </div>
        <div
          style={{
            background: DS.bgCard,
            border: `1px solid ${DS.border}`,
            borderRadius: 10,
            padding: "0.75rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Building2 size={14} style={{ color: DS.purple }} />
          <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>Phòng ban: </span>
          <span style={{ color: DS.text, fontWeight: 700, fontSize: 14, fontFamily: DS.heading }}>
            {depts.length}
          </span>
        </div>
      </div>
    </div>
  );
}
