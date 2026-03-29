"use strict";
const fs = require("fs");
let c = fs.readFileSync("src/app/pages/CustomerDashboard.tsx", "utf8");

// ── 1. Add ordersService import ──────────────────────────────────────────────────
if (!c.includes("import { ordersService, Order }")) {
  c = c.replace(
    "import { academyService, StudentEnrollment } from '../api/academy.service';",
    "import { academyService, StudentEnrollment } from '../api/academy.service';\nimport { ordersService, Order } from '../api/orders.service';"
  );
}

// ── 2. Replace HomeTab body (after `const GLD =`) ──────────────────────────
const OLD_HOME_START = `function HomeTab({ onSelect }: { onSelect: (s: string) => void }) {
  const CUSTOMER = useCustomerProfile();
  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];
  const PROJECTS = [`;

const NEW_HOME_START = `function HomeTab({ onSelect }: { onSelect: (s: string) => void }) {
  const CUSTOMER = useCustomerProfile();
  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];
  const { user } = useAuthStore();

  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user?.email) { setHomeLoading(false); return; }
    ordersService.getOrders({ customerEmail: user.email, limit: 20 })
      .then(({ orders: fetched }) => {
        if (cancelled) return;
        const mapped = fetched.map((o) => ({
          id: o.id, clientId: 2, clientName: o.customerName,
          clientCompany: o.companyName ?? 'Khách hàng LOOP',
          clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&crop=faces',
          type: 'service' as const, serviceType: 'thiet-ke-web' as const,
          serviceTitle: o.packageTitle || 'Dịch vụ LOOP',
          title: o.packageTitle || "Đơn hàng " + o.orderNumber,
          budget: o.totalAmount ?? 0, lpUsed: o.lpUsed, lpReward: o.lpReward,
          status: (o.status as Order['status']) ?? 'pending_payment',
          progress: o.status === 'done' ? 100 : o.status === 'demo_ready' ? 85 : o.status === 'in_progress' ? 55 : o.status === 'paid' ? 20 : 0,
          createdAt: new Date(o.createdAt).toLocaleDateString('vi-VN'),
          updatedAt: new Date(o.updatedAt).toLocaleDateString('vi-VN'),
          invoiceId: o.orderNumber, assignedPM: null, tags: [], messages: [],
          demoUrl: o.demoUrl, maskedUrl: o.maskedUrl,
        }));
        setClientOrders(mapped);
      })
      .finally(() => { if (!cancelled) setHomeLoading(false); });
    return () => { cancelled = true; };
  }, [user?.email]);

  const HOME_PROJECTS = clientOrders.length > 0
    ? clientOrders.slice(0, 3).map((o) => ({
        id: o.id, name: o.packageTitle || o.title,
        type: 'Web Development',
        status: o.status === 'done' ? 'done' : o.status === 'in_progress' ? 'doing' : o.status === 'demo_ready' ? 'review' : 'todo',
        progress: o.progress,
        pm: members[3], pmImg: members[3].img,
        deadline: o.updatedAt,
        budget: o.totalAmount ? (o.totalAmount / 1_000_000).toFixed(0) + "M VNĐ" : 'N/A',
        tags: o.tags,
      }))
    : [`;

c = c.replace(OLD_HOME_START, NEW_HOME_START);

// ── 3. Replace the old fallback PROJECTS items ──────────────────────────────
const OLD_PROJECTS = `    { id: 'p1', name: 'Website Công ty TechViet', type: 'Web Development', status: 'doing', progress: 65, pm: 'Yuna Park', pmImg: members[3].img, deadline: '28/03/2026', budget: '85M VNĐ', tags: ['React', 'TailwindCSS', 'Node.js'] },
    { id: 'p2', name: 'App Mobile TechViet v2', type: 'Mobile App', status: 'review', progress: 90, pm: 'Shin Watanabe', pmImg: members[4].img, deadline: '01/04/2026', budget: '120M VNĐ', tags: ['React Native', 'AWS'] },
    { id: 'p3', name: 'SEO & Content Q2/2026', type: 'Marketing', status: 'todo', progress: 10, pm: 'Mei Lin', pmImg: members[1].img, deadline: '30/06/2026', budget: '45M VNĐ', tags: ['SEO', 'Content', 'Analytics'] },
  ];

  const STATUS_CFG`;

