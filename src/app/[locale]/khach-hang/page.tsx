"use client";

/**
 * Customer Portal — LOOP Solutions
 * Route: /vi/khach-hang, /en/khach-hang, /ja/khach-hang, /ko/khach-hang, /zh/khach-hang
 *
 * Client-only page (uses authStore + API).
 * Redirects to login if not authenticated as client.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  LayoutDashboard, FolderKanban, GraduationCap,
  Receipt, Wallet, UserPlus, Headphones,
  Settings, LogOut,
  CheckCircle2, Clock, XCircle,
  BookOpen, Award, Monitor, ExternalLink,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";
import { apiClient } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab =
  | "overview" | "projects" | "demos" | "courses" | "invoices"
  | "wallet" | "referral" | "support" | "settings";

interface CustomerOrder {
  id: string;
  status: string;
  totalAmount: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  package: { title: string } | null;
  statusHistory: Array<{ fromStatus: string; toStatus: string; note: string | null; createdAt: Date | string }>;
}

interface CustomerDemo {
  id: string;
  title: string;
  figmaUrl: string;
  clientToken: string;
  status: string;
  versionHash: string | null;
  rejectionNote: string | null;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  reviewUrl: string;
  order: {
    id: string;
    orderNumber: string;
    package: { title: string } | null;
  } | null;
}

interface CustomerEnrollment {
  id: string;
  enrolledAt: Date | string;
  completedCount: number;
  progress: number;
  course: {
    id: string;
    title: string;
    price: number;
    lpReward: number;
    instructor: { name: string } | null;
  };
}

interface PointData {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  rank: string;
  rankColor: string;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

// ── Order status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_payment: { label: "Chờ thanh toán", color: "#F59E0B", icon: <Clock size={13} /> },
  paid: { label: "Đã thanh toán", color: "#3B82F6", icon: <CheckCircle2 size={13} /> },
  in_progress: { label: "Đang thực hiện", color: "#8B5CF6", icon: <Clock size={13} /> },
  demo_ready: { label: "Demo sẵn sàng", color: "#06B6D4", icon: <CheckCircle2 size={13} /> },
  client_review: { label: "Khách hàng review", color: "#F59E0B", icon: <Clock size={13} /> },
  done: { label: "Hoàn thành", color: "#10B981", icon: <CheckCircle2 size={13} /> },
  cancelled: { label: "Đã hủy", color: "#EF4444", icon: <XCircle size={13} /> },
};

// ── Tab config ────────────────────────────────────────────────────────────────

function TabIcon({ tab, size = 16 }: { tab: Tab; size?: number }) {
  const icons: Record<Tab, React.ReactNode> = {
    overview: <LayoutDashboard size={size} />,
    projects: <FolderKanban size={size} />,
    demos: <Monitor size={size} />,
    courses: <GraduationCap size={size} />,
    invoices: <Receipt size={size} />,
    wallet: <Wallet size={size} />,
    referral: <UserPlus size={size} />,
    support: <Headphones size={size} />,
    settings: <Settings size={size} />,
  };
  return <>{icons[tab]}</>;
}

// ── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ orders }: { locale: string; orders: CustomerOrder[] }) {
  const t = useTranslations("customer");

  const activeOrders = orders.filter(
    (o) => !["done", "cancelled"].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === "done");

  const totalSpent = orders
    .filter((o) => o.status === "done")
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);

  return (
    <div>
      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          { label: t("projects"), value: completedOrders.length, color: DS.blue },
          { label: t("totalSpent"), value: `${(totalSpent / 1_000_000).toFixed(1)}M`, color: DS.purple },
          { label: "Đơn đang hoạt động", value: activeOrders.length, color: DS.amber },
          { label: "Tổng đơn hàng", value: orders.length, color: DS.cyan },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: "1.25rem",
              borderRadius: "1rem",
              background: "rgba(15,23,42,0.6)",
              border: `1px solid ${DS.border}`,
            }}
          >
            <div style={{ color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "0.5rem" }}>
              {kpi.label.toUpperCase()}
            </div>
            <div style={{ color: kpi.color, fontSize: "1.75rem", fontWeight: 900, fontFamily: DS.heading }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1rem", marginBottom: "1rem" }}>
        {t("recentOrders")}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {orders.slice(0, 4).map((order) => {
          const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending_payment;
          return (
            <div
              key={order.id}
              style={{
                padding: "1rem",
                borderRadius: "0.75rem",
                background: "rgba(15,23,42,0.6)",
                border: `1px solid ${DS.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ color: DS.text, fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  {order.package?.title ?? "Dịch vụ LOOP"}
                </div>
                <div style={{ color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: cfg.color }}>
                {cfg.icon}
                <span style={{ fontSize: "0.75rem" }}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div style={{ color: DS.text4, textAlign: "center", padding: "2rem" }}>
            Chưa có đơn hàng nào
          </div>
        )}
      </div>
    </div>
  );
}

// ── Projects tab ───────────────────────────────────────────────────────────────

function ProjectsTab({ orders }: { locale: string; orders: CustomerOrder[] }) {
  const done = orders.filter((o) => o.status === "done");
  const active = orders.filter((o) => o.status !== "done" && o.status !== "cancelled");

  return (
    <div>
      {active.length > 0 && (
        <>
          <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "0.9375rem", marginBottom: "1rem" }}>
            Đang thực hiện ({active.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {active.map((o) => {
              const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.in_progress;
              return (
                <div key={o.id} style={{ padding: "1.25rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${cfg.color}30` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ color: DS.text, fontWeight: 700 }}>{o.package?.title ?? "Dự án"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: cfg.color }}>
                      {cfg.icon} <span style={{ fontSize: "0.75rem" }}>{cfg.label}</span>
                    </div>
                  </div>
                  {o.statusHistory[0]?.note && (
                    <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>{o.statusHistory[0].note}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "0.9375rem", marginBottom: "1rem" }}>
        Hoàn thành ({done.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {done.map((o) => (
          <div key={o.id} style={{ padding: "1.25rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: DS.text, fontWeight: 700, marginBottom: "0.25rem" }}>{o.package?.title ?? "Dự án"}</div>
                <div style={{ color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  {o.updatedAt ? new Date(o.updatedAt).toLocaleDateString("vi-VN") : ""}
                </div>
              </div>
              <div style={{ color: DS.green, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <CheckCircle2 size={13} /> <span style={{ fontSize: "0.75rem" }}>Hoàn thành</span>
              </div>
            </div>
          </div>
        ))}
        {done.length === 0 && active.length === 0 && (
          <div style={{ color: DS.text4, textAlign: "center", padding: "2rem" }}>Chưa có dự án nào</div>
        )}
      </div>
    </div>
  );
}

// ── Courses tab ───────────────────────────────────────────────────────────────

function DemosTab({ demos }: { demos: CustomerDemo[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const STATUS_CONFIG_DEMO: Record<string, { label: string; color: string }> = {
    pending:           { label: "Chờ duyệt", color: "#F59E0B" },
    approved:          { label: "Đã duyệt",   color: "#22C55E" },
    rejected:          { label: "Từ chối",   color: "#EF4444" },
    approved_by_client:{ label: "Hoàn tất",  color: "#3B82F6" },
  };

  if (demos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <Monitor size={40} style={{ color: DS.text4, margin: "0 auto 1rem" }} />
        <h3 style={{ color: DS.text, marginBottom: "0.5rem", fontFamily: DS.heading }}>Chưa có demo nào</h3>
        <p style={{ color: DS.text3, fontSize: "0.875rem" }}>Demo thiết kế sẽ xuất hiện tại đây khi đội ngũ LOOP gửi cho bạn.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {demos.map((demo) => {
        const cfg = STATUS_CONFIG_DEMO[demo.status] ?? STATUS_CONFIG_DEMO.pending;
        const isOpen = !!expanded[demo.id];
        return (
          <div
            key={demo.id}
            style={{
              borderRadius: "1rem",
              background: "rgba(15,23,42,0.6)",
              border: `1px solid ${isOpen ? cfg.color + "40" : DS.border}`,
              overflow: "hidden",
              transition: "border-color 0.2s",
            }}
          >
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [demo.id]: !prev[demo.id] }))}
              style={{
                width: "100%", padding: "1rem", background: "none", border: "none",
                display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: DS.text, fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {demo.title}
                </div>
                <div style={{ color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  {demo.order?.package?.title ?? demo.order?.orderNumber ?? "—"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ padding: "3px 10px", borderRadius: 20, background: `${cfg.color}15`, color: cfg.color, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  {cfg.label}
                </span>
                {demo.versionHash && (
                  <span style={{ color: DS.amber, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>{demo.versionHash}</span>
                )}
                <span style={{ color: DS.text5, fontSize: "0.75rem" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${DS.border}` }}>
                <div style={{ paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>NGÀY GỬI:</span>
                    <span style={{ color: DS.text3, fontSize: "0.75rem" }}>
                      {demo.sentAt ? new Date(demo.sentAt).toLocaleDateString("vi-VN") : "—"}
                    </span>
                    {demo.approvedAt && (
                      <>
                        <span style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", marginLeft: "1rem" }}>DUYỆT:</span>
                        <span style={{ color: DS.green, fontSize: "0.75rem" }}>
                          {new Date(demo.approvedAt).toLocaleDateString("vi-VN")}
                        </span>
                      </>
                    )}
                  </div>

                  {demo.rejectionNote && (
                    <div style={{ background: "rgba(239,68,68,0.08)", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 10, padding: "0.625rem" }}>
                      <div style={{ color: DS.red, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "0.25rem" }}>GHI CHÚ TỪ CHỐI</div>
                      <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>{demo.rejectionNote}</p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a
                      href={`https://www.figma.com/embed?embed_host=loops&url=${encodeURIComponent(demo.figmaUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, padding: "0.625rem", borderRadius: "0.75rem",
                        background: `rgba(59,130,246,0.1)`, border: `1px solid rgba(59,130,246,0.3)`,
                        color: DS.blue, fontSize: "0.8125rem", fontWeight: 600,
                        textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                      }}
                    >
                      <ExternalLink size={13} /> Mở Figma
                    </a>
                    {demo.status === "approved" && (
                      <a
                        href={demo.reviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1, padding: "0.625rem", borderRadius: "0.75rem",
                          background: GRD.primary, border: "none",
                          color: "#fff", fontSize: "0.8125rem", fontWeight: 700,
                          textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                        }}
                      >
                        <Monitor size={13} /> Xem Demo
                      </a>
                    )}
                    {demo.status === "pending" && (
                      <div style={{ flex: 1, padding: "0.625rem", borderRadius: "0.75rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: DS.amber, fontSize: "0.75rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        Đang chờ designer gửi
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CoursesTab({ enrollments }: { enrollments: CustomerEnrollment[] }) {
  const _t = useTranslations("customer");

  if (enrollments.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <BookOpen size={40} style={{ color: DS.text4, margin: "0 auto 1rem" }} />
        <h3 style={{ color: DS.text, marginBottom: "0.5rem", fontFamily: DS.heading }}>Chưa có khóa học</h3>
        <p style={{ color: DS.text3, fontSize: "0.875rem" }}>Đăng ký khóa học tại LOOP Academy để bắt đầu học</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
      {enrollments.map((e) => (
        <div key={e.id} style={{ borderRadius: "1rem", overflow: "hidden", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}` }}>
          <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(59,130,246,0.08)", borderBottom: `1px solid ${DS.border}` }}>
            <GraduationCap size={32} style={{ color: DS.blue }} />
          </div>
          <div style={{ padding: "1rem" }}>
            <div style={{ color: DS.text, fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.25rem" }}>{e.course.title}</div>
            {e.course.instructor && (
              <div style={{ color: DS.text4, fontSize: "0.6875rem", marginBottom: "0.75rem" }}>{e.course.instructor.name}</div>
            )}
            {/* Progress bar */}
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ color: DS.text3, fontSize: "0.6875rem" }}>Tiến độ</span>
                <span style={{ color: DS.blue, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>{e.progress}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: DS.border }}>
                <div style={{ height: "100%", borderRadius: 2, background: GRD.primary, width: `${e.progress}%` }} />
              </div>
            </div>
            {e.progress >= 100 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: DS.green, fontSize: "0.75rem" }}>
                <Award size={13} /> Hoàn thành
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Wallet tab ─────────────────────────────────────────────────────────────────

