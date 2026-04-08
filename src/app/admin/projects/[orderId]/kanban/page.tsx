"use client";

/**
 * PM Project Kanban — Task-level board for a specific Order project
 * Route: /admin/projects/[orderId]/kanban
 *
 * PM/Admin view: Order info header + Project Members sidebar + TaskKanbanBoard
 */
import { use, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { TaskKanbanBoard } from "@/components/admin/TaskKanbanBoard";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Users, Plus, X, ChevronRight, UserCheck, Trash2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectMember {
  id: string;
  memberId: string;
  projectRoleKey: string;
  assignedLp: number;
  earnedLp: number;
  joinedAt: string;
  member: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    department: string;
  };
  projectRole?: { key: string; label: string; color: string };
}

interface OrderInfo {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  status: string;
  finalPrice?: number;
  paymentStatus: string;
  isActiveProject: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  role: string;
}

// ── Role config ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  pm: "Project Manager", designer: "Designer",
  dev: "Developer", qa: "QA Engineer", seo: "SEO Specialist",
};

const ROLE_COLORS: Record<string, string> = {
  pm: DS.pink, designer: DS.cosmicPurple,
  dev: DS.cosmicBlue, qa: DS.green, seo: DS.amber,
};

const PROJECT_ROLE_KEYS = ["pm", "designer", "dev", "qa", "seo"];

// ── AddMemberModal ─────────────────────────────────────────────────────────────

