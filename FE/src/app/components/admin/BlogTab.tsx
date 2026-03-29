import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Edit3, Trash2, Eye, Clock, User, Tag,
  X, Check, TrendingUp, Heart, MessageCircle,
  ToggleLeft, ToggleRight, FileText,
} from 'lucide-react';
import { DS, GRD } from '../layout/ds';
import { blogService } from '../../../api/blog.service';

type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  cat: string;
  status: 'published' | 'draft' | 'scheduled';
  date: string;
  readTime: string;
  views: number;
  likes: number;
  comments: number;
  img: string;
  featured: boolean;
  tags: string[];
};

const catColors: Record<string, string> = {
  Design: DS.blue, Tech: DS.cyan, Marketing: DS.green,
  DevOps: DS.amber, 'LP System': DS.purple, Business: DS.red, General: DS.text4,
};

const statusCfg: Record<string, { label: string; color: string }> = {
  published: { label: 'Đã xuất bản', color: DS.green },
  draft: { label: 'Bản nháp', color: DS.amber },
  scheduled: { label: 'Đã lên lịch', color: DS.blue },
};

const INITIAL_POSTS: BlogPost[] = [
  { id: 1, title: 'Xu hướng Web Design 2026: Dark Mode, Glassmorphism và AI-Generated UI', excerpt: 'Khám phá những xu hướng thiết kế sẽ định hình giao diện web trong năm 2026...', author: 'Mei Lin', cat: 'Design', status: 'published', date: '20/03/2026', readTime: '8 phút', views: 12400, likes: 342, comments: 28, img: 'https://images.unsplash.com/photo-1588336443962-49d88df004a1?auto=format&fit=crop&w=80&q=80', featured: true, tags: ['UI/UX', 'Trends', '2026'] },
  { id: 2, title: 'Từ Iron đến Diamond: Hành trình thăng hạng trong hệ thống LP của LOOP', excerpt: 'Làm thế nào để tích lũy LP nhanh nhất? Chiến lược của các thành viên đã đạt rank Diamond chia sẻ...', author: 'Akira Sato', cat: 'LP System', status: 'published', date: '18/03/2026', readTime: '6 phút', views: 8900, likes: 215, comments: 45, img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=80&q=80', featured: false, tags: ['LP', 'Rank', 'LOOP'] },
  { id: 3, title: 'React 19 + TypeScript 5.4: Những tính năng cần biết cho developer 2026', excerpt: 'Server Components, use() hook và TypeScript inference mới — tổng hợp toàn diện...', author: 'Ryo Hashimoto', cat: 'Tech', status: 'published', date: '15/03/2026', readTime: '12 phút', views: 15600, likes: 489, comments: 67, img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=80&q=80', featured: false, tags: ['React', 'TypeScript', 'Dev'] },
  { id: 4, title: 'SEO cho SaaS B2B: Chiến lược tăng organic traffic 300% trong 6 tháng', excerpt: 'Case study thực tế từ dự án VNRetail: Từ 0 đến 50K organic visits/tháng...', author: 'Yuna Park', cat: 'Marketing', status: 'published', date: '12/03/2026', readTime: '10 phút', views: 9800, likes: 278, comments: 33, img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=80&q=80', featured: false, tags: ['SEO', 'SaaS', 'Marketing'] },
  { id: 5, title: 'Kubernetes cho Digital Agency: Khi nào cần và khi nào không?', excerpt: 'Phân tích chi tiết chi phí-lợi ích của việc chuyển sang K8s...', author: 'Shin Watanabe', cat: 'DevOps', status: 'published', date: '10/03/2026', readTime: '15 phút', views: 7200, likes: 198, comments: 22, img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=80&q=80', featured: false, tags: ['K8s', 'DevOps', 'Cloud'] },
  { id: 6, title: 'UX Writing cho người Việt: Ngôn ngữ UI phù hợp với thị trường nội địa', excerpt: 'Những lỗi thường gặp khi viết nội dung giao diện cho người dùng Việt Nam...', author: 'Mei Lin', cat: 'Design', status: 'published', date: '08/03/2026', readTime: '7 phút', views: 5400, likes: 167, comments: 19, img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=80&q=80', featured: false, tags: ['UX', 'Writing', 'Vietnam'] },
  { id: 7, title: 'Chiến lược định giá cho Digital Agency Việt Nam 2026', excerpt: 'Phân tích mô hình định giá theo giờ vs theo dự án vs retainer cho agency...', author: 'Akira Sato', cat: 'Business', status: 'draft', date: '25/03/2026', readTime: '9 phút', views: 0, likes: 0, comments: 0, img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=80&q=80', featured: false, tags: ['Pricing', 'Agency', 'Business'] },
  { id: 8, title: 'AI Tools cho Designer 2026: Midjourney, Figma AI và tương lai UX', excerpt: 'Review chi tiết các công cụ AI đang thay đổi workflow của designer hiện đại...', author: 'Mei Lin', cat: 'Design', status: 'scheduled', date: '27/03/2026', readTime: '11 phút', views: 0, likes: 0, comments: 0, img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=80&q=80', featured: false, tags: ['AI', 'Design', 'Tools'] },
];

// ── Post Modal ──────────────────────────────────────────────────────────────
function PostModal({ post, onClose, onSave }: {
  post: Partial<BlogPost> | null;
  onClose: () => void;
  onSave: (p: BlogPost) => void;
}) {
  const isNew = !post?.id;
  const [form, setForm] = useState<Partial<BlogPost>>({
    title: '', excerpt: '', author: '', cat: 'Tech', status: 'draft',
    readTime: '5 phút', img: '', featured: false, tags: [], views: 0, likes: 0, comments: 0,
    date: new Date().toLocaleDateString('vi-VN'),
    ...post,
  });
  const [tagsInput, setTagsInput] = useState((post?.tags ?? []).join(', '));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{isNew ? '+ Tạo bài viết mới' : '✎ Chỉnh sửa bài viết'}</div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          {/* Title */}
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>TIÊU ĐỀ BÀI VIẾT</label>
            <input value={form.title ?? ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {/* Excerpt */}
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>TÓM TẮT</label>
            <textarea value={form.excerpt ?? ''} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} rows={3}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: DS.body }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Author */}
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>TÁC GIẢ</label>
              <input value={form.author ?? ''} onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {/* Read time */}
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>THỜI GIAN ĐỌC</label>
              <input value={form.readTime ?? ''} onChange={e => setForm(p => ({ ...p, readTime: e.target.value }))}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>DANH MỤC</label>
              <select value={form.cat ?? 'Tech'} onChange={e => setForm(p => ({ ...p, cat: e.target.value }))}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none' }}>
                {['Design', 'Tech', 'Marketing', 'DevOps', 'LP System', 'Business', 'General'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Status */}
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>TRẠNG THÁI</label>
              <select value={form.status ?? 'draft'} onChange={e => setForm(p => ({ ...p, status: e.target.value as BlogPost['status'] }))}
                style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none' }}>
                <option value="draft">Bản nháp</option>
                <option value="published">Xuất bản ngay</option>
                <option value="scheduled">Lên lịch</option>
              </select>
            </div>
          </div>
          {/* Tags */}
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>TAGS (cách nhau bởi dấu phẩy)</label>
            <input value={tagsInput} onChange={e => { setTagsInput(e.target.value); setForm(p => ({ ...p, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })); }}
              placeholder="React, TypeScript, Frontend"
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {/* Image */}
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>URL ẢNH BÌA</label>
            <input value={form.img ?? ''} onChange={e => setForm(p => ({ ...p, img: e.target.value }))}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {form.img && (
            <div className="rounded-xl overflow-hidden" style={{ height: 100 }}>
              <img src={form.img} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}
          {/* Featured toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div>
              <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>Bài viết nổi bật</div>
              <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>Hiển thị ở vị trí đặc biệt trên trang Blog</div>
            </div>
            <button onClick={() => setForm(p => ({ ...p, featured: !p.featured }))}
              className="w-12 h-6 rounded-full relative"
              style={{ background: form.featured ? DS.blue : DS.border, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', left: form.featured ? 'calc(100% - 22px)' : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5" style={{ borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 20px', color: DS.text3, fontSize: 13, cursor: 'pointer' }}>Hủy</button>
          <button onClick={() => onSave({ ...form, id: form.id ?? Date.now() } as BlogPost)}
            style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 16px rgba(129,140,248,0.4)' }}>
            <Check size={13} style={{ display: 'inline', marginRight: 6 }} />{isNew ? 'Tạo bài viết' : 'Lưu thay đổi'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export function BlogTab() {
  const [apiPosts, setApiPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [modal, setModal] = useState<null | 'new' | BlogPost>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPostsLoading(true);
    setPostsError('');
    blogService.getAdminPosts({ limit: 50 })
      .then(({ posts: fetched }) => { if (!cancelled) setApiPosts(fetched as unknown as BlogPost[]); })
      .catch(() => { if (!cancelled) setPostsError('Không tải được danh sách bài viết'); })
      .finally(() => { if (!cancelled) setPostsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Use API posts when loaded, fall back to mock
  const displayPosts = postsLoading && postsError === '' ? posts : apiPosts.length > 0 ? apiPosts : posts;

  const cats = ['Tất cả', 'Design', 'Tech', 'Marketing', 'DevOps', 'LP System', 'Business'];
  const statuses = ['Tất cả', 'published', 'draft', 'scheduled'];

  const filtered = displayPosts.filter(p =>
    (filterCat === 'Tất cả' || p.cat === filterCat) &&
    (filterStatus === 'Tất cả' || p.status === filterStatus) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.author.toLowerCase().includes(search.toLowerCase()))
  );

  const togglePublish = (id: number) => {
    setPosts(prev => prev.map(p => p.id === id
      ? { ...p, status: p.status === 'published' ? 'draft' : 'published' }
      : p
    ));
  };

  const toggleFeatured = (id: number) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, featured: !p.featured } : { ...p, featured: false }));
  };

  const handleSave = (updated: BlogPost) => {
    setPosts(prev => {
      const exists = prev.find(p => p.id === updated.id);
      return exists ? prev.map(p => p.id === updated.id ? updated : p) : [updated, ...prev];
    });
    setModal(null);
  };

  const handleDelete = (id: number) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    setDeleteId(null);
  };

  const published = displayPosts.filter(p => p.status === 'published');
  const totalViews = published.reduce((s, p) => s + (p.views ?? 0), 0);
  const totalLikes = published.reduce((s, p) => s + (p.likes ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Tổng bài viết', value: String(posts.length), sub: `${published.length} đã xuất bản`, color: DS.blue, icon: <FileText size={16} /> },
          { label: 'Tổng lượt xem', value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : String(totalViews), sub: 'Tất cả bài viết', color: DS.cyan, icon: <Eye size={16} /> },
          { label: 'Tổng lượt thích', value: String(totalLikes), sub: 'Bài xuất bản', color: DS.red, icon: <Heart size={16} /> },
          { label: 'Bình luận', value: String(published.reduce((s, p) => s + p.comments, 0)), sub: 'Tương tác cộng đồng', color: DS.green, icon: <MessageCircle size={16} /> },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 4 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Search size={14} style={{ color: DS.text4 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bài viết, tác giả..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, fontFamily: DS.body }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          {statuses.map(s => <option key={s} value={s}>{s === 'Tất cả' ? 'Tất cả trạng thái' : statusCfg[s].label}</option>)}
        </select>
        {postsLoading && postsError === '' && (
          <div className="text-center py-16" style={{ color: DS.text4 }}>
            <div className="text-3xl mb-2">⏳</div>
            <div style={{ fontFamily: DS.mono, fontSize: 11 }}>Đang tải bài viết...</div>
          </div>
        )}
        {postsError && (
          <div className="text-center py-12" style={{ color: DS.red }}>
            <div style={{ fontFamily: DS.mono, fontSize: 12 }}>{postsError}</div>
          </div>
        )}
        <button onClick={() => setModal('new')}
          style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(129,140,248,0.35)' }}>
          <Plus size={14} /> Tạo bài viết
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="grid px-4 py-3" style={{ gridTemplateColumns: '2.5fr 0.8fr 0.8fr 0.6fr 0.6fr 0.5fr 0.8fr 1fr', borderBottom: `1px solid ${DS.border}` }}>
          {['BÀI VIẾT', 'DANH MỤC', 'TÁC GIẢ', 'LƯỢT XEM', 'THÍCH', 'NỔI BẬT', 'TRẠNG THÁI', 'THAO TÁC'].map(h => (
            <div key={h} style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em' }}>{h}</div>
          ))}
        </div>
        <AnimatePresence>
          {filtered.map((p, i) => {
            const sc = statusCfg[p.status];
            const cc = catColors[p.cat] ?? DS.text4;
            return (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid px-4 py-3 items-center"
                style={{ gridTemplateColumns: '2.5fr 0.8fr 0.8fr 0.6fr 0.6fr 0.5fr 0.8fr 1fr', borderBottom: i < filtered.length - 1 ? `1px solid ${DS.border}` : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                {/* Post info */}
                <div className="flex items-center gap-3 min-w-0">
                  {p.img && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={p.img} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ color: DS.text4, fontSize: 11 }}>
                      <Clock size={9} style={{ display: 'inline', marginRight: 3 }} />{p.readTime} · {p.date}
                    </div>
                  </div>
                </div>
                {/* Category */}
                <span style={{ color: cc, fontSize: 10, fontFamily: DS.mono, background: `${cc}15`, border: `1px solid ${cc}30`, borderRadius: 6, padding: '2px 7px', display: 'inline-block' }}>{p.cat}</span>
                {/* Author */}
                <div style={{ color: DS.text3, fontSize: 12 }}>{p.author}</div>
                {/* Views */}
                <div style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono }}>{p.views >= 1000 ? `${(p.views / 1000).toFixed(1)}K` : p.views}</div>
                {/* Likes */}
                <div className="flex items-center gap-1" style={{ color: DS.red, fontSize: 12 }}>
                  <Heart size={10} fill={DS.red} />{p.likes}
                </div>
                {/* Featured */}
                <button onClick={() => toggleFeatured(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.featured ? DS.amber : DS.text5 }}>
                  {p.featured ? '★' : '☆'}
                </button>
                {/* Status */}
                <button onClick={() => togglePublish(p.id)} className="flex items-center gap-1.5"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {p.status === 'published'
                    ? <ToggleRight size={18} style={{ color: DS.green }} />
                    : <ToggleLeft size={18} style={{ color: DS.text4 }} />}
                  <span style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono }}>{sc.label}</span>
                </button>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setModal(p)} style={{ color: DS.blue, background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Edit3 size={11} /> Sửa
                  </button>
                  <button onClick={() => setDeleteId(p.id)} style={{ color: DS.red, background: `${DS.red}10`, border: `1px solid ${DS.red}20`, borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={11} /> Xóa
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div style={{ color: DS.text4, fontSize: 32, marginBottom: 8 }}>◎</div>
            <div style={{ color: DS.text4, fontSize: 13 }}>Không có bài viết phù hợp</div>
          </div>
        )}
      </div>

      {/* Top performing posts */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── BÀI VIẾT HIỆU SUẤT CAO NHẤT</div>
        <div className="space-y-3">
          {[...published].sort((a, b) => b.views - a.views).slice(0, 4).map((p, i) => {
            const maxViews = Math.max(...published.map(x => x.views));
            const cc = catColors[p.cat] ?? DS.blue;
            return (
              <div key={p.id} className="flex items-center gap-4">
                <div style={{ color: DS.text5, fontFamily: DS.mono, fontSize: 12, width: 20, textAlign: 'center' }}>#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div style={{ color: DS.text2, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
                      <div style={{ height: '100%', width: `${(p.views / maxViews) * 100}%`, background: `linear-gradient(90deg, ${cc}cc, ${cc}55)`, borderRadius: 99 }} />
                    </div>
                    <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, flexShrink: 0 }}>{p.views.toLocaleString()} lượt xem</span>
                  </div>
                </div>
                <div style={{ color: DS.red, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Heart size={10} fill={DS.red} />{p.likes}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <PostModal
            post={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="p-6 rounded-2xl w-full max-w-sm" style={{ background: DS.bgCard, border: `1px solid ${DS.red}40` }}>
              <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Xác nhận xóa bài viết?</div>
              <div style={{ color: DS.text4, fontSize: 13, marginBottom: 20 }}>Thao tác này không thể hoàn tác.</div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: 'none', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px', color: DS.text3, fontSize: 13, cursor: 'pointer' }}>Hủy</button>
                <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, background: DS.red, border: 'none', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Xóa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
