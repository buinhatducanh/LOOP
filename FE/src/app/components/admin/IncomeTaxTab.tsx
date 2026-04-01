/**
 * IncomeTaxTab — Thống kê thu nhập cá nhân & Thuế TNCN
 * Dùng cho mục đích khai thuế, báo cáo nội bộ
 * Tuân thủ biểu thuế TNCN Việt Nam (lũy tiến 7 bậc)
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, DollarSign, TrendingUp, User, Download,
  ChevronDown, Info, BarChart3, Calculator, Building2,
  Calendar, Printer, Eye, Search, ChevronRight,
  CheckCircle2, AlertTriangle, Users, Shield,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { members, RANKS, type RankKey } from '../team/memberData';

// ── Vietnamese PIT (Thuế TNCN) brackets 2026 ──────────────────────────────

interface TaxBracket {
  from: number; // VND/tháng
  to: number | null;
  rate: number; // percent
  label: string;
}

const PIT_BRACKETS: TaxBracket[] = [
  { from: 0,          to: 5_000_000,   rate: 5,  label: 'Bậc 1' },
  { from: 5_000_000,  to: 10_000_000,  rate: 10, label: 'Bậc 2' },
  { from: 10_000_000, to: 18_000_000,  rate: 15, label: 'Bậc 3' },
  { from: 18_000_000, to: 32_000_000,  rate: 20, label: 'Bậc 4' },
  { from: 32_000_000, to: 52_000_000,  rate: 25, label: 'Bậc 5' },
  { from: 52_000_000, to: 80_000_000,  rate: 30, label: 'Bậc 6' },
  { from: 80_000_000, to: null,         rate: 35, label: 'Bậc 7' },
];

// ── Insurance rates (standard 2026) ──────────────────────────────────────

const INSURANCE = {
  bhxh: 0.08,  // BHXH 8%
  bhyt: 0.015, // BHYT 1.5%
  bhtn: 0.01,  // BHTN 1%
  // Cap: BHXH max = 36.96M/tháng (29 * tl tối thiểu vùng 1 = 29 * 1,272,000 * 20)
  bhxhCap: 36_960_000,
};

// ── Salary base by rank (VND/month) ─────────────────────────────────────

const SALARY_VND: Record<RankKey, number> = {
  iron:     10_000_000,
  bronze:   16_000_000,
  silver:   26_000_000,
  gold:     45_000_000,
  platinum: 75_000_000,
  ruby:    120_000_000,
  diamond: 200_000_000,
};

// ── Income components ─────────────────────────────────────────────────────

interface MonthlyIncome {
  baseSalary: number;       // Lương cứng
  projectBonus: number;     // Thưởng dự án
  performanceBonus: number; // Thưởng hiệu suất
  serviceBonus: number;     // Thu nhập dịch vụ
  tetBonus: number;         // Thưởng tết (tháng 1)
  otherBonus: number;       // Khác
  totalGross: number;
}

// ── Calculation ───────────────────────────────────────────────────────────

function calcInsurance(grossSalary: number) {
  const bhxhBase = Math.min(grossSalary, INSURANCE.bhxhCap);
  const bhxh = bhxhBase * INSURANCE.bhxh;
  const bhyt = grossSalary * INSURANCE.bhyt;
  const bhtn = grossSalary * INSURANCE.bhtn;
  return { bhxh, bhyt, bhtn, total: bhxh + bhyt + bhtn };
}

function calcPersonalDeduction(dependants: number) {
  return 11_000_000 + dependants * 4_400_000; // per month
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
    const tax = taxable * b.rate / 100;
    brackets.push({ label: b.label, base: taxable, rate: b.rate, tax });
    totalTax += tax;
    remaining -= taxable;
  }
  return { tax: totalTax, brackets };
}

// ── Generate sample income data ────────────────────────────────────────────

function genMonthlyIncome(m: typeof members[0], month: number, year: number): MonthlyIncome {
  const base = SALARY_VND[m.rank];
  const isJan = month === 1;
  const isTetMonth = month === 1;
  const levelBonus = m.level * 50_000;

  const baseSalary = base + levelBonus;
  const projectBonus = m.missions > 0
    ? Math.round(base * 0.08 * (0.8 + Math.random() * 0.4))
    : 0;
  const performanceBonus = month % 3 === 0  // quarterly
    ? Math.round(base * 0.2 * (0.7 + Math.random() * 0.6))
    : Math.round(base * 0.05 * (0.5 + Math.random() * 1));
  const serviceBonus = Math.round((m.missions % 5) * 300_000);
  const tetBonus = isTetMonth ? Math.round(base * 1.5) : 0;

  const totalGross = baseSalary + projectBonus + performanceBonus + serviceBonus + tetBonus;
  return { baseSalary, projectBonus, performanceBonus, serviceBonus, tetBonus, otherBonus: 0, totalGross };
}

// ── Format helpers ────────────────────────────────────────────────────────

const fmtVND = (n: number) => {
  if (n >= 1_000_000_000) return `${(n/1_000_000_000).toFixed(3)}B`;
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(3)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}K`;
  return n.toLocaleString('vi-VN');
};
const fmtM = (n: number) => `${(n/1_000_000).toFixed(2)}M VND`;

const MONTHS_VI = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

// ── Tax calculation panel ─────────────────────────────────────────────────

function TaxCalcPanel({ member, year, dependants }: {
  member: typeof members[0];
  year: number;
  dependants: number;
}) {
  const [selectedMonth, setSelectedMonth] = useState<number | 'year'>(3);
  const rc = RANKS[member.rank];

  const monthlyData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => genMonthlyIncome(member, i + 1, year)),
    [member, year]
  );

  const income = selectedMonth === 'year'
    ? {
        baseSalary:       monthlyData.reduce((s, m) => s + m.baseSalary, 0),
        projectBonus:     monthlyData.reduce((s, m) => s + m.projectBonus, 0),
        performanceBonus: monthlyData.reduce((s, m) => s + m.performanceBonus, 0),
        serviceBonus:     monthlyData.reduce((s, m) => s + m.serviceBonus, 0),
        tetBonus:         monthlyData.reduce((s, m) => s + m.tetBonus, 0),
        otherBonus:       0,
        totalGross:       monthlyData.reduce((s, m) => s + m.totalGross, 0),
      }
    : monthlyData[selectedMonth - 1];

  const periodLabel = selectedMonth === 'year' ? `Cả năm ${year}` : MONTHS_VI[Number(selectedMonth) - 1];
  const periodMonths = selectedMonth === 'year' ? 12 : 1;

  const insurance = calcInsurance(income.baseSalary);
  const personalDeduction = calcPersonalDeduction(dependants) * periodMonths;
  const incomeAfterIns = income.totalGross - insurance.total;
  const taxableIncome = Math.max(incomeAfterIns - personalDeduction, 0);
  const { tax, brackets } = calcPIT(taxableIncome);
  const netIncome = income.totalGross - insurance.total - tax;
  const effectiveTaxRate = income.totalGross > 0 ? (tax / income.totalGross * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>KỲ TÍNH THUẾ:</div>
        <div className="flex gap-1 flex-wrap">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
            <button key={m} onClick={() => setSelectedMonth(m)}
              className="px-2.5 py-1.5 rounded-lg"
              style={{ background: selectedMonth === m ? `${DS.blue}15` : DS.bgCard2, border: `1px solid ${selectedMonth === m ? DS.blue + '40' : DS.border}`, color: selectedMonth === m ? DS.blue : DS.text5, fontSize: 10, cursor: 'pointer', fontFamily: DS.mono }}>
              T{m}
            </button>
          ))}
          <button onClick={() => setSelectedMonth('year')}
            className="px-3 py-1.5 rounded-lg"
            style={{ background: selectedMonth === 'year' ? `${DS.amber}15` : DS.bgCard2, border: `1px solid ${selectedMonth === 'year' ? DS.amber + '40' : DS.border}`, color: selectedMonth === 'year' ? DS.amber : DS.text5, fontSize: 10, cursor: 'pointer', fontFamily: DS.mono, fontWeight: 700 }}>
            Cả năm
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Income breakdown */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>
            ── PHÂN TÍCH THU NHẬP · {periodLabel}
          </div>
          {[
            { label: 'Lương cứng',        value: income.baseSalary,       color: DS.green,  pct: income.totalGross > 0 ? income.baseSalary / income.totalGross * 100 : 0 },
            { label: 'Thưởng dự án',       value: income.projectBonus,     color: DS.blue,   pct: income.totalGross > 0 ? income.projectBonus / income.totalGross * 100 : 0 },
            { label: 'Thưởng hiệu suất',   value: income.performanceBonus, color: DS.amber,  pct: income.totalGross > 0 ? income.performanceBonus / income.totalGross * 100 : 0 },
            { label: 'Dịch vụ',            value: income.serviceBonus,     color: DS.cyan,   pct: income.totalGross > 0 ? income.serviceBonus / income.totalGross * 100 : 0 },
            { label: 'Thưởng Tết',         value: income.tetBonus,         color: DS.red,    pct: income.totalGross > 0 ? income.tetBonus / income.totalGross * 100 : 0 },
          ].map(row => (
            <div key={row.label} className="mb-3">
              <div className="flex justify-between mb-1">
                <span style={{ color: DS.text4, fontSize: 11 }}>{row.label}</span>
                <span style={{ color: row.value > 0 ? row.color : DS.text5, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{fmtM(row.value)}</span>
              </div>
              <div style={{ height: 4, background: DS.border, borderRadius: 99, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${row.pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: row.color, borderRadius: 99 }} />
              </div>
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 2 }}>{row.pct.toFixed(1)}%</div>
            </div>
          ))}
          <div className="flex justify-between py-3 mt-2" style={{ borderTop: `2px solid ${DS.border}` }}>
            <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>TỔNG THU NHẬP GỘP</span>
            <span style={{ color: DS.green, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{fmtM(income.totalGross)}</span>
          </div>
        </div>

        {/* Tax calculation */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>
            ── TÍNH THUẾ TNCN · {periodLabel}
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {[
              { label: 'Thu nhập gộp (gross)', value: income.totalGross, color: DS.green, sign: '' },
              { label: `BHXH (8%) + BHYT (1.5%) + BHTN (1%)`, value: -insurance.total, color: DS.amber, sign: '−' },
              { label: `Giảm trừ bản thân (${fmtM(calcPersonalDeduction(0) * periodMonths)})`, value: -calcPersonalDeduction(0) * periodMonths, color: DS.blue, sign: '−' },
              ...(dependants > 0 ? [{ label: `Giảm trừ người phụ thuộc (${dependants} người × 4.4M/tháng)`, value: -(4_400_000 * dependants * periodMonths), color: DS.blue, sign: '−' }] : []),
            ].map((row, i) => (
              <div key={i} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text4, fontSize: 11 }}>{row.label}</span>
                <span style={{ color: row.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                  {row.sign}{fmtM(Math.abs(row.value))}
                </span>
              </div>
            ))}
            <div className="flex justify-between py-2 px-3 rounded-xl" style={{ background: `${DS.purple}08`, border: `1px solid ${DS.purple}20` }}>
              <span style={{ color: DS.text2, fontSize: 12, fontWeight: 700 }}>Thu nhập tính thuế</span>
              <span style={{ color: DS.purple, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtM(taxableIncome)}</span>
            </div>
          </div>

          {/* Tax brackets breakdown */}
          {brackets.length > 0 && (
            <div className="mt-4">
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 8 }}>PHÂN TÍCH THEO BẬC THUẾ</div>
              <div className="space-y-1">
                {brackets.map(b => (
                  <div key={b.label} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, width: 40 }}>{b.label}</span>
                    <span style={{ color: DS.text4, fontSize: 10, flex: 1 }}>{fmtM(b.base)} × {b.rate}%</span>
                    <span style={{ color: DS.red, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{fmtM(b.tax)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary boxes */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Thuế TNCN', value: tax, color: DS.red },
              { label: 'BHXH/YT/TN', value: insurance.total, color: DS.amber },
              { label: 'Thực nhận', value: netIncome, color: DS.green },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                <div style={{ color: s.color, fontSize: 13, fontWeight: 700, fontFamily: DS.mono }}>{fmtM(s.value)}</div>
                <div style={{ color: DS.text5, fontSize: 9, marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Effective rate */}
          <div className="flex items-center justify-between mt-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <span style={{ color: DS.text4, fontSize: 12 }}>Thuế suất thực tế</span>
            <span style={{ color: effectiveTaxRate > 20 ? DS.red : effectiveTaxRate > 10 ? DS.amber : DS.green, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>
              {effectiveTaxRate.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Annual summary chart (SVG bar chart) */}
      {selectedMonth !== 'year' && (
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── BIỂU ĐỒ THU NHẬP GỘP 12 THÁNG / {year}</div>
          <div className="overflow-x-auto">
            <svg width={Math.max(700, 700)} height={160} style={{ display: 'block' }}>
              {monthlyData.map((md, i) => {
                const maxVal = Math.max(...monthlyData.map(m => m.totalGross));
                const barH = maxVal > 0 ? (md.totalGross / maxVal) * 110 : 0;
                const x = i * 58 + 10;
                const isSelected = selectedMonth === i + 1;
                return (
                  <g key={i} onClick={() => setSelectedMonth(i + 1)} style={{ cursor: 'pointer' }}>
                    {/* Bar */}
                    <rect
                      x={x} y={140 - barH} width={44} height={barH}
                      rx={4} fill={isSelected ? DS.blue : `${DS.blue}35`}
                      style={{ transition: 'all 0.3s ease' }}
                    />
                    {/* Label */}
                    <text x={x + 22} y={155} textAnchor="middle" fill={DS.text5} fontSize={9} fontFamily="monospace">T{i + 1}</text>
                    {/* Value */}
                    {barH > 20 && (
                      <text x={x + 22} y={140 - barH - 4} textAnchor="middle" fill={isSelected ? DS.blue : DS.text4} fontSize={8} fontFamily="monospace">
                        {(md.totalGross / 1_000_000).toFixed(0)}M
                      </text>
                    )}
                  </g>
                );
              })}
              {/* Base line */}
              <line x1={0} y1={140} x2={700} y2={140} stroke={DS.border} strokeWidth={1} />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export function IncomeTaxTab() {
  const [selectedMemberId, setSelectedMemberId] = useState<number>(7);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [dependants, setDependants] = useState(0);
  const [search, setSearch] = useState('');

  const selectedMember = members.find(m => m.id === selectedMemberId) ?? members[0];
  const rc = RANKS[selectedMember.rank];
  const baseSalaryVND = SALARY_VND[selectedMember.rank];

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  // Annual income estimate
  const annualData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => genMonthlyIncome(selectedMember, i + 1, selectedYear)),
    [selectedMember, selectedYear]
  );
  const annualGross = annualData.reduce((s, m) => s + m.totalGross, 0);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between p-5 rounded-2xl"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${DS.cyan}15`, border: `1px solid ${DS.cyan}30` }}>
            <Calculator size={22} style={{ color: DS.cyan }} />
          </div>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── BÁO CÁO THUẾ</div>
            <div style={{ color: DS.text, fontSize: 18, fontWeight: 700 }}>Thống kê thu nhập cá nhân</div>
            <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>Biểu thuế TNCN lũy tiến · Năm {selectedYear}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none' }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 10, padding: '8px 16px', color: DS.blue, cursor: 'pointer', fontSize: 12 }}>
            <Printer size={13} /> In báo cáo
          </button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tổng nhân sự', value: members.length, sub: 'trong hệ thống', color: DS.blue, icon: <Users size={18} /> },
          { label: 'Quỹ lương ước tính', value: fmtVND(members.reduce((s, m) => s + SALARY_VND[m.rank] * 12, 0)), sub: `năm ${selectedYear}`, color: DS.green, icon: <DollarSign size={18} /> },
          { label: 'Mức giảm trừ cá nhân', value: '132M', sub: '11M/tháng × 12', color: DS.amber, icon: <Shield size={18} /> },
          { label: 'Biểu thuế hiện hành', value: '7 bậc', sub: '5% → 35%', color: DS.purple, icon: <BarChart3 size={18} /> },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 2 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Layout: member list + detail */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5" style={{ alignItems: 'start' }}>
        {/* Left: member selector */}
        <div className="space-y-3">
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── CHỌN NHÂN VIÊN</div>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <Search size={12} style={{ color: DS.text5 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhân viên..."
              style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 12, flex: 1 }} />
          </div>

          {/* Members */}
          <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 560 }}>
            {filteredMembers.map(m => {
              const mr = RANKS[m.rank];
              const isSelected = m.id === selectedMemberId;
              return (
                <motion.div key={m.id} onClick={() => setSelectedMemberId(m.id)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                  style={{ background: isSelected ? `${mr.color}08` : DS.bgCard, border: `1px solid ${isSelected ? mr.color + '40' : DS.border}` }}
                  whileHover={{ borderColor: mr.color + '30', x: 2 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: `1.5px solid ${mr.color}${isSelected ? '80' : '30'}` }}>
                    <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ color: isSelected ? DS.text : DS.text3, fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ color: mr.color, fontSize: 9, fontFamily: DS.mono }}>{mr.symbol} Lv.{m.level}</div>
                  </div>
                  {isSelected && <ChevronRight size={12} style={{ color: mr.color }} />}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: detail */}
        <div className="xl:col-span-3 space-y-5">
          {/* Selected member header */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${rc.color}30` }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right, ${rc.color}07, transparent 55%)`, pointerEvents: 'none' }} />
            <div className="flex items-center justify-between gap-4 flex-wrap relative">
              <div className="flex items-center gap-4">
                <div style={{ width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${rc.color}`, boxShadow: `0 0 14px ${rc.glowColor}` }}>
                  <img src={selectedMember.img} alt={selectedMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── HỒ SƠ THUẾ</div>
                  <div style={{ color: DS.text, fontSize: 18, fontWeight: 700 }}>{selectedMember.name}</div>
                  <div style={{ color: DS.text4, fontSize: 12, marginTop: 1 }}>{selectedMember.role} · {rc.symbol} {rc.label} · Lv.{selectedMember.level}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-3 rounded-xl text-center" style={{ background: `${DS.green}08`, border: `1px solid ${DS.green}20`, minWidth: 100 }}>
                  <div style={{ color: DS.green, fontFamily: DS.mono, fontWeight: 700, fontSize: 13 }}>{fmtVND(baseSalaryVND)}/th</div>
                  <div style={{ color: DS.text5, fontSize: 9, marginTop: 2 }}>Lương cứng</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: `${DS.cyan}08`, border: `1px solid ${DS.cyan}20`, minWidth: 100 }}>
                  <div style={{ color: DS.cyan, fontFamily: DS.mono, fontWeight: 700, fontSize: 13 }}>{fmtVND(annualGross)}/năm</div>
                  <div style={{ color: DS.text5, fontSize: 9, marginTop: 2 }}>Thu nhập gộp ước tính</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginBottom: 5 }}>NGƯỜI PHỤ THUỘC</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDependants(d => Math.max(0, d - 1))}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>−</button>
                    <span style={{ color: DS.text, fontFamily: DS.mono, fontWeight: 700, fontSize: 16, minWidth: 20, textAlign: 'center' }}>{dependants}</span>
                    <button onClick={() => setDependants(d => d + 1)}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: DS.bgCard, border: `1px solid ${DS.border}`, color: DS.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>+</button>
                  </div>
                  <div style={{ color: DS.text5, fontSize: 9, marginTop: 4 }}>−{fmtVND(4_400_000 * dependants)}/th</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tax calculation */}
          <TaxCalcPanel member={selectedMember} year={selectedYear} dependants={dependants} />

          {/* PIT bracket reference */}
          <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── BIỂU THUẾ TNCN LŨY TIẾN — VIỆT NAM {selectedYear}</div>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {['Bậc', 'Thu nhập tính thuế / tháng', 'Thuế suất', 'Ghi chú'].map(h => (
                      <th key={h} style={{ color: DS.text5, fontFamily: DS.mono, fontSize: 9, letterSpacing: '0.1em', padding: '6px 12px', textAlign: 'left', fontWeight: 400 }}>{h}</th>
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
                        <td style={{ padding: '8px 12px', color: c, fontFamily: DS.mono, fontWeight: 700 }}>{b.label}</td>
                        <td style={{ padding: '8px 12px', color: DS.text3, fontFamily: DS.mono }}>
                          {from_m.toFixed(0)}M – {to_m ? `${to_m.toFixed(0)}M` : 'trở lên'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ color: c, background: `${c}12`, border: `1px solid ${c}25`, borderRadius: 6, padding: '2px 10px', fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{b.rate}%</span>
                        </td>
                        <td style={{ padding: '8px 12px', color: DS.text5, fontSize: 11 }}>
                          {i === 0 ? '≤ 5 triệu' : i === 6 ? 'Thu nhập cao' : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-start gap-2 mt-4 p-3 rounded-xl" style={{ background: `${DS.amber}06`, border: `1px solid ${DS.amber}18` }}>
              <Info size={13} style={{ color: DS.amber, flexShrink: 0, marginTop: 1 }} />
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
