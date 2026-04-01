/**
 * AnalyticsTab — Admin analytics dashboard
 * Pure-SVG charts · no third-party chart libs
 */
import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, TrendingDown, BarChart3, Users, Zap,
  ArrowUpRight, ArrowDownRight, DollarSign, FolderKanban,
  Activity, Filter,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { useLoopStore } from '../../store/loopStore';
import { members, RANKS } from '../team/memberData';

const fmtVND = (n: number) =>
  n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)}B`
  : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M`
  : `${(n / 1_000).toFixed(0)}K`;
const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

// ── Count-up hook ──────────────────────────────────────────────────────────
function useCountUp(target: number, dur = 1200) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, dur]);
  return val;
}

// ── Revenue monthly data ───────────────────────────────────────────────────
const MONTHS = ['T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T1', 'T2', 'T3'];
const REVENUE_DATA = [380, 420, 510, 490, 570, 620, 590, 680, 730, 810, 760, 890]; // × 1M VNĐ
const LP_EARN_DATA  = [12, 14, 18, 16, 20, 23, 21, 25, 28, 32, 30, 35]; // × 1000 LP
const LP_SPEND_DATA = [4, 5, 7, 6, 8, 9, 8, 11, 12, 14, 13, 16];

// ── Bar Chart (pure SVG) ───────────────────────────────────────────────────
function BarChart({
  data, labels, color, color2, stacked, secondData,
  height = 160, yLabel = '', fmt = (v: number) => String(v),
}: {
  data: number[];
  labels: string[];
  color: string;
  color2?: string;
  stacked?: boolean;
  secondData?: number[];
  height?: number;
  yLabel?: string;
  fmt?: (v: number) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = stacked && secondData
    ? Math.max(...data.map((v, i) => v + secondData[i]))
    : Math.max(...data);
  const padL = 36, padR = 12, padT = 16, padB = 28;
  const totalW = 560, totalH = height;
  const chartW = totalW - padL - padR;
  const chartH = totalH - padT - padB;
  const barW = (chartW / data.length) * 0.55;
  const barGap = chartW / data.length;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
    pct: t,
    val: maxVal * t,
    y: padT + chartH * (1 - t),
  }));

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ width: '100%', height, display: 'block' }}>
      {/* Grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL} y1={t.y} x2={padL + chartW} y2={t.y}
            stroke={DS.border} strokeWidth={0.8} strokeDasharray="4 3"
          />
          <text x={padL - 4} y={t.y + 4} textAnchor="end"
            fill={DS.text5} fontSize={9} fontFamily={DS.mono}>
            {fmt(Math.round(t.val))}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((v, i) => {
        const x = padL + barGap * i + barGap / 2 - barW / 2;
        const h1 = (v / maxVal) * chartH;
        const h2 = stacked && secondData ? (secondData[i] / maxVal) * chartH : 0;
        const y1 = padT + chartH - h1;
        const y2 = y1 - h2;
        const isHov = hovered === i;
        return (
          <g key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}>
            {/* primary bar */}
            <rect
              x={x} y={y1} width={barW} height={h1}
              rx={3}
              fill={isHov ? color : `${color}cc`}
              style={{ transition: 'fill 0.15s' }}
            />
            {/* glow effect when hovered */}
            {isHov && (
              <rect
                x={x} y={y1} width={barW} height={h1}
                rx={3}
                fill="none" stroke={color} strokeWidth={1.5}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
            )}
            {/* stacked bar */}
            {stacked && secondData && h2 > 0 && (
              <rect
                x={x} y={y2} width={barW} height={h2}
                rx={3}
                fill={`${color2}aa`}
              />
            )}
            {/* x label */}
            <text x={x + barW / 2} y={padT + chartH + 14} textAnchor="middle"
              fill={isHov ? DS.text3 : DS.text5} fontSize={9} fontFamily={DS.mono}
              style={{ transition: 'fill 0.15s' }}>
              {labels[i]}
            </text>
            {/* Tooltip */}
            {isHov && (
              <g>
                <rect
                  x={Math.min(x + barW / 2 - 32, totalW - padR - 70)} y={y1 - 30}
                  width={64} height={22} rx={5}
                  fill={DS.bgCard} stroke={color} strokeWidth={0.8}
                />
                <text
                  x={Math.min(x + barW / 2, totalW - padR - 38)} y={y1 - 15}
                  textAnchor="middle" fill={color} fontSize={10} fontFamily={DS.mono} fontWeight="bold">
                  {fmt(v)}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Line Chart (pure SVG) ──────────────────────────────────────────────────
function LineChart({
  data, labels, color, height = 120,
  fmt = (v: number) => String(v),
}: {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
  fmt?: (v: number) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const padL = 8, padR = 8, padT = 12, padB = 20;
  const totalW = 560, totalH = height;
  const chartW = totalW - padL - padR;
  const chartH = totalH - padT - padB;
  const n = data.length;

  const pts = data.map((v, i) => ({
    x: padL + (i / (n - 1)) * chartW,
    y: padT + chartH - ((v - minVal) / range) * chartH,
    v,
    i,
  }));

  const pathD = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${padT + chartH} L ${pts[0].x} ${padT + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id={`area-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#area-${color.replace('#','')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2.5}
        style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} strokeLinecap="round" />
      {pts.map(pt => (
        <g key={pt.i}
          onMouseEnter={() => setHovered(pt.i)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: 'pointer' }}>
          <circle cx={pt.x} cy={pt.y} r={hovered === pt.i ? 5 : 3}
            fill={hovered === pt.i ? color : DS.bgCard}
            stroke={color} strokeWidth={2}
            style={{ transition: 'r 0.15s' }} />
          <text x={pt.x} y={padT + chartH + 14} textAnchor="middle"
            fill={hovered === pt.i ? DS.text3 : DS.text5} fontSize={9} fontFamily={DS.mono}
            style={{ transition: 'fill 0.15s' }}>
            {labels[pt.i]}
          </text>
          {hovered === pt.i && (
            <g>
              <rect x={Math.min(pt.x - 28, totalW - padR - 60)} y={pt.y - 26}
                width={56} height={18} rx={4}
                fill={DS.bgCard} stroke={color} strokeWidth={0.8} />
              <text x={Math.min(pt.x, totalW - padR - 30)} y={pt.y - 13}
                textAnchor="middle" fill={color} fontSize={10} fontFamily={DS.mono} fontWeight="bold">
                {fmt(pt.v)}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────
function DonutChart({
  slices, size = 130,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const cx = size / 2, cy = size / 2, r = size * 0.38, strokeW = size * 0.13;
  const gap = 0.025;

  let cumAngle = -Math.PI / 2;
  const arcSlices = slices.map((sl, i) => {
    const pct = sl.value / total;
    const angle = pct * 2 * Math.PI - gap;
    const startA = cumAngle;
    cumAngle += pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startA);
    const y1 = cy + r * Math.sin(startA);
    const endA = startA + angle;
    const x2 = cx + r * Math.cos(endA);
    const y2 = cy + r * Math.sin(endA);
    const large = angle > Math.PI ? 1 : 0;
    return { ...sl, i, x1, y1, x2, y2, large, startA, endA, pct };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcSlices.map(sl => {
        const isHov = hovered === sl.i;
        const scale = isHov ? 1.05 : 1;
        return (
          <path
            key={sl.i}
            d={`M ${cx} ${cy} L ${sl.x1} ${sl.y1} A ${r} ${r} 0 ${sl.large} 1 ${sl.x2} ${sl.y2} Z`}
            fill={isHov ? sl.color : `${sl.color}bb`}
            stroke={DS.bgCard}
            strokeWidth={2}
            onMouseEnter={() => setHovered(sl.i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              cursor: 'pointer',
              transform: isHov ? `scale(${scale})` : 'scale(1)',
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'transform 0.15s, fill 0.15s',
              filter: isHov ? `drop-shadow(0 0 8px ${sl.color})` : 'none',
            }}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.62} fill={DS.bgCard} />
      {hovered !== null ? (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={11} fontWeight="bold" fill={arcSlices[hovered].color} fontFamily={DS.mono}>
            {(arcSlices[hovered].pct * 100).toFixed(0)}%
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill={DS.text5} fontFamily={DS.mono}>
            {arcSlices[hovered].label.slice(0, 8)}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={11} fontWeight="bold" fill={DS.text} fontFamily={DS.mono}>
            {slices.length}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill={DS.text5} fontFamily={DS.mono}>
            HẠNG MỤC
          </text>
        </>
      )}
    </svg>
  );
}

// ── Radar / Spider chart ───────────────────────────────────────────────────
function RadarChart({
  axes, data, color, size = 160,
}: {
  axes: string[];
  data: number[];  // 0-100
  color: string;
  size?: number;
}) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.4;
  const n = axes.length;
  const levels = [0.25, 0.5, 0.75, 1];

  const angleOf = (i: number) => -Math.PI / 2 + (i / n) * 2 * Math.PI;
  const pt = (i: number, pct: number) => ({
    x: cx + r * pct * Math.cos(angleOf(i)),
    y: cy + r * pct * Math.sin(angleOf(i)),
  });

  const dataPath = data.map((v, i) => {
    const { x, y } = pt(i, v / 100);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Web lines */}
      {levels.map(l => {
        const pts = axes.map((_, i) => pt(i, l));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={l} d={d} fill="none" stroke={DS.border} strokeWidth={0.8} />;
      })}
      {/* Spokes */}
      {axes.map((_, i) => {
        const { x, y } = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={DS.border} strokeWidth={0.8} />;
      })}
      {/* Data polygon */}
      <path d={dataPath} fill={`${color}25`} stroke={color} strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 8px ${color}50)` }} />
      {/* Data points */}
      {data.map((v, i) => {
        const { x, y } = pt(i, v / 100);
        return <circle key={i} cx={x} cy={y} r={3} fill={color} stroke={DS.bgCard} strokeWidth={1.5} />;
      })}
      {/* Labels */}
      {axes.map((label, i) => {
        const { x, y } = pt(i, 1.22);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fill={DS.text5} fontSize={9} fontFamily={DS.mono}>
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── Analytics main ─────────────────────────────────────────────────────────
const DEPT_PERFORMANCE = [
  { dept: 'Engineering', score: 88, color: DS.blue, projects: 14, lp: 128000 },
  { dept: 'Design', score: 92, color: DS.purple, projects: 11, lp: 95000 },
  { dept: 'Media', score: 85, color: DS.cyan, projects: 8, lp: 72000 },
  { dept: 'Marketing', score: 79, color: DS.green, projects: 9, lp: 68000 },
  { dept: 'Sales', score: 95, color: DS.amber, projects: 22, lp: 54000 },
  { dept: 'Finance', score: 82, color: DS.red, projects: 5, lp: 41000 },
  { dept: 'HR', score: 88, color: DS.text3, projects: 3, lp: 35000 },
];

const PROJECT_STATUS_SLICES = [
  { label: 'Hoàn thành', value: 48, color: DS.green },
  { label: 'Đang làm', value: 15, color: DS.blue },
  { label: 'Demo', value: 6, color: DS.cyan },
  { label: 'Review', value: 4, color: DS.amber },
  { label: 'Hủy', value: 3, color: DS.red },
];

const CLIENT_TIER_SLICES = [
  { label: 'Diamond', value: 3, color: '#818CF8' },
  { label: 'Platinum', value: 8, color: '#94A3B8' },
  { label: 'Gold', value: 17, color: '#F59E0B' },
  { label: 'Silver', value: 24, color: '#9CA3AF' },
  { label: 'Bronze', value: 31, color: '#A07850' },
];

const RADAR_AXES = ['Doanh thu', 'LP', 'Dự án', 'Khách hàng', 'Đội ngũ', 'Hài lòng'];
const RADAR_DATA = [88, 75, 92, 71, 85, 90];

export function AnalyticsTab() {
  const { orders } = useLoopStore();
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('12m');

  const totalRev = orders.filter(o => !['pending_payment', 'cancelled'].includes(o.status))
    .reduce((s, o) => s + o.budget, 0);
  const totalProj = orders.length;
  const done = orders.filter(o => o.status === 'done').length;
  const totalLP = members.reduce((s, m) => s + m.lpBalance, 0);

  const cntRev = useCountUp(Math.round(totalRev / 1_000_000), 1400);
  const cntLP  = useCountUp(totalLP, 1400);

  const displayMonths = period === '3m' ? 3 : period === '6m' ? 6 : 12;
  const revSlice    = REVENUE_DATA.slice(-displayMonths);
  const lpESlice    = LP_EARN_DATA.slice(-displayMonths);
  const lpSSlice    = LP_SPEND_DATA.slice(-displayMonths);
  const labSlice    = MONTHS.slice(-displayMonths);
  const maxLPBar    = Math.max(...lpESlice);

  return (
    <div className="space-y-5">
      {/* ── Period Filter ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── BÁO CÁO & PHÂN TÍCH</div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          {(['3m', '6m', '12m'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{
                padding: '5px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 11,
                fontFamily: DS.mono, fontWeight: 700,
                background: period === p ? DS.blue : 'transparent',
                color: period === p ? '#fff' : DS.text4,
                transition: 'all 0.15s',
              }}>
              {p === '3m' ? '3 tháng' : p === '6m' ? '6 tháng' : '12 tháng'}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Doanh thu Q1/2026', value: `${cntRev}M VNĐ`, sub: 'Không tính đơn hủy', color: DS.blue, icon: <DollarSign size={16} />, trend: '+28%', up: true },
          { label: 'Tổng LP lưu thông', value: fmtLP(cntLP), sub: 'Season III · All members', color: DS.amber, icon: <Zap size={16} />, trend: '+22%', up: true },
          { label: 'Dự án đã hoàn thành', value: String(done), sub: `/ ${totalProj} tổng`, color: DS.green, icon: <FolderKanban size={16} />, trend: `${Math.round(done / totalProj * 100)}%`, up: true },
          { label: 'Thành viên đội ngũ', value: '27', sub: 'Season III active', color: DS.cyan, icon: <Users size={16} />, trend: 'Full', up: true },
        ].map(k => (
          <motion.div key={k.label} className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ position: 'absolute', top: -30, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${k.color}08`, filter: 'blur(20px)' }} />
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15`, border: `1px solid ${k.color}25` }}>
                <span style={{ color: k.color }}>{k.icon}</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: k.up ? DS.green : DS.red, fontSize: 11 }}>
                {k.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {k.trend}
              </div>
            </div>
            <div style={{ color: k.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700, textShadow: `0 0 12px ${k.color}50` }}>{k.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 4 }}>{k.label}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{k.sub}</div>
            <motion.div className="absolute bottom-0 left-0 h-0.5"
              style={{ background: `linear-gradient(90deg, ${k.color}, transparent)` }}
              initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }} />
          </motion.div>
        ))}
      </div>

      {/* ── Revenue + LP Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Revenue bar chart */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── DOANH THU THEO THÁNG</div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>Đơn vị: Triệu VNĐ</div>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: DS.green, fontSize: 12 }}>
              <TrendingUp size={13} /> +34% YoY
            </div>
          </div>
          <BarChart
            data={revSlice}
            labels={labSlice}
            color={DS.blue}
            height={170}
            fmt={v => `${v}M`}
          />
        </div>

        {/* LP stacked bar */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── LUỒNG LP THÁNG</div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>Đơn vị: Nghìn điểm LP</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: DS.amber }} />
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>Phát hành</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: DS.purple }} />
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>Quy đổi</span>
              </div>
            </div>
          </div>
          <BarChart
            data={lpESlice}
            labels={labSlice}
            color={DS.amber}
            color2={DS.purple}
            stacked
            secondData={lpSSlice}
            height={170}
            fmt={v => `${v}K`}
          />
        </div>
      </div>

      {/* ── Middle row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Client growth line */}
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── TĂNG TRƯỞNG KHÁCH HÀNG</div>
            <div className="flex items-center gap-1.5" style={{ color: DS.cyan, fontSize: 12 }}>
              <Activity size={13} /> Cộng dồn
            </div>
          </div>
          <LineChart
            data={[18, 22, 27, 31, 38, 43, 48, 55, 61, 68, 75, 83].slice(-displayMonths)}
            labels={labSlice}
            color={DS.cyan}
            height={130}
            fmt={v => `${v} KH`}
          />
        </div>

        {/* Project status donut */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── TRẠNG THÁI DỰ ÁN</div>
          <div className="flex items-center gap-4">
            <DonutChart slices={PROJECT_STATUS_SLICES} size={120} />
            <div className="flex-1 space-y-2">
              {PROJECT_STATUS_SLICES.map(sl => (
                <div key={sl.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: sl.color }} />
                    <span style={{ color: DS.text4, fontSize: 11 }}>{sl.label}</span>
                  </div>
                  <span style={{ color: sl.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{sl.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Dept performance horizontal bars */}
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── HIỆU SUẤT THEO PHÒNG BAN</div>
          <div className="space-y-3">
            {DEPT_PERFORMANCE.map(d => (
              <div key={d.dept} className="flex items-center gap-3">
                <div style={{ width: 72, color: DS.text4, fontSize: 11, textAlign: 'right', flexShrink: 0 }}>{d.dept}</div>
                <div className="flex-1 rounded-full overflow-hidden relative" style={{ height: 18, background: DS.bgCard2 }}>
                  <motion.div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ background: `linear-gradient(90deg, ${d.color}60, ${d.color})`, minWidth: 20 }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${d.score}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}>
                    <span style={{ color: '#fff', fontSize: 9, fontFamily: DS.mono, fontWeight: 700, textShadow: '0 0 6px rgba(0,0,0,0.5)' }}>{d.score}%</span>
                  </motion.div>
                </div>
                <div style={{ width: 56, flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{d.projects} DA</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client tier donut + Radar */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── PHÂN LOẠI KH</div>
            <div className="flex items-center gap-3">
              <DonutChart slices={CLIENT_TIER_SLICES} size={90} />
              <div className="flex-1 space-y-1.5">
                {CLIENT_TIER_SLICES.map(sl => (
                  <div key={sl.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: sl.color }} />
                      <span style={{ color: DS.text5, fontSize: 10 }}>{sl.label}</span>
                    </div>
                    <span style={{ color: sl.color, fontSize: 10, fontFamily: DS.mono }}>{sl.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 10 }}>── CHỈ SỐ TỔNG HỢP</div>
            <div className="flex justify-center">
              <RadarChart axes={RADAR_AXES} data={RADAR_DATA} color={DS.purple} size={150} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Top LP Members ── */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── TOP 10 THÀNH VIÊN THEO LP</div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {[...members].sort((a, b) => b.lpBalance - a.lpBalance).slice(0, 10).map((m, i) => {
            const rc = RANKS[m.rank];
            const max = Math.max(...members.map(mm => mm.lpBalance));
            return (
              <div key={m.id} className="flex items-center gap-3">
                <div style={{ width: 16, color: i < 3 ? DS.amber : DS.text5, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, textAlign: 'center', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ border: `1.5px solid ${rc.color}60` }}>
                  <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: DS.text2, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                    <span style={{ color: rc.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, flexShrink: 0 }}>{fmtLP(m.lpBalance)}</span>
                  </div>
                  <div className="rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
                    <motion.div
                      style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})` }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${(m.lpBalance / max) * 100}%` }}
                      transition={{ duration: 1.4, delay: i * 0.04, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
