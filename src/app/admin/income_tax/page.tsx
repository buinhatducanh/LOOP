"use client";

/**
 * Income Tax Admin Page — LOOP Solutions
 * Route: /admin/income_tax
 * Wire: /api/admin/kpi/dashboard (for member salary data)
 *
 * Full rewrite to match DESIGN LOOPS IncomeTaxTab (533 lines):
 * - Vietnamese PIT progressive tax (7 brackets)
 * - BHXH/BHYT/BHTN insurance deductions
 * - Per-member income breakdown with rank-based salary
 * - TaxCalcPanel: income breakdown + tax calculation steps + bracket breakdown
 * - SVG annual income bar chart
 * - PIT reference table
 */

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { DS } from "@/lib/design-tokens";
import {
  Calculator, DollarSign, Users, Shield, BarChart3,
  ChevronRight, Search, Printer,
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
  iron: { label: "Iron", symbol: "⬡", color: "#9CA3AF", glowColor: "rgba(156,163,175,0.3)" },
  bronze: { label: "Bronze", symbol: "◈", color: "#CD7F32", glowColor: "rgba(205,127,50,0.3)" },
  silver: { label: "Silver", symbol: "◇", color: "#CBD5E1", glowColor: "rgba(203,213,225,0.3)" },
  gold: { label: "Gold", symbol: "★", color: "#FFD700", glowColor: "rgba(255,215,0,0.3)" },
  platinum: { label: "Platinum", symbol: "❋", color: "#14B8A6", glowColor: "rgba(20,184,166,0.3)" },
  ruby: { label: "Ruby", symbol: "♦", color: "#EF4444", glowColor: "rgba(239,68,68,0.3)" },
  diamond: { label: "Diamond", symbol: "✦", color: "#818CF8", glowColor: "rgba(129,140,248,0.3)" },
};

// ── Mock members (from memberData.ts) ─────────────────────────────────────────

interface MockMember {
  id: number;
  name: string;
  role: string;
  rank: RankKey;
  level: number;
  img: string;
  missions: number;
}

const MOCK_MEMBERS: MockMember[] = [
  { id: 1, name: "Akira Tanaka", role: "CEO", rank: "diamond", level: 120, img: "https://i.pravatar.cc/150?img=1", missions: 18 },
  { id: 2, name: "Yuki Sato", role: "Project Manager", rank: "ruby", level: 96, img: "https://i.pravatar.cc/150?img=2", missions: 16 },
  { id: 3, name: "Min-jun Lee", role: "Senior Engineer", rank: "platinum", level: 88, img: "https://i.pravatar.cc/150?img=3", missions: 15 },
  { id: 4, name: "Wei Chen", role: "Tech Lead", rank: "gold", level: 68, img: "https://i.pravatar.cc/150?img=4", missions: 12 },
  { id: 5, name: "Sora Kimura", role: "Designer", rank: "silver", level: 48, img: "https://i.pravatar.cc/150?img=5", missions: 9 },
  { id: 6, name: "Ryo Nakamura", role: "Developer", rank: "silver", level: 42, img: "https://i.pravatar.cc/150?img=6", missions: 8 },
  { id: 7, name: "Hana Park", role: "Media Specialist", rank: "bronze", level: 28, img: "https://i.pravatar.cc/150?img=7", missions: 6 },
  { id: 8, name: "Alex Nguyen", role: "Backend Engineer", rank: "bronze", level: 22, img: "https://i.pravatar.cc/150?img=8", missions: 5 },
  { id: 9, name: "Linh Hoang", role: "Frontend Developer", rank: "iron", level: 8, img: "https://i.pravatar.cc/150?img=9", missions: 2 },
  { id: 10, name: "Minh Tran", role: "QA Engineer", rank: "iron", level: 5, img: "https://i.pravatar.cc/150?img=10", missions: 1 },
];

// ── Tax brackets (Vietnamese PIT 2026 — 7 brackets progressive) ──────────────────

interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
  label: string;
}

