/**
 * Wire BookingWizardPage → ordersService.submitQuote()
 * Replaces addOrder() mock with real API call.
 */
import { readFileSync, writeFileSync } from 'fs';

const file = readFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/pages/BookingWizardPage.tsx', 'utf8');

let f = file;

// ── 1. Add import ──────────────────────────────────────────────────────────
const importLine = "import { DS, GRD } from '../components/layout/ds';\nimport { useLoopStore, type Order } from '../store/loopStore';";
const newImportLine = `import { DS, GRD } from '../components/layout/ds';\nimport { useLoopStore, type Order } from '../store/loopStore';\nimport { ordersService } from '../../api/orders.service';`;

if (!f.includes("ordersService } from '../../api/orders.service'")) {
  f = f.replace(importLine, newImportLine);
}

// ── 2. Add submitLoading / submitError states ───────────────────────────────
// Find: "const [submitted, setSubmitted] = useState(false);" in BookingWizardMain
// After it, add loading + error states
const oldStateLine = '  const [submitted, setSubmitted] = useState(false);';
const newStateLines = `  const [submitted, setSubmitted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');`;
f = f.replace(oldStateLine, newStateLines);

// ── 3. Replace handleSubmit ─────────────────────────────────────────────────
const oldHandleSubmit = `  const handleSubmit = (n: string, em: string, ph: string, co: string) => {
    const svc = SERVICES.find(s => s.id === serviceId);
    const pkg = PACKAGES.find(p => p.id === pkgId);
    const basePrice = svc ? svc.basePrice * (pkg?.multiplier ?? 1) : 0;
    const featPrices = (FEATURE_OPTIONS[serviceId] ?? []).filter(f => features.includes(f.id)).reduce((s, f) => s + f.price, 0);
    const extraPrices = EXTRAS.filter(e => extras.includes(e.id)).reduce((s, e) => s + e.price, 0);
    const total = Math.round((basePrice + featPrices + extraPrices) * 1.1);
    const lpEarned = Math.round(total / 1_000_000) * (pkg?.lp ?? 50);
    const orderId = \`ORD-\${Date.now().toString().slice(-4)}\`;
    setNewOrderId(orderId);

    const svcTypeMap: Record<string, string> = {
      web: 'thiet-ke-web', app: 'phat-trien-app',
      dashboard: 'dashboard-analytics', seo: 'seo-marketing',
    };

    const newOrder: Order = {
      id: orderId,
      clientId: 9, clientName: n, clientCompany: co || company || 'Khách hàng mới',
      clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&crop=faces',
      type: 'service',
      serviceType: svcTypeMap[serviceId] as any,
      serviceTitle: svc?.title,
      title: \`\${svc?.title ?? 'Dịch vụ'} — \${pkg?.name ?? 'Gói'} (\${co || 'New Client'})\`,
      budget: total,
      lpUsed: lpDiscount,
      lpReward: lpEarned,
      status: 'pending_payment',
      progress: 0,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN'),
      invoiceId: \`INV-\${orderId}\`,
      tags: features.length > 0 ? features : [svc?.id ?? 'web'],
      messages: [
        {
          id: 'm_init', senderId: 'admin', senderName: 'LOOP System',
          content: \`Cảm ơn \${n} đã đặt dịch vụ \${svc?.title ?? ''}! Chúng tôi sẽ liên hệ qua \${em} trong vòng 2 giờ làm việc để xác nhận và tạo hợp đồng.\`,
          type: 'system',
          timestamp: new Date().toLocaleString('vi-VN'), read: true,
        }
      ],
    };
    addOrder(newOrder);
    setSubmitted(true);
  };`;

const newHandleSubmit = `  const handleSubmit = async (n: string, em: string, ph: string, co: string) => {
    const svc = SERVICES.find(s => s.id === serviceId);
    const pkg = PACKAGES.find(p => p.id === pkgId);
    const featOptions = FEATURE_OPTIONS[serviceId] ?? [];
    const basePrice = svc ? svc.basePrice * (pkg?.multiplier ?? 1) : 0;
    const featPrices = featOptions.filter(f => features.includes(f.id)).reduce((s, f) => s + f.price, 0);
    const extraPrices = EXTRAS.filter(e => extras.includes(e.id)).reduce((s, e) => s + e.price, 0);
    const total = Math.round((basePrice + featPrices + extraPrices) * 1.1);
    const lpEarned = Math.round(total / 1_000_000) * (pkg?.lp ?? 50);

    // Build selectedItems matching BE BeQuoteItem schema
    const selectedItems = [
      // Base service
      { featureId: svc?.id ?? serviceId, featureName: svc?.title ?? '', variantId: pkg?.id ?? '', variantName: pkg?.name ?? '', price: basePrice },
      // Selected add-on features
      ...featOptions.filter(f => features.includes(f.id)).map(f => ({
        featureId: f.id, featureName: f.name, variantId: '', variantName: '', price: f.price,
      })),
      // Selected extras
      ...EXTRAS.filter(e => extras.includes(e.id)).map(e => ({
        featureId: e.id, featureName: e.label, variantId: '', variantName: '', price: e.price,
      })),
    ];

    try {
      setSubmitLoading(true);
      setSubmitError('');
      const result = await ordersService.submitQuote({
        customerName: n,
        customerEmail: em,
        customerPhone: ph || undefined,
        companyName: co || undefined,
        selectedItems,
        totalAmount: total,
        notes: \`Dịch vụ: \${svc?.title ?? ''} | Gói: \${pkg?.name ?? ''}\`,
      });
      setNewOrderId(result.orderNumber);

      // Add mock Order to local store for portal navigation UX
      const svcTypeMap: Record<string, string> = {
        web: 'thiet-ke-web', app: 'phat-trien-app',
        dashboard: 'dashboard-analytics', seo: 'seo-marketing',
      };
      const newOrder: Order = {
        id: result.id,
        clientId: 9, clientName: n, clientCompany: co || company || 'Khách hàng mới',
        clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&crop=faces',
        type: 'service',
        serviceType: svcTypeMap[serviceId] as any,
        serviceTitle: svc?.title,
        title: \`\${svc?.title ?? 'Dịch vụ'} — \${pkg?.name ?? 'Gói'} (\${co || 'New Client'})\`,
        budget: total,
        lpUsed: lpDiscount,
        lpReward: lpEarned,
        status: 'pending_payment',
        progress: 0,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        updatedAt: new Date().toLocaleDateString('vi-VN'),
        invoiceId: \`INV-\${result.orderNumber}\`,
        tags: features.length > 0 ? features : [svc?.id ?? 'web'],
        messages: [
          {
            id: 'm_init', senderId: 'admin', senderName: 'LOOP System',
            content: \`Cảm ơn \${n} đã đặt dịch vụ \${svc?.title ?? ''}! Chúng tôi sẽ liên hệ qua \${em} trong vòng 2 giờ làm việc để xác nhận và tạo hợp đồng.\`,
            type: 'system',
            timestamp: new Date().toLocaleString('vi-VN'), read: true,
          }
        ],
      };
      addOrder(newOrder);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSubmitLoading(false);
    }
  };`;

