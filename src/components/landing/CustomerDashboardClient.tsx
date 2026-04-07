"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import {
  FolderOpen, FileText, Coins, Bell, Calendar,
  TrendingUp,
  ArrowRight, MessageSquare,
} from "lucide-react";

type DashboardData = {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    updatedAt: string;
    demoUrl?: string;
  }>;
  invoices: Array<{
    id: string;
    amount: number;
    status: string;
    dueDate: string;
  }>;
  lpBalance: number;
  notifications: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
  }>;
};

const MOCK_DATA: DashboardData = {
  projects: [
    { id: "p1", name: "VNRetail Platform", status: "in_progress", progress: 72, updatedAt: "2026-03-27" },
    { id: "p2", name: "HealthTech Mobile App", status: "client_review", progress: 90, updatedAt: "2026-03-26", demoUrl: "https://demo.loop.vn/healthtech" },
  ],
  invoices: [
    { id: "inv-001", amount: 45000000, status: "pending", dueDate: "2026-04-05" },
    { id: "inv-002", amount: 22000000, status: "paid", dueDate: "2026-03-20" },
  ],
  lpBalance: 12450,
  notifications: [
    { id: "n1", title: "Demo VNRetail đã sẵn sàng để review", type: "demo", createdAt: "2026-03-27" },
    { id: "n2", title: "Hóa đơn INV-001 sắp đến hạn", type: "billing", createdAt: "2026-03-26" },
  ],
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Chờ thanh toán", color: DS.amber, bg: "rgba(251,191,36,0.1)" },
  paid: { label: "Đã thanh toán", color: DS.green, bg: "rgba(34,197,94,0.1)" },
  in_progress: { label: "Đang thực hiện", color: DS.blue, bg: "rgba(59,130,246,0.1)" },
  client_review: { label: "Đang review", color: DS.purple, bg: "rgba(129,140,248,0.1)" },
  done: { label: "Hoàn thành", color: DS.green, bg: "rgba(34,197,94,0.1)" },
};

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 14, padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.12em" }}>{label.toUpperCase()}</span>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}33`, display: "grid", placeItems: "center", color }}>{icon}</span>
      </div>
      <div style={{ color: DS.text, fontSize: 24, fontWeight: 800, fontFamily: DS.mono, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ color: DS.text4, fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

export function CustomerDashboardClient() {
  const data = MOCK_DATA;

  const totalOutstanding = useMemo(
    () => data.invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + i.amount, 0),
    [data.invoices]
  );

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section className="py-12 px-6" style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <h1 style={{ fontFamily: DS.heading, fontSize: 34, fontWeight: 900, letterSpacing: "0.05em", color: DS.text, marginBottom: 8 }}>
            CUSTOMER DASHBOARD
          </h1>
          <p style={{ color: DS.text3, fontSize: 14 }}>Theo dõi dự án, hóa đơn, LP và thông báo mới nhất theo thời gian thực.</p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
            <KpiCard icon={<FolderOpen size={16} />} label="Dự án" value={String(data.projects.length)} sub="đang hoạt động" color={DS.blue} />
            <KpiCard icon={<FileText size={16} />} label="Hóa đơn chờ" value={fmtVND(totalOutstanding)} sub="cần thanh toán" color={DS.amber} />
            <KpiCard icon={<Coins size={16} />} label="LP hiện có" value={data.lpBalance.toLocaleString()} sub="điểm thưởng" color={DS.cyan} />
            <KpiCard icon={<Bell size={16} />} label="Thông báo" value={String(data.notifications.length)} sub="chưa đọc" color={DS.purple} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 16 }}>
            {/* Projects */}
            <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={{ color: DS.text2, fontSize: 14, fontWeight: 700, fontFamily: DS.mono, letterSpacing: "0.1em" }}>DỰ ÁN CỦA BẠN</h2>
                <Link href="/vi/portfolio" style={{ color: DS.blue, textDecoration: "none", fontSize: 11, fontFamily: DS.mono }}>Xem tất cả</Link>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {data.projects.map((p, i) => {
                  const cfg = STATUS_CFG[p.status] ?? { label: p.status, color: DS.text4, bg: "transparent" };
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "12px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <p style={{ color: DS.text, fontWeight: 600, fontSize: 14 }}>{p.name}</p>
                        <span style={{ background: cfg.bg, border: `1px solid ${cfg.color}55`, color: cfg.color, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono }}>{cfg.label}</span>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 9999, overflow: "hidden" }}>
                          <div style={{ width: `${p.progress}%`, height: "100%", background: GRD.primary }} />
                        </div>
                        <div style={{ color: DS.text4, fontSize: 11, marginTop: 4 }}>{p.progress}% hoàn thành · cập nhật {new Date(p.updatedAt).toLocaleDateString("vi-VN")}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: DS.blue, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontFamily: DS.mono, cursor: "pointer" }}>
                          Chi tiết
                        </button>
                        {p.demoUrl && (
                          <a href={p.demoUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.3)", color: DS.purple, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontFamily: DS.mono }}>
                            Xem demo
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {/* Invoices */}
              <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 14, padding: 16 }}>
                <h3 style={{ color: DS.text2, fontSize: 13, fontWeight: 700, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 10 }}>HÓA ĐƠN</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {data.invoices.map((inv) => {
                    const cfg = STATUS_CFG[inv.status] ?? { label: inv.status, color: DS.text4, bg: "transparent" };
                    return (
                      <div key={inv.id} style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{inv.id.toUpperCase()}</span>
                          <span style={{ color: cfg.color, fontSize: 10, fontFamily: DS.mono }}>{cfg.label}</span>
                        </div>
                        <div style={{ color: DS.text, fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{fmtVND(inv.amount)}</div>
                        <div style={{ color: DS.text5, fontSize: 11 }}>Hạn: {new Date(inv.dueDate).toLocaleDateString("vi-VN")}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notifications */}
              <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 14, padding: 16 }}>
                <h3 style={{ color: DS.text2, fontSize: 13, fontWeight: 700, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 10 }}>THÔNG BÁO MỚI</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {data.notifications.map((n) => (
                    <div key={n.id} style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: 10 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ color: DS.blue, marginTop: 1 }}><MessageSquare size={13} /></span>
                        <div>
                          <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6 }}>{n.title}</p>
                          <p style={{ color: DS.text5, fontSize: 10, marginTop: 3 }}>{new Date(n.createdAt).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {[
              { icon: <Calendar size={14} />, label: "Nhận báo giá Website", href: "/vi/contact", color: DS.blue },
              { icon: <FileText size={14} />, label: "Xem hợp đồng", href: "#", color: DS.purple },
              { icon: <TrendingUp size={14} />, label: "Tiến độ dự án", href: "#", color: DS.cyan },
              { icon: <ArrowRight size={14} />, label: "Khám phá thêm", href: "/vi/services", color: DS.green },
            ].map((item) => (
              <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, color: item.color, fontSize: 12, fontFamily: DS.mono }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
