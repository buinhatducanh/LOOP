/**
 * QuotationTab — Quản lý cấu hình Báo giá 8 bước (Admin)
 * Quản lý dịch vụ, gói, tính năng, nhân sự, extras, pricing
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit3, Trash2, X, Save, ChevronDown, ChevronUp,
  Globe, Code2, BarChart3, Target, DollarSign, Users,
  Layers, Shield, Zap, Package, Settings, Eye, GripVertical,
  CreditCard, Star, Check, AlertCircle,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { servicesService, type WizardService } from '../../../api/services.service';
import { featuresService, type WizardFeature } from '../../../api/features.service';
import { addonService, type WizardExtra } from '../../../api/addon.service';
import { teamService } from '../../../api/team.service';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// ── Wizard types (imported from services) ──────────────────────────────────────
// WizardService, WizardFeature, WizardExtra → imported from api/services, features, addon
// WizardPackage — kept local (no BE model yet)
interface WizardPackage {
  id: string; name: string; multiplier: number; color: string; desc: string; features: string[]; lp: number; popular?: boolean;
}
interface WizardTalent {
  id: string; name: string; role: string; rank: string; rankColor: string; specialty: string; img: string; active: boolean;
}

// ── Fallback data (used when BE is offline) ────────────────────────────────────
const FALLBACK_SERVICES: WizardService[] = [
  { id: 'web', title: 'Thiết kế & Phát triển Website', desc: 'Landing page, corporate site, e-commerce', basePrice: 15_000_000, color: DS.blue, icon: '🌐', active: true },
  { id: 'app', title: 'Phát triển App & SaaS Platform', desc: 'Mobile app, web app, SaaS enterprise', basePrice: 80_000_000, color: DS.purple, icon: '⚙️', active: true },
  { id: 'dashboard', title: 'Dashboard & Data Analytics', desc: 'Real-time dashboard, data visualization', basePrice: 25_000_000, color: DS.cyan, icon: '📊', active: true },
  { id: 'seo', title: 'SEO & Digital Marketing', desc: 'Tăng trưởng organic bền vững', basePrice: 8_000_000, color: DS.green, icon: '📈', active: true, perMonth: true },
];
const FALLBACK_FEATURES: WizardFeature[] = [
  { id: 'cms', serviceId: 'web', label: 'Tích hợp CMS (Sanity/Contentful)', description: '', price: 5_000_000, icon: '📄', variants: [], active: true },
  { id: 'i18n', serviceId: 'web', label: 'Đa ngôn ngữ (i18n)', description: '', price: 3_000_000, icon: '🌍', variants: [], active: true },
  { id: 'ecom', serviceId: 'web', label: 'E-commerce (giỏ hàng, thanh toán)', description: '', price: 12_000_000, icon: '🛒', variants: [], active: true },
  { id: 'blog', serviceId: 'web', label: 'Blog & Content module', description: '', price: 2_500_000, icon: '📰', variants: [], active: true },
  { id: 'analytics-web', serviceId: 'web', label: 'Analytics dashboard riêng', description: '', price: 4_000_000, icon: '📊', variants: [], active: true },
  { id: 'auth', serviceId: 'app', label: 'Auth & User management', description: '', price: 6_000_000, icon: '🔐', variants: [], active: true },
  { id: 'notification', serviceId: 'app', label: 'Push notification', description: '', price: 3_500_000, icon: '🔔', variants: [], active: true },
  { id: 'payment', serviceId: 'app', label: 'Tích hợp thanh toán (VNPAY/Momo)', description: '', price: 8_000_000, icon: '💳', variants: [], active: true },
  { id: 'chat', serviceId: 'app', label: 'In-app chat & messaging', description: '', price: 7_000_000, icon: '💬', variants: [], active: true },
  { id: 'realtime', serviceId: 'dashboard', label: 'Real-time data sync', description: '', price: 5_000_000, icon: '⚡', variants: [], active: true },
  { id: 'export', serviceId: 'dashboard', label: 'Export PDF/Excel tự động', description: '', price: 3_000_000, icon: '📥', variants: [], active: true },
  { id: 'ml', serviceId: 'dashboard', label: 'ML predictions & insights', description: '', price: 15_000_000, icon: '🤖', variants: [], active: true },
  { id: 'ads', serviceId: 'seo', label: 'Quản lý Google Ads', description: '', price: 3_000_000, icon: '📢', variants: [], active: true },
  { id: 'content', serviceId: 'seo', label: 'Content marketing (4 bài/tháng)', description: '', price: 4_000_000, icon: '✍️', variants: [], active: true },
];
const FALLBACK_EXTRAS: WizardExtra[] = [
  { id: 'hosting', label: 'Hosting & Domain 1 năm', price: 3_000_000, color: DS.blue, type: 'hosting', active: true },
  { id: 'maintenance', label: 'Bảo trì & cập nhật 1 năm', price: 5_000_000, color: DS.green, type: 'maintenance', active: true },
  { id: 'analytics-setup', label: 'Setup Google Analytics 4', price: 1_500_000, color: DS.cyan, type: 'analytics', active: true },
  { id: 'training', label: 'Training & hướng dẫn (3 buổi)', price: 2_000_000, color: DS.purple, type: 'training', active: true },
  { id: 'priority', label: 'Priority support 24/7 (6 tháng)', price: 4_500_000, color: DS.amber, type: 'support', active: true },
  { id: 'seo-basic', label: 'SEO cơ bản & submission', price: 1_200_000, color: DS.red, type: 'seo', active: true },
];
const FALLBACK_TALENTS: WizardTalent[] = [
  { id: 'akira', name: 'Akira Sato', role: 'Lead Full-stack Dev', rank: 'DIAMOND', rankColor: '#818CF8', specialty: 'React, Node.js, AWS', img: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=80&h=80&crop=faces', active: true },
  { id: 'yuna', name: 'Yuna Park', role: 'UI/UX Design Lead', rank: 'RUBY', rankColor: '#EF4444', specialty: 'Figma, Design Systems', img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=80&h=80&crop=faces', active: true },
  { id: 'shin', name: 'Shin Watanabe', role: 'DevOps & Backend', rank: 'DIAMOND', rankColor: '#818CF8', specialty: 'Docker, K8s, Rust', img: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=80&h=80&crop=faces', active: true },
  { id: 'mei', name: 'Mei Lin', role: 'Mobile & SEO Expert', rank: 'RUBY', rankColor: '#EF4444', specialty: 'React Native, SEO', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&crop=faces', active: true },
];
const INIT_PACKAGES: WizardPackage[] = [
  { id: 'starter', name: 'Starter', multiplier: 1, color: DS.text3, desc: 'Phù hợp cá nhân, startup', features: ['Thiết kế cơ bản', 'Responsive design', 'SEO cơ bản', 'Bảo hành 3 tháng'], lp: 50 },
  { id: 'business', name: 'Business', multiplier: 2.2, color: DS.blue, desc: 'Doanh nghiệp vừa, cần scale', features: ['Thiết kế độc quyền', 'CMS tích hợp', 'Analytics dashboard', 'Bảo hành 6 tháng', 'Không giới hạn sửa'], lp: 120, popular: true },
  { id: 'enterprise', name: 'Enterprise', multiplier: 3.8, color: DS.purple, desc: 'Doanh nghiệp lớn, yêu cầu cao', features: ['Tùy chỉnh hoàn toàn', 'API & Integrations', 'SLA 99.9%', 'Dedicated PM', 'Support 24/7', 'Bảo hành 12 tháng'], lp: 250 },
];

const STEP_LABELS = ['Dịch vụ', 'Gói', 'Tính năng', 'Team', 'Lịch', 'Thêm', 'Xem lại', 'Thanh toán'];

// ── Sub Components ────────────────────────────────────────────────────────

function SectionHeader({ title, count, onAdd }: { title: string; count: number; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── {title}</div>
        <div style={{ color: DS.text5, fontSize: 11, marginTop: 2 }}>{count} mục</div>
      </div>
      <button onClick={onAdd}
        style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
        <Plus size={12} /> Thêm mới
      </button>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────
function EditModal({ title, children, onClose, onSave }: {
  title: string; children: React.ReactNode; onClose: () => void; onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">{children}</div>
        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, fontSize: 13, cursor: 'pointer' }}>Hủy</button>
          <button onClick={onSave} style={{ flex: 1, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Save size={12} style={{ display: 'inline', marginRight: 6 }} />Lưu
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5, letterSpacing: '0.12em' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export function QuotationTab() {
  const [activeSection, setActiveSection] = useState<'overview' | 'services' | 'packages' | 'features' | 'extras' | 'talents' | 'steps'>('overview');
  const [services, setServices] = useState<WizardService[]>([]);
  const [packages, setPackages] = useState(INIT_PACKAGES); // local only (no BE model yet)
  const [features, setFeatures] = useState<WizardFeature[]>([]);
  const [extras, setExtras] = useState<WizardExtra[]>([]);
  const [talents, setTalents] = useState<WizardTalent[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Fetch all config from BE on mount
  useEffect(() => {
    let cancelled = false;
    setTabLoading(true);
    Promise.all([
      servicesService.getWizardServices().catch(() => FALLBACK_SERVICES),
      featuresService.getFeatures().catch(() => FALLBACK_FEATURES),
      addonService.getAddons().catch(() => FALLBACK_EXTRAS),
      teamService.getAdminMembers({ limit: 20 }).catch(() => ({ members: [] })),
    ])
      .then(([svc, feat, add, tm]) => {
        if (cancelled) return;
        setServices(svc);
        setFeatures(feat);
        setExtras(add);
        setTalents(tm.members.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role,
          rank: m.rank.toUpperCase(),
          rankColor: m.rankColor,
          specialty: m.tags.join(', '),
          img: m.image,
          active: true,
        })));
      })
      .finally(() => { if (!cancelled) setTabLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const [editModal, setEditModal] = useState<{ type: string; item: unknown } | null>(null);

  const sections = [
    { id: 'overview', label: 'Tổng quan', icon: <Eye size={14} />, count: 0 },
    { id: 'services', label: 'Dịch vụ', icon: <Globe size={14} />, count: services.length },
    { id: 'packages', label: 'Gói dịch vụ', icon: <Package size={14} />, count: packages.length },
    { id: 'features', label: 'Tính năng', icon: <Layers size={14} />, count: features.length },
    { id: 'extras', label: 'Dịch vụ thêm', icon: <Plus size={14} />, count: extras.length },
    { id: 'talents', label: 'Nhân sự', icon: <Users size={14} />, count: talents.length },
    { id: 'steps', label: '8 Bước Wizard', icon: <Settings size={14} />, count: 8 },
  ] as const;

  // ── Service CRUD ──────────────────────────────────────────────────────
  const handleSaveService = (item: WizardService) => {
    // Optimistic update
    setServices(prev => {
      const exists = prev.find(s => s.id === item.id);
      return exists ? prev.map(s => s.id === item.id ? item : s) : [...prev, item];
    });
    setEditModal(null);
    // Sync to BE (create or update by presence of real id)
    const isNew = !item.id || item.id.startsWith('svc-') || item.id.startsWith('wiz-');
    if (!isNew) {
      servicesService.updateService(item.id, item as Parameters<typeof servicesService.updateService>[1]).catch(() => {});
    } else {
      servicesService.createService({ ...item, id: '' } as Parameters<typeof servicesService.createService>[0]).then(created => {
        setServices(prev => prev.map(s => s.id === item.id ? { ...s, id: created.id } : s));
      }).catch(() => {});
    }
  };

  const handleSavePackage = (_item: WizardPackage) => {
    // Packages are local-only (no BE model yet)
    setEditModal(null);
  };

  const handleSaveFeature = (item: WizardFeature) => {
    setFeatures(prev => {
      const exists = prev.find(f => f.id === item.id);
      return exists ? prev.map(f => f.id === item.id ? item : f) : [...prev, item];
    });
    setEditModal(null);
    const isNew = !item.id || item.id.startsWith('feat-');
    if (!isNew) {
      featuresService.updateFeature(item.id, item).catch(() => {});
    } else {
      featuresService.createFeature({
        groupId: item.serviceId,
        featureName: item.label,
        description: item.description,
        variants: item.variants?.map(v => ({ variantName: v.variantName, description: v.description ?? '', price: v.price })) ?? [],
      }).then(created => {
        setFeatures(prev => prev.map(f => f.id === item.id ? created : f));
      }).catch(() => {});
    }
  };

  const handleSaveExtra = (item: WizardExtra) => {
    setExtras(prev => {
      const exists = prev.find(e => e.id === item.id);
      return exists ? prev.map(e => e.id === item.id ? item : e) : [...prev, item];
    });
    setEditModal(null);
    const isNew = !item.id || item.id.startsWith('ext-');
    if (!isNew) {
      addonService.updateAddon(item.id, item).catch(() => {});
    } else {
      addonService.createAddon({ name: item.label, nameVi: item.label, type: item.type ?? undefined, price: item.price }).then(created => {
        setExtras(prev => prev.map(e => e.id === item.id ? created : e));
      }).catch(() => {});
    }
  };

  const handleSaveTalent = (_item: WizardTalent) => {
    // Talents → team members; edits handled in MembersTab
    setEditModal(null);
  };

  // ── Stats ──────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Dịch vụ', value: services.filter(s => s.active).length + '/' + services.length, color: DS.blue, icon: <Globe size={16} /> },
    { label: 'Gói dịch vụ', value: String(packages.length), color: DS.purple, icon: <Package size={16} /> },
    { label: 'Tính năng', value: String(features.length), color: DS.cyan, icon: <Layers size={16} /> },
    { label: 'Nhân sự khả dụng', value: talents.filter(t => t.active).length + '/' + talents.length, color: DS.green, icon: <Users size={16} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: activeSection === s.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeSection === s.id ? DS.blue + '40' : DS.border}`,
              color: activeSection === s.id ? DS.blue : DS.text3,
              fontSize: 12, cursor: 'pointer',
            }}>
            {s.icon} {s.label}
            {s.count > 0 && <span style={{ color: DS.text5, fontFamily: DS.mono, fontSize: 10 }}>({s.count})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {activeSection === 'overview' && (
            <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Cấu hình Wizard Báo giá 8 Bước</div>
              <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>
                Quản lý toàn bộ nội dung của trang Báo giá <span style={{ color: DS.blue, fontFamily: DS.mono }}>/bao-gia</span>. 
                Mọi thay đổi tại đây sẽ được phản ánh trực tiếp trên trang khách hàng.
              </div>
              {/* Step preview */}
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>QUY TRÌNH 8 BƯỚC</div>
              <div className="flex items-center gap-1 flex-wrap">
                {STEP_LABELS.map((label, i) => (
                  <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: GRD.primary, border: 'none' }}>
                        <span style={{ color: '#fff', fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{i + 1}</span>
                      </div>
                      <span style={{ color: DS.text3, fontSize: 9, fontFamily: DS.mono, marginTop: 4 }}>{label}</span>
                    </div>
                    {i < 7 && <div style={{ width: 20, height: 1, background: DS.border, margin: '0 2px', marginBottom: 16 }} />}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { step: 'Bước 1', label: 'Chọn dịch vụ', data: `${services.filter(s => s.active).length} dịch vụ`, section: 'services' as const },
                  { step: 'Bước 2', label: 'Chọn gói', data: `${packages.length} gói`, section: 'packages' as const },
                  { step: 'Bước 3', label: 'Chọn tính năng', data: `${features.length} tính năng`, section: 'features' as const },
                  { step: 'Bước 4', label: 'Chọn nhân sự', data: `${talents.filter(t => t.active).length} nhân sự`, section: 'talents' as const },
                  { step: 'Bước 5', label: 'Lịch hẹn', data: 'Cấu hình lịch', section: 'steps' as const },
                  { step: 'Bước 6', label: 'Dịch vụ thêm', data: `${extras.length} extras`, section: 'extras' as const },
                  { step: 'Bước 7', label: 'Xem lại', data: 'Tự động', section: 'overview' as const },
                  { step: 'Bước 8', label: 'Thanh toán', data: 'LP + VNĐ', section: 'overview' as const },
                ].map(s => (
                  <button key={s.step} onClick={() => setActiveSection(s.section)}
                    className="flex items-center gap-3 p-3 rounded-xl text-left"
                    style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, cursor: 'pointer' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                      <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{s.step.split(' ')[1]}</span>
                    </div>
                    <div>
                      <div style={{ color: DS.text, fontSize: 12, fontWeight: 600 }}>{s.label}</div>
                      <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{s.data}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'services' && (
            <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <SectionHeader title="DỊCH VỤ BÁO GIÁ" count={services.length}
                onAdd={() => setEditModal({ type: 'service', item: { id: `svc-${Date.now()}`, title: '', desc: '', basePrice: 10_000_000, color: DS.blue, icon: '🌐', active: true } })} />
              <div className="space-y-3">
                {services.map(s => (
                  <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, opacity: s.active ? 1 : 0.5 }}>
                    <div className="text-2xl flex-shrink-0">{s.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{s.title}</div>
                      <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{s.desc}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span style={{ color: s.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>Từ {fmtVND(s.basePrice)}{s.perMonth ? '/tháng' : ''}</span>
                        <span style={{ color: s.active ? DS.green : DS.red, fontSize: 10, fontFamily: DS.mono, border: `1px solid ${s.active ? DS.green : DS.red}30`, padding: '1px 6px', borderRadius: 4 }}>
                          {s.active ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setServices(prev => prev.map(sv => sv.id === s.id ? { ...sv, active: !sv.active } : sv))}
                        style={{ color: s.active ? DS.green : DS.text5, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 10 }}>
                        {s.active ? 'Tắt' : 'Bật'}
                      </button>
                      <button onClick={() => setEditModal({ type: 'service', item: s })}
                        style={{ color: DS.blue, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
                        <Edit3 size={11} />
                      </button>
                      <button onClick={() => {
                        const id = s.id;
                        setServices(prev => prev.filter(sv => sv.id !== id));
                        if (!id.startsWith('svc-') && !id.startsWith('wiz-')) {
                          servicesService.deleteService(id).catch(() => setServices(prev => [...prev, s]));
                        }
                      }}
                        style={{ color: DS.red, background: `${DS.red}10`, border: `1px solid ${DS.red}20`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'packages' && (
            <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <SectionHeader title="GÓI DỊCH VỤ" count={packages.length}
                onAdd={() => setEditModal({ type: 'package', item: { id: `pkg-${Date.now()}`, name: '', multiplier: 1, color: DS.blue, desc: '', features: [], lp: 50 } })} />
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {packages.map(p => (
                  <div key={p.id} className="p-5 rounded-xl relative" style={{ background: DS.bgCard2, border: `1px solid ${p.popular ? p.color + '50' : DS.border}` }}>
                    {p.popular && <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-full" style={{ background: p.color, fontSize: 9, color: '#fff', fontFamily: DS.mono }}>PHỔ BIẾN</div>}
                    <div style={{ color: p.color, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ color: DS.text4, fontSize: 12, marginBottom: 8 }}>{p.desc}</div>
                    <div style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700, marginBottom: 4 }}>×{p.multiplier} giá cơ sở</div>
                    <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, marginBottom: 10 }}>+{p.lp} LP/đơn</div>
                    <div className="space-y-1 mb-4">
                      {p.features.map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <Check size={10} style={{ color: DS.green }} />
                          <span style={{ color: DS.text3, fontSize: 11 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditModal({ type: 'package', item: p })}
                        style={{ flex: 1, color: DS.blue, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 6, padding: '6px', cursor: 'pointer', fontSize: 11 }}>
                        <Edit3 size={11} style={{ display: 'inline', marginRight: 4 }} />Sửa
                      </button>
                      <button onClick={() => setPackages(prev => prev.filter(pk => pk.id !== p.id))}
                        style={{ color: DS.red, background: `${DS.red}10`, border: `1px solid ${DS.red}20`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 11 }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'features' && (
            <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <SectionHeader title="TÍNH NĂNG TÙY CHỌN" count={features.length}
                onAdd={() => setEditModal({ type: 'feature', item: { id: `feat-${Date.now()}`, serviceId: 'web', label: '', price: 3_000_000, icon: '⚡' } })} />
              {services.filter(s => s.active).map(svc => {
                const svcFeatures = features.filter(f => f.serviceId === svc.id);
                if (svcFeatures.length === 0) return null;
                return (
                  <div key={svc.id} className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{svc.icon}</span>
                      <span style={{ color: svc.color, fontSize: 12, fontWeight: 700 }}>{svc.title}</span>
                      <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>({svcFeatures.length})</span>
                    </div>
                    <div className="space-y-2">
                      {svcFeatures.map(f => (
                        <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl"
                          style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                          <span className="text-sm">{f.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div style={{ color: DS.text2, fontSize: 13 }}>{f.label}</div>
                          </div>
                          <span style={{ color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(f.price)}</span>
                          <button onClick={() => setEditModal({ type: 'feature', item: f })}
                            style={{ color: DS.blue, background: 'none', border: `1px solid ${DS.blue}30`, borderRadius: 5, padding: '3px 6px', cursor: 'pointer' }}>
                            <Edit3 size={10} />
                          </button>
                          <button onClick={() => {
                            const id = f.id;
                            setFeatures(prev => prev.filter(ff => ff.id !== id));
                            if (!id.startsWith('feat-')) {
                              featuresService.deleteFeature(id).catch(() => setFeatures(prev => [...prev, f]));
                            }
                          }}
                            style={{ color: DS.red, background: 'none', border: `1px solid ${DS.red}20`, borderRadius: 5, padding: '3px 6px', cursor: 'pointer' }}>
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeSection === 'extras' && (
            <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <SectionHeader title="DỊCH VỤ THÊM" count={extras.length}
                onAdd={() => setEditModal({ type: 'extra', item: { id: `ext-${Date.now()}`, label: '', price: 1_000_000, color: DS.blue } })} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {extras.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                    <div className="flex-1">
                      <div style={{ color: DS.text2, fontSize: 13 }}>{e.label}</div>
                    </div>
                    <span style={{ color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(e.price)}</span>
                    <button onClick={() => setEditModal({ type: 'extra', item: e })}
                      style={{ color: DS.blue, background: 'none', border: `1px solid ${DS.blue}30`, borderRadius: 5, padding: '3px 6px', cursor: 'pointer' }}>
                      <Edit3 size={10} />
                    </button>
                    <button onClick={() => {
                      const id = e.id;
                      setExtras(prev => prev.filter(ex => ex.id !== id));
                      if (!id.startsWith('ext-')) {
                        addonService.deleteAddon(id).catch(() => setExtras(prev => [...prev, e]));
                      }
                    }}
                      style={{ color: DS.red, background: 'none', border: `1px solid ${DS.red}20`, borderRadius: 5, padding: '3px 6px', cursor: 'pointer' }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'talents' && (
            <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <SectionHeader title="NHÂN SỰ CHO BÁO GIÁ" count={talents.length}
                onAdd={() => setEditModal({ type: 'talent', item: { id: `tal-${Date.now()}`, name: '', role: '', rank: 'GOLD', rankColor: DS.amber, specialty: '', img: '', active: true } })} />
              <div className="space-y-3">
                {talents.map(t => (
                  <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, opacity: t.active ? 1 : 0.5 }}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `2px solid ${t.rankColor}` }}>
                      <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                      <div style={{ color: DS.text4, fontSize: 12 }}>{t.role} · <span style={{ color: t.rankColor }}>{t.rank}</span></div>
                      <div style={{ color: DS.text5, fontSize: 11, marginTop: 2 }}>{t.specialty}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setTalents(prev => prev.map(tl => tl.id === t.id ? { ...tl, active: !tl.active } : tl))}
                        style={{ color: t.active ? DS.green : DS.text5, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 10 }}>
                        {t.active ? 'Đang bật' : 'Đã tắt'}
                      </button>
                      <button onClick={() => setEditModal({ type: 'talent', item: t })}
                        style={{ color: DS.blue, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                        <Edit3 size={11} />
                      </button>
                      <button onClick={() => setTalents(prev => prev.filter(tl => tl.id !== t.id))}
                        style={{ color: DS.red, background: `${DS.red}10`, border: `1px solid ${DS.red}20`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'steps' && (
            <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── CẤU HÌNH 8 BƯỚC WIZARD</div>
              <div className="space-y-3">
                {STEP_LABELS.map((label, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GRD.primary }}>
                      <span style={{ color: '#fff', fontSize: 14, fontFamily: DS.mono, fontWeight: 900 }}>{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{label}</div>
                      <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
                        {i === 0 && `${services.filter(s => s.active).length} dịch vụ đang hoạt động`}
                        {i === 1 && `${packages.length} gói với hệ số ×1 - ×${Math.max(...packages.map(p => p.multiplier))}`}
                        {i === 2 && `${features.length} tính năng tùy chọn`}
                        {i === 3 && `${talents.filter(t => t.active).length} nhân sự khả dụng`}
                        {i === 4 && 'Lịch hẹn online / onsite'}
                        {i === 5 && `${extras.length} dịch vụ thêm`}
                        {i === 6 && 'Tổng hợp tự động từ 6 bước trước'}
                        {i === 7 && 'Thanh toán VNĐ + LP · Giảm giá tối đa 20%'}
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: DS.green, boxShadow: `0 0 4px ${DS.green}` }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit Modals */}
      <AnimatePresence>
        {editModal?.type === 'service' && (() => {
          const [draft, setDraft] = [editModal.item, (v: any) => setEditModal({ ...editModal, item: v })];
          return (
            <EditModal title={draft.title ? 'Sửa dịch vụ' : 'Thêm dịch vụ'} onClose={() => setEditModal(null)} onSave={() => handleSaveService(draft)}>
              <Field label="TÊN DỊCH VỤ" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} />
              <Field label="MÔ TẢ" value={draft.desc} onChange={v => setDraft({ ...draft, desc: v })} />
              <Field label="GIÁ CƠ SỞ (VNĐ)" value={draft.basePrice} onChange={v => setDraft({ ...draft, basePrice: Number(v) })} type="number" />
              <Field label="ICON (emoji)" value={draft.icon} onChange={v => setDraft({ ...draft, icon: v })} />
              <Field label="MÀU SẮC (hex)" value={draft.color} onChange={v => setDraft({ ...draft, color: v })} />
            </EditModal>
          );
        })()}

        {editModal?.type === 'package' && (() => {
          const [draft, setDraft] = [editModal.item, (v: any) => setEditModal({ ...editModal, item: v })];
          return (
            <EditModal title={draft.name ? 'Sửa gói' : 'Thêm gói mới'} onClose={() => setEditModal(null)} onSave={() => handleSavePackage(draft)}>
              <Field label="TÊN GÓI" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} />
              <Field label="MÔ TẢ" value={draft.desc} onChange={v => setDraft({ ...draft, desc: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="HỆ SỐ GIÁ (×)" value={draft.multiplier} onChange={v => setDraft({ ...draft, multiplier: Number(v) })} type="number" />
                <Field label="LP THƯỞNG" value={draft.lp} onChange={v => setDraft({ ...draft, lp: Number(v) })} type="number" />
              </div>
              <Field label="MÀU SẮC (hex)" value={draft.color} onChange={v => setDraft({ ...draft, color: v })} />
              <div>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>TÍNH NĂNG (1 dòng/1 tính năng)</label>
                <textarea value={(draft.features || []).join('\n')} onChange={e => setDraft({ ...draft, features: e.target.value.split('\n').filter(Boolean) })}
                  rows={5} style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: DS.body }} />
              </div>
            </EditModal>
          );
        })()}

        {editModal?.type === 'feature' && (() => {
          const [draft, setDraft] = [editModal.item, (v: any) => setEditModal({ ...editModal, item: v })];
          return (
            <EditModal title="Chỉnh sửa tính năng" onClose={() => setEditModal(null)} onSave={() => handleSaveFeature(draft)}>
              <Field label="TÊN TÍNH NĂNG" value={draft.label} onChange={v => setDraft({ ...draft, label: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="GIÁ (VNĐ)" value={draft.price} onChange={v => setDraft({ ...draft, price: Number(v) })} type="number" />
                <Field label="ICON (emoji)" value={draft.icon} onChange={v => setDraft({ ...draft, icon: v })} />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>THUỘC DỊCH VỤ</label>
                <select value={draft.serviceId} onChange={e => setDraft({ ...draft, serviceId: e.target.value })}
                  style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none' }}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
            </EditModal>
          );
        })()}

        {editModal?.type === 'extra' && (() => {
          const [draft, setDraft] = [editModal.item, (v: any) => setEditModal({ ...editModal, item: v })];
          return (
            <EditModal title="Chỉnh sửa dịch vụ thêm" onClose={() => setEditModal(null)} onSave={() => handleSaveExtra(draft)}>
              <Field label="TÊN DỊCH VỤ" value={draft.label} onChange={v => setDraft({ ...draft, label: v })} />
              <Field label="GIÁ (VNĐ)" value={draft.price} onChange={v => setDraft({ ...draft, price: Number(v) })} type="number" />
              <Field label="MÀU SẮC (hex)" value={draft.color} onChange={v => setDraft({ ...draft, color: v })} />
            </EditModal>
          );
        })()}

        {editModal?.type === 'talent' && (() => {
          const [draft, setDraft] = [editModal.item, (v: any) => setEditModal({ ...editModal, item: v })];
          return (
            <EditModal title="Chỉnh sửa nhân sự" onClose={() => setEditModal(null)} onSave={() => handleSaveTalent(draft)}>
              <Field label="TÊN" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} />
              <Field label="VỊ TRÍ" value={draft.role} onChange={v => setDraft({ ...draft, role: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="RANK" value={draft.rank} onChange={v => setDraft({ ...draft, rank: v })} />
                <Field label="MÀU RANK (hex)" value={draft.rankColor} onChange={v => setDraft({ ...draft, rankColor: v })} />
              </div>
              <Field label="CHUYÊN MÔN" value={draft.specialty} onChange={v => setDraft({ ...draft, specialty: v })} />
              <Field label="URL ẢNH" value={draft.img} onChange={v => setDraft({ ...draft, img: v })} />
            </EditModal>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
