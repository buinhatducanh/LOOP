"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Receipt, Download, ExternalLink } from "lucide-react";

type Invoice = {
 id: string;
 invoiceNumber: string;
 amount: number;
 totalAmount: number;
 status: string;
 dueDate?: string;
 paidAt?: string;
 paidMethod?: string;
 createdAt: string;
 orderId?: string;
};

type PageData = { data: Invoice[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
 draft: { label: "Bản nháp", color: "#6B7280" },
 sent: { label: "Đã gửi", color: "#3B82F6" },
 paid: { label: "Đã thanh toán", color: "#22C55E" },
 overdue:  { label: "Quá hạn", color: "#EF4444" },
 cancelled: { label: "Đã hủy", color: "#6B7280" },
};

export function InvoiceTab() {
 const [invoices, setInvoices] = useState<Invoice[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const load = async () => {
  try {
 const res = await apiClient.get<{ data: PageData }>("/api/client/invoices", { params: { page: 1, limit: 50 }, throwOnError: false });
 if (!("error" in res)) setInvoices((res as unknown as { data: { data: Invoice[] } }).data.data ?? []);
 } finally {
 setLoading(false);
 }
 };
 load();
 }, []);

 if (loading) return <div style={{ color: DS.text4, textAlign: "center", padding: "3rem" }}>Đang tải...</div>;

 if (invoices.length === 0) {
 return (
 <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
 <Receipt size={40} style={{ color: DS.text4, margin: "0 auto 1rem" }} />
 <h3 style={{ color: DS.text, fontFamily: DS.heading, marginBottom: "0.5rem" }}>Chưa có hóa đơn nào</h3>
 <p style={{ color: DS.text3, fontSize: "0.875rem" }}>Hóa đơn sẽ xuất hiện sau khi bạn hoàn tất thanh toán đơn hàng.</p>
 </div>
 );
 }

 const totalPaid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);

 return (
 <div>
 {/* Summary */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
 {[
 { label: "Tổng hóa đơn", value: invoices.length, color: DS.blue },
 { label: "Đã thanh toán", value: invoices.filter(i => i.status === "paid").length, color: DS.green },
 { label: "Tổng đã thanh toán", value: (totalPaid / 1_000_000).toFixed(1) + "M", color: DS.purple },
 ].map(kpi => (
 <div key={kpi.label} style={{ padding: "1rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}` }}>
 <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "0.25rem" }}>{kpi.label.toUpperCase()}</div>
 <div style={{ color: kpi.color, fontSize: "1.5rem", fontWeight: 800 }}>{kpi.value}</div>
 </div>
 ))}
 </div>

 {/* List */}
 <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
 {invoices.map(inv => {
 const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
 return (
 <div key={inv.id} style={{ padding: "1rem 1.25rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${cfg.color}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <div>
 <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
 <span style={{ color: DS.text, fontWeight: 600, fontSize: "0.875rem", fontFamily: "'JetBrains Mono', monospace" }}>{inv.invoiceNumber}</span>
 <span style={{ padding: "2px 8px", borderRadius: 20, background: `${cfg.color}15`, color: cfg.color, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>
 {cfg.label}
 </span>
 </div>
 <div style={{ color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>
 {new Date(inv.createdAt).toLocaleDateString("vi-VN")}
 {inv.dueDate && ` • Hạn: ${new Date(inv.dueDate).toLocaleDateString("vi-VN")}`}
 </div>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
 <div style={{ textAlign: "right" }}>
 <div style={{ color: DS.text, fontWeight: 700, fontSize: "1rem" }}>{inv.amount.toLocaleString("vi-VN")}đ</div>
 {inv.paidMethod && <div style={{ color: DS.text4, fontSize: "0.625rem" }}>{inv.paidMethod}</div>}
 </div>
 {inv.status === "paid" && <Download size={14} style={{ color: DS.green }} />}
 </div>
 </div>
 );
 })}
 </div>
  </div>
 );
}