function AddMemberModal({
  orderId,
  existingMemberIds,
  onClose,
  onAdded,
}: {
  orderId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const { data: allMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["team-members-select"],
    queryFn: () =>
      adminApi.get("/admin/team").then((r: unknown) => {
        const d = (r as { data: { id: string; name: string; avatar?: string; department: string; role: string }[] }).data;
        return d.map(m => ({ id: m.id, name: m.name, avatar: m.avatar, department: m.department, role: m.role }));
      }),
  });

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRoleKey, setSelectedRoleKey] = useState("dev");

  const add = useMutation({
    mutationFn: ({ memberId, projectRoleKey }: { memberId: string; projectRoleKey: string }) =>
      adminApi.post(`/admin/projects/${orderId}/members`, { memberId, projectRoleKey }),
    onSuccess: () => { onAdded(); onClose(); },
  });

  const available = allMembers.filter(m => !existingMemberIds.includes(m.id));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="rounded-xl p-6 w-full max-w-md"
        style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">Gán thành viên</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={18} color="#94A3B8" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Thành viên</label>
            <select
              value={selectedMemberId}
              onChange={e => setSelectedMemberId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <option value="">Chọn thành viên...</option>
              {available.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Vai trò dự án</label>
            <div className="grid grid-cols-2 gap-2">
              {PROJECT_ROLE_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedRoleKey(key)}
                  className="py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor: selectedRoleKey === key ? `${ROLE_COLORS[key]}33` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selectedRoleKey === key ? ROLE_COLORS[key] : "rgba(255,255,255,0.08)"}`,
                    color: selectedRoleKey === key ? ROLE_COLORS[key] : "#94A3B8",
                  }}
                >
                  {ROLE_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => selectedMemberId && add.mutate({ memberId: selectedMemberId, projectRoleKey: selectedRoleKey })}
          disabled={!selectedMemberId || add.isPending}
          className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: GRD.primary }}
        >
          {add.isPending ? "Đang gán..." : "Gán vào dự án"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectKanbanPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [showAddMember, setShowAddMember] = useState(false);

  const { data: order } = useQuery<OrderInfo>({
    queryKey: ["order", orderId],
    queryFn: () => adminApi.get(`/admin/orders/${orderId}`).then((r: unknown) => (r as { data: OrderInfo }).data),
  });

  const { data: members = [], refetch: refetchMembers } = useQuery<ProjectMember[]>({
    queryKey: ["project-members", orderId],
    queryFn: () => adminApi.get(`/admin/projects/${orderId}/members`).then((r: unknown) => (r as { data: ProjectMember[] }).data),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      await adminApi.post(`/admin/projects/${orderId}/members`, { memberId }, { method: "DELETE" });
    },
    onSuccess: () => refetchMembers(),
  });

  const existingMemberIds = members.map(m => m.memberId);

  const statusColors: Record<string, string> = {
    draft: DS.text4, pending: DS.amber, accepted: DS.cosmicBlue,
    paid_partial: DS.cosmicPurple, paid_full: DS.green, contracted: DS.pink,
    designing: DS.pink, developing: DS.cosmicBlue, reviewing: DS.amber,
    delivered: DS.green, completed: DS.green, cancelled: DS.red,
  };

  const fmtVnd = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen" style={{ backgroundColor: DS.bg }}>
      {/* Header */}
      <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: "#475569" }}>
          <span>Projects</span>
          <ChevronRight size={14} />
          <span style={{ color: "#94A3B8" }}>{order?.orderNumber ?? "..."}</span>
          <ChevronRight size={14} />
          <span style={{ color: DS.cosmicCyan }}>Kanban</span>
        </div>

        {order && (
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                {order.customerName}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
                {order.orderNumber} · {order.finalPrice ? fmtVnd(order.finalPrice) : "Chưa có giá"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${statusColors[order.status] ?? "#94A3B8"}22`, color: statusColors[order.status] ?? "#94A3B8" }}
              >
                {order.status}
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: order.isActiveProject ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", color: order.isActiveProject ? "#22C55E" : "#475569" }}
              >
                {order.isActiveProject ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex">
        {/* Members sidebar */}
        <aside className="w-64 flex-shrink-0 p-4" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} style={{ color: DS.cosmicCyan }} />
              <span className="text-sm font-semibold text-white">Thành viên</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#94A3B8" }}>
                {members.length}
              </span>
            </div>
            <button onClick={() => setShowAddMember(true)} className="p-1 rounded" style={{ color: DS.cosmicCyan }} title="Gán thành viên">
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {members.map(m => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg p-3 group"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: GRD.primary, color: "#fff" }}>
                    {m.member?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.member?.name ?? "—"}</p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block"
                      style={{ backgroundColor: `${m.projectRole?.color ?? "#94A3B8"}22`, color: m.projectRole?.color ?? "#94A3B8" }}
                    >
                      {m.projectRole?.label ?? ROLE_LABELS[m.projectRoleKey] ?? m.projectRoleKey}
                    </span>
                    {m.assignedLp > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: "#E6C75F" }}>{m.assignedLp.toLocaleString()} LP budget</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeMember.mutate(m.memberId)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: "#EF4444" }}
                    title="Xóa khỏi dự án"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-8">
                <UserCheck size={32} style={{ color: "#334155", margin: "0 auto 8px" }} />
                <p className="text-sm" style={{ color: "#334155" }}>Chưa có thành viên</p>
                <p className="text-xs mt-1" style={{ color: "#1E293B" }}>Gán thành viên để bắt đầu</p>
              </div>
            )}
          </div>

          {members.length > 0 && (
            <div className="mt-4 rounded-lg p-3" style={{ backgroundColor: "rgba(230,199,95,0.08)", border: "1px solid rgba(230,199,95,0.15)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#E6C75F" }}>Tổng LP Budget</p>
              <p className="text-xl font-bold" style={{ color: "#E6C75F" }}>
                {members.reduce((sum, m) => sum + (m.assignedLp ?? 0), 0).toLocaleString()}
                <span className="text-xs font-normal ml-1">LP</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                Đã nhận: {members.reduce((sum, m) => sum + (m.earnedLp ?? 0), 0).toLocaleString()} LP
              </p>
            </div>
          )}
        </aside>

        {/* Kanban board */}
        <main className="flex-1 p-4 overflow-hidden">
          <TaskKanbanBoard
            orderId={orderId}
            members={members.map(m => ({ id: m.memberId, name: m.member?.name ?? "", projectRoleKey: m.projectRoleKey }))}
          />
        </main>
      </div>

      <AnimatePresence>
        {showAddMember && (
          <AddMemberModal
            orderId={orderId}
            existingMemberIds={existingMemberIds}
            onClose={() => setShowAddMember(false)}
            onAdded={refetchMembers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}