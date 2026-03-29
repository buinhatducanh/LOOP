const fs = require("fs");
let c = fs.readFileSync("src/app/pages/CustomerDashboard.tsx", "utf8");

if (!c.includes("import { ordersService, Order }")) {
  c = c.replace(
    "import { academyService, StudentEnrollment } from '../api/academy.service';",
    "import { academyService, StudentEnrollment } from '../api/academy.service';\nimport { ordersService, Order } from '../api/orders.service';"
  );
}

const OLD_HOME_START = `function HomeTab({ onSelect }: { onSelect: (s: string) => void }) {\n  const CUSTOMER = useCustomerProfile();\n  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];\n  const PROJECTS = [`;
const NEW_HOME_START = `function HomeTab({ onSelect }: { onSelect: (s: string) => void }) {\n  const CUSTOMER = useCustomerProfile();\n  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];\n  const { user } = useAuthStore();\n\n  const [clientOrders, setClientOrders] = useState<Order[]>([]);\n  const [homeLoading, setHomeLoading] = useState(true);\n\n  useEffect(() => {\n    let cancelled = false;\n    if (!user?.email) { setHomeLoading(false); return; }\n    ordersService.getOrders({ customerEmail: user.email, limit: 20 })\n      .then(({ orders: fetched }) => {\n        if (cancelled) return;\n        const mapped = fetched.map((o) => ({\n          id: o.id, clientId: 2, clientName: o.customerName,\n          clientCompany: o.companyName ?? 'Khách hàng LOOP',\n          clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&crop=faces',\n          type: 'service', serviceType: 'thiet-ke-web',\n          serviceTitle: o.packageTitle || 'Dịch vụ LOOP',\n          title: o.packageTitle || 'Đơn hàng ' + o.orderNumber,\n          budget: o.totalAmount ?? 0, lpUsed: o.lpUsed, lpReward: o.lpReward,\n          status: o.status || 'pending_payment',\n          progress: o.status === 'done' ? 100 : o.status === 'demo_ready' ? 85 : o.status === 'in_progress' ? 55 : o.status === 'paid' ? 20 : 0,\n          createdAt: new Date(o.createdAt).toLocaleDateString('vi-VN'),\n          updatedAt: new Date(o.updatedAt).toLocaleDateString('vi-VN'),\n          invoiceId: o.orderNumber, assignedPM: null, tags: [], messages: [],\n          demoUrl: o.demoUrl, maskedUrl: o.maskedUrl,\n        }));\n        setClientOrders(mapped);\n      })\n      .finally(() => { if (!cancelled) setHomeLoading(false); });\n    return () => { cancelled = true; };\n  }, [user?.email]);\n\n  const HOME_PROJECTS = clientOrders.length > 0\n    ? clientOrders.slice(0, 3).map((o) => ({\n        id: o.id, name: o.packageTitle || o.title,\n        type: 'Web Development',\n        status: o.status === 'done' ? 'done' : o.status === 'in_progress' ? 'doing' : o.status === 'demo_ready' ? 'review' : 'todo',\n        progress: o.progress,\n        pm: members[3], pmImg: members[3].img,\n        deadline: o.updatedAt,\n        budget: o.totalAmount ? (o.totalAmount / 1000000).toFixed(0) + 'M VNĐ' : 'N/A',\n        tags: o.tags,\n      }))\n    : [`;

c = c.replace(OLD_HOME_START, NEW_HOME_START);

const OLD_PROJECTS = `    { id: 'p1', name: 'Website Công ty TechViet', type: 'Web Development', status: 'doing', progress: 65, pm: 'Yuna Park', pmImg: members[3].img, deadline: '28/03/2026', budget: '85M VNĐ', tags: ['React', 'TailwindCSS', 'Node.js'] },\n    { id: 'p2', name: 'App Mobile TechViet v2', type: 'Mobile App', status: 'review', progress: 90, pm: 'Shin Watanabe', pmImg: members[4].img, deadline: '01/04/2026', budget: '120M VNĐ', tags: ['React Native', 'AWS'] },\n    { id: 'p3', name: 'SEO & Content Q2/2026', type: 'Marketing', status: 'todo', progress: 10, pm: 'Mei Lin', pmImg: members[1].img, deadline: '30/06/2026', budget: '45M VNĐ', tags: ['SEO', 'Content', 'Analytics'] },\n  ];\n\n  const STATUS_CFG`;

const NEW_PROJECTS = `        { id: 'p1', name: 'Website Công ty TechViet', type: 'Web Development', status: 'doing', progress: 65, pm: members[3], pmImg: members[3].img, deadline: '28/03/2026', budget: '85M VNĐ', tags: ['React', 'TailwindCSS', 'Node.js'] },\n        { id: 'p2', name: 'App Mobile TechViet v2', type: 'Mobile App', status: 'review', progress: 90, pm: members[4], pmImg: members[4].img, deadline: '01/04/2026', budget: '120M VNĐ', tags: ['React Native', 'AWS'] },\n        { id: 'p3', name: 'SEO & Content Q2/2026', type: 'Marketing', status: 'todo', progress: 10, pm: members[1], pmImg: members[1].img, deadline: '30/06/2026', budget: '45M VNĐ', tags: ['SEO', 'Content', 'Analytics'] },\n      ];\n\n  const homeActiveCount = HOME_PROJECTS.filter(p => p.status === 'doing' || p.status === 'review').length;\n  const lpEarnedTotal = clientOrders.length > 0\n    ? clientOrders.reduce((s, o) => s + (o.lpReward ?? 0), 0)\n    : CUSTOMER.lpEarned;\n\n  const STATUS_CFG`;

c = c.replace(OLD_PROJECTS, NEW_PROJECTS);

c = c.replace(
  "{ label: 'Dự án đang chạy', value: '3', sub: '1 sắp deadline', color: DS.blue, icon: <FolderKanban size={16} /> },",
  "{ label: 'Dự án đang chạy', value: homeLoading ? '...' : String(homeActiveCount), sub: '1 sắp deadline', color: DS.blue, icon: <FolderKanban size={16} /> },"
);

c = c.replace(
  "{ label: 'LP tổng tích lũy', value: fmtLP(CUSTOMER.lpEarned), sub: `Đã dùng ${fmtLP(CUSTOMER.lpSpent)}`, color: GLD.color, icon: <Zap size={16} /> },",
  "{ label: 'LP tổng tích lũy', value: homeLoading ? '...' : fmtLP(lpEarnedTotal), sub: 'Đã dùng ' + fmtLP(CUSTOMER.lpSpent), color: GLD.color, icon: <Zap size={16} /> },"
);

c = c.replace("{PROJECTS.map((p) => {", "{HOME_PROJECTS.map((p) => {");
c = c.replace("src={p.pmImg} alt={p.pm}", "src={p.pmImg} alt={p.pm.name}");
c = c.replace("{RANKS[members.find(m => m.name.includes(p.pm.split(' ')[0]))?.rank ?? 'iron'].color}", "{RANKS[p.pm.rank].color}");
c = c.replace("{p.pm}</span>", "{p.pm.name}</span>");

if (c.includes("const pmOf = (name: string)")) {
  c = c.replace("  const pmOf = (name: string) => members.find(m => m.name.includes(name.split(' ')[0]));", "  // pmOf removed");
}

fs.writeFileSync("src/app/pages/CustomerDashboard.tsx", c, "utf8");
console.log("Patch applied.");
