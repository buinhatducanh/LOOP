/**
 * PortfolioTab — Quản lý dự án portfolio (Admin)
 * CRUD projects, demo links, featured control, translate
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Edit3, Trash2, X, Save, Monitor, Star, ExternalLink,
  Eye, EyeOff, Image, Link as LinkIcon, Check, Globe, Languages,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { useLoopStore, type PortfolioProject } from '../../store/loopStore';
import { projectsService } from '../../../api/projects.service';
import { DemoViewer } from '../ui/DemoViewer';
import { Link } from 'react-router';
import {
  TranslationEditor,
  type TranslationsMap,
  type FieldDef,
} from './TranslationEditor';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n);

const CAT_COLORS: Record<string, string> = {
  SaaS: DS.blue, App: DS.purple, Website: DS.green,
};

const STATUS_CFG = {
  completed: { label: 'Hoàn thành', color: DS.green },
  in_progress: { label: 'Đang làm', color: DS.blue },
  paused: { label: 'Tạm dừng', color: DS.amber },
};

// ── Project i18n Fields ──────────────────────────────────────────────────────
const PORTFOLIO_I18N_FIELDS: FieldDef[] = [
  { key: 'title',      label: 'Tên dự án',  type: 'text'     },
  { key: 'challenge',  label: 'Thách thức',  type: 'textarea' },
  { key: 'solution',   label: 'Giải pháp',  type: 'textarea' },
  { key: 'result',     label: 'Kết quả',    type: 'textarea' },
  { key: 'tags',        label: 'Tech Stack',  type: 'array'    },
  { key: 'features',   label: 'Tính năng',  type: 'array'    },
];

type ProjectEditTab = 'basic' | 'demo' | 'translate';

// ── Project Edit Modal ────────────────────────────────────────────────────────
function ProjectEditModal({ project, onClose, onSave }: {
  project: PortfolioProject;
  onClose: () => void;
  onSave: (data: Partial<PortfolioProject>) => Promise<void>;
}) {
  const [draft, setDraft] = useState({ ...project });
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectEditTab>('basic');
  const [saving, setSaving] = useState(false);

  // Build translations map from project i18n fields
  const buildTranslations = (p: PortfolioProject): TranslationsMap => ({
    en: {
      title: p.titleEn ?? '',
      challenge: p.challengeEn ?? '',
      solution: p.solutionEn ?? '',
      result: p.resultEn ?? '',
      tags: p.tagsEn ?? [],
      features: p.featuresEn ?? [],
    },
    ja: {
      title: p.titleJa ?? '',
      challenge: p.challengeJa ?? '',
      solution: p.solutionJa ?? '',
      result: p.resultJa ?? '',
      tags: p.tagsJa ?? [],
      features: p.featuresJa ?? [],
    },
    ko: {
      title: p.titleKo ?? '',
      challenge: p.challengeKo ?? '',
      solution: p.solutionKo ?? '',
      result: p.resultKo ?? '',
      tags: p.tagsKo ?? [],
      features: p.featuresKo ?? [],
    },
    zh: {
      title: p.titleZh ?? '',
      challenge: p.challengeZh ?? '',
      solution: p.solutionZh ?? '',
      result: p.resultZh ?? '',
      tags: p.tagsZh ?? [],
      features: p.featuresZh ?? [],
    },
  });

  const [translations, setTranslations] = useState<TranslationsMap>(() => buildTranslations(project));

  useEffect(() => {
    setTranslations(buildTranslations(project));
  }, [project.id]);

  const handleTranslationsChange = (next: TranslationsMap) => {
    setTranslations(next);
    setDraft(d => ({
      ...d,
      titleEn: next.en?.title, titleJa: next.ja?.title, titleKo: next.ko?.title, titleZh: next.zh?.title,
      challengeEn: next.en?.challenge, challengeJa: next.ja?.challenge, challengeKo: next.ko?.challenge, challengeZh: next.zh?.challenge,
      solutionEn: next.en?.solution, solutionJa: next.ja?.solution, solutionKo: next.ko?.solution, solutionZh: next.zh?.solution,
      resultEn: next.en?.result, resultJa: next.ja?.result, resultKo: next.ko?.result, resultZh: next.zh?.result,
      tagsEn: next.en?.tags, tagsJa: next.ja?.tags, tagsKo: next.ko?.tags, tagsZh: next.zh?.tags,
      featuresEn: next.en?.features, featuresJa: next.ja?.features, featuresKo: next.ko?.features, featuresZh: next.zh?.features,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: ProjectEditTab; label: string; icon: React.ReactNode }[] = [
    { key: 'basic',     label: 'Thông tin cơ bản', icon: <Edit3 size={12} /> },
    { key: 'demo',      label: 'Demo Link',         icon: <ExternalLink size={12} /> },
    { key: 'translate', label: 'Translate',           icon: <Languages size={12} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>
              {project.id === 'new' ? 'Thêm dự án mới' : 'Chỉnh sửa dự án'}
            </div>
            <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{draft.title}</div>
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: DS.border }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-3 flex-1 justify-center transition-all"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === t.key ? DS.purple : 'transparent'}`,
                color: activeTab === t.key ? DS.purple : DS.text4,
                fontSize: 12, cursor: 'pointer',
                fontFamily: DS.mono,
                fontWeight: activeTab === t.key ? 700 : 400,
              }}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'basic' && (
            <>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>TÊN DỰ ÁN</label>
                <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}
                  style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>KHÁCH HÀNG</label>
                  <input value={draft.client} onChange={e => setDraft({ ...draft, client: e.target.value })}
                    style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>DANH MỤC</label>
                  <select value={draft.cat} onChange={e => setDraft({ ...draft, cat: e.target.value })}
                    style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                    {['SaaS', 'App', 'Website'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>NGÂN SÁCH</label>
                  <input value={draft.budget} onChange={e => setDraft({ ...draft, budget: e.target.value })}
                    style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>TRẠNG THÁI</label>
                  <select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as PortfolioProject['status'] })}
                    style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}>
                    <option value="completed">Hoàn thành</option>
                    <option value="in_progress">Đang làm</option>
                    <option value="paused">Tạm dừng</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>URL ẢNH COVER</label>
                <input value={draft.img} onChange={e => setDraft({ ...draft, img: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'METRIC 1 GIÁ TRỊ', key: 'metric1' },
                  { label: 'METRIC 1 LABEL', key: 'm1label' },
                  { label: 'METRIC 2 GIÁ TRỊ', key: 'metric2' },
                  { label: 'METRIC 2 LABEL', key: 'm2label' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input value={draft[f.key as keyof PortfolioProject] as string}
                      onChange={e => setDraft({ ...draft, [f.key]: e.target.value })}
                      style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between py-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                <div>
                  <div style={{ color: DS.text, fontSize: 13 }}>Dự án nổi bật (Featured)</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>Hiển thị đầu trang Portfolio</div>
                </div>
                <button onClick={() => setDraft({ ...draft, featured: !draft.featured })}
                  className="w-12 h-6 rounded-full relative"
                  style={{ background: draft.featured ? DS.amber : DS.border, border: 'none', cursor: 'pointer' }}>
                  <div className="absolute top-0.5 w-5 h-5 rounded-full"
                    style={{ background: '#fff', left: draft.featured ? 'calc(100% - 22px)' : 2, transition: 'left 0.2s' }} />
                </button>
              </div>
            </>
          )}

          {activeTab === 'demo' && (
            <>
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, marginBottom: 6 }}>💡 HƯỚNG DẪN</div>
                <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.7 }}>
                  <strong style={{ color: DS.text3 }}>URL gốc</strong>: Link thật đến demo (Figma embed, Vercel preview, staging...). Được mã hóa, không hiển thị với khách.<br />
                  <strong style={{ color: DS.text3 }}>URL che</strong>: Link giả hiển thị trong thanh địa chỉ trình duyệt giả lập.
                </p>
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>URL GỐC DEMO (ẩn với khách)</label>
                <div className="flex gap-2">
                  <input value={draft.demoUrl} onChange={e => setDraft({ ...draft, demoUrl: e.target.value, hasDemo: !!e.target.value })}
                    placeholder="https://figma.com/embed?url=... hoặc https://preview.vercel.app"
                    style={{ flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none' }} />
                  {draft.demoUrl && (
                    <button onClick={() => window.open(draft.demoUrl, '_blank')}
                      style={{ padding: '10px 12px', borderRadius: 10, background: `${DS.blue}15`, border: `1px solid ${DS.blue}30`, color: DS.blue, cursor: 'pointer' }}>
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>URL CHE (hiển thị với khách)</label>
                <input value={draft.maskedUrl} onChange={e => setDraft({ ...draft, maskedUrl: e.target.value })}
                  placeholder="demo.loop-solutions.vn/ten-du-an"
                  style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>TIÊU ĐỀ DEMO</label>
                <input value={draft.demoTitle} onChange={e => setDraft({ ...draft, demoTitle: e.target.value })}
                  placeholder="VD: VNRetail Platform — Live Demo"
                  style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 12px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <button onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full justify-center"
                style={{ background: `${draft.color}12`, border: `1px solid ${draft.color}30`, color: draft.color, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                <Monitor size={14} /> {showPreview ? 'Ẩn xem trước' : 'Xem trước demo (Admin view)'}
              </button>

              {showPreview && draft.demoUrl && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <DemoViewer
                    demoUrl={draft.demoUrl}
                    maskedUrl={draft.maskedUrl}
                    previewImg={draft.img}
                    title={draft.demoTitle}
                    accentColor={draft.color}
                    height={300}
                  />
                </motion.div>
              )}
            </>
          )}

          {activeTab === 'translate' && (
            <TranslationEditor
              baseValues={draft as Record<string, unknown>}
              translations={translations}
              locales={[
                { code: 'en', label: 'EN', flag: '🇬🇧', nativeLabel: 'English' },
                { code: 'ja', label: 'JA', flag: '🇯🇵', nativeLabel: '日本語' },
                { code: 'ko', label: 'KO', flag: '🇰🇷', nativeLabel: '한국어' },
                { code: 'zh', label: 'ZH', flag: '🇨🇳', nativeLabel: '中文' },
              ]}
              fields={PORTFOLIO_I18N_FIELDS}
              onChange={handleTranslationsChange}
              sectionLabel="Portfolio"
            />
          )}
        </div>

        <div className="p-5 flex-shrink-0" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={handleSave}
            disabled={saving}
            style={{ width: '100%', background: saving ? `${GRD.primary}80` : GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 0 24px rgba(129,140,248,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
            <Save size={15} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function PortfolioTab() {
  const { portfolio, deleteProject } = useLoopStore();
  const [apiProjects, setApiProjects] = useState<PortfolioProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    setProjectsError('');
    projectsService.getAdminProjects()
      .then(fetched => { if (!cancelled) setApiProjects(fetched); })
      .catch(() => { if (!cancelled) setProjectsError('Không tải được danh sách dự án'); })
      .finally(() => { if (!cancelled) setProjectsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use API projects when loaded, fall back to store
  const displayProjects = projectsLoading && projectsError === '' ? portfolio : apiProjects.length > 0 ? apiProjects : portfolio;
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const cats = ['Tất cả', 'SaaS', 'App', 'Website'];
  const filtered = displayProjects.filter(p =>
    (filterCat === 'Tất cả' || p.cat === filterCat) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase()))
  );

  const handleNew = () => {
    const newProject: PortfolioProject = {
      id: `proj_${Date.now()}`, title: 'Dự án mới', tag: 'Web Project', cat: 'Website',
      client: 'Khách hàng mới', color: DS.blue,
      img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=900&q=80',
      year: '2026', duration: '3 tháng', budget: '50,000,000 VNĐ', budgetNum: 50_000_000, team: '3 người',
      status: 'in_progress',
      metric1: '', m1label: '', metric2: '', m2label: '', metric3: '', m3label: '',
      challenge: '', solution: '', result: '',
      tags: [], features: [], lp: 0,
      hasDemo: false, demoUrl: '', maskedUrl: '', demoTitle: '',
      featured: false, publishedAt: new Date().toISOString().split('T')[0],
    };
    setEditingProject(newProject);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {editingProject && (
          <ProjectEditModal
            key={editingProject.id}
            project={editingProject}
            onClose={() => setEditingProject(null)}
            onSave={async (data) => {
              if (displayProjects.find(p => p.id === editingProject.id)) {
                const updated = await projectsService.updateProject(editingProject.id, data);
                setApiProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
              } else {
                const created = await projectsService.createProject(data);
                setApiProjects(prev => [...prev, created]);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── QUẢN LÝ PORTFOLIO ({displayProjects.length} dự án)</div>
        <div className="flex gap-2 ml-auto flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm dự án..."
              style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, width: 160, fontFamily: DS.body }} />
          </div>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              style={{ padding: '6px 14px', borderRadius: 8, background: filterCat === c ? `${DS.blue}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${filterCat === c ? DS.blue + '40' : DS.border}`, color: filterCat === c ? DS.blue : DS.text4, fontSize: 12, cursor: 'pointer' }}>
              {c}
            </button>
          ))}
          <button onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: GRD.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 16px rgba(129,140,248,0.3)' }}>
            <Plus size={14} /> Thêm dự án
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng dự án', val: displayProjects.length, color: DS.blue },
          { label: 'Có demo', val: displayProjects.filter(p => p.hasDemo).length, color: DS.cyan },
          { label: 'Featured', val: displayProjects.filter(p => p.featured).length, color: DS.amber },
          { label: 'Tổng LP phát hành', val: displayProjects.reduce((s, p) => s + (p.lp ?? 0), 0).toLocaleString(), color: DS.purple },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 20, fontWeight: 700 }}>{s.val}</div>
            <div style={{ color: DS.text4, fontSize: 11, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Project table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="grid px-5 py-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', borderBottom: `1px solid ${DS.border}` }}>
          {['Dự án', 'Danh mục', 'Trạng thái', 'Demo', 'LP', 'Hành động'].map(h => (
            <div key={h} style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>{h}</div>
          ))}
        </div>

        <div className="divide-y" style={{ borderColor: DS.border }}>
          {filtered.map((p, i) => {
            const sc = STATUS_CFG[p.status];
            const isPreview = previewId === p.id;
            return (
              <div key={p.id}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="grid items-center px-5 py-3.5"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto' }}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  {/* Project */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={p.img} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                        {p.featured && <Star size={10} style={{ color: DS.amber, marginLeft: 5, display: 'inline', fill: DS.amber }} />}
                      </div>
                      <div style={{ color: DS.text4, fontSize: 11 }}>{p.client} · {p.year}</div>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <span style={{ color: CAT_COLORS[p.cat] ?? DS.text4, fontSize: 10, fontFamily: DS.mono, padding: '2px 8px', borderRadius: 4, background: `${CAT_COLORS[p.cat] ?? DS.text4}15`, border: `1px solid ${CAT_COLORS[p.cat] ?? DS.text4}25` }}>
                      {p.cat}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono, padding: '2px 8px', borderRadius: 4, background: `${sc.color}12`, border: `1px solid ${sc.color}30` }}>
                      {sc.label}
                    </span>
                  </div>

                  {/* Demo */}
                  <div>
                    {p.hasDemo ? (
                      <button onClick={() => setPreviewId(isPreview ? null : p.id)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                        style={{ background: isPreview ? `${p.color}20` : `${p.color}10`, border: `1px solid ${p.color}30`, color: p.color, fontSize: 11, cursor: 'pointer' }}>
                        <Monitor size={11} /> {isPreview ? 'Ẩn' : 'Xem'}
                      </button>
                    ) : (
                      <span style={{ color: DS.text5, fontSize: 11 }}>— Không có</span>
                    )}
                  </div>

                  {/* LP */}
                  <div style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                    +{p.lp.toLocaleString()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <Link to={`/du-an/${p.id}`} target="_blank"
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, color: DS.text4, textDecoration: 'none' }}>
                      <Globe size={12} />
                    </Link>
                    <button onClick={() => setEditingProject(p)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, color: DS.text4, cursor: 'pointer' }}>
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => setConfirmDelete(p.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: DS.red, cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>

                {/* Demo preview inline */}
                <AnimatePresence>
                  {isPreview && p.hasDemo && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden px-5 pb-5" style={{ borderTop: `1px solid ${DS.border}` }}>
                      <div className="pt-5">
                        <DemoViewer
                          demoUrl={p.demoUrl}
                          maskedUrl={p.maskedUrl}
                          previewImg={p.img}
                          title={p.demoTitle}
                          accentColor={p.color}
                          height={360}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm delete */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div className="p-8 rounded-3xl text-center max-w-sm w-full mx-4"
              style={{ background: DS.bgCard, border: `1px solid ${DS.red}30` }}>
              <div className="text-4xl mb-4">⚠️</div>
              <div style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Xóa dự án?</div>
              <p style={{ color: DS.text4, fontSize: 13, marginBottom: 20 }}>Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'none', border: `1px solid ${DS.border}`, color: DS.text3, cursor: 'pointer' }}>
                  Hủy
                </button>
                <button onClick={async () => {
                  await projectsService.deleteProject(confirmDelete);
                  setApiProjects(prev => prev.filter(p => p.id !== confirmDelete));
                  setConfirmDelete(null);
                }}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: `1px solid rgba(239,68,68,0.3)`, color: DS.red, cursor: 'pointer', fontWeight: 700 }}>
                  Xóa
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}