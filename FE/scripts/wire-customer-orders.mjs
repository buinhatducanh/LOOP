/**
 * Wire CustomerDashboard ProjectsTab → ordersService.getOrders({ customerEmail })
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/pages/CustomerDashboard.tsx', 'utf8');
let g = f;

// ── 1. Add imports ─────────────────────────────────────────────────────────────
if (!g.includes("ordersService } from '../api/orders.service'")) {
  const oldLine = "import { useState, useRef } from 'react';";
  const newLine = "import { useState, useRef, useEffect } from 'react';";
  g = g.replace(oldLine, newLine);
  const lastImport = "import { useIsMobile } from '../components/ui/use-mobile';";
  const insertImport = lastImport + "\nimport { ordersService } from '../api/orders.service';";
  g = g.replace(lastImport, insertImport);
} else {
  // Already imported, just make sure useEffect is there
  if (!g.includes("useEffect } from 'react'")) {
    const oldLine = "import { useState, useRef } from 'react';";
    const newLine = "import { useState, useRef, useEffect } from 'react';";
    g = g.replace(oldLine, newLine);
  }
}

// ── 2. Update ProjectsTab — replace clientOrders logic ──────────────────────────
// Find the ProjectsTab function and inject API fetching
// Pattern: "// Orders belonging to client ID=2 (Nguyễn Minh Tuấn)"
//          "const clientOrders = orders.filter(o => o.clientId === 2);"
// Replace with: API fetch using customer email

const oldOrdersLogic = /\/\/ Orders belonging to client ID=2[^\n]*\n\s+const clientOrders = orders\.filter\(o => o\.clientId === 2\);/;

g = g.replace(oldOrdersLogic, `// Fetch real orders from BE for this customer
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    setOrdersLoading(true);
    ordersService.getOrders({ limit: 50, customerEmail: user?.email })
      .then(({ orders: fetched }) => {
        if (!cancelled) setClientOrders(fetched);
      })
      .catch(() => {
        // Fall back to store orders on error
        if (!cancelled) setClientOrders(orders.filter(o => o.clientId === 2));
      })
      .finally(() => { if (!cancelled) setOrdersLoading(false); });
    return () => { cancelled = true; };
  }, [user?.email]);`);

// Also update demoReady and selectedDemoOrder to use clientOrders
// The existing code uses `clientOrders` variable already, so that's fine

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/pages/CustomerDashboard.tsx', g, 'utf8');
console.log('Done — CustomerDashboard ProjectsTab wired to getOrders({ customerEmail })');