if (f.includes('addOrder(newOrder);') && f.includes('setSubmitted(true);')) {
  // Replace the handleSubmit function body only (up to the closing })
  const idx = f.indexOf('const handleSubmit = (n: string');
  const endIdx = f.indexOf('  };', idx);
  if (idx !== -1 && endIdx !== -1) {
    f = f.slice(0, idx) + newHandleSubmit + '\n  };' + f.slice(endIdx + 4);
  }
}

// ── 4. Pass submitLoading / submitError to Step8 ───────────────────────────
// Find Step8_Payment render in BookingWizardMain and add props
// In JSX: submitted={submitted} setSubmitted={setSubmitted}
// Add after setSubmitted={setSubmitted}:
//   submitLoading={submitLoading} submitError={submitError} setSubmitError={setSubmitError}
const oldStep8Props = 'submitted={submitted} setSubmitted={setSubmitted} onConfirm={handleSubmit} orderId={newOrderId}';
const newStep8Props = 'submitted={submitted} setSubmitted={setSubmitted} onConfirm={handleSubmit} orderId={newOrderId} submitLoading={submitLoading} submitError={submitError} setSubmitError={setSubmitError}';
f = f.replace(oldStep8Props, newStep8Props);

// ── 5. Update Step8_Payment props interface ─────────────────────────────────
const oldStep8PropsInterface = `  submitted: boolean; setSubmitted: (b: boolean) => void;
  onConfirm: (n: string, em: string, ph: string, co: string) => void;
  orderId: string;`;
const newStep8PropsInterface = `  submitted: boolean; setSubmitted: (b: boolean) => void;
  onConfirm: (n: string, em: string, ph: string, co: string) => void;
  orderId: string;
  submitLoading: boolean; submitError: string; setSubmitError: (s: string) => void;`;
f = f.replace(oldStep8PropsInterface, newStep8PropsInterface);

// ── 6. Update Step8 render — add loading overlay + error message ─────────────
// Find the form return inside Step8_Payment (before the payment methods section)
// Add error display after the input fields section and add disabled to confirm button
// Add loading spinner on the submit button
const oldPayMethodsComment = '  const payMethods = [';
const newPayMethodsSection = `  // Error display
  if (submitError) {
    return (
      <div className="text-center py-8">
        <div style={{ color: DS.red, fontSize: 13, marginBottom: 12, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)' }}>
          {submitError}
        </div>
        <button
          onClick={() => setSubmitError('')}
          style={{ color: DS.text4, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: DS.mono }}
        >
          Đóng và thử lại
        </button>
      </div>
    );
  }

  const payMethods = [`;
f = f.replace(oldPayMethodsComment, newPayMethodsSection);

// ── 7. Add submitLoading spinner to the confirm button ───────────────────────
// Find the "XÁC NHẬN ĐẶT HÀNG" button and disable it when loading
const oldConfirmBtn = `          <button
            onClick={() => onConfirm(name, email, phone, company)}
            style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: GRD.primary, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: DS.heading, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            XÁC NHẬN ĐẶT HÀNG <ArrowRight size={18} />
          </button>`;
const newConfirmBtn = `          <button
            onClick={() => onConfirm(name, email, phone, company)}
            disabled={submitLoading}
            style={{ width: '100%', padding: '16px', borderRadius: 12, border: 'none', background: submitLoading ? 'rgba(59,130,246,0.4)' : GRD.primary, color: '#fff', fontSize: 16, fontWeight: 700, cursor: submitLoading ? 'not-allowed' : 'pointer', fontFamily: DS.heading, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {submitLoading ? 'ĐANG GỬI...' : 'XÁC NHẬN ĐẶT HÀNG'} {!submitLoading && <ArrowRight size={18} />}
          </button>`;
f = f.replace(oldConfirmBtn, newConfirmBtn);

writeFileSync('d:/LOOP_COMPANY/LOOP/FE/src/app/pages/BookingWizardPage.tsx', f, 'utf8');
console.log('Done — wizard wired to ordersService.submitQuote()');