const NEW_PROJECTS = `        { id: 'p1', name: 'Website Công ty TechViet', type: 'Web Development', status: 'doing', progress: 65, pm: members[3], pmImg: members[3].img, deadline: '28/03/2026', budget: '85M VNĐ', tags: ['React', 'TailwindCSS', 'Node.js'] },
        { id: 'p2', name: 'App Mobile TechViet v2', type: 'Mobile App', status: 'review', progress: 90, pm: members[4], pmImg: members[4].img, deadline: '01/04/2026', budget: '120M VNĐ', tags: ['React Native', 'AWS'] },
        { id: 'p3', name: 'SEO & Content Q2/2026', type: 'Marketing', status: 'todo', progress: 10, pm: members[1], pmImg: members[1].img, deadline: '30/06/2026', budget: '45M VNĐ', tags: ['SEO', 'Content', 'Analytics'] },
      ];

  const homeActiveCount = HOME_PROJECTS.filter(p => p.status === 'doing' || p.status === 'review').length;
  const lpEarnedTotal = clientOrders.length > 0
    ? clientOrders.reduce((s, o) => s + (o.lpReward ?? 0), 0)
    : CUSTOMER.lpEarned;

  const STATUS_CFG`;

c = c.replace(OLD_PROJECTS, NEW_PROJECTS);

// ── 4. Update quick stats ─────────────────────────────────────────────────
c = c.replace(
  "{ label: 'Dự án đang chạy', value: '3', sub: '1 sắp deadline', color: DS.blue, icon: <FolderKanban size={16} /> },",
  "{ label: 'Dự án đang chạy', value: homeLoading ? '...' : String(homeActiveCount), sub: '1 sắp deadline', color: DS.blue, icon: <FolderKanban size={16} /> },"
);
c = c.replace(
  "{ label: 'LP tổng tích lũy', value: fmtLP(CUSTOMER.lpEarned), sub: `Đã dùng ${fmtLP(CUSTOMER.lpSpent)}`, color: GLD.color, icon: <Zap size={16} /> },",
  "{ label: 'LP tổng tích lũy', value: homeLoading ? '...' : fmtLP(lpEarnedTotal), sub: 'Đã dùng ' + fmtLP(CUSTOMER.lpSpent), color: GLD.color, icon: <Zap size={16} /> },"
);

// ── 5. Fix pmOf usages in Active Projects ────────────────────────────────
// Change `members.find(m => m.name.includes(p.pm.split(' ')[0]))` → `p.pm`
// Since p.pm is now a member object, we need a helper
// Insert member lookup for each place where p.pm.name is used
const PM_IMG_OLD = `src={p.pmImg} alt={p.pm} className="w-full h-full object-cover" />`;
const PM_IMG_NEW = `src={p.pmImg} alt={p.pm.name} className="w-full h-full object-cover" />`;
c = c.replace(PM_IMG_OLD, PM_IMG_NEW);

// pm display: `<span style={{ color: DS.text4, fontSize: 11 }}>{p.pm}</span>`
const PM_SPAN_OLD = `<span style={{ color: DS.text4, fontSize: 11 }}>{p.pm}</span>`;
const PM_SPAN_NEW = `<span style={{ color: DS.text4, fontSize: 11 }}>{p.pm.name}</span>`;
c = c.replace(PM_SPAN_OLD, PM_SPAN_NEW);

// PM rank border: `RANKS[members.find...`
const PM_RANK_OLD = `RANKS[members.find(m => m.name.includes(p.pm.split(' ')[0]))?.rank ?? 'iron']`;
const PM_RANK_NEW = `p.pm.rank`;
c = c.replace(PM_RANK_OLD, PM_RANK_NEW);

// Rank display in PM contact section: `<div style={{ color: DS.text2, fontSize: 13, fontWeight: 700 }}>{p.pm.name}</div>`
// Already fixed above. Also `{RANKS[p.pm.rank].label}`
const PM_ROLE_OLD = `<div style={{ color: DS.text2, fontSize: 13, fontWeight: 700 }}>{p.pm.name}</div>
                    <div style={{ color: DS.text5, fontSize: 11 }}>{p.pm.role} · {RANKS[p.pm.rank].label}</div>`;
