/**
 * Wire OrdersTab → ordersService.getOrders()
 * Adds useEffect + loading state, keeps all existing filter/stats logic.
 */
import { readFileSync, writeFileSync } from 'fs';

const f = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/OrdersTab.tsx', 'utf8');
let g = f;

// ── 1. Add import ─────────────────────────────────────────────────────────────
const oldImport = "import { useLoopStore, type Order, type OrderStatus } from '../../store/loopStore';";
const newImport = `import { useLoopStore, type Order, type OrderStatus } from '../../store/loopStore';\nimport { ordersService } from '../../api/orders.service';`;
if (!g.includes("ordersService } from '../../api/orders.service'")) {
  g = g.replace(oldImport, newImport);
}

// ── 2. Add state + useEffect in OrdersTab component ──────────────────────────
// Find: "const { orders, adminNotifications } = useLoopStore();"
// After it, add loading/error/ordersLoading state
const oldStoreLine = '  const { orders, adminNotifications } = useLoopStore();';
const newStoreLines = `  const { orders, adminNotifications } = useLoopStore();
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [apiOrders, setApiOrders] = useState<Order[]>([]);`;
g = g.replace(oldStoreLine, newStoreLines);

// ── 3. Add useEffect after search state ───────────────────────────────────────
// Find: "  const [search, setSearch] = useState('');"  (in OrdersTab function)
// Then add useEffect right after
const oldSearchLine = "  const [search, setSearch] = useState('');";
const newSearchLines = `  const [search, setSearch] = useState('');

  // Fetch real orders from BE
  useEffect(() => {
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError('');
    ordersService.getOrders({ limit: 50 })
      .then(({ orders: fetched }) => {
        if (!cancelled) setApiOrders(fetched);
      })
      .catch(() => {
        if (!cancelled) setOrdersError('Không tải được danh sách đơn hàng');
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => { cancelled = true; };
  }, []);
`;
g = g.replace(oldSearchLine, newSearchLines);

// ── 4. Update filtered to use apiOrders when available ────────────────────────
// Replace the filtered logic to use apiOrders (from BE) as primary, fall back to store orders
const oldFilteredLine1 = '  const newPaidOrders = orders.filter(o => o.status === \'paid\');';
const oldFilteredLine2 = '  const filtered = orders.filter(o =>';
const oldFilteredLine3 = '    (filterStatus === \'all\' || o.status === filterStatus) &&';
const oldFilteredLine4 = '    (o.title.toLowerCase().includes(search.toLowerCase()) || o.clientName.toLowerCase().includes(search.toLowerCase()))';
const oldFilteredLine5 = '  );';
const oldFilteredLine6 = '  const totalRevenue = orders.filter(o => o.status !== \'pending_payment\' && o.status !== \'cancelled\')';

const newFilteredLines = `  // Use API orders when loaded, fall back to store orders
  const displayOrders = ordersLoading && ordersError === '' ? orders : apiOrders.length > 0 ? apiOrders : orders;

  const newPaidOrders = displayOrders.filter(o => o.status === 'paid');
  const filtered = displayOrders.filter(o =>
    (filterStatus === 'all' || o.status === filterStatus) &&
    (o.title.toLowerCase().includes(search.toLowerCase()) || o.clientName.toLowerCase().includes(search.toLowerCase()))
  );
  const totalRevenue = displayOrders.filter(o => o.status !== 'pending_payment' && o.status !== 'cancelled')`;

g = g.replace(oldFilteredLine1, newFilteredLines);
// Remove the now-redundant lines
g = g.replace(oldFilteredLine2 + '\n' + oldFilteredLine3 + '\n' + oldFilteredLine4 + '\n' + oldFilteredLine5, '  ');

// ── 5. Update section header count ────────────────────────────────────────────
// "── QUẢN LÝ ĐƠN HÀNG ({orders.length})"
const oldHeaderCount = '── QUẢN LÝ ĐƠN HÀNG ({orders.length})';
const newHeaderCount = '── QUẢN LÝ ĐƠN HÀNG ({displayOrders.length})';
g = g.replace(oldHeaderCount, newHeaderCount);

// ── 6. Add loading skeleton ───────────────────────────────────────────────────
// Before the main grid/list render, after the search bar section
// Find: "{/* Alert: New paid orders */}" and add loading state before it
const alertSection = '{/* Alert: New paid orders */}';
const loadingSkeletons = `      {/* Loading state */}
      {ordersLoading && (
        <div className="space-y-3 mb-6">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: DS.bgCard, border: \`1px solid \${DS.border}\` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full" style={{ background: DS.border }} />
                <div className="flex-1">
                  <div style={{ height: 12, width: '40%', background: DS.border, borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 10, width: '25%', background: DS.border, borderRadius: 4 }} />
                </div>
                <div style={{ height: 24, width: 80, background: DS.border, borderRadius: 20 }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {ordersError && (
        <div className="mb-4 px-4 py-3 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.08)', border: \`1px solid rgba(239,68,68,0.2)\`, color: DS.red, fontSize: 12 }}>
          {ordersError}
        </div>
      )}
      ${alertSection}`;

if (!g.includes('ordersLoading &&')) {
  g = g.replace(alertSection, loadingSkeletons);
}

// ── 7. Add useEffect to the file imports (it's already in the imports at top) ──
// Make sure useState is imported (it's already there on line 5)
// Just add useEffect import
const oldReactImport = "import { useState } from 'react';";
const newReactImport = "import { useState, useEffect } from 'react';";
if (!g.includes('useEffect } from \'react\'')) {
  g = g.replace(oldReactImport, newReactImport);
}

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/components/admin/OrdersTab.tsx', g, 'utf8');
console.log('Done — OrdersTab wired to ordersService.getOrders()');
