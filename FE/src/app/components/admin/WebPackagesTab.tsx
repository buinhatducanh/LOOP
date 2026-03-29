/**
 * WebPackagesTab — Admin quản lý Gói Web Doanh Nghiệp
 * Tương ứng 1-1 với ServicesPage/WEB_PACKAGES
 * Quản lý: loại web, giá, thời gian dùng thử, tính năng, trạng thái active
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit3, Save, X, Search,
  ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, CheckCircle2,
  ArrowUpDown, Package, DollarSign, CalendarClock, Loader2, AlertCircle,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { WEB_PACKAGES, type WebPackage } from '../../pages/ServicesPage';
import { webPackagesService } from '../../../api/web-packages.service';

// ── Chart constants ────────────────────────────────────────────────────────────
const BAR_W = 36;
const CHART_H = 96;

// ── Editable package state ─────────────────────────────────────────────────────

interface AdminPackage extends WebPackage {
  active: boolean;
  orderCount: number;
  trialRequests: number;
  revenue: number;
  beId?: string; // BE PricingWebPackage CUID for update/delete
}

const FALLBACK_PACKAGES: AdminPackage[] = WEB_PACKAGES.map((p, i) => ({
  ...p,
  active: true,
  orderCount: [8, 14, 6, 11, 3, 7, 2, 5, 9, 4][i] ?? 0,
  trialRequests: [24, 38, 18, 29, 12, 20, 7, 15, 26, 11][i] ?? 0,
  revenue: p.fullPrice * ([8, 14, 6, 11, 3, 7, 2, 5, 9, 4][i] ?? 0),
}));

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditModal({ pkg, onClose, onSave }: {
  pkg: AdminPackage;
  onClose: () => void;
  onSave: (updated: Partial<AdminPackage>) => void;
}) {
  const [form, setForm] = useState({
    industry: pkg.industry,
    tagline: pkg.tagline,
    description: pkg.description,
    trialDays: pkg.trialDays,
    fullPrice: pkg.fullPrice,
    activateTime: pkg.activateTime,
    lp: pkg.lp,
    badge: pkg.badge ?? '',
    features: pkg.features.join('\n'),
    demoFeatures: pkg.demoFeatures.join('\n'),
  });

  const handleSave = () => {
    onSave({
      industry: form.industry,
      tagline: form.tagline,
      description: form.description,
      trialDays: Number(form.trialDays),
      fullPrice: Number(form.fullPrice),
      activateTime: form.activateTime,
      lp: Number(form.lp),
      badge: form.badge || undefined,
      features: form.features.split('\n').filter(Boolean),
      demoFeatures: form.demoFeatures.split('\n').filter(Boolean),
    });
    onClose();
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 6, letterSpacing: '0.1em' }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle = {
    width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13,
    outline: 'none', boxSizing: 'border-box' as const,
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }} />
      <motion.div className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${pkg.color}35`, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 flex-shrink-0"
          style={{ borderBottom: `1px solid ${DS.border}`, background: `${pkg.color}08` }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 24 }}>{pkg.icon}</span>
            <div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>── CHỈNH SỬA GÓI WEB</div>
              <div style={{ color: pkg.color, fontSize: 15, fontWeight: 700 }}>{pkg.industry}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="TÊN GÓI WEB">
              <input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="BADGE (ví dụ: HOT, PREMIUM)">
              <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="Để trống nếu không có" style={inputStyle} />
            </Field>
          </div>

          <Field label="TAGLINE">
            <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} style={inputStyle} />
          </Field>

          <Field label="MÔ TẢ NGẮN">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="SỐ NGÀY DÙNG THỬ">
              <input type="number" min={1} max={30} value={form.trialDays}
                onChange={e => setForm(f => ({ ...f, trialDays: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="THỜI GIAN KÍCH HOẠT">
              <input value={form.activateTime} onChange={e => setForm(f => ({ ...f, activateTime: e.target.value }))}
                placeholder="2 giờ" style={inputStyle} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="GIÁ GÓI FULL (VNĐ)">
              <input type="number" value={form.fullPrice}
                onChange={e => setForm(f => ({ ...f, fullPrice: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="LP THƯỞNG">
              <input type="number" value={form.lp}
                onChange={e => setForm(f => ({ ...f, lp: Number(e.target.value) }))} style={inputStyle} />
            </Field>
          </div>

          <Field label="TÍNH NĂNG ĐẦY ĐỦ (mỗi dòng 1 tính năng)">
            <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              rows={6} style={{ ...inputStyle, resize: 'vertical', fontFamily: DS.mono, fontSize: 12 }} />
          </Field>

          <Field label="TÍNH NĂNG DEMO (hiển thị trên card, tối đa 3)">
            <textarea value={form.demoFeatures} onChange={e => setForm(f => ({ ...f, demoFeatures: e.target.value }))}
              rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: DS.mono, fontSize: 12 }} />
          </Field>

          {/* Price preview */}
          <div className="p-4 rounded-xl" style={{ background: `${pkg.color}08`, border: `1px solid ${pkg.color}25` }}>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 8 }}>XEM TRƯỚC</div>
            <div className="flex items-center gap-4">
              <span style={{ fontSize: 24 }}>{pkg.icon}</span>
              <div>
                <div style={{ color: pkg.color, fontSize: 13, fontWeight: 700 }}>{form.industry}</div>
                <div style={{ color: DS.text5, fontSize: 11 }}>{form.tagline}</div>
              </div>
              <div className="ml-auto text-right">
                <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>FREE {form.trialDays}N</div>
                <div style={{ color: pkg.color, fontSize: 15, fontWeight: 800 }}>{Number(form.fullPrice).toLocaleString('vi-VN')} VNĐ</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose}
            style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, cursor: 'pointer', fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleSave}
            style={{ flex: 2, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Save size={14} /> Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Feature Row (expandable) ───────────────────────────────────────────────────

function PackageRow({ pkg, onEdit, onToggle, onDelete }: {
  pkg: AdminPackage;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${pkg.active ? DS.border : DS.border + '50'}`, opacity: pkg.active ? 1 : 0.55 }}>
      {/* Main row */}
      <div className="flex items-center gap-4 p-4" style={{ background: DS.bgCard2 }}>
        {/* Icon + name */}
        <div className="flex items-center gap-3 flex-shrink-0" style={{ minWidth: 200 }}>
          <span style={{ fontSize: 22 }}>{pkg.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ color: pkg.active ? DS.text : DS.text4, fontSize: 13, fontWeight: 700 }}>{pkg.industry}</span>
              {pkg.badge && (
                <span style={{ color: pkg.badgeColor, fontSize: 8, fontFamily: DS.mono, background: `${pkg.badgeColor}15`, border: `1px solid ${pkg.badgeColor}30`, padding: '1px 6px', borderRadius: 6 }}>{pkg.badge}</span>
              )}
            </div>
            <div style={{ color: DS.text5, fontSize: 10 }}>{pkg.category}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-4 gap-3">
          <div className="text-center">
            <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>FREE/{pkg.trialDays}N</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>{pkg.trialRequests} yêu cầu thử</div>
          </div>
          <div className="text-center">
            <div style={{ color: pkg.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{Number(pkg.fullPrice).toLocaleString('vi-VN')}</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>VNĐ / gói full</div>
          </div>
          <div className="text-center">
            <div style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{pkg.orderCount}</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>Đơn đã mua</div>
          </div>
          <div className="text-center">
            <div style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
              {pkg.revenue >= 1_000_000 ? `${(pkg.revenue / 1_000_000).toFixed(0)}M` : pkg.revenue.toLocaleString('vi-VN')}
            </div>
            <div style={{ color: DS.text5, fontSize: 9 }}>Doanh thu VNĐ</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onToggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: pkg.active ? DS.green : DS.text5, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: DS.mono }}>
            {pkg.active ? <ToggleRight size={22} style={{ color: DS.green }} /> : <ToggleLeft size={22} />}
          </button>
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: `${pkg.color}12`, border: `1px solid ${pkg.color}30`, color: pkg.color, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono }}>
            <Edit3 size={12} /> Sửa
          </button>
          {pkg.beId && (
            <button onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: `${DS.red}10`, border: `1px solid ${DS.red}30`, color: DS.red, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono }}>
              <X size={12} /> Xóa
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text5, padding: 4 }}>
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded features */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="p-4 pt-3" style={{ background: DS.bgCard, borderTop: `1px solid ${DS.border}` }}>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                {pkg.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={10} style={{ color: pkg.color, flexShrink: 0 }} />
                    <span style={{ color: DS.text4, fontSize: 11 }}>{f}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>DEMO: </span>
                {pkg.demoFeatures.map(f => (
                  <span key={f} style={{ color: pkg.color, fontSize: 10, fontFamily: DS.mono, background: `${pkg.color}10`, border: `1px solid ${pkg.color}25`, padding: '2px 8px', borderRadius: 5 }}>{f}</span>
                ))}
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginLeft: 'auto' }}>
                  Kích hoạt: {pkg.activateTime} · LP thưởng: {pkg.lp.toLocaleString()} LP
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add Package Modal ──────────────────────────────────────────────────────────

function AddPackageModal({ onClose, onAdd }: { onClose: () => void; onAdd: (pkg: AdminPackage) => void }) {
  const [form, setForm] = useState({
    industry: '', icon: '🌐', tagline: '', description: '', category: 'ăn uống',
    trialDays: 5, fullPrice: 9900000, activateTime: '2 giờ', lp: 500,
    badge: '', color: '#3B82F6', gradFrom: '#3B82F6', gradTo: '#818CF8',
    features: '', demoFeatures: '',
  });

  const COLORS = ['#3B82F6', '#818CF8', '#22C55E', '#F59E0B', '#EF4444', '#14B8A6', '#EC4899', '#C084FC', '#06B6D4', '#D97706'];

  const handleAdd = () => {
    if (!form.industry.trim()) return;
    const newPkg: AdminPackage = {
      id: form.industry.toLowerCase().replace(/\s+/g, '-'),
      industry: form.industry,
      icon: form.icon,
      color: form.color,
      gradFrom: form.color,
      gradTo: form.gradTo,
      tagline: form.tagline,
      description: form.description,
      category: form.category as WebPackage['category'],
      trialDays: form.trialDays,
      trialPrice: 0,
      fullPrice: form.fullPrice,
      activateTime: form.activateTime,
      badge: form.badge || undefined,
      badgeColor: form.color,
      features: form.features.split('\n').filter(Boolean),
      demoFeatures: form.demoFeatures.split('\n').filter(Boolean),
      previewImg: `https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=600&q=80`,
      lp: form.lp,
      active: true,
      orderCount: 0,
      trialRequests: 0,
      revenue: 0,
    };
    onAdd(newPkg);
    onClose();
  };

  const inputStyle = { width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }} />
      <motion.div className="relative w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.blue}35`, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>── THÊM GÓI WEB MỚI</div>
            <div style={{ color: DS.blue, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Tạo loại website mới</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DS.text4, cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field label="TÊN GÓI WEB">
                <input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  placeholder="Web Tiệm tóc" style={inputStyle} />
              </Field>
            </div>
            <Field label="ICON (EMOJI)">
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="✂️" style={{ ...inputStyle, fontSize: 20, textAlign: 'center' }} />
            </Field>
          </div>

          <Field label="MÀU SẮC CHÍNH">
            <div className="flex flex-wrap gap-2 mt-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c, gradFrom: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${form.color === c ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="DANH MỤC">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {['ăn uống', 'sức khỏe', 'lưu trú', 'mua sắm', 'giáo dục', 'bất động sản'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="BADGE (TÙY CHỌN)">
              <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                placeholder="HOT, NEW, PREMIUM..." style={inputStyle} />
            </Field>
          </div>

          <Field label="TAGLINE">
            <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              placeholder="Tính năng 1 · Tính năng 2 · Tính năng 3" style={inputStyle} />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="NGÀY DÙNG THỬ">
              <input type="number" min={1} max={30} value={form.trialDays}
                onChange={e => setForm(f => ({ ...f, trialDays: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="GIÁ FULL (VNĐ)">
              <input type="number" value={form.fullPrice}
                onChange={e => setForm(f => ({ ...f, fullPrice: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="LP THƯỞNG">
              <input type="number" value={form.lp}
                onChange={e => setForm(f => ({ ...f, lp: Number(e.target.value) }))} style={inputStyle} />
            </Field>
          </div>

          <Field label="TÍNH NĂNG (mỗi dòng 1 tính năng)">
            <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              rows={4} placeholder="Đặt lịch online&#10;Quản lý khách hàng&#10;..." style={{ ...inputStyle, resize: 'vertical', fontFamily: DS.mono, fontSize: 12 }} />
          </Field>

          <Field label="TÍNH NĂNG DEMO (tối đa 3 dòng, hiển thị trên card)">
            <textarea value={form.demoFeatures} onChange={e => setForm(f => ({ ...f, demoFeatures: e.target.value }))}
              rows={3} placeholder="Đặt lịch&#10;Quản lý&#10;Báo cáo" style={{ ...inputStyle, resize: 'none', fontFamily: DS.mono, fontSize: 12 }} />
          </Field>
        </div>

        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose}
            style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, cursor: 'pointer', fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleAdd} disabled={!form.industry.trim()}
            style={{ flex: 2, background: form.industry.trim() ? GRD.primary : DS.bgCard2, color: form.industry.trim() ? '#fff' : DS.text5, border: 'none', borderRadius: 10, padding: '10px', cursor: form.industry.trim() ? 'pointer' : 'default', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={14} /> Thêm gói web
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

export function WebPackagesTab() {
  // ── BE state ──────────────────────────────────────────────────────
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [editPkg, setEditPkg] = useState<AdminPackage | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'orders' | 'price' | 'trial'>('revenue');

  // ── Fetch BE packages ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    webPackagesService.getPackages()
      .then(be => {
        if (cancelled) return;
        // Map BE → AdminPackage (keep mock stats, real name/price/color)
        const mapped: AdminPackage[] = be.map((p) => {
          const fallback = FALLBACK_PACKAGES.find(fp => fp.id === p.id);
          return {
            ...(fallback ?? { ...p, id: p.id, industry: p.name ?? p.id }),
            active: p.isActive ?? true,
            // Keep mock stats since BE doesn't have them
            orderCount: fallback?.orderCount ?? 0,
            trialRequests: fallback?.trialRequests ?? 0,
            revenue: fallback?.revenue ?? 0,
            beId: p.id,
          };
        });
        // Fill in missing with fallback packages
        const merged = [...mapped];
        FALLBACK_PACKAGES.forEach(fp => {
          if (!merged.some(p => p.id === fp.id)) {
            merged.push(fp);
          }
        });
        setPackages(merged);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('Không tải được danh sách gói web');
        setPackages(FALLBACK_PACKAGES);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Loading / Error overlay ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={36} className="animate-spin" style={{ color: DS.purple }} />
        <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 12 }}>Đang tải gói web...</span>
      </div>
    );
  }

  const filtered = useMemo(() => {
    let list = packages;
    if (filterActive === 'active') list = list.filter(p => p.active);
    if (filterActive === 'inactive') list = list.filter(p => !p.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.industry.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sortBy === 'revenue') sorted.sort((a, b) => b.revenue - a.revenue);
    else if (sortBy === 'orders') sorted.sort((a, b) => b.orderCount - a.orderCount);
    else if (sortBy === 'price') sorted.sort((a, b) => b.fullPrice - a.fullPrice);
    else if (sortBy === 'trial') sorted.sort((a, b) => b.trialRequests - a.trialRequests);
    return sorted;
  }, [packages, filterActive, search, sortBy]);

  const totalRevenue = packages.reduce((s, p) => s + p.revenue, 0);
  const totalOrders = packages.reduce((s, p) => s + p.orderCount, 0);
  const totalTrials = packages.reduce((s, p) => s + p.trialRequests, 0);
  const activeCount = packages.filter(p => p.active).length;

  const toggle = (id: string) => {
    const pkg = packages.find(p => p.id === id);
    if (!pkg) return;
    // Optimistic update
    setPackages(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    // Sync to BE
    if (pkg.beId) {
      webPackagesService.updatePackage(pkg.beId, { isActive: !pkg.active }).catch(() => {
        // Revert
        setPackages(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
      });
    }
  };

  const update = (id: string, data: Partial<AdminPackage>) => {
    const pkg = packages.find(p => p.id === id);
    if (!pkg) return;
    // Optimistic update
    setPackages(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    setEditPkg(null);
    // Sync to BE (only if already persisted — new packages have no beId yet)
    if (pkg.beId) {
      webPackagesService.updatePackage(pkg.beId, {
        name: data.industry ?? pkg.industry,
        nameVi: data.industry ?? pkg.industry,
        price: data.fullPrice,
        color: data.color,
        highlighted: data.popular,
      }).catch(() => {/* revert not needed — local state already updated */});
    }
  };

  const addPkg = (pkg: AdminPackage) => {
    // Optimistic
    setPackages(prev => [...prev, pkg]);
    setShowAdd(false);
    // Sync to BE
    webPackagesService.createPackage({
      slug: pkg.id,
      name: pkg.industry,
      nameVi: pkg.industry,
      price: pkg.fullPrice,
      color: pkg.color,
      highlighted: pkg.popular,
      isActive: pkg.active,
    }).then(created => {
      // Update with BE ID for future updates
      setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, beId: created.id } : p));
    }).catch(() => {/* already added optimistically */});
  };

  const deletePkg = (id: string) => {
    const pkg = packages.find(p => p.id === id);
    if (!pkg) return;
    // Optimistic delete
    setPackages(prev => prev.filter(p => p.id !== id));
    // Sync to BE
    if (pkg.beId) {
      webPackagesService.deletePackage(pkg.beId).catch(() => {
        // Revert
        setPackages(prev => [...prev, pkg]);
      });
    }
  };

  // SVG mini bar chart for revenue distribution
  const maxRevenue = Math.max(...packages.map(p => p.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {loadError && (
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: `${DS.red}12`, border: `1px solid ${DS.red}30` }}>
          <AlertCircle size={14} style={{ color: DS.red }} />
          <span style={{ color: DS.red, fontSize: 12, fontFamily: DS.mono }}>{loadError}</span>
          <button onClick={() => setLoadError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: DS.red, cursor: 'pointer' }}><X size={12} /></button>
        </div>
      )}

      {/* KPI overview */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tổng doanh thu', value: totalRevenue >= 1_000_000 ? `${(totalRevenue / 1_000_000).toFixed(0)}M VNĐ` : totalRevenue.toLocaleString('vi-VN'), color: DS.green, icon: <DollarSign size={18} /> },
          { label: 'Đơn hàng đã bán', value: totalOrders, color: DS.blue, icon: <Package size={18} /> },
          { label: 'Yêu cầu dùng thử', value: totalTrials, color: DS.amber, icon: <CalendarClock size={18} /> },
          { label: 'Gói đang active', value: `${activeCount}/${packages.length}`, color: DS.purple, icon: <ToggleRight size={18} /> },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue distribution SVG chart */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── DOANH THU THEO GÓI WEB</div>
        <div className="overflow-x-auto">
          <svg width={packages.length * (BAR_W + 12) + 40} height={CHART_H + 36} style={{ display: 'block' }}>
            {packages.map((p, i) => {
              const barH = Math.max((p.revenue / maxRevenue) * CHART_H, 2);
              const x = i * (BAR_W + 12) + 20;
              const y = CHART_H - barH;
              return (
                <g key={p.id}>
                  <rect x={x} y={y} width={BAR_W} height={barH} rx={4}
                    fill={p.active ? p.color : DS.border}
                    opacity={p.active ? 0.85 : 0.4}
                  />
                  <text x={x + BAR_W / 2} y={CHART_H + 14} textAnchor="middle"
                    style={{ fontSize: 18, fill: 'transparent' }}>
                    {p.icon}
                  </text>
                  <foreignObject x={x + BAR_W / 2 - 9} y={CHART_H + 4} width={18} height={18}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{p.icon}</span>
                  </foreignObject>
                  {p.revenue > 0 && (
                    <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle" style={{ fontSize: 8, fill: p.color, fontFamily: 'monospace' }}>
                      {(p.revenue / 1_000_000).toFixed(0)}M
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <Search size={13} style={{ color: DS.text5 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm gói web theo tên, danh mục..."
              style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, flex: 1 }} />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <ArrowUpDown size={12} style={{ color: DS.text5 }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              style={{ background: 'none', border: 'none', outline: 'none', color: DS.text4, fontSize: 12, fontFamily: DS.mono, cursor: 'pointer' }}>
              <option value="revenue">Doanh thu</option>
              <option value="orders">Đơn hàng</option>
              <option value="trial">Dùng thử</option>
              <option value="price">Giá</option>
            </select>
          </div>

          {/* Add button */}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: GRD.primary, border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 0 16px rgba(129,140,248,0.3)' }}>
            <Plus size={14} /> Thêm gói web
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              style={{ padding: '4px 12px', borderRadius: 20, fontSize: 10, fontFamily: DS.mono, cursor: 'pointer', border: `1px solid ${filterActive === f ? DS.blue : DS.border}`, background: filterActive === f ? 'rgba(59,130,246,0.12)' : 'none', color: filterActive === f ? DS.blue : DS.text5 }}>
              {f === 'all' ? `TẤT CẢ (${packages.length})` : f === 'active' ? `ACTIVE (${activeCount})` : `ẨN (${packages.length - activeCount})`}
            </button>
          ))}
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginLeft: 'auto' }}>
            {filtered.length} / {packages.length} gói web
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid gap-4 px-4" style={{ gridTemplateColumns: '200px 1fr 80px' }}>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em' }}>TÊN GÓI WEB</div>
        <div className="grid grid-cols-4 gap-3" style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em' }}>
          <span className="text-center">DÙNG THỬ / YÊU CẦU</span>
          <span className="text-center">GIÁ FULL</span>
          <span className="text-center">ĐƠN ĐÃ BÁN</span>
          <span className="text-center">DOANH THU</span>
        </div>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em' }}>THAO TÁC</div>
      </div>

      {/* Package list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((pkg, i) => (
            <motion.div key={pkg.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.04 }}>
              <PackageRow pkg={pkg} onEdit={() => setEditPkg(pkg)} onToggle={() => toggle(pkg.id)} onDelete={() => deletePkg(pkg.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editPkg && (
          <EditModal pkg={editPkg} onClose={() => setEditPkg(null)}
            onSave={data => { update(editPkg.id, data); setEditPkg(null); }} />
        )}
        {showAdd && <AddPackageModal onClose={() => setShowAdd(false)} onAdd={addPkg} />}
      </AnimatePresence>
    </div>
  );
}