const PIT_BRACKETS: TaxBracket[] = [
  { from: 0, to: 5_000_000, rate: 5, label: "Bậc 1" },
  { from: 5_000_000, to: 10_000_000, rate: 10, label: "Bậc 2" },
  { from: 10_000_000, to: 18_000_000, rate: 15, label: "Bậc 3" },
  { from: 18_000_000, to: 32_000_000, rate: 20, label: "Bậc 4" },
  { from: 32_000_000, to: 52_000_000, rate: 25, label: "Bậc 5" },
  { from: 52_000_000, to: 80_000_000, rate: 30, label: "Bậc 6" },
  { from: 80_000_000, to: null, rate: 35, label: "Bậc 7" },
];

// ── Insurance rates (standard 2026) ─────────────────────────────────────────

const INSURANCE = {
  bhxh: 0.08,
  bhyt: 0.015,
  bhtn: 0.01,
  bhxhCap: 36_960_000,
};

// ── Salary base by rank (VND/month) ─────────────────────────────────────────

const SALARY_VND: Record<RankKey, number> = {
  iron: 10_000_000,
  bronze: 16_000_000,
  silver: 26_000_000,
  gold: 45_000_000,
  platinum: 75_000_000,
  ruby: 120_000_000,
  diamond: 200_000_000,
};

// ── Calculation helpers ───────────────────────────────────────────────────────

function calcInsurance(grossSalary: number) {
  const bhxhBase = Math.min(grossSalary, INSURANCE.bhxhCap);
  const bhxh = bhxhBase * INSURANCE.bhxh;
  const bhyt = grossSalary * INSURANCE.bhyt;
  const bhtn = grossSalary * INSURANCE.bhtn;
  return { bhxh, bhyt, bhtn, total: bhxh + bhyt + bhtn };
}

function calcPersonalDeduction(dependants: number) {
  return 11_000_000 + dependants * 4_400_000;
}

function calcPIT(taxableIncome: number): { tax: number; brackets: { label: string; base: number; rate: number; tax: number }[] } {
  if (taxableIncome <= 0) return { tax: 0, brackets: [] };
  let remaining = taxableIncome;
  let totalTax = 0;
  const brackets: { label: string; base: number; rate: number; tax: number }[] = [];

  for (const b of PIT_BRACKETS) {
    if (remaining <= 0) break;
    const bandSize = b.to !== null ? b.to - b.from : Infinity;
    const taxable = Math.min(remaining, bandSize);
    const tax = (taxable * b.rate) / 100;
    brackets.push({ label: b.label, base: taxable, rate: b.rate, tax });
    totalTax += tax;
    remaining -= taxable;
  }
  return { tax: totalTax, brackets };
}

function genMonthlyIncome(m: MockMember, month: number): {
  baseSalary: number; projectBonus: number; performanceBonus: number;
  serviceBonus: number; tetBonus: number; otherBonus: number; totalGross: number;
} {
  const base = SALARY_VND[m.rank];
  const levelBonus = m.level * 50_000;
  const baseSalary = base + levelBonus;
  const projectBonus = m.missions > 0 ? Math.round(base * 0.08 * (0.8 + ((m.id * 37) % 40) / 100)) : 0;
  const performanceBonus = month % 3 === 0 ? Math.round(base * 0.2 * (0.7 + ((m.id * 13) % 60) / 100)) : Math.round(base * 0.05 * (0.5 + ((m.id * 19) % 100) / 100));
  const serviceBonus = Math.round((m.missions % 5) * 300_000);
  const tetBonus = month === 1 ? Math.round(base * 1.5) : 0;
  const totalGross = baseSalary + projectBonus + performanceBonus + serviceBonus + tetBonus;
  return { baseSalary, projectBonus, performanceBonus, serviceBonus, tetBonus, otherBonus: 0, totalGross };
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtVND = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(3)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(3)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("vi-VN");
};

const fmtM = (n: number) => `${(n / 1_000_000).toFixed(2)}M VND`;

const MONTHS_VI = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

// ── Tax Calculation Panel ─────────────────────────────────────────────────────

