/**
 * ServicesTab — Quản lý dịch vụ (Admin)
 * CRUD dịch vụ, demo links, thống kê đơn hàng
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor, Edit3, Save, X, Eye, EyeOff, TrendingUp,
  Globe, Code2, BarChart3, Target, ExternalLink, CheckCircle2,
  DollarSign, Package, Link as LinkIcon,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { useLoopStore, type Service, type ServiceType } from '../../store/loopStore';
import { DemoViewer } from '../ui/DemoViewer';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n);

const SERVICE_ICON_MAP: Record<ServiceType, React.ReactNode> = {
  'thiet-ke-web': <Globe size={20} />,
  'phat-trien-app': <Code2 size={20} />,
  'dashboard-analytics': <BarChart3 size={20} />,
  'seo-marketing': <Target size={20} />,
};

// ── Service Edit Modal ────────────────────────────────────────────────────────
function ServiceEditModal({ service, onClose, onSave }: {
  service: Service;
  onClose: () => void;
  onSave: (data: Partial<Service>) => void;
}) {
  const [draft, setDraft] = useState({ ...service });
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}`, position: 'sticky', top: 0, background: DS.bgCard, zIndex: 10 }}>
          <div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>Chỉnh sửa dịch vụ</div>
            <div style={{ color: DS.text4, fontSize: 12 }}>{draft.title}</div>
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>GIÁ BẮT ĐẦU (VNĐ)</label>
              <input type="number" value={draft.startPrice} onChange={e => setDraft({ ...draft, startPrice: Number(e.target.value) })}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>GIÁ TỐI ĐA (VNĐ)</label>
              <input type="number" value={draft.endPrice} onChange={e => setDraft({ ...draft, endPrice: Number(e.target.value) })}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Demo URLs */}
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginTop: 8 }}>── DEMO LINK</div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>URL GỐC (ẩn với khách hàng)</label>
            <div className="flex items-center gap-2">
              <input value={draft.demoUrl} onChange={e => setDraft({ ...draft, demoUrl: e.target.value })}
                placeholder="https://demo.example.com"
                style={{ flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none' }} />
              <button onClick={() => window.open(draft.demoUrl, '_blank')}
                style={{ padding: '10px 12px', borderRadius: 10, background: `${draft.color}15`, border: `1px solid ${draft.color}30`, color: draft.color, cursor: 'pointer' }}>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>URL CHE (hiển thị với khách hàng)</label>
            <input value={draft.maskedUrl} onChange={e => setDraft({ ...draft, maskedUrl: e.target.value })}
              placeholder="demo.loop-solutions.vn/ten-dich-vu"
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Preview demo */}
          <div>
            <button onClick={() => setShowDemoPreview(!showDemoPreview)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: `${draft.color}12`, border: `1px solid ${draft.color}30`, color: draft.color, fontSize: 12, cursor: 'pointer' }}>
              <Monitor size={13} />
              {showDemoPreview ? 'Ẩn preview' : 'Xem demo preview'}
            </button>
          </div>
          {showDemoPreview && (
            <DemoViewer
              demoUrl={draft.demoUrl}
              maskedUrl={draft.maskedUrl}
              previewImg="https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=800&q=80"
              title={draft.title}
              accentColor={draft.color}
              height={280}
            />
          )}

          {/* Status toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div>
              <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>Hiển thị dịch vụ</div>
              <div style={{ color: DS.text4, fontSize: 12 }}>Ẩn/hiện trên trang dịch vụ công khai</div>
            </div>
            <button onClick={() => setDraft({ ...draft, active: !draft.active })}
              className="w-12 h-6 rounded-full relative"
              style={{ background: draft.active ? DS.green : DS.border, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full"
                style={{ background: '#fff', left: draft.active ? 'calc(100% - 22px)' : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </button>
          </div>

          <button onClick={() => { onSave(draft); onClose(); }}
            style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 24px rgba(129,140,248,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Save size={15} /> Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ServicesTab() {
  const { services, orders, updateService } = useLoopStore();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [previewDemoId, setPreviewDemoId] = useState<ServiceType | null>(null);

  const getServiceOrders = (id: ServiceType) => orders.filter(o => o.serviceType === id);
  const getServiceRevenue = (id: ServiceType) => getServiceOrders(id).filter(o => o.status !== 'pending_payment' && o.status !== 'cancelled').reduce((s, o) => s + o.budget, 0);

  const statusCols = [
    { key: 'pending_payment', label: 'Chờ TT', color: DS.text4 },
    { key: 'paid', label: 'Đã TT', color: DS.blue },
    { key: 'in_progress', label: 'Đang làm', color: DS.cyan },
    { key: 'demo_ready', label: 'Demo', color: DS.amber },
    { key: 'done', label: 'Xong', color: DS.green },
  ];

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {editingService && (
          <ServiceEditModal
            service={editingService}
            onClose={() => setEditingService(null)}
            onSave={(data) => updateService(editingService.id, data)}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── QUẢN LÝ DỊCH VỤ ({services.length} dịch vụ)</div>
        <div className="flex items-center gap-3">
          <div style={{ color: DS.text4, fontSize: 12 }}>Tổng doanh thu dịch vụ:</div>
          <div style={{ color: DS.green, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>
            {fmtVND(orders.filter(o => o.status !== 'pending_payment').reduce((s, o) => s + o.budget, 0))} VNĐ
          </div>
        </div>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {services.map((svc, i) => {
          const svcOrders = getServiceOrders(svc.id);
          const svcRevenue = getServiceRevenue(svc.id);
          const activeOrders = svcOrders.filter(o => o.status === 'in_progress' || o.status === 'demo_ready');
          const isPreviewing = previewDemoId === svc.id;

          return (
            <motion.div key={svc.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, boxShadow: `0 0 0 0 ${svc.color}` }}
              whileHover={{ borderColor: `${svc.color}40`, boxShadow: `0 0 20px ${svc.color}08` }}>

              {/* Card header */}
              <div className="flex items-start justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}30` }}>
                    <span style={{ color: svc.color }}>{SERVICE_ICON_MAP[svc.id]}</span>
                  </div>
                  <div>
                    <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{svc.title}</div>
                    <div style={{ color: DS.text4, fontSize: 11 }}>{svc.subtitle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                    style={{ background: svc.active ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)', border: `1px solid ${svc.active ? DS.green : DS.text4}30` }}>
                    {svc.active
                      ? <CheckCircle2 size={11} style={{ color: DS.green }} />
                      : <EyeOff size={11} style={{ color: DS.text4 }} />}
                    <span style={{ color: svc.active ? DS.green : DS.text4, fontSize: 10, fontFamily: DS.mono }}>
                      {svc.active ? 'ACTIVE' : 'HIDDEN'}
                    </span>
                  </div>
                  <button onClick={() => setEditingService(svc)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${DS.border}`, cursor: 'pointer', color: DS.text4 }}>
                    <Edit3 size={13} />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-0" style={{ borderBottom: `1px solid ${DS.border}` }}>
                {[
                  { label: 'Đơn hàng', val: svcOrders.length, color: svc.color, icon: <Package size={12} /> },
                  { label: 'Đang làm', val: activeOrders.length, color: DS.blue, icon: <TrendingUp size={12} /> },
                  { label: 'Doanh thu', val: fmtVND(Math.floor(svcRevenue / 1_000_000)) + 'M', color: DS.green, icon: <DollarSign size={12} /> },
                ].map((stat, si) => (
                  <div key={si} className="flex flex-col items-center justify-center py-3"
                    style={{ borderRight: si < 2 ? `1px solid ${DS.border}` : 'none' }}>
                    <div className="flex items-center gap-1 mb-1" style={{ color: DS.text4 }}>{stat.icon}</div>
                    <div style={{ color: stat.color, fontFamily: DS.mono, fontSize: 16, fontWeight: 700 }}>{stat.val}</div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Price range */}
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text4, fontSize: 12 }}>Khoảng giá</div>
                <div style={{ color: svc.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
                  {fmtVND(svc.startPrice / 1_000_000)}M — {fmtVND(svc.endPrice / 1_000_000)}M VNĐ{svc.perMonth ? '/tháng' : ''}
                </div>
              </div>

              {/* Order status mini breakdown */}
              <div className="px-5 py-3" style={{ borderBottom: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 8 }}>TRẠNG THÁI ĐƠN HÀNG</div>
                <div className="flex gap-2 flex-wrap">
                  {statusCols.map(sc => {
                    const cnt = svcOrders.filter(o => o.status === sc.key).length;
                    if (cnt === 0) return null;
                    return (
                      <div key={sc.key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                        style={{ background: `${sc.color}10`, border: `1px solid ${sc.color}25` }}>
                        <span style={{ color: sc.color, fontSize: 11, fontWeight: 700, fontFamily: DS.mono }}>{cnt}</span>
                        <span style={{ color: DS.text4, fontSize: 10 }}>{sc.label}</span>
                      </div>
                    );
                  })}
                  {svcOrders.length === 0 && <span style={{ color: DS.text5, fontSize: 11 }}>Chưa có đơn nào</span>}
                </div>
              </div>

              {/* Demo link section */}
              <div className="p-5">
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 8 }}>DEMO LINK</div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl mb-3" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  <LinkIcon size={11} style={{ color: svc.color, flexShrink: 0 }} />
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {svc.maskedUrl || 'Chưa cấu hình'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: svc.demoUrl ? DS.green : DS.text5 }} />
                    <span style={{ color: svc.demoUrl ? DS.green : DS.text5, fontSize: 9, fontFamily: DS.mono }}>
                      {svc.demoUrl ? 'ACTIVE' : 'NONE'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setPreviewDemoId(isPreviewing ? null : svc.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 justify-center"
                    style={{ background: isPreviewing ? `${svc.color}20` : `${svc.color}10`, border: `1px solid ${svc.color}30`, color: svc.color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Monitor size={13} /> {isPreviewing ? 'Ẩn demo' : 'Xem demo'}
                  </button>
                  <button onClick={() => setEditingService(svc)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, color: DS.text3, fontSize: 12, cursor: 'pointer' }}>
                    <Edit3 size={13} /> Sửa link
                  </button>
                </div>

                {/* Demo preview inline */}
                <AnimatePresence>
                  {isPreviewing && svc.demoUrl && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                      <DemoViewer
                        demoUrl={svc.demoUrl}
                        maskedUrl={svc.maskedUrl}
                        previewImg="https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=800&q=80"
                        title={svc.title}
                        accentColor={svc.color}
                        height={240}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
