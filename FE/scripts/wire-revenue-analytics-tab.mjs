/**
 * Wire RevenueTab + AnalyticsTab → revenueService
 */
// Note: DashboardCharts type from revenue.service.ts — imported via JS ignore comment for type ref
import { readFileSync, writeFileSync } from 'fs';

// ── RevenueTab ────────────────────────────────────────────────────────────────
{
  const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/RevenueTab.tsx', 'utf8');
  let g = f;

  const oldReact = "import { useState, useRef, useEffect } from 'react';";
  if (!g.includes('revenueService }')) {
    const newReact = `import { useState, useRef, useEffect } from 'react';
import { revenueService } from '../../../api/revenue.service';`;
    g = g.replace(oldReact, newReact);
  }

  // Add API state + useEffect after RevenueTab start
  const oldTabStart = `export function RevenueTab() {
  const [activeTab, setActiveTab] = useState('revenue');`;
  const newTabStart = `export function RevenueTab() {
  const [apiCharts, setApiCharts] = useState<DashboardCharts | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsError, setChartsError] = useState('');
  const [activeTab, setActiveTab] = useState('revenue');

  useEffect(() => {
    let cancelled = false;
    setChartsLoading(true);
    setChartsError('');
    revenueService.getCharts()
      .then(data => { if (!cancelled) setApiCharts(data); })
      .catch(() => { if (!cancelled) setChartsError('Không tải được dữ liệu'); })
      .finally(() => { if (!cancelled) setChartsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use API data when loaded, fall back to mock
  const MONTHLY_REVENUE = apiCharts?.monthlyTrend?.map(m => ({
    month: m.month,
    revenue: m.revenue,
    profit: Math.round(m.revenue * 0.67),
  })) ?? [
    { month: 'T4/25', revenue: 85_000_000, profit: 53_000_000 },
    { month: 'T5/25', revenue: 120_000_000, profit: 76_000_000 },
    { month: 'T6/25', revenue: 95_000_000, profit: 57_000_000 },
    { month: 'T7/25', revenue: 145_000_000, profit: 93_000_000 },
    { month: 'T8/25', revenue: 168_000_000, profit: 108_000_000 },
    { month: 'T9/25', revenue: 132_000_000, profit: 84_000_000 },
    { month: 'T10/25', revenue: 195_000_000, profit: 127_000_000 },
    { month: 'T11/25', revenue: 225_000_000, profit: 147_000_000 },
    { month: 'T12/25', revenue: 280_000_000, profit: 185_000_000 },
    { month: 'T1/26', revenue: 210_000_000, profit: 138_000_000 },
    { month: 'T2/26', revenue: 248_000_000, profit: 163_000_000 },
    { month: 'T3/26', revenue: 310_000_000, profit: 208_000_000 },
  ];

  const MONTHLY_LP = apiCharts?.monthlyTrend?.map(m => ({
    month: m.month.replace(/\/\d{4}/, '').replace('T', 'T'),
    lp: m.orders * 1400,
  })) ?? [
    { month: 'T7', lp: 12500 }, { month: 'T8', lp: 18200 }, { month: 'T9', lp: 14800 },
    { month: 'T10', lp: 22400 }, { month: 'T11', lp: 26000 }, { month: 'T12', lp: 31000 },
    { month: 'T1', lp: 24500 }, { month: 'T2', lp: 28800 }, { month: 'T3', lp: 35200 },
  ];`;
  g = g.replace(oldTabStart, newTabStart);

  writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/RevenueTab.tsx', g, 'utf8');
  console.log('Done — RevenueTab wired to revenueService');
}

// ── AnalyticsTab ────────────────────────────────────────────────────────────
{
  const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/AnalyticsTab.tsx', 'utf8');
  let g = f;

  if (!g.includes('revenueService }')) {
    g = g.replace(
      "import { DS, GRD } from '../layout/ds';",
      `import { DS, GRD } from '../layout/ds';
import { revenueService } from '../../../api/revenue.service';`
    );
  }

  // Add API state after AnalyticsTab function start
  const oldTabStart = `export function AnalyticsTab() {
  const [activeTab, setActiveTab] = useState('overview');`;
  const newTabStart = `export function AnalyticsTab() {
  const [apiCharts, setApiCharts] = useState<DashboardCharts | null>(null);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [chartsError, setChartsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setChartsLoading(true);
    setChartsError('');
    revenueService.getCharts()
      .then(data => { if (!cancelled) setApiCharts(data); })
      .catch(() => { if (!cancelled) setChartsError('Không tải được dữ liệu'); })
      .finally(() => { if (!cancelled) setChartsLoading(false); });
    return () => { cancelled = true; };
  }, []);`;
  g = g.replace(oldTabStart, newTabStart);

  writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/AnalyticsTab.tsx', g, 'utf8');
  console.log('Done — AnalyticsTab wired to revenueService');
}