function TaxCalcPanel({ member, dependants }: { member: MockMember; dependants: number }) {
  const [selectedMonth, setSelectedMonth] = useState<number | "year">("year");
  RANKS[member.rank];

  const monthlyData = useMemo(
    () => Array.from({ length: 12 }, (_, i) => genMonthlyIncome(member, i + 1)),
    [member]
  );

  const income = selectedMonth === "year"
    ? {
      baseSalary: monthlyData.reduce((s, m) => s + m.baseSalary, 0),
      projectBonus: monthlyData.reduce((s, m) => s + m.projectBonus, 0),
      performanceBonus: monthlyData.reduce((s, m) => s + m.performanceBonus, 0),
      serviceBonus: monthlyData.reduce((s, m) => s + m.serviceBonus, 0),
      tetBonus: monthlyData.reduce((s, m) => s + m.tetBonus, 0),
      otherBonus: 0,
      totalGross: monthlyData.reduce((s, m) => s + m.totalGross, 0),
    }
    : monthlyData[selectedMonth - 1];

  const periodLabel = selectedMonth === "year" ? "Cả năm" : MONTHS_VI[Number(selectedMonth) - 1];
  const periodMonths = selectedMonth === "year" ? 12 : 1;

  const insurance = calcInsurance(income.baseSalary);
  const personalDeduction = calcPersonalDeduction(dependants) * periodMonths;
  const incomeAfterIns = income.totalGross - insurance.total;
  const taxableIncome = Math.max(incomeAfterIns - personalDeduction, 0);
  const { tax, brackets } = calcPIT(taxableIncome);
  const netIncome = income.totalGross - insurance.total - tax;
  const effectiveTaxRate = income.totalGross > 0 ? (tax / income.totalGross * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Period selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>KỲ TÍNH THUẾ:</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)}
              style={{
                padding: "5px 10px", borderRadius: 8, fontSize: 10, cursor: "pointer", fontFamily: DS.mono,
                background: selectedMonth === m ? "rgba(59,130,246,0.15)" : DS.bgCard2,
                border: `1px solid ${selectedMonth === m ? DS.blue + "40" : DS.border}`,
                color: selectedMonth === m ? DS.blue : DS.text5,
              }}>
              T{m}
            </button>
          ))}
          <button onClick={() => setSelectedMonth("year")}
            style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer", fontFamily: DS.mono,
              background: selectedMonth === "year" ? "rgba(245,158,11,0.15)" : DS.bgCard2,
              border: `1px solid ${selectedMonth === "year" ? DS.amber + "40" : DS.border}`,
              color: selectedMonth === "year" ? DS.amber : DS.text5,
              fontWeight: 700,
            }}>
            Cả năm
          </button>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", flexWrap: "wrap" }}>
        {/* Income breakdown */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 14 }}>
            ── PHÂN TÍCH THU NHẬP · {periodLabel}
          </div>
          {[
            { label: "Lương cứng", value: income.baseSalary, color: DS.green, pct: income.totalGross > 0 ? income.baseSalary / income.totalGross * 100 : 0 },
            { label: "Thưởng dự án", value: income.projectBonus, color: DS.blue, pct: income.totalGross > 0 ? income.projectBonus / income.totalGross * 100 : 0 },
            { label: "Thưởng hiệu suất", value: income.performanceBonus, color: DS.amber, pct: income.totalGross > 0 ? income.performanceBonus / income.totalGross * 100 : 0 },
            { label: "Dịch vụ", value: income.serviceBonus, color: DS.cyan, pct: income.totalGross > 0 ? income.serviceBonus / income.totalGross * 100 : 0 },
            { label: "Thưởng Tết", value: income.tetBonus, color: DS.red, pct: income.totalGross > 0 ? income.tetBonus / income.totalGross * 100 : 0 },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: DS.text4, fontSize: 11 }}>{row.label}</span>
                <span style={{ color: row.value > 0 ? row.color : DS.text5, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{fmtM(row.value)}</span>
              </div>
              <div style={{ height: 4, background: DS.border, borderRadius: 99, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${row.pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ height: "100%", background: row.color, borderRadius: 99 }}
                />
              </div>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 2 }}>{row.pct.toFixed(1)}%</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, marginTop: 4, borderTop: `2px solid ${DS.border}` }}>
            <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>TỔNG THU NHẬP GỘP</span>
            <span style={{ color: DS.green, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{fmtM(income.totalGross)}</span>
          </div>
        </div>

        {/* Tax calculation */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 14 }}>
            ── TÍNH THUẾ TNCN · {periodLabel}
          </div>

          {/* Calculation steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: "Thu nhập gộp (gross)", value: income.totalGross, color: DS.green, sign: "" },
              { label: "BHXH (8%) + BHYT (1.5%) + BHTN (1%)", value: -insurance.total, color: DS.amber, sign: "−" },
              { label: `Giảm trừ bản thân (${fmtM(calcPersonalDeduction(0) * periodMonths)})`, value: -calcPersonalDeduction(0) * periodMonths, color: DS.blue, sign: "−" },
              ...(dependants > 0 ? [{ label: `Giảm trừ người phụ thuộc (${dependants} người × 4.4M/tháng)`, value: -(4_400_000 * dependants * periodMonths), color: DS.blue, sign: "−" }] : []),
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, paddingBottom: 8, borderBottom: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text4, fontSize: 11 }}>{row.label}</span>
                <span style={{ color: row.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                  {row.sign}{fmtM(Math.abs(row.value))}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, background: `${DS.purple}08`, border: `1px solid ${DS.purple}20`, marginTop: 4 }}>
              <span style={{ color: DS.text2, fontSize: 12, fontWeight: 700 }}>Thu nhập tính thuế</span>
              <span style={{ color: DS.purple, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtM(taxableIncome)}</span>
            </div>
          </div>

          {/* Tax brackets breakdown */}
          {brackets.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 8 }}>PHÂN TÍCH THEO BẬC THUẾ</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {brackets.map(b => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 12, background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, width: 40 }}>{b.label}</span>
                    <span style={{ color: DS.text4, fontSize: 10, flex: 1 }}>{fmtM(b.base)} × {b.rate}%</span>
                    <span style={{ color: DS.red, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{fmtM(b.tax)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary boxes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
            {[
              { label: "Thuế TNCN", value: tax, color: DS.red },
              { label: "BHXH/YT/TN", value: insurance.total, color: DS.amber },
              { label: "Thực nhận", value: netIncome, color: DS.green },
            ].map(s => (
              <div key={s.label} style={{ background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: 12, padding: "10px", textAlign: "center" }}>
                <div style={{ color: s.color, fontSize: 12, fontWeight: 700, fontFamily: DS.mono }}>{fmtM(s.value)}</div>
                <div style={{ color: DS.text5, fontSize: 9, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Effective rate */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "10px 12px", borderRadius: 12, background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <span style={{ color: DS.text4, fontSize: 12 }}>Thuế suất thực tế</span>
            <span style={{
              color: effectiveTaxRate > 20 ? DS.red : effectiveTaxRate > 10 ? DS.amber : DS.green,
              fontFamily: DS.mono, fontWeight: 700, fontSize: 14,
            }}>
              {effectiveTaxRate.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Annual bar chart (SVG) */}
      {selectedMonth !== "year" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 16 }}>── BIỂU ĐỒ THU NHẬP GỘP 12 THÁNG</div>
          <div style={{ overflowX: "auto" }}>
            <svg width={Math.max(700, 700)} height={160} style={{ display: "block", minWidth: 400 }}>
              {monthlyData.map((md, i) => {
                const maxVal = Math.max(...monthlyData.map(m => m.totalGross));
                const barH = maxVal > 0 ? (md.totalGross / maxVal) * 110 : 0;
                const x = i * 58 + 10;
                const isSelected = selectedMonth === i + 1;
                return (
                  <g key={i} onClick={() => setSelectedMonth(i + 1)} style={{ cursor: "pointer" }}>
                    <rect
                      x={x} y={140 - barH} width={44} height={barH}
                      rx={4} fill={isSelected ? DS.blue : `${DS.blue}35`}
                    />
                    <text x={x + 22} y={155} textAnchor="middle" fill={DS.text5} fontSize={9} fontFamily="monospace">T{i + 1}</text>
                    {barH > 20 && (
                      <text x={x + 22} y={140 - barH - 4} textAnchor="middle" fill={isSelected ? DS.blue : DS.text4} fontSize={8} fontFamily="monospace">
                        {(md.totalGross / 1_000_000).toFixed(0)}M
                      </text>
                    )}
                  </g>
                );
              })}
              <line x1={0} y1={140} x2={700} y2={140} stroke={DS.border} strokeWidth={1} />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function IncomeTaxPage() {
  const [selectedMemberId, setSelectedMemberId] = useState<number>(3);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [dependants, setDependants] = useState(0);
  const [search, setSearch] = useState("");

  const selectedMember = MOCK_MEMBERS.find(m => m.id === selectedMemberId) ?? MOCK_MEMBERS[0];
  const rc = RANKS[selectedMember.rank];
  const baseSalaryVND = SALARY_VND[selectedMember.rank];

  const filteredMembers = MOCK_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  const annualData = useMemo(
    () => Array.from({ length: 12 }, (_, i) => genMonthlyIncome(selectedMember, i + 1)),
    [selectedMember]
  );
  const annualGross = annualData.reduce((s, m) => s + m.totalGross, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", borderRadius: 16, background: DS.bgCard, border: `1px solid ${DS.border}`, marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${DS.cyan}15`, border: `1px solid ${DS.cyan}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calculator size={22} style={{ color: DS.cyan }} />
          </div>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── BÁO CÁO THUẾ</div>
            <div style={{ color: DS.text, fontSize: 18, fontWeight: 700 }}>Thống kê thu nhập cá nhân</div>
            <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>Biểu thuế TNCN lũy tiến · Năm {selectedYear}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 12, outline: "none" }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 10, padding: "8px 16px", color: DS.blue, cursor: "pointer", fontSize: 12 }}>
            <Printer size={13} /> In báo cáo
          </button>
        </div>
      </div>

      {/* Stats overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Tổng nhân sự", value: MOCK_MEMBERS.length, sub: "trong hệ thống", color: DS.blue, icon: <Users size={18} /> },
          { label: "Quỹ lương ước tính", value: fmtVND(MOCK_MEMBERS.reduce((s, m) => s + SALARY_VND[m.rank] * 12, 0)), sub: `năm ${selectedYear}`, color: DS.green, icon: <DollarSign size={18} /> },
          { label: "Mức giảm trừ cá nhân", value: "132M", sub: "11M/tháng × 12", color: DS.amber, icon: <Shield size={18} /> },
          { label: "Biểu thuế hiện hành", value: "7 bậc", sub: "5% → 35%", color: DS.purple, icon: <BarChart3 size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 2 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main layout: member list + detail */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.25rem", alignItems: "start" }}>
        {/* Left: member selector */}
        <div>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 12 }}>── CHỌN NHÂN VIÊN</div>

          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, background: DS.bgCard, border: `1px solid ${DS.border}`, marginBottom: 12 }}>
            <Search size={12} style={{ color: DS.text5 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân viên..."
              style={{ background: "none", border: "none", outline: "none", color: DS.text3, fontSize: 12, flex: 1 }} />
          </div>

          {/* Members */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", maxHeight: 560 }}>
            {filteredMembers.map(m => {
              const mr = RANKS[m.rank];
              const isSelected = m.id === selectedMemberId;
              return (
                <motion.div
                  key={m.id}
                  onClick={() => setSelectedMemberId(m.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    borderRadius: 12, cursor: "pointer",
                    background: isSelected ? `${mr.color}08` : DS.bgCard,
                    border: `1px solid ${isSelected ? mr.color + "40" : DS.border}`,
                  }}
                  whileHover={{ borderColor: mr.color + "30", x: 2 }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${mr.color}${isSelected ? "80" : "30"}` }}>
                    <img src={m.img} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: isSelected ? DS.text : DS.text3, fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                    <div style={{ color: mr.color, fontSize: 9, fontFamily: DS.mono }}>{mr.symbol} Lv.{m.level}</div>
                  </div>
                  {isSelected && <ChevronRight size={12} style={{ color: mr.color }} />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Selected member header */}
          <div style={{ background: DS.bgCard, border: `1px solid ${rc.color}30`, borderRadius: 16, padding: "1.25rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top right, ${rc.color}07, transparent 55%)`, pointerEvents: "none" }} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", border: `2px solid ${rc.color}`, boxShadow: `0 0 14px ${rc.glowColor}` }}>
                  <img src={selectedMember.img} alt={selectedMember.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <div style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── HỒ SƠ THUẾ</div>
                  <div style={{ color: DS.text, fontSize: 18, fontWeight: 700 }}>{selectedMember.name}</div>
                  <div style={{ color: DS.text4, fontSize: 12, marginTop: 1 }}>{selectedMember.role} · {rc.symbol} {rc.label} · Lv.{selectedMember.level}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ padding: "10px 16px", borderRadius: 12, background: `${DS.green}08`, border: `1px solid ${DS.green}20`, textAlign: "center" }}>
                  <div style={{ color: DS.green, fontFamily: DS.mono, fontWeight: 700, fontSize: 13 }}>{fmtVND(baseSalaryVND)}/th</div>
                  <div style={{ color: DS.text5, fontSize: 9, marginTop: 2 }}>Lương cứng</div>
                </div>
                <div style={{ padding: "10px 16px", borderRadius: 12, background: `${DS.cyan}08`, border: `1px solid ${DS.cyan}20`, textAlign: "center" }}>
                  <div style={{ color: DS.cyan, fontFamily: DS.mono, fontWeight: 700, fontSize: 13 }}>{fmtVND(annualGross)}/năm</div>
                  <div style={{ color: DS.text5, fontSize: 9, marginTop: 2 }}>Thu nhập gộp ước tính</div>
                </div>
                <div style={{ padding: "10px 16px", borderRadius: 12, background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginBottom: 6 }}>NGƯỜI PHỤ THUỘC</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => setDependants(d => Math.max(0, d - 1))}
                      style={{ width: 24, height: 24, borderRadius: "50%", background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>−</button>
                    <span style={{ color: DS.text, fontFamily: DS.mono, fontWeight: 700, fontSize: 16, minWidth: 20, textAlign: "center" }}>{dependants}</span>
                    <button onClick={() => setDependants(d => d + 1)}
                      style={{ width: 24, height: 24, borderRadius: "50%", background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>+</button>
                  </div>
                  <div style={{ color: DS.text5, fontSize: 9, marginTop: 4 }}>−{fmtVND(4_400_000 * dependants)}/th</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tax calculation */}
          <TaxCalcPanel member={selectedMember} dependants={dependants} />

          {/* PIT bracket reference table */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 14 }}>── BIỂU THUẾ TNCN LŨY TIẾN — VIỆT NAM {selectedYear}</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Bậc", "Thu nhập tính thuế / tháng", "Thuế suất", "Ghi chú"].map(h => (
                      <th key={h} style={{ color: DS.text5, fontFamily: DS.mono, fontSize: 9, letterSpacing: "0.1em", padding: "6px 12px", textAlign: "left", fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PIT_BRACKETS.map((b, i) => {
                    const from_m = b.from / 1_000_000;
                    const to_m = b.to ? b.to / 1_000_000 : null;
                    const colors = [DS.green, DS.cyan, DS.blue, DS.amber, DS.amber, DS.red, DS.red];
                    const c = colors[i];
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "8px 12px", color: c, fontFamily: DS.mono, fontWeight: 700 }}>{b.label}</td>
                        <td style={{ padding: "8px 12px", color: DS.text3, fontFamily: DS.mono }}>
                          {from_m.toFixed(0)}M – {to_m ? `${to_m.toFixed(0)}M` : "trở lên"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ color: c, background: `${c}12`, border: `1px solid ${c}25`, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{b.rate}%</span>
                        </td>
                        <td style={{ padding: "8px 12px", color: DS.text5, fontSize: 11 }}>
                          {i === 0 ? "≤ 5 triệu" : i === 6 ? "Thu nhập cao" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 16, padding: "10px 12px", borderRadius: 12, background: `${DS.amber}06`, border: `1px solid ${DS.amber}18` }}>
              <span style={{ color: DS.amber, flexShrink: 0, marginTop: 1 }}>ℹ</span>
              <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.65 }}>
                Giảm trừ bản thân: <strong style={{ color: DS.text3 }}>11.000.000 VND/tháng</strong> · Giảm trừ người phụ thuộc: <strong style={{ color: DS.text3 }}>4.400.000 VND/người/tháng</strong> · BHXH/BHYT/BHTN được khấu trừ trước khi tính thuế. Số liệu mang tính tham khảo theo Thông tư 111/2013/TT-BTC sửa đổi 2024.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