const PM_ROLE_NEW = `<div style={{ color: DS.text2, fontSize: 13, fontWeight: 700 }}>{p.pm.name}</div>
                    <div style={{ color: DS.text5, fontSize: 11 }}>{p.pm.role} · {RANKS[p.pm.rank].label}</div>`;
// Just fix the role name - p.pm.role is fine since p.pm is member object
// But we need to make sure memberData has role field
// Since p.pm.role is undefined on member objects (memberData uses 'chucDanh' not 'role')
// Let's use 'chucDanh' or just show 'PM'
const PM_ROLE_V2 = `<div style={{ color: DS.text2, fontSize: 13, fontWeight: 700 }}>{p.pm.name}</div>
                    <div style={{ color: DS.text5, fontSize: 11 }}>PM · {RANKS[p.pm.rank].label}</div>`;
c = c.replace(PM_ROLE_OLD, PM_ROLE_V2);

// In PM contact card of Active Projects (p.pm is a string 'Yuna Park')
// Fix the rank reference inside PM contact
// `RANKS[members.find(m => m.name.includes(p.pm.split(' ')[0]))?.rank ?? 'iron']`
c = c.replace(
  `RANKS[members.find(m => m.name.includes(p.pm.split(' ')[0]))?.rank ?? 'iron']`,
  `p.pm.rank ?? 'gold'`
);

// Fix avatar border rank lookup in PM section: `RANKS[p.pm.rank]`
// Already fixed above. Now update the rank label display

// Fix PM rank label in Active Projects section (inside the task details)
const TASK_PM_SPAN = `<span style={{ color: DS.text4, fontSize: 11 }}>{p.pm}</span>`;
const TASK_PM_SPAN_NEW = `<span style={{ color: DS.text4, fontSize: 11 }}>{p.pm.name}</span>`;
if (c.includes(TASK_PM_SPAN)) {
  c = c.replace(TASK_PM_SPAN, TASK_PM_SPAN_NEW);
}

// ── 6. Replace PROJECTS.map in Active Projects section ────────────────────
c = c.replace(
  /\{PROJECTS\.map\(\(p\) => \{\s*const sc = STATUS_CFG\[p\.status as keyof typeof STATUS_CFG\];/g,
  '{HOME_PROJECTS.map((p) => {\n            const sc = STATUS_CFG[p.status as keyof typeof STATUS_CFG];'
);
c = c.replace(
  /const sc = STATUS_CFG\[p\.status as keyof typeof STATUS_CFG\];[\s\S]{1,200}?\{PROJECTS\.map\(/,
  ''
);

// ── 7. Remove pmOf unused function ─────────────────────────────────────
const PMOF_OLD = `
  const pmOf = (name: string) => members.find(m => m.name.includes(name.split(' ')[0]));`;
if (c.includes(PMOF_OLD)) {
  c = c.replace(PMOF_OLD, '\n  // pmOf removed');
}

// ── 8. Remove the old PROJECTS constant definition ──────────────────────
const OLD_PROJECTS_DEF = `  const PROJECTS = [`;
if (c.includes(OLD_PROJECTS_DEF)) {
  c = c.replace(OLD_PROJECTS_DEF, '  // PROJECTS removed (replaced by HOME_PROJECTS + BE API)\n  const PROJECTS = [');
}

fs.writeFileSync("src/app/pages/CustomerDashboard.tsx", c, "utf8");
console.log("Done. Verifying...");

// Verify key replacements
const checks = [
  ["ordersService import", c.includes("import { ordersService, Order }")],
  ["HOME_PROJECTS", c.includes("HOME_PROJECTS")],
  ["homeActiveCount", c.includes("homeActiveCount")],
  ["lpEarnedTotal", c.includes("lpEarnedTotal")],
  ["useAuthStore in HomeTab", c.includes("const { user } = useAuthStore();")],
];
checks.forEach(([label, ok]) => console.log((ok ? "OK" : "FAIL") + " " + label));
