import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, X, Mail, Phone, Building2, Globe, Zap, FolderKanban, Star, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { revenueService } from '../../../api/revenue.service';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n);

interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  website: string;
  status: 'active' | 'inactive' | 'prospect';
  totalSpend: number;
  projects: number;
  lpBalance: number;
  rank: 'vip' | 'gold' | 'standard';
  joinDate: string;
  avatar: string;
  note: string;
}

const INITIAL_CLIENTS: Client[] = [
  { id: 1, name: 'Lê Quang Đức', company: 'FinCorp Vietnam', email: 'duc.le@fincorp.vn', phone: '0901 234 567', industry: 'FinTech', website: 'fincorp.vn', status: 'active', totalSpend: 500_000_000, projects: 1, lpBalance: 25000, rank: 'vip', joinDate: '15/01/2025', avatar: 'https://images.unsplash.com/photo-1642531291598-3a6b5cf98428?auto=format&fit=crop&w=80&h=80&crop=faces', note: 'Khách VIP quan trọng, đang đàm phán gói maintenance 100M/năm.' },
  { id: 2, name: 'Nguyễn Minh Tuấn', company: 'VNRetail JSC', email: 'tuan@vnretail.vn', phone: '0912 345 678', industry: 'E-commerce', website: 'vnretail.vn', status: 'active', totalSpend: 350_000_000, projects: 2, lpBalance: 17500, rank: 'vip', joinDate: '20/09/2024', avatar: 'https://images.unsplash.com/photo-1665615839740-f9cfcc9568f9?auto=format&fit=crop&w=80&h=80&crop=faces', note: 'Đang triển khai phase 2. Tiềm năng thêm module ERP.' },
  { id: 3, name: 'Dr. Trần Thị Mai', company: 'HealthTech Vietnam', email: 'mai@healthtech.vn', phone: '0923 456 789', industry: 'Healthcare', website: 'healthtech.vn', status: 'active', totalSpend: 180_000_000, projects: 1, lpBalance: 9000, rank: 'gold', joinDate: '05/03/2025', avatar: 'https://images.unsplash.com/photo-1729337531424-198f880cb6c7?auto=format&fit=crop&w=80&h=80&crop=faces', note: 'Hài lòng với MedApp. Xem xét khóa học cho team.' },
  { id: 4, name: 'Phạm Văn Hùng', company: 'DataViet Corp', email: 'hung@dataviet.vn', phone: '0934 567 890', industry: 'Analytics', website: 'dataviet.vn', status: 'active', totalSpend: 120_000_000, projects: 1, lpBalance: 6000, rank: 'gold', joinDate: '10/07/2024', avatar: 'https://images.unsplash.com/photo-1618698937393-8d7bb5f2d341?auto=format&fit=crop&w=80&h=80&crop=faces', note: 'Cần nâng cấp license Analytics Pro. Follow up Q2.' },
  { id: 5, name: 'Ngô Thị Lan', company: 'EduViet Foundation', email: 'lan@eduviet.edu.vn', phone: '0945 678 901', industry: 'Education', website: 'eduviet.edu.vn', status: 'active', totalSpend: 75_000_000, projects: 1, lpBalance: 3750, rank: 'standard', joinDate: '22/11/2024', avatar: 'https://images.unsplash.com/photo-1725144118950-44dc92db3f09?auto=format&fit=crop&w=80&h=80&crop=faces', note: 'Hài lòng cao. Giới thiệu 2 trường đại học khác.' },
  { id: 6, name: 'Trần Bảo Long', company: 'StartupHub Vietnam', email: 'long@startuphub.vn', phone: '0956 789 012', industry: 'Tech', website: 'startuphub.vn', status: 'active', totalSpend: 25_000_000, projects: 1, lpBalance: 1250, rank: 'standard', joinDate: '14/01/2026', avatar: 'https://images.unsplash.com/photo-1547137289-636000d1ec10?auto=format&fit=crop&w=80&h=80&crop=faces', note: 'Startup mới, tiềm năng. Đang tăng trưởng nhanh.' },
  { id: 7, name: 'Vũ Hoàng Minh', company: 'RetailMax VN', email: 'minh@retailmax.vn', phone: '0967 890 123', industry: 'Retail', website: 'retailmax.vn', status: 'prospect', totalSpend: 0, projects: 0, lpBalance: 0, rank: 'standard', joinDate: '10/03/2026', avatar: 'https://images.unsplash.com/photo-1769221909855-d1f62ef5aaa7?auto=format&fit=crop&w=80&h=80&crop=faces', note: 'Prospect - Đã meeting, đang chờ proposal approval.' },
  { id: 8, name: 'Đinh Thị Hoa', company: 'Fashion Plus', email: 'hoa@fashionplus.vn', phone: '0978 901 234', industry: 'Fashion', website: 'fashionplus.vn', status: 'prospect', totalSpend: 0, projects: 0, lpBalance: 0, rank: 'standard', joinDate: '18/03/2026', avatar: 'https://images.unsplash.com/photo-1547137289-636000d1ec10?auto=format&fit=crop&w=80&h=80&crop=faces', note: 'Quan tâm gói Website + SEO. Budget ~50M.' },
];

