/**
 * Wire ClientsTab → revenueService.getSalesLeads()
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/ClientsTab.tsx', 'utf8');
let g = f;

// ── 1. Add imports ──────────────────────────────────────────────────────────
if (!g.includes('useEffect }')) {
  g = g.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");
}

if (!g.includes('revenueService }')) {
  g = g.replace(
    "import { DS, GRD } from '../layout/ds';",
    `import { DS, GRD } from '../layout/ds';
import { revenueService } from '../../../api/revenue.service';`
  );
}

// ── 2. Add API state after ClientsTab function start ────────────────────────
const oldTabStart = `export function ClientsTab() {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [selected, setSelected] = useState<Client | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rankFilter, setRankFilter] = useState<string>('all');`;

const newTabStart = `export function ClientsTab() {
  const [apiClients, setApiClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [selected, setSelected] = useState<Client | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rankFilter, setRankFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    setClientsLoading(true);
    setClientsError('');
    revenueService.getSalesLeads({ limit: 50 })
      .then(({ leads }) => {
        if (!cancelled) {
          const mapped: Client[] = leads.map(l => ({
            id: Number(l.id),
            name: l.name,
            company: l.company,
            email: l.email,
            phone: l.phone,
            industry: l.industry,
            website: l.website,
            status: (l.status ?? 'prospect') as Client['status'],
            totalSpend: l.totalSpent,
            projects: l.projectCount,
            lpBalance: l.lpBalance,
            rank: (l.rank ?? 'standard') as Client['rank'],
            joinDate: l.createdAt ? new Date(l.createdAt).toLocaleDateString('vi-VN') : '',
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=' + l.name.replace(/\s/g, '+'),
            note: l.note ?? '',
          }));
          setApiClients(mapped);
        }
      })
      .catch(() => { if (!cancelled) setClientsError('Không tải được danh sách khách hàng'); })
      .finally(() => { if (!cancelled) setClientsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use API clients when loaded, fall back to mock
  const displayClients = clientsLoading && clientsError === '' ? clients : apiClients.length > 0 ? apiClients : clients;`;

g = g.replace(oldTabStart, newTabStart);

// ── 3. Replace filtered to use displayClients ───────────────────────────────
g = g.replace(
  `const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQ.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchRank = rankFilter === 'all' || c.rank === rankFilter;
    return matchSearch && matchStatus && matchRank;
  });

  const totalRevenue = clients.reduce((s, c) => s + c.totalSpend, 0);`,
  `const filtered = displayClients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQ.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchRank = rankFilter === 'all' || c.rank === rankFilter;
    return matchSearch && matchStatus && matchRank;
  });

  const totalRevenue = displayClients.reduce((s, c) => s + c.totalSpend, 0);`
);

// ── 4. Replace activeCount and prospectCount to use displayClients ──────────
g = g.replace(
  `const activeCount = clients.filter(c => c.status === 'active').length;
  const prospectCount = clients.filter(c => c.status === 'prospect').length;`,
  `const activeCount = displayClients.filter(c => c.status === 'active').length;
  const prospectCount = displayClients.filter(c => c.status === 'prospect').length;`
);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/ClientsTab.tsx', g, 'utf8');
console.log('Done — ClientsTab wired to revenueService.getSalesLeads()');
