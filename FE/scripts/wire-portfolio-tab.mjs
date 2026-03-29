/**
 * Wire PortfolioTab → projectsService.getAdminProjects()
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/PortfolioTab.tsx', 'utf8');
let g = f;

// ── 1. Add imports ──────────────────────────────────────────────────────────
const oldReact = "import { useState } from 'react';";
const newReact = "import { useState, useEffect } from 'react';";
if (!g.includes('useEffect }')) g = g.replace(oldReact, newReact);

const oldStoreImport = "import { useLoopStore, type PortfolioProject } from '../../store/loopStore';";
const newStoreImport = `import { useLoopStore, type PortfolioProject } from '../../store/loopStore';
import { projectsService } from '../../../api/projects.service';`;
if (!g.includes('projectsService }')) {
  g = g.replace(oldStoreImport, newStoreImport);
}

// ── 2. Add state + useEffect in PortfolioTab ─────────────────────────────────
const oldTabStart = `export function PortfolioTab() {
  const { portfolio, updateProject, deleteProject, addProject } = useLoopStore();`;

const newTabStart = `export function PortfolioTab() {
  const { portfolio, updateProject, deleteProject, addProject } = useLoopStore();
  const [apiProjects, setApiProjects] = useState<PortfolioProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    setProjectsError('');
    projectsService.getAdminProjects()
      .then(fetched => { if (!cancelled) setApiProjects(fetched); })
      .catch(() => { if (!cancelled) setProjectsError('Không tải được danh sách dự án'); })
      .finally(() => { if (!cancelled) setProjectsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use API projects when loaded, fall back to store
  const displayProjects = projectsLoading && projectsError === '' ? portfolio : apiProjects.length > 0 ? apiProjects : portfolio;`;

g = g.replace(oldTabStart, newTabStart);

// ── 3. Replace portfolio references with displayProjects ──────────────────────
// Header count
g = g.replace('── QUẢN LÝ PORTFOLIO ({portfolio.length} dự án)', '── QUẢN LÝ PORTFOLIO ({displayProjects.length} dự án)');

// Stats: "portfolio.length"
g = g.replace(
  "{ label: 'Tổng dự án', val: portfolio.length, color: DS.blue }",
  "{ label: 'Tổng dự án', val: displayProjects.length, color: DS.blue }"
);
g = g.replace(
  "{ label: 'Có demo', val: portfolio.filter(p => p.hasDemo).length, color: DS.cyan }",
  "{ label: 'Có demo', val: displayProjects.filter(p => p.hasDemo).length, color: DS.cyan }"
);
g = g.replace(
  "{ label: 'Featured', val: portfolio.filter(p => p.featured).length, color: DS.amber }",
  "{ label: 'Featured', val: displayProjects.filter(p => p.featured).length, color: DS.amber }"
);
g = g.replace(
  "{ label: 'Tổng LP phát hành', val: portfolio.reduce((s, p) => s + p.lp, 0).toLocaleString(), color: DS.purple }",
  "{ label: 'Tổng LP phát hành', val: displayProjects.reduce((s, p) => s + (p.lp ?? 0), 0).toLocaleString(), color: DS.purple }"
);

// filtered = portfolio.filter
g = g.replace(
  '  const filtered = portfolio.filter(p =>',
  '  const filtered = displayProjects.filter(p =>'
);

// "portfolio.find(p => p.id === editingProject.id))"
g = g.replace(
  'if (portfolio.find(p => p.id === editingProject.id))',
  'if (displayProjects.find(p => p.id === editingProject.id))'
);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/PortfolioTab.tsx', g, 'utf8');
console.log('Done — PortfolioTab wired to projectsService.getAdminProjects()');
