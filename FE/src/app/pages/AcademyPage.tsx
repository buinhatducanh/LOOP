import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import {
  Search, Star, Clock, Users, Play, BookOpen, ArrowRight, Zap,
  ChevronDown, Filter, Check, ChevronRight, X,
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const COURSES = [
  { id: 1, title: 'React & Next.js 14 Từ Zero Đến Hero', instructor: 'Akira Sato', instructorRole: 'Diamond · Lead Fullstack', instructorImg: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=60&h=60&crop=faces', duration: '32h', students: 2400, rating: 4.9, reviews: 312, price: 2_000_000, lpPrice: 4000, lpReward: 200, img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=500&q=80', cat: 'Frontend', level: 'Intermediate', color: DS.blue, featured: true, updatedAt: '15/03/2026', lectures: 48, certificate: true, tags: ['React', 'Next.js', 'TypeScript'] },
  { id: 2, title: 'UI/UX Design System với Figma & Tailwind', instructor: 'Mei Lin', instructorRole: 'Ruby · Design Lead', instructorImg: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=60&h=60&crop=faces', duration: '18h', students: 1800, rating: 4.8, reviews: 245, price: 1_500_000, lpPrice: 3000, lpReward: 150, img: 'https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=500&q=80', cat: 'Design', level: 'Beginner', color: DS.purple, featured: false, updatedAt: '10/03/2026', lectures: 32, certificate: true, tags: ['Figma', 'Tailwind', 'UX'] },
  { id: 3, title: 'Node.js API & PostgreSQL: Production-Ready', instructor: 'Ryo Hashimoto', instructorRole: 'Diamond · Backend Architect', instructorImg: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=60&h=60&crop=faces', duration: '26h', students: 1200, rating: 4.9, reviews: 189, price: 2_500_000, lpPrice: 5000, lpReward: 250, img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=500&q=80', cat: 'Backend', level: 'Advanced', color: DS.cyan, featured: false, updatedAt: '08/03/2026', lectures: 56, certificate: true, tags: ['Node.js', 'PostgreSQL', 'Docker'] },
  { id: 4, title: 'Kubernetes & DevOps cho Startup Việt Nam', instructor: 'Shin Watanabe', instructorRole: 'Platinum · DevOps Lead', instructorImg: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=60&h=60&crop=faces', duration: '22h', students: 890, rating: 4.7, reviews: 134, price: 3_000_000, lpPrice: 6000, lpReward: 300, img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=500&q=80', cat: 'DevOps', level: 'Advanced', color: DS.green, featured: false, updatedAt: '01/03/2026', lectures: 40, certificate: true, tags: ['K8s', 'Docker', 'AWS'] },
  { id: 5, title: 'SEO & Content Marketing cho SaaS B2B', instructor: 'Yuna Park', instructorRole: 'Gold · Marketing Lead', instructorImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&h=60&crop=faces', duration: '14h', students: 3100, rating: 4.8, reviews: 421, price: 1_200_000, lpPrice: 2400, lpReward: 120, img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=500&q=80', cat: 'Marketing', level: 'Beginner', color: DS.amber, featured: false, updatedAt: '20/02/2026', lectures: 28, certificate: true, tags: ['SEO', 'Content', 'Growth'] },
  { id: 6, title: 'High-Performance Rust & Go cho Backend', instructor: 'Rin Nakamura', instructorRole: 'Ruby · Performance Expert', instructorImg: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=60&h=60&crop=faces', duration: '40h', students: 680, rating: 5.0, reviews: 98, price: 4_500_000, lpPrice: 9000, lpReward: 450, img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=500&q=80', cat: 'Backend', level: 'Expert', color: DS.red, featured: false, updatedAt: '12/03/2026', lectures: 72, certificate: true, tags: ['Rust', 'Go', 'Performance'] },
];

const CATS = ['Tất cả', 'Frontend', 'Backend', 'Design', 'DevOps', 'Marketing'];
const LEVELS = ['Tất cả', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
const SORTS = [
  { label: 'Nổi bật nhất', val: 'featured' },
  { label: 'Đánh giá cao', val: 'rating' },
  { label: 'Học viên nhiều', val: 'students' },
  { label: 'Mới nhất', val: 'newest' },
  { label: 'Giá thấp → cao', val: 'price-asc' },
  { label: 'Giá cao → thấp', val: 'price-desc' },
];
const levelColor: Record<string, string> = {
  Beginner: DS.green, Intermediate: DS.blue, Advanced: DS.amber, Expert: DS.red,
};
const levelVN: Record<string, string> = {
  Beginner: 'Cơ bản', Intermediate: 'Trung cấp', Advanced: 'Nâng cao', Expert: 'Chuyên gia',
};

// ── Learning paths ──────────────────────────────────────────────────────────
const PATHS = [
  {
    id: 'fullstack', title: 'Lộ trình Full-Stack', icon: '⚡', color: DS.blue,
    desc: 'Từ Frontend đến Backend – xây dựng sản phẩm hoàn chỉnh',
    steps: ['UI/UX Design System', 'React & Next.js 14', 'Node.js & PostgreSQL'],
    duration: '76h', totalLP: 600, difficulty: 'Intermediate → Advanced',
  },
  {
    id: 'design', title: 'Lộ trình Product Designer', icon: '✦', color: DS.purple,
    desc: 'Thiết kế giao diện đẹp, tối ưu trải nghiệm người dùng',
    steps: ['UI/UX Design System với Figma', 'SEO & Content Marketing', 'UX Writing (Sắp ra mắt)'],
    duration: '32h', totalLP: 270, difficulty: 'Beginner → Intermediate',
  },
  {
    id: 'devops', title: 'Lộ trình DevOps Engineer', icon: '◈', color: DS.green,
    desc: 'Hạ tầng, CI/CD và vận hành hệ thống quy mô lớn',
    steps: ['Node.js & PostgreSQL', 'Kubernetes & DevOps', 'Rust & Go Performance'],
    duration: '88h', totalLP: 1000, difficulty: 'Advanced → Expert',
  },
];

// ── FAQ data ────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'LP (Learning Points) hoạt động như thế nào?', a: 'Sau khi hoàn thành một khóa học, bạn nhận LP tương ứng. LP có thể dùng để giảm giá dịch vụ LOOP (1,000 LP = 500,000 VNĐ giảm giá, tối đa 20% hóa đơn) hoặc đăng ký khóa học khác.' },
  { q: 'Tôi có thể thanh toán bằng LP không?', a: 'Có! Với khóa học giá dưới 3,000,000 VNĐ, bạn có thể thanh toán tối đa 50% bằng LP. Ví dụ: khóa 2,000,000 VNĐ = 1,000,000 VNĐ + 2,000 LP.' },
  { q: 'Chứng chỉ có giá trị như thế nào?', a: 'Chứng chỉ LOOP Academy được cấp dưới dạng PDF có QR code xác thực. Chứng chỉ được nhiều startup và doanh nghiệp công nghệ tại Việt Nam công nhận.' },
  { q: 'Tôi có được hỗ trợ sau khi học không?', a: 'Tất cả học viên được tham gia Discord LOOP Academy để hỏi đáp với giảng viên và cộng đồng. Giảng viên cam kết phản hồi trong 24 giờ.' },
  { q: 'Content có được cập nhật không?', a: 'Có, tất cả khóa học được cập nhật ít nhất 1 lần/quý. Khi mua khóa học, bạn có quyền truy cập lifetime kể cả các phiên bản cập nhật.' },
];

// ── Instructor showcase ─────────────────────────────────────────────────────
const INSTRUCTORS = [
  { name: 'Akira Sato', role: 'Lead Fullstack', rank: 'Diamond', courses: 2, students: 4100, img: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=100&h=100&crop=faces', rankColor: '#7DD3FC' },
  { name: 'Rin Nakamura', role: 'Performance Expert', rank: 'Ruby', courses: 1, students: 680, img: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=100&h=100&crop=faces', rankColor: '#FB7185' },
  { name: 'Mei Lin', role: 'Design Lead', rank: 'Ruby', courses: 1, students: 1800, img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&crop=faces', rankColor: '#FB7185' },
  { name: 'Ryo Hashimoto', role: 'Backend Architect', rank: 'Diamond', courses: 1, students: 1200, img: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=100&h=100&crop=faces', rankColor: '#7DD3FC' },
];

// ── Payment Modal ───────────────────────────────────────────────────────────
function PaymentModal({ course, lpBalance, onClose }: {
  course: typeof COURSES[0];
  lpBalance: number;
  onClose: () => void;
}) {
  const [payMode, setPayMode] = useState<'vnd' | 'lp-partial' | 'lp-full'>('vnd');
  const [enrolled, setEnrolled] = useState(false);
  const lpPartialMax = Math.min(Math.floor(course.price * 0.5 / 500) * 1000, lpBalance);
  const lpSaved = Math.round(lpPartialMax / 1000) * 500_000;
  const partialRemain = course.price - lpSaved;
  const canFullLP = lpBalance >= course.lpPrice;

  if (enrolled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center p-10 rounded-3xl max-w-sm w-full" style={{ background: DS.bgCard, border: `1px solid ${DS.green}40` }}>
          <div className="text-5xl mb-5">🎉</div>
          <div style={{ color: DS.green, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, marginBottom: 8 }}>ĐĂNG KÝ THÀNH CÔNG!</div>
          <div style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            Bạn đã đăng ký khóa học <span style={{ color: DS.text }}>{course.title}</span> thành công.
            Hoàn thành để nhận <span style={{ color: DS.purple }}>+{course.lpReward} LP</span>!
          </div>
          <button onClick={onClose} style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
            Bắt đầu học ngay
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>Đăng ký khóa học</div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Course info */}
          <div className="flex gap-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
              <img src={course.img} alt={course.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <div style={{ color: DS.text, fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{course.title}</div>
              <div style={{ color: DS.text4, fontSize: 12, marginTop: 3 }}>👤 {course.instructor}</div>
            </div>
          </div>

          {/* Payment mode */}
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 8 }}>PHƯƠNG THỨC THANH TOÁN</div>

          {/* Full VND */}
          <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: payMode === 'vnd' ? 'rgba(59,130,246,0.08)' : 'transparent', border: `1px solid ${payMode === 'vnd' ? DS.blue + '40' : DS.border}` }}>
            <input type="radio" checked={payMode === 'vnd'} onChange={() => setPayMode('vnd')} style={{ accentColor: DS.blue }} />
            <div className="flex-1">
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>Thanh toán VNĐ đầy đủ</div>
              <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: 20, fontWeight: 900 }}>{fmtVND(course.price)}</div>
            </div>
          </label>

          {/* VND + LP partial */}
          {lpPartialMax >= 1000 && (
            <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: payMode === 'lp-partial' ? 'rgba(129,140,248,0.08)' : 'transparent', border: `1px solid ${payMode === 'lp-partial' ? DS.purple + '40' : DS.border}` }}>
              <input type="radio" checked={payMode === 'lp-partial'} onChange={() => setPayMode('lp-partial')} style={{ accentColor: DS.purple }} />
              <div className="flex-1">
                <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>Kết hợp LP + VNĐ</div>
                <div className="flex items-center gap-3 mt-1">
                  <span style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 13 }}>-{lpPartialMax.toLocaleString('vi-VN')} LP</span>
                  <span style={{ color: DS.text4, fontSize: 12 }}>+</span>
                  <span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13 }}>{fmtVND(partialRemain)}</span>
                </div>
                <div style={{ color: DS.green, fontSize: 11, marginTop: 2 }}>Tiết kiệm {fmtVND(lpSaved)}</div>
              </div>
            </label>
          )}

          {/* Full LP */}
          <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: payMode === 'lp-full' ? 'rgba(245,158,11,0.08)' : 'transparent', border: `1px solid ${payMode === 'lp-full' ? DS.amber + '40' : DS.border}`, opacity: canFullLP ? 1 : 0.5 }}>
            <input type="radio" checked={payMode === 'lp-full'} onChange={() => canFullLP && setPayMode('lp-full')} disabled={!canFullLP} style={{ accentColor: DS.amber }} />
            <div className="flex-1">
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>Toàn bộ bằng LP ◈</div>
              <div style={{ color: DS.amber, fontFamily: DS.mono, fontSize: 16, fontWeight: 700 }}>{course.lpPrice.toLocaleString('vi-VN')} LP</div>
              {!canFullLP && <div style={{ color: DS.red, fontSize: 11, marginTop: 2 }}>LP không đủ (bạn có {lpBalance.toLocaleString('vi-VN')} LP)</div>}
            </div>
          </label>

          {/* LP balance indicator */}
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)' }}>
            <div style={{ color: DS.text4, fontSize: 12 }}>LP hiện có của bạn</div>
            <div style={{ color: DS.purple, fontFamily: DS.mono, fontWeight: 700 }}>{lpBalance.toLocaleString('vi-VN')} LP</div>
          </div>

          {/* LP reward note */}
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <Zap size={12} style={{ color: DS.green, flexShrink: 0 }} />
            <div style={{ color: DS.text4, fontSize: 12 }}>
              Hoàn thành khóa học nhận <span style={{ color: DS.green, fontWeight: 700 }}>+{course.lpReward} LP</span> phần thưởng
            </div>
          </div>

          <button onClick={() => setEnrolled(true)} style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 24px rgba(129,140,248,0.35)' }}>
            Xác nhận đăng ký
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function AcademyPage() {
  const [activeCat, setActiveCat] = useState('Tất cả');
  const [activeLevel, setActiveLevel] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [payModal, setPayModal] = useState<typeof COURSES[0] | null>(null);

  const USER_LP = 15_200;

  const featured = COURSES[0];

  let filtered = COURSES.slice(1).filter(c =>
    (activeCat === 'Tất cả' || c.cat === activeCat) &&
    (activeLevel === 'Tất cả' || c.level === activeLevel) &&
    (c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase()))
  );

  // Sort
  if (sort === 'rating') filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  else if (sort === 'students') filtered = [...filtered].sort((a, b) => b.students - a.students);
  else if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => b.price - a.price);
  else if (sort === 'newest') filtered = [...filtered].reverse();

  const hasFilters = activeCat !== 'Tất cả' || activeLevel !== 'Tất cả';

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center relative" style={{ background: 'linear-gradient(180deg, rgba(129,140,248,0.08) 0%, transparent 80%)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full" style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)' }}>
            <BookOpen size={11} style={{ color: DS.purple }} />
            <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.22em' }}>LOOP ACADEMY</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 14 }}>
            HỌC TỪ CHUYÊN GIA LOOP
          </h1>
          <p style={{ color: DS.text3, fontSize: 16, lineHeight: 1.8, marginBottom: 28 }}>
            Khóa học thực chiến từ đội ngũ Diamond–Ruby. Học bằng LP, thăng hạng nhanh hơn.
          </p>

          {/* Search */}
          <div className="flex items-center gap-3 max-w-xl mx-auto px-5 py-3 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(129,140,248,0.2)', backdropFilter: 'blur(12px)' }}>
            <Search size={16} style={{ color: DS.text4 }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm khóa học, kỹ năng, giảng viên..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text, fontSize: 15, fontFamily: DS.body }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={14} /></button>
            )}
            <button style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>Tìm kiếm</button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
            {[
              { val: '6+', label: 'Khóa học', icon: '📚' },
              { val: '10.2K', label: 'Học viên', icon: '👥' },
              { val: '4.9★', label: 'Đánh giá TB', icon: '⭐' },
              { val: '100%', label: 'Thực chiến', icon: '⚡' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.icon} {s.val}</div>
                <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LP Banner ────────────────────────────────────────────────────── */}
      <section className="px-6 mb-10">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl p-5 flex items-center gap-5 flex-wrap" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(129,140,248,0.25)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(129,140,248,0.2)', border: '1px solid rgba(129,140,248,0.3)' }}>
              <Zap size={22} style={{ color: DS.purple }} />
            </div>
            <div className="flex-1 min-w-60">
              <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Bạn có {USER_LP.toLocaleString('vi-VN')} LP — Dùng ngay để học!</div>
              <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.6 }}>
                LP của bạn có thể dùng để giảm giá tối đa 50% học phí hoặc thanh toán toàn phần cho một số khóa học. <span style={{ color: DS.purple }}>1,000 LP = 500,000 VNĐ giảm giá.</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{USER_LP.toLocaleString('vi-VN')} LP</div>
              <div style={{ color: DS.text4, fontSize: 11 }}>≈ giảm được {fmtVND(Math.floor(USER_LP / 1000) * 500_000)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured course ──────────────────────────────────────────────── */}
      <section className="px-6 mb-12">
        <div className="max-w-6xl mx-auto">
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 16 }}>── KHÓA HỌC NỔI BẬT</div>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.18) 0%, rgba(15,23,42,0.9) 100%)', border: '1.5px solid rgba(59,130,246,0.35)', boxShadow: '0 0 40px rgba(59,130,246,0.08)' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            {/* Image */}
            <div style={{ position: 'relative', overflow: 'hidden', height: 300 }}>
              <img src={featured.img} alt={featured.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(2,6,23,0.5) 0%, transparent 100%)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.85)', boxShadow: '0 0 24px rgba(59,130,246,0.5)' }}>
                  <Play size={22} style={{ color: '#fff', fill: '#fff', marginLeft: 3 }} />
                </div>
              </div>
              {/* Tags */}
              <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
                {featured.tags.map(t => (
                  <span key={t} style={{ color: DS.blue, background: 'rgba(2,6,23,0.85)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontFamily: DS.mono, backdropFilter: 'blur(8px)' }}>{t}</span>
                ))}
              </div>
            </div>
            {/* Info */}
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span style={{ color: DS.blue, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em', padding: '2px 8px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>{featured.cat.toUpperCase()}</span>
                <span style={{ color: levelColor[featured.level], fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', padding: '2px 8px', borderRadius: 4, background: `${levelColor[featured.level]}15` }}>{levelVN[featured.level].toUpperCase()}</span>
                <span style={{ color: DS.amber, fontSize: 9, fontFamily: DS.mono, padding: '2px 8px', borderRadius: 4, background: `${DS.amber}12` }}>★ BÀI NỔI BẬT</span>
              </div>
              <h2 style={{ color: DS.text, fontSize: 22, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>{featured.title}</h2>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} style={{ color: DS.amber, fill: DS.amber }} />)}
                  <span style={{ color: DS.amber, fontSize: 13, fontFamily: DS.mono, marginLeft: 4, fontWeight: 700 }}>{featured.rating}</span>
                  <span style={{ color: DS.text4, fontSize: 12 }}>({featured.reviews})</span>
                </div>
              </div>
              <div className="flex items-center gap-5 mb-5 flex-wrap">
                <div className="flex items-center gap-1.5" style={{ color: DS.text3, fontSize: 12 }}><Users size={13} />{featured.students.toLocaleString()} học viên</div>
                <div className="flex items-center gap-1.5" style={{ color: DS.text3, fontSize: 12 }}><Clock size={13} />{featured.duration} · {featured.lectures} bài</div>
              </div>
              {/* Instructor mini */}
              <div className="flex items-center gap-2 mb-5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}` }}>
                <img src={featured.instructorImg} alt={featured.instructor} className="w-8 h-8 rounded-lg object-cover" style={{ border: `1.5px solid ${DS.blue}50` }} />
                <div>
                  <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{featured.instructor}</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>{featured.instructorRole}</div>
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: 26, fontWeight: 700 }}>
                    {fmtVND(featured.price)}
                  </div>
                  <div style={{ color: DS.text5, fontSize: 12, textDecoration: 'line-through' }}>{fmtVND(featured.price * 1.3)}</div>
                  <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>◈ hoặc {featured.lpPrice.toLocaleString()} LP toàn phần</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPayModal(featured)} style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Đăng ký <Zap size={13} />
                  </button>
                  <Link to={`/hoc-vien/${featured.id}`} style={{ background: 'rgba(59,130,246,0.1)', color: DS.blue, border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '12px 16px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                    Xem <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Learning Paths ───────────────────────────────────────────────── */}
      <section className="px-6 mb-14" style={{ background: 'rgba(15,23,42,0.5)' }}>
        <div className="max-w-6xl mx-auto py-12">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 6 }}>── LỘ TRÌNH HỌC TẬP</div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.06em' }}>CHỌN LỘ TRÌNH PHÙ HỢP</h2>
            </div>
            <div style={{ color: DS.text4, fontSize: 13 }}>Học theo thứ tự, nhận LP bonus khi hoàn thành trọn bộ</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PATHS.map((path, i) => (
              <motion.div key={path.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-5 cursor-pointer group"
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                whileHover={{ borderColor: `${path.color}50`, boxShadow: `0 8px 24px ${path.color}10`, y: -4 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${path.color}15`, border: `1px solid ${path.color}30` }}>
                    <span style={{ color: path.color, fontSize: 22 }}>{path.icon}</span>
                  </div>
                  <div>
                    <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{path.title}</div>
                    <div style={{ color: path.color, fontSize: 10, fontFamily: DS.mono }}>{path.difficulty}</div>
                  </div>
                </div>
                <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>{path.desc}</p>
                {/* Steps */}
                <div className="space-y-2 mb-5">
                  {path.steps.map((step, si) => (
                    <div key={si} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${path.color}20`, border: `1px solid ${path.color}40` }}>
                        <span style={{ color: path.color, fontSize: 9, fontFamily: DS.mono }}>{si + 1}</span>
                      </div>
                      <span style={{ color: step.includes('Sắp') ? DS.text5 : DS.text3, fontSize: 12 }}>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <div className="flex items-center gap-3">
                    <span style={{ color: DS.text4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{path.duration}</span>
                    <span style={{ color: DS.purple, fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}><Zap size={11} />+{path.totalLP} LP</span>
                  </div>
                  <span style={{ color: path.color, fontSize: 11, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 3 }}>
                    Xem lộ trình <ChevronRight size={11} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <section className="px-6 mb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap flex-1">
              {CATS.map(cat => (
                <button key={cat} onClick={() => setActiveCat(cat)}
                  style={{ padding: '7px 16px', borderRadius: 30, fontSize: 12, cursor: 'pointer', background: activeCat === cat ? GRD.primary : 'transparent', border: activeCat === cat ? 'none' : `1px solid ${DS.border}`, color: activeCat === cat ? '#fff' : DS.text3, transition: 'all 0.2s' }}>
                  {cat}
                </button>
              ))}
            </div>
            {/* Level + Sort */}
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: hasFilters ? 'rgba(59,130,246,0.12)' : DS.bgCard, border: `1px solid ${hasFilters ? DS.blue + '40' : DS.border}`, color: hasFilters ? DS.blue : DS.text3, fontSize: 12, cursor: 'pointer' }}>
                <Filter size={13} />Bộ lọc {hasFilters && `(${(activeCat !== 'Tất cả' ? 1 : 0) + (activeLevel !== 'Tất cả' ? 1 : 0)})`}
              </button>
              <select value={sort} onChange={e => setSort(e.target.value)}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '8px 12px', color: DS.text3, fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                {SORTS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
                  <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>CẤP ĐỘ</div>
                  <div className="flex gap-2 flex-wrap">
                    {LEVELS.map(l => (
                      <button key={l} onClick={() => setActiveLevel(l)}
                        style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: activeLevel === l ? `${levelColor[l] ?? DS.blue}20` : 'transparent', border: `1px solid ${activeLevel === l ? (levelColor[l] ?? DS.blue) + '60' : DS.border}`, color: activeLevel === l ? (levelColor[l] ?? DS.blue) : DS.text3 }}>
                        {l === 'Tất cả' ? 'Tất cả cấp độ' : levelVN[l]}
                      </button>
                    ))}
                  </div>
                  {hasFilters && (
                    <button onClick={() => { setActiveCat('Tất cả'); setActiveLevel('Tất cả'); }}
                      style={{ marginTop: 12, color: DS.red, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <X size={12} /> Xóa bộ lọc
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Course grid ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>
              ── {filtered.length} KHÓA HỌC {search ? `cho "${search}"` : ''}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filtered.map((course, i) => (
                <motion.div key={course.id} className="rounded-2xl overflow-hidden cursor-pointer group"
                  style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ borderColor: `${course.color}40`, boxShadow: `0 8px 24px ${course.color}12`, y: -4 }}>
                  {/* Image */}
                  <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                    <img src={course.img} alt={course.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" style={{ background: 'rgba(2,6,23,0.65)' }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${course.color}cc` }}>
                        <Play size={18} style={{ color: '#fff', fill: '#fff', marginLeft: 2 }} />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span style={{ color: course.color, background: 'rgba(2,6,23,0.85)', border: `1px solid ${course.color}40`, borderRadius: 6, padding: '2px 8px', fontSize: 9, fontFamily: DS.mono, backdropFilter: 'blur(8px)' }}>{course.cat.toUpperCase()}</span>
                    </div>
                    {course.lpPrice <= USER_LP && (
                      <div className="absolute top-3 right-3">
                        <span style={{ color: DS.purple, background: 'rgba(2,6,23,0.9)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 6, padding: '2px 7px', fontSize: 9, fontFamily: DS.mono, backdropFilter: 'blur(8px)' }}>◈ LP OK</span>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span style={{ color: levelColor[course.level], fontSize: 9, fontFamily: DS.mono, padding: '2px 6px', borderRadius: 4, background: `${levelColor[course.level]}15`, border: `1px solid ${levelColor[course.level]}30` }}>{levelVN[course.level].toUpperCase()}</span>
                    </div>
                    <h3 style={{ color: DS.text, fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.title}</h3>
                    {/* Instructor mini */}
                    <div className="flex items-center gap-2 mb-3">
                      <img src={course.instructorImg} alt={course.instructor} className="w-6 h-6 rounded-lg object-cover" style={{ border: `1px solid ${course.color}40` }} />
                      <span style={{ color: DS.text4, fontSize: 12 }}>{course.instructor}</span>
                    </div>
                    {/* Rating + meta */}
                    <div className="flex items-center gap-1 mb-4">
                      <Star size={12} style={{ color: DS.amber, fill: DS.amber }} />
                      <span style={{ color: DS.amber, fontSize: 12, fontWeight: 700 }}>{course.rating}</span>
                      <span style={{ color: DS.text4, fontSize: 11 }}>({course.reviews})</span>
                      <span style={{ color: DS.text5, marginLeft: 8, fontSize: 11 }}>{course.students.toLocaleString()} học viên · {course.duration}</span>
                    </div>
                    {/* Price row */}
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                      <div>
                        <div style={{ color: course.color, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>
                          {fmtVND(course.price)}
                        </div>
                        <div style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>
                          ◈ {course.lpPrice.toLocaleString()} LP · +{course.lpReward} LP hoàn thành
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPayModal(course)}
                          style={{ background: `${course.color}18`, border: `1px solid ${course.color}40`, borderRadius: 8, padding: '6px 10px', color: course.color, fontSize: 11, cursor: 'pointer', fontFamily: DS.mono }}>
                          Đăng ký
                        </button>
                        <Link to={`/hoc-vien/${course.id}`} style={{ background: 'transparent', border: `1px solid ${DS.border}`, borderRadius: 8, padding: '6px 10px', color: DS.text4, fontSize: 11, cursor: 'pointer', fontFamily: DS.mono, textDecoration: 'none' }}>
                          Xem
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <div style={{ color: DS.text4, fontSize: 40, marginBottom: 12 }}>◎</div>
              <div style={{ color: DS.text3, fontSize: 14, marginBottom: 8 }}>Không tìm thấy khóa học phù hợp</div>
              <button onClick={() => { setSearch(''); setActiveCat('Tất cả'); setActiveLevel('Tất cả'); }}
                style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: DS.mono }}>
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Instructors ──────────────────────────────────────────────────── */}
      <section className="px-6 py-14" style={{ background: 'rgba(15,23,42,0.6)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 8 }}>── GIẢNG VIÊN</div>
            <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.06em' }}>HỌC TỪ NHỮNG CHUYÊN GIA HÀNG ĐẦU</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {INSTRUCTORS.map((ins, i) => (
              <motion.div key={ins.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="p-5 rounded-2xl text-center cursor-pointer"
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                whileHover={{ borderColor: `${ins.rankColor}40`, y: -4 }}>
                <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3" style={{ border: `2px solid ${ins.rankColor}60`, boxShadow: `0 0 16px ${ins.rankColor}25` }}>
                  <img src={ins.img} alt={ins.name} className="w-full h-full object-cover" />
                </div>
                <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{ins.name}</div>
                <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{ins.role}</div>
                <div style={{ color: ins.rankColor, fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>✦ {ins.rank.toUpperCase()}</div>
                <div className="flex items-center justify-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.text4, fontSize: 11 }}>📚 {ins.courses} khóa</span>
                  <span style={{ color: DS.text4, fontSize: 11 }}>👥 {ins.students.toLocaleString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 8 }}>── FAQ</div>
            <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.06em' }}>CÂU HỎI THƯỜNG GẶP</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${openFaq === i ? DS.blue + '40' : DS.border}` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5"
                  style={{ background: openFaq === i ? 'rgba(59,130,246,0.06)' : DS.bgCard, border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{faq.q}</span>
                  <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} style={{ flexShrink: 0, color: DS.text4 }}>
                    <ChevronDown size={16} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5" style={{ color: DS.text3, fontSize: 13, lineHeight: 1.8, borderTop: `1px solid ${DS.border}`, paddingTop: 16 }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-12" style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.2), rgba(129,140,248,0.1))', border: '1px solid rgba(129,140,248,0.25)' }}>
          <div style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 11, letterSpacing: '0.2em', marginBottom: 12 }}>◈ LOOP ACADEMY</div>
          <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 12 }}>
            SẴN SÀNG NÂNG CẤP KỸ NĂNG?
          </h2>
          <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
            Học cùng chuyên gia thực chiến, nhận LP thưởng và mở khóa đặc quyền trong hệ sinh thái LOOP.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/dat-lich" style={{ background: GRD.primary, color: '#fff', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 24px rgba(129,140,248,0.35)' }}>
              Đặt tư vấn miễn phí <ArrowRight size={14} />
            </Link>
            <Link to="/hoc-vien/1" style={{ background: 'transparent', color: DS.text3, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '12px 24px', fontSize: 14, textDecoration: 'none' }}>
              Xem tất cả khóa học
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <AnimatePresence>
        {payModal && (
          <PaymentModal course={payModal} lpBalance={USER_LP} onClose={() => setPayModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