function WalletTab({ pointData }: { pointData: PointData | null }) {
  const balance = pointData?.balance ?? 0;

  return (
    <div>
      {/* Balance hero */}
      <div style={{
        padding: "2rem",
        borderRadius: "1.5rem",
        background: `linear-gradient(135deg, rgba(79,125,243,0.15) 0%, rgba(236,72,153,0.1) 100%)`,
        border: `1px solid rgba(236,72,153,0.2)`,
        textAlign: "center",
        marginBottom: "1.5rem",
      }}>
        <div style={{ color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em", marginBottom: "0.5rem" }}>
          SỐ DƯ LP
        </div>
        <div style={{
          color: DS.purple,
          fontSize: "3rem",
          fontWeight: 900,
          fontFamily: DS.heading,
          textShadow: "0 0 24px rgba(129,140,248,0.6)",
          marginBottom: "0.5rem",
        }}>
          {balance.toLocaleString("vi-VN")}
        </div>
        <div style={{ color: DS.text3, fontSize: "0.8125rem" }}>
          {pointData?.rank ?? "Iron"} Rank
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ padding: "1rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`, textAlign: "center" }}>
          <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "0.25rem" }}>TỔNG TÍCH LŨY</div>
          <div style={{ color: DS.green, fontSize: "1.25rem", fontWeight: 700 }}>{pointData?.lifetimeEarned.toLocaleString("vi-VN") ?? "—"} LP</div>
        </div>
        <div style={{ padding: "1rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`, textAlign: "center" }}>
          <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "0.25rem" }}>ĐÃ DÙNG</div>
          <div style={{ color: DS.amber, fontSize: "1.25rem", fontWeight: 700 }}>{pointData?.lifetimeSpent.toLocaleString("vi-VN") ?? "—"} LP</div>
        </div>
      </div>

      {/* Transaction history */}
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "0.9375rem", marginBottom: "0.75rem" }}>
        Lịch sử giao dịch
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {pointData?.recentTransactions.map((tx) => (
          <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderRadius: "0.75rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}` }}>
            <div>
              <div style={{ color: DS.text3, fontSize: "0.8125rem" }}>{tx.description}</div>
              <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
            <div style={{ color: tx.type === "earn" ? DS.green : DS.amber, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.875rem" }}>
              {tx.type === "earn" ? "+" : "-"}{tx.amount.toLocaleString("vi-VN")} LP
            </div>
          </div>
        ))}
        {(!pointData?.recentTransactions || pointData.recentTransactions.length === 0) && (
          <div style={{ color: DS.text4, textAlign: "center", padding: "1.5rem" }}>Chưa có giao dịch nào</div>
        )}
      </div>
    </div>
  );
}