const RANK_CFG: Record<string, { label: string; color: string; icon: string }> = {
  vip: { label: 'VIP', color: '#FFD700', icon: '✦' },
  gold: { label: 'Gold', color: DS.amber, icon: '★' },
  standard: { label: 'Standard', color: DS.text4, icon: '○' },
};

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  active: { label: 'Đang hợp tác', color: DS.green },
  inactive: { label: 'Không hoạt động', color: DS.text4 },
  prospect: { label: 'Tiềm năng', color: DS.blue },
};

// ── Client Detail Modal ────────────────────────────────────────────────────
function ClientModal({ client, onClose, onSave, onDelete }: {
  client: Client; onClose: () => void;
  onSave: (c: Client) => void; onDelete: (id: number) => void;
}) {
  const [draft, setDraft] = useState<Client>({ ...client });

  const rc = RANK_CFG[draft.rank];
  const sc = STATUS_CFG[draft.status];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }} />
      <motion.div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5" style={{ borderBottom: `1px solid ${DS.border}`, background: `linear-gradient(135deg, rgba(59,130,246,0.06), transparent)` }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', border: `2px solid ${rc.color}60`, boxShadow: `0 0 14px ${rc.color}30` }}>
                <img src={draft.avatar} alt={draft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ color: DS.text, fontSize: 16, fontWeight: 700 }}>{draft.name}</div>
                <div style={{ color: DS.text3, fontSize: 13 }}>{draft.company}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono, background: `${rc.color}15`, padding: '2px 7px', borderRadius: 10 }}>
                    {rc.icon} {rc.label}
                  </span>
                  <span style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono, background: `${sc.color}15`, padding: '2px 7px', borderRadius: 10 }}>
                    {sc.label}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Tổng chi', value: fmtVND(draft.totalSpend) + ' VNĐ', color: DS.blue },
              { label: 'Dự án', value: String(draft.projects), color: DS.purple },
              { label: 'LP Tích lũy', value: draft.lpBalance.toLocaleString() + ' LP', color: DS.cyan },
            ].map(s => (
              <div key={s.label} className="text-center py-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div style={{ color: s.color, fontSize: 15, fontWeight: 700, fontFamily: DS.mono }}>{s.value}</div>
                <div style={{ color: DS.text5, fontSize: 10, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Editable fields */}
          {[
            { key: 'name', label: 'Họ & Tên', type: 'text' },
            { key: 'company', label: 'Công ty', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'Điện thoại', type: 'text' },
            { key: 'industry', label: 'Ngành', type: 'text' },
            { key: 'website', label: 'Website', type: 'text' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>{f.label.toUpperCase()}</label>
              <input
                type={f.type}
                value={(draft as any)[f.key] as string}
                onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>RANK</label>
              <select value={draft.rank} onChange={e => setDraft(d => ({ ...d, rank: e.target.value as Client['rank'] }))} style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: RANK_CFG[draft.rank].color, fontSize: 13, outline: 'none' }}>
                {Object.entries(RANK_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>TRẠNG THÁI</label>
              <select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value as Client['status'] }))} style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: STATUS_CFG[draft.status].color, fontSize: 13, outline: 'none' }}>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>GHI CHÚ NỘI BỘ</label>
            <textarea
              value={draft.note}
              onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
              rows={3}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text3, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: DS.body, lineHeight: 1.6 }}
            />
          </div>

          <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
            <button onClick={() => { onSave(draft); onClose(); }} style={{ flex: 1, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>Lưu thay đổi</button>
            <button onClick={() => { onDelete(client.id); onClose(); }} style={{ padding: '11px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: DS.red, cursor: 'pointer', fontSize: 13 }}><Trash2 size={14} /></button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Clients Tab ───────────────────────────────────────────────────────
export function ClientsTab() {
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
            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=' + l.name.replace(/s/g, '+'),
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
  const displayClients = clientsLoading && clientsError === '' ? clients : apiClients.length > 0 ? apiClients : clients;

  const filtered = displayClients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQ.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQ.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchRank = rankFilter === 'all' || c.rank === rankFilter;
    return matchSearch && matchStatus && matchRank;
  });

  const totalRevenue = displayClients.reduce((s, c) => s + c.totalSpend, 0);
  const activeCount = displayClients.filter(c => c.status === 'active').length;
  const prospectCount = displayClients.filter(c => c.status === 'prospect').length;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Khách hàng đang hợp tác', value: activeCount, color: DS.green },
          { label: 'Khách hàng tiềm năng', value: prospectCount, color: DS.blue },
          { label: 'Tổng doanh thu', value: `${(totalRevenue / 1_000_000).toFixed(0)}M VNĐ`, color: DS.amber },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl text-center" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 24, fontWeight: 700, textShadow: `0 0 12px ${s.color}40` }}>{s.value}</div>
            <div style={{ color: DS.text4, fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── DANH SÁCH KHÁCH HÀNG ({filtered.length})</div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <Search size={13} style={{ color: DS.text4 }} />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Tìm khách hàng..." style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, width: 170, fontFamily: DS.body }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={rankFilter} onChange={e => setRankFilter(e.target.value)} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '8px 12px', color: DS.text3, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="all">Tất cả rank</option>
            {Object.entries(RANK_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <Plus size={14} /> Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Client grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {filtered.map((client, i) => {
          const rc = RANK_CFG[client.rank];
          const sc = STATUS_CFG[client.status];
          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-5 rounded-2xl cursor-pointer"
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
              whileHover={{ borderColor: `${rc.color}40`, boxShadow: `0 0 20px ${rc.color}10`, y: -2 }}
              onClick={() => setSelected(client)}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', border: `2px solid ${rc.color}50`, boxShadow: `0 0 10px ${rc.color}25` }}>
                    <img src={client.avatar} alt={client.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: -3, right: -3, fontSize: 10, background: DS.bgCard, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${rc.color}`, color: rc.color }}>
                    {rc.icon}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{client.name}</div>
                      <div style={{ color: DS.text3, fontSize: 12 }}>{client.company} · {client.industry}</div>
                    </div>
                    <span style={{ color: sc.color, fontSize: 9, fontFamily: DS.mono, background: `${sc.color}15`, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {sc.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    <Mail size={11} style={{ color: DS.text5 }} />
                    <span style={{ color: DS.text4, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mt-3">
                    {client.totalSpend > 0 && (
                      <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>
                        {(client.totalSpend / 1_000_000).toFixed(0)}M VNĐ
                      </div>
                    )}
                    {client.projects > 0 && (
                      <div className="flex items-center gap-1" style={{ color: DS.text4, fontSize: 11 }}>
                        <FolderKanban size={11} /> {client.projects} DA
                      </div>
                    )}
                    {client.lpBalance > 0 && (
                      <div className="flex items-center gap-1" style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono }}>
                        <Zap size={10} /> {client.lpBalance.toLocaleString()} LP
                      </div>
                    )}
                    <div style={{ marginLeft: 'auto', color: DS.text5, fontSize: 10 }}>{client.joinDate}</div>
                  </div>
                </div>
              </div>

              {client.note && (
                <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: DS.bgCard2, borderLeft: `2px solid ${rc.color}40` }}>
                  <p style={{ color: DS.text4, fontSize: 11, lineHeight: 1.5 }}>{client.note}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Client Detail Modal */}
      <AnimatePresence>
        {selected && (
          <ClientModal
            client={selected}
            onClose={() => setSelected(null)}
            onSave={updated => setClients(prev => prev.map(c => c.id === updated.id ? updated : c))}
            onDelete={id => setClients(prev => prev.filter(c => c.id !== id))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
