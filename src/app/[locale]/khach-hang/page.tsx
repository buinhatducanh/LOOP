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
  Settings, LogOut, ChevronRight, Zap,
  CheckCircle2, Clock, XCircle,
  BookOpen, Award, ArrowUpRight,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";
import { apiClient } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab =
  | "overview" | "projects" | "courses" | "invoices"
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

function OverviewTab({ locale, orders }: { locale: string; orders: CustomerOrder[] }) {
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
            <div style={{ color: kpi.color, fontSize: "1.75rem", fontWeight: 900, fontFamily: "'Cinzel', serif" }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <h3 style={{ color: DS.text, fontFamily: "'Cinzel', serif", fontSize: "1rem", marginBottom: "1rem" }}>
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

function ProjectsTab({ locale, orders }: { locale: string; orders: CustomerOrder[] }) {
  const done = orders.filter((o) => o.status === "done");
  const active = orders.filter((o) => o.status !== "done" && o.status !== "cancelled");

  return (
    <div>
      {active.length > 0 && (
        <>
          <h3 style={{ color: DS.text, fontFamily: "'Cinzel', serif", fontSize: "0.9375rem", marginBottom: "1rem" }}>
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

      <h3 style={{ color: DS.text, fontFamily: "'Cinzel', serif", fontSize: "0.9375rem", marginBottom: "1rem" }}>
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

function CoursesTab({ enrollments }: { enrollments: CustomerEnrollment[] }) {
  const t = useTranslations("customer");

  if (enrollments.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <BookOpen size={40} style={{ color: DS.text4, margin: "0 auto 1rem" }} />
        <h3 style={{ color: DS.text, marginBottom: "0.5rem", fontFamily: "'Cinzel', serif" }}>Chưa có khóa học</h3>
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
        background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(129,140,248,0.1) 100%)",
        border: `1px solid rgba(129,140,248,0.2)`,
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
          fontFamily: "'Cinzel', serif",
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
      <h3 style={{ color: DS.text, fontFamily: "'Cinzel', serif", fontSize: "0.9375rem", marginBottom: "0.75rem" }}>
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
        <h3 style={{ color: DS.text, fontFamily: "'Cinzel', serif", marginBottom: "0.75rem" }}>Liên hệ hỗ trợ</h3>
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
        background: "linear-gradient(135deg, rgba(129,140,248,0.1) 0%, rgba(59,130,246,0.1) 100%)",
        border: `1px solid rgba(129,140,248,0.2)`,
        textAlign: "center",
        marginBottom: "1rem",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎁</div>
        <h3 style={{ color: DS.text, fontFamily: "'Cinzel', serif", marginBottom: "0.5rem" }}>Giới thiệu bạn bè</h3>
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
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const tNav = useTranslations("Navigation");

  // Resolve locale from params
  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push(`/${locale}/dang-nhap`);
      return;
    }
    if (user.role !== "client") {
      router.push("/admin/overview");
      return;
    }
  }, [isAuthenticated, user, locale, router]);

  // Load portal data
  useEffect(() => {
    if (!isAuthenticated) return;

    async function load() {
      try {
        const [oRes, eRes, pRes] = await Promise.all([
          apiClient.get<{ data: CustomerOrder[] }>("/api/portal/orders", { params: { limit: 20 }, throwOnError: false }),
          apiClient.get<{ data: CustomerEnrollment[] }>("/api/portal/enrollments", { params: { limit: 10 }, throwOnError: false }),
          apiClient.get<{ data: PointData }>("/api/portal/points", { throwOnError: false }),
        ]);
        if (!("error" in oRes)) setOrders((oRes as any).data?.data ?? []);
        if (!("error" in eRes)) setEnrollments((eRes as any).data?.data ?? []);
        if (!("error" in pRes)) setPointData((pRes as any).data?.data ?? null);
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

  const tabs: Tab[] = ["overview", "projects", "courses", "invoices", "wallet", "referral", "support", "settings"];

  const tabLabels: Record<Tab, string> = {
    overview: "Tổng quan",
    projects: "Dự án",
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
          <div style={{ width: 32, height: 32, borderRadius: 8, background: GRD.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 14 }}>∞</span>
          </div>
          <div>
            <div style={{ color: DS.text, fontFamily: "'Cinzel', serif", fontSize: "0.875rem", fontWeight: 900, letterSpacing: "0.05em" }}>LOOP</div>
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
            src={user?.avatar ?? ""}
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
          <nav style={{
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
