"use client";

/**
 * Income Tax Admin Page — LOOP Solutions
 * Route: /admin/income_tax
 * Wire: /api/admin/kpi/dashboard (for revenue data)
 *
 * Shows income summary and tax calculation info.
 * Real tax calculation requires payroll/member income data from DB.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Calculator, RefreshCw, TrendingUp, Users, DollarSign, Info } from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const fmtB = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

type MemberIncome = {
  memberId: string;
  memberName: string;
  department: string;
  totalIncome: number;
  taxCode: string;
  status: string;
};

const TAX_BRACKETS = [
  { min: 0, max: 5_000_000, rate: 0, label: "0%" },
  { min: 5_000_001, max: 10_000_000, rate: 5, label: "5%" },
  { min: 10_000_001, max: 18_000_000, rate: 10, label: "10%" },
  { min: 18_000_001, max: 32_000_000, rate: 15, label: "15%" },
  { min: 32_000_001, max: 52_000_000, rate: 20, label: "20%" },
  { min: 52_000_001, max: 80_000_000, rate: 25, label: "25%" },
  { min: 80_000_001, max: Infinity, rate: 30, label: "30%" },
];

function getTaxRate(income: number) {
  const bracket = TAX_BRACKETS.find(b => income > b.min && income <= b.max);
  return bracket?.rate ?? 0;
}

export default function IncomeTaxPage() {
  const [period, setPeriod] = useState("30");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "kpi", "dashboard", period],
    queryFn: () =>
      adminApi.get<{ data: { summary: Record<string,number> } }>("/api/admin/kpi/dashboard", { params: { period } }),
  });

  const summary = data?.data?.summary ?? {};
  const totalRevenue = summary.totalRevenue ?? 0;
  const totalProjects = summary.totalProjects ?? 0;

  // Mock member income data for display (replace with real /api/admin/member-incomes when exists)
  const mockMemberIncomes: MemberIncome[] = [
    { memberId: "m1", memberName: "Nguyễn Văn A", department: "Engineering", totalIncome: 25_000_000, taxCode: "TAX-001", status: "paid" },
    { memberId: "m2", memberName: "Trần Thị B", department: "Design", totalIncome: 22_000_000, taxCode: "TAX-002", status: "paid" },
    { memberId: "m3", memberName: "Lê Văn C", department: "Sales", totalIncome: 45_000_000, taxCode: "TAX-003", status: "pending" },
    { memberId: "m4", memberName: "Phạm Thị D", department: "Marketing", totalIncome: 18_000_000, taxCode: "TAX-004", status: "paid" },
    { memberId: "m5", memberName: "Hoàng Văn E", department: "Finance", totalIncome: 35_000_000, taxCode: "TAX-005", status: "pending" },
  ];

  const totalGrossIncome = mockMemberIncomes.reduce((s, m) => s + m.totalIncome, 0);
  const totalEstimatedTax = mockMemberIncomes.reduce((s, m) => s + (m.totalIncome * getTaxRate(m.totalIncome) / 100), 0);
  const netIncome = totalGrossIncome - totalEstimatedTax;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Thu nhập & Thuế
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {period} ngày · Báo cáo thuế thu nhập cá nhân
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "6px 12px", color: DS.text3, fontSize: 12, fontFamily: DS.mono, cursor: "pointer" }}
          >
            <option value="30">30 ngày</option>
            <option value="90">90 ngày</option>
            <option value="365">1 năm</option>
          </select>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      {/* Note */}
      <div style={{ background: `${DS.blue}08`, border: `1px solid ${DS.blue}25`, borderRadius: 10, padding: "0.875rem 1rem", marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <Info size={14} style={{ color: DS.blue, flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: DS.text3, fontFamily: DS.body }}>
          Thuế TNCN tính theo biểu thuế lũy tiến Việt Nam (Luật Thuế TNCN sửa đổi).
          Dữ liệu thu nhập thực tế cần kết nối với bảng lương / hợp đồng trong DB.
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tổng thu nhập</span>
            <DollarSign size={14} style={{ color: DS.green }} />
          </div>
          <div style={{ color: DS.green, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(totalGrossIncome)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmtVND(totalGrossIncome)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Thuế ước tính</span>
            <Calculator size={14} style={{ color: DS.red }} />
          </div>
          <div style={{ color: DS.red, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(totalEstimatedTax)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmtVND(totalEstimatedTax)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Thu nhập ròng</span>
            <TrendingUp size={14} style={{ color: DS.amber }} />
          </div>
          <div style={{ color: DS.amber, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(netIncome)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmtVND(netIncome)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Nhân viên</span>
            <Users size={14} style={{ color: DS.blue }} />
          </div>
          <div style={{ color: DS.blue, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{mockMemberIncomes.length}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>đã kê khai</div>
        </motion.div>
      </div>

      {/* Tax brackets */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: "0 0 1rem" }}>Biểu thuế TNCN (lũy tiến)</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {TAX_BRACKETS.filter(b => b.max !== Infinity).map(b => (
            <div key={b.label} style={{ background: `${DS.red}08`, border: `1px solid ${DS.red}25`, borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>{fmtVND(b.min)} – {fmtVND(b.max)}</div>
              <div style={{ color: DS.red, fontSize: 13, fontWeight: 700, fontFamily: DS.mono }}>{b.label}</div>
            </div>
          ))}
          <div style={{ background: `${DS.red}10`, border: `1px solid ${DS.red}40`, borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>&gt; {fmtVND(80_000_000)}</div>
            <div style={{ color: DS.red, fontSize: 13, fontWeight: 700, fontFamily: DS.mono }}>30%</div>
          </div>
        </div>
      </div>

      {/* Member income table */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem", borderBottom: `1px solid ${DS.border}` }}>
          <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: 0 }}>Thu nhập cá nhân (tham khảo)</h3>
        </div>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                  {["Nhân viên", "Phòng ban", "Thu nhập tháng", "Thuế suất", "Thuế", "Mã số thuế", "Trạng thái"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockMemberIncomes.map(m => {
                  const taxRate = getTaxRate(m.totalIncome);
                  const tax = m.totalIncome * taxRate / 100;
                  return (
                    <tr key={m.memberId} style={{ borderBottom: `1px solid ${DS.border}` }}>
                      <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 600 }}>{m.memberName}</td>
                      <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{m.department}</td>
                      <td style={{ padding: "12px 16px", color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(m.totalIncome)}</td>
                      <td style={{ padding: "12px 16px", color: DS.red, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{taxRate}%</td>
                      <td style={{ padding: "12px 16px", color: DS.red, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(tax)}</td>
                      <td style={{ padding: "12px 16px", color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>{m.taxCode}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: m.status === "paid" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: m.status === "paid" ? DS.green : DS.amber, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                          {m.status === "paid" ? "Đã nộp" : "Chưa nộp"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