// ── Support tab ────────────────────────────────────────────────────────────────

function SupportTab() {
  return (
    <div>
      <div style={{
        padding: "1.5rem",
        borderRadius: "1rem",
        background: "rgba(15,23,42,0.6)",
        border: `1px solid ${DS.border}`,
        marginBottom: "1rem",
      }}>
        <h3 style={{ color: DS.text, fontFamily: DS.heading, marginBottom: "0.75rem" }}>Liên hệ hỗ trợ</h3>
        <p style={{ color: DS.text3, fontSize: "0.875rem", marginBottom: "1rem" }}>
          Đội ngũ LOOP luôn sẵn sàng hỗ trợ bạn 24/7.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { icon: "📧", label: "Email", value: "support@loops.vn" },
            { icon: "📞", label: "Hotline", value: "1900 1234" },
            { icon: "💬", label: "Zalo", value: "LOOP Solutions" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: DS.text3, fontSize: "0.875rem" }}>
              <span>{item.icon}</span>
              <span style={{ color: DS.text4, minWidth: 60 }}>{item.label}:</span>
              <span style={{ color: DS.text }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Referral tab ────────────────────────────────────────────────────────────────

function ReferralTab() {
  return (
    <div>
      <div style={{
        padding: "2rem",
        borderRadius: "1.5rem",
        background: `linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(79,125,243,0.1) 100%)`,
        border: `1px solid rgba(236,72,153,0.2)`,
        textAlign: "center",
        marginBottom: "1rem",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎁</div>
        <h3 style={{ color: DS.text, fontFamily: DS.heading, marginBottom: "0.5rem" }}>Giới thiệu bạn bè</h3>
        <p style={{ color: DS.text3, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Giới thiệu khách hàng mới, nhận <strong style={{ color: DS.purple }}>500–2,000 LP</strong> cho mỗi khách thành công!
        </p>
        <div style={{
          display: "flex", gap: "0.75rem", justifyContent: "center",
        }}>
          <button style={{
            padding: "0.625rem 1.5rem", borderRadius: "0.75rem",
            background: GRD.primary, color: "#fff", border: "none",
            fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
          }}>
            Sao chép link giới thiệu
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomerPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("vi");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [enrollments, setEnrollments] = useState<CustomerEnrollment[]>([]);
  const [pointData, setPointData] = useState<PointData | null>(null);
  const [demos, setDemos] = useState<CustomerDemo[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Resolve locale from params
  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  // Auth guard — redirect staff/admin back to admin dashboard
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push(`/${locale}/dang-nhap`);
      return;
    }
    // user.role is "client" → allowed in customer portal
    // user.role is NOT "client" (admin/pm/media/qa/member) → redirect to admin
    if (user.role !== "client") {
      router.push("/admin/overview");
      return;
    }
    // Also check accountType — admin accounts have accountType="staff"
    if (user.accountType === "staff") {
      router.push("/admin/overview");
      return;
    }
  }, [isAuthenticated, user, locale, router]);

  // Block rendering staff/admin — prevents portal UI flash before redirect fires.
  // Customers: user.role === "client" AND accountType === "customer"
  // Staff: user.accountType === "staff" (even if role === "member")
  if (user && user.accountType === "staff") {
    return null;
  }

  // Load portal data
  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [oRes, eRes, pRes, dRes] = await Promise.all([
          apiClient.get<{ data: CustomerOrder[] }>("/api/portal/orders", { params: { limit: 20 }, throwOnError: false }),
          apiClient.get<{ data: CustomerEnrollment[] }>("/api/portal/enrollments", { params: { limit: 10 }, throwOnError: false }),
          apiClient.get<{ data: PointData }>("/api/portal/points", { throwOnError: false }),
          apiClient.get<{ data: CustomerDemo[] }>("/api/portal/demos", { throwOnError: false }),
        ]);
        if (!("error" in oRes)) setOrders((oRes as unknown as { data: { data: CustomerOrder[] } }).data?.data ?? []);
        if (!("error" in eRes)) setEnrollments((eRes as unknown as { data: { data: CustomerEnrollment[] } }).data?.data ?? []);
        if (!("error" in pRes)) setPointData((pRes as unknown as { data: { data: PointData } }).data?.data ?? null);
        if (!("error" in dRes)) setDemos((dRes as unknown as { data: { data: CustomerDemo[] } }).data?.data ?? []);
      } catch {
        // Silent fail — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/dang-nhap`);
  };

  const tabs: Tab[] = ["overview", "projects", "demos", "courses", "invoices", "wallet", "referral", "support", "settings"];

  const tabLabels: Record<Tab, string> = {
    overview: "Tổng quan",
    projects: "Dự án",
    demos: "Demo",
    courses: "Khóa học",
    invoices: "Hóa đơn",
    wallet: "Ví LP",
    referral: "Giới thiệu",
    support: "Hỗ trợ",
    settings: "Cài đặt",
  };

  return (
    <div style={{ minHeight: "100vh", background: DS.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* Topbar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(2,6,23,0.95)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${DS.border}`,
        height: 64, display: "flex", alignItems: "center",
        padding: "0 1.5rem", gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <img src="/logo.png" alt="LOOP" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 8 }} />
          <div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: "0.875rem", fontWeight: 900, letterSpacing: "0.05em" }}>LOOP</div>
            <div style={{ color: DS.text4, fontSize: "0.5rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em" }}>CUSTOMER PORTAL</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* User badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: DS.text, fontSize: "0.8125rem", fontWeight: 600 }}>{user?.name}</div>
            <div style={{ color: DS.blue, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>Client</div>
          </div>
          <img
            src={user?.avatar || undefined}
            alt={user?.name ?? ""}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid rgba(59,130,246,0.5)`, objectFit: "cover" }}
          />
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4, display: "flex", alignItems: "center", padding: "0.25rem" }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: 80, maxWidth: "80rem", margin: "0 auto", padding: "80px 1.5rem 4rem" }}>
        <div style={{ display: "flex", gap: "2rem" }}>
          {/* Sidebar */}
          <nav className="hidden lg:block" style={{
            width: 220, flexShrink: 0,
            position: "sticky", top: 80, height: "fit-content",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.625rem",
                    padding: "0.625rem 0.875rem", borderRadius: "0.75rem",
                    background: activeTab === tab ? "rgba(59,130,246,0.12)" : "transparent",
                    border: activeTab === tab ? `1px solid rgba(59,130,246,0.25)` : "1px solid transparent",
                    color: activeTab === tab ? DS.text : DS.text3,
                    fontSize: "0.875rem", fontWeight: activeTab === tab ? 600 : 400,
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  <TabIcon tab={tab} size={15} />
                  {tabLabels[tab]}
                </button>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "4rem", color: DS.text4 }}>Đang tải...</div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "overview" && <OverviewTab locale={locale} orders={orders} />}
                {activeTab === "projects" && <ProjectsTab locale={locale} orders={orders} />}
                {activeTab === "demos" && <DemosTab demos={demos} />}
                {activeTab === "courses" && <CoursesTab enrollments={enrollments} />}
                {activeTab === "wallet" && <WalletTab pointData={pointData} />}
                {activeTab === "support" && <SupportTab />}
                {activeTab === "referral" && <ReferralTab />}
                {activeTab === "invoices" && (
                  <div style={{ color: DS.text4, textAlign: "center", padding: "3rem" }}>
                    Hóa đơn sẽ được cập nhật sớm
                  </div>
                )}
                {activeTab === "settings" && (
                  <div style={{ color: DS.text4, textAlign: "center", padding: "3rem" }}>
                    Cài đặt tài khoản sẽ được cập nhật sớm
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
