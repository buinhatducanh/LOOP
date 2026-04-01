/**
 * ProjectsCompletedTab — Quản lý dự án đã hoàn thành (Admin)
 * CRUD dự án completed, nội dung chi tiết, demo links, case study
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit3, Trash2, X, Save, Eye, Star, ExternalLink,
  Globe, Users, Clock, DollarSign, Check, Image, Link as LinkIcon,
  FileText, Award, TrendingUp, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { useLoopStore, type PortfolioProject } from '../../store/loopStore';
import { DemoViewer } from '../ui/DemoViewer';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n);

const CAT_COLORS: Record<string, string> = {
  SaaS: DS.blue, App: DS.purple, Website: DS.green,
};

// ── Project Detail Modal ──────────────────────────────────────────────────
function ProjectDetailModal({ project, onClose, onSave }: {
  project: PortfolioProject;
  onClose: () => void;
  onSave: (data: Partial<PortfolioProject>) => void;
}) {
  const [draft, setDraft] = useState({ ...project });
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'demo' | 'metrics' | 'testimonial'>('info');
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  const tabs = [
    { id: 'info' as const, label: 'Thông tin' },
    { id: 'content' as const, label: 'Nội dung' },
    { id: 'demo' as const, label: 'Demo' },
    { id: 'metrics' as const, label: 'Metrics' },
    { id: 'testimonial' as const, label: 'Testimonial' },
  ];

  const field = (label: string, value: string, key: string, type = 'text', multi = false) => (
    <div>
      <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5, letterSpacing: '0.1em' }}>{label}</label>
      {multi ? (
        <textarea value={value} onChange={e => setDraft({ ...draft, [key]: e.target.value })} rows={3}
          style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: DS.body }} />
      ) : (
        <input type={type} value={value} onChange={e => setDraft({ ...draft, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
          style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{draft.id === 'new' ? 'Thêm dự án mới' : 'Chi tiết dự án'}</div>
            <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{draft.title} · {draft.client}</div>
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 flex-shrink-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-3 py-2 rounded-t-xl"
              style={{ background: activeTab === t.id ? DS.bgCard2 : 'transparent', border: 'none', color: activeTab === t.id ? DS.text : DS.text4, fontSize: 12, cursor: 'pointer', fontWeight: activeTab === t.id ? 700 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'info' && (
            <>
              {field('TIÊU ĐỀ DỰ ÁN', draft.title, 'title')}
              <div className="grid grid-cols-2 gap-3">
                {field('KHÁCH HÀNG', draft.client, 'client')}
                {field('TAG', draft.tag, 'tag')}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>DANH MỤC</label>
                  <select value={draft.cat} onChange={e => setDraft({ ...draft, cat: e.target.value })}
                    style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none' }}>
                    {['SaaS', 'App', 'Website'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {field('NĂM', draft.year, 'year')}
                {field('THỜI GIAN', draft.duration, 'duration')}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {field('NGÂN SÁCH', draft.budget, 'budget')}
                {field('TEAM', draft.team, 'team')}
                {field('MÀU SẮC', draft.color, 'color')}
              </div>
              {field('URL ẢNH', draft.img, 'img')}
              {draft.img && <div className="rounded-xl overflow-hidden" style={{ height: 120 }}><img src={draft.img} alt="" className="w-full h-full object-cover" /></div>}
              <div>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>TAGS (phẩy phân cách)</label>
                <input value={draft.tags.join(', ')} onChange={e => setDraft({ ...draft, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>TÍNH NĂNG NỔI BẬT (1 dòng/1 feature)</label>
                <textarea value={draft.features.join('\n')} onChange={e => setDraft({ ...draft, features: e.target.value.split('\n').filter(Boolean) })}
                  rows={4} style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: DS.body }} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text3, fontSize: 12 }}>Featured (hiển thị nổi bật)</span>
                <button onClick={() => setDraft({ ...draft, featured: !draft.featured })}
                  style={{ color: draft.featured ? DS.green : DS.text5, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {draft.featured ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
              </div>
            </>
          )}

          {activeTab === 'content' && (
            <>
              {field('THÁCH THỨC (Challenge)', draft.challenge, 'challenge', 'text', true)}
              {field('GIẢI PHÁP (Solution)', draft.solution, 'solution', 'text', true)}
              {field('KẾT QUẢ (Result)', draft.result, 'result', 'text', true)}
              {field('LP THƯỞNG', String(draft.lp), 'lp', 'number')}
              {field('NGÀY XUẤT BẢN', draft.publishedAt, 'publishedAt')}
            </>
          )}

          {activeTab === 'demo' && (
            <>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text3, fontSize: 12 }}>Có Demo</span>
                <button onClick={() => setDraft({ ...draft, hasDemo: !draft.hasDemo })}
                  style={{ color: draft.hasDemo ? DS.green : DS.text5, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {draft.hasDemo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
              </div>
              {draft.hasDemo && (
                <>
                  {field('DEMO URL (gốc)', draft.demoUrl, 'demoUrl')}
                  {field('MASKED URL (hiển thị cho khách)', draft.maskedUrl, 'maskedUrl')}
                  {field('TIÊU ĐỀ DEMO', draft.demoTitle, 'demoTitle')}
                  {draft.demoUrl && (
                    <button onClick={() => setShowDemoPreview(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl"
                      style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: DS.blue, fontSize: 12, cursor: 'pointer' }}>
                      <Eye size={13} /> Xem trước Demo
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'metrics' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {field('METRIC 1 (giá trị)', draft.metric1, 'metric1')}
                {field('METRIC 1 (label)', draft.m1label, 'm1label')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field('METRIC 2 (giá trị)', draft.metric2, 'metric2')}
                {field('METRIC 2 (label)', draft.m2label, 'm2label')}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field('METRIC 3 (giá trị)', draft.metric3, 'metric3')}
                {field('METRIC 3 (label)', draft.m3label, 'm3label')}
              </div>
            </>
          )}

          {activeTab === 'testimonial' && (
            <>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>TESTIMONIAL KHÁCH HÀNG</div>
                <div className="space-y-3">
                  {field('TÊN KHÁCH HÀNG', draft.testimonial?.name ?? '', 'testimonial_name')}
                  {field('CHỨC VỤ', draft.testimonial?.role ?? '', 'testimonial_role')}
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>NỘI DUNG NHẬN XÉT</label>
                    <textarea value={draft.testimonial?.quote ?? ''} onChange={e => setDraft({ ...draft, testimonial: { name: draft.testimonial?.name ?? '', role: draft.testimonial?.role ?? '', quote: e.target.value } })}
                      rows={3} style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: DS.body }} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, fontSize: 13, cursor: 'pointer' }}>Hủy</button>
          <button onClick={() => onSave(draft)} style={{ flex: 1, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Save size={12} style={{ display: 'inline', marginRight: 6 }} />Lưu thay đổi
          </button>
        </div>
      </motion.div>

      {showDemoPreview && draft.demoUrl && (
        <DemoViewer url={draft.demoUrl} maskedUrl={draft.maskedUrl} title={draft.demoTitle} onClose={() => setShowDemoPreview(false)} />
      )}
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export function ProjectsCompletedTab() {
  const { portfolio, updateProject, addProject, deleteProject } = useLoopStore();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [detailProject, setDetailProject] = useState<PortfolioProject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const cats = ['Tất cả', 'SaaS', 'App', 'Website'];
  const completed = portfolio.filter(p => p.status === 'completed');
  const filtered = completed.filter(p =>
    (filterCat === 'Tất cả' || p.cat === filterCat) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase()))
  );

  const totalBudget = completed.reduce((s, p) => s + p.budgetNum, 0);
  const totalLP = completed.reduce((s, p) => s + p.lp, 0);
  const featured = completed.filter(p => p.featured).length;

  const stats = [
    { label: 'Dự án hoàn thành', value: String(completed.length), color: DS.green, icon: <Check size={16} /> },
    { label: 'Tổng ngân sách', value: `${(totalBudget / 1e9).toFixed(1)}B₫`, color: DS.blue, icon: <DollarSign size={16} /> },
    { label: 'LP đã thưởng', value: totalLP.toLocaleString(), color: DS.purple, icon: <Award size={16} /> },
    { label: 'Dự án nổi bật', value: String(featured), color: DS.amber, icon: <Star size={16} /> },
  ];

  const handleSave = (data: Partial<PortfolioProject>) => {
    if (data.id === 'new') {
      addProject({ ...data, id: `proj-${Date.now()}` } as PortfolioProject);
    } else {
      updateProject(data.id!, data);
    }
    setDetailProject(null);
  };

  const newProject: PortfolioProject = {
    id: 'new', title: '', tag: '', cat: 'Website', client: '', color: DS.blue,
    img: '', year: '2026', duration: '', budget: '', budgetNum: 0, team: '',
    status: 'completed', metric1: '', m1label: '', metric2: '', m2label: '',
    metric3: '', m3label: '', challenge: '', solution: '', result: '',
    tags: [], features: [], lp: 0, hasDemo: false, demoUrl: '', maskedUrl: '',
    demoTitle: '', featured: false, publishedAt: new Date().toISOString().split('T')[0],
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Eye size={14} style={{ color: DS.text4 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm dự án, khách hàng..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, fontFamily: DS.body }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setDetailProject(newProject)}
          style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Plus size={14} /> Thêm dự án
        </button>
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map(p => {
          const cc = CAT_COLORS[p.cat] ?? DS.blue;
          return (
            <motion.div key={p.id} className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
              whileHover={{ borderColor: cc + '40' }}>
              {/* Image */}
              <div className="relative" style={{ height: 140 }}>
                <img src={p.img} alt={p.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.8))' }} />
                {p.featured && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.9)', fontSize: 9, color: '#000', fontWeight: 700 }}>
                    <Star size={9} fill="#000" /> FEATURED
                  </div>
                )}
                <div className="absolute bottom-3 left-4 right-4">
                  <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{p.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{p.client} · {p.year}</div>
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span style={{ color: cc, fontSize: 10, fontFamily: DS.mono, background: `${cc}15`, border: `1px solid ${cc}30`, padding: '1px 6px', borderRadius: 4 }}>{p.cat}</span>
                  {p.tags.slice(0, 3).map(t => (
                    <span key={t} style={{ color: DS.text5, fontSize: 9, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, padding: '1px 5px', borderRadius: 3 }}>{t}</span>
                  ))}
                  {p.hasDemo && <span style={{ color: DS.green, fontSize: 9, fontFamily: DS.mono }}>● DEMO</span>}
                </div>
                <div className="flex items-center gap-4 mb-3" style={{ color: DS.text4, fontSize: 11 }}>
                  <span><DollarSign size={10} style={{ display: 'inline' }} /> {p.budget}</span>
                  <span><Clock size={10} style={{ display: 'inline' }} /> {p.duration}</span>
                  <span><Users size={10} style={{ display: 'inline' }} /> {p.team}</span>
                </div>
                {/* Metrics mini */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { v: p.metric1, l: p.m1label },
                    { v: p.metric2, l: p.m2label },
                    { v: p.metric3, l: p.m3label },
                  ].map((m, i) => (
                    <div key={i} className="p-2 rounded-lg text-center" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                      <div style={{ color: cc, fontSize: 13, fontWeight: 700, fontFamily: DS.mono }}>{m.v}</div>
                      <div style={{ color: DS.text5, fontSize: 8, marginTop: 1 }}>{m.l}</div>
                    </div>
                  ))}
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => setDetailProject(p)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl"
                    style={{ background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, color: DS.blue, fontSize: 11, cursor: 'pointer' }}>
                    <Edit3 size={11} /> Chi tiết & Sửa
                  </button>
                  <button onClick={() => setDeleteId(p.id)}
                    style={{ color: DS.red, background: `${DS.red}10`, border: `1px solid ${DS.red}20`, borderRadius: 12, padding: '8px 12px', cursor: 'pointer' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text4, fontSize: 32, marginBottom: 8 }}>◎</div>
          <div style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy dự án phù hợp</div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailProject && (
          <ProjectDetailModal project={detailProject} onClose={() => setDetailProject(null)} onSave={handleSave} />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 rounded-2xl w-full max-w-sm" style={{ background: DS.bgCard, border: `1px solid ${DS.red}40` }}>
              <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Xác nhận xóa dự án?</div>
              <div style={{ color: DS.text4, fontSize: 13, marginBottom: 20 }}>Dự án sẽ bị xóa khỏi portfolio. Thao tác không thể hoàn tác.</div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, fontSize: 13, cursor: 'pointer' }}>Hủy</button>
                <button onClick={() => { deleteProject(deleteId); setDeleteId(null); }} style={{ flex: 1, background: DS.red, border: 'none', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Xóa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
