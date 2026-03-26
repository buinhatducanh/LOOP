import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Search, Clock, User, ArrowRight, Tag } from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';

const POSTS = [
  { id: 1, title: 'Xu hướng Web Design 2026: Dark Mode, Glassmorphism và AI-Generated UI', excerpt: 'Khám phá những xu hướng thiết kế sẽ định hình giao diện web trong năm 2026, từ hiệu ứng kính mờ đến AI tự động tạo layout...', cat: 'Design', time: '8 phút', author: 'Mei Lin', date: '20/03/2026', img: 'https://images.unsplash.com/photo-1588336443962-49d88df004a1?auto=format&fit=crop&w=600&q=80', featured: true, color: DS.blue },
  { id: 2, title: 'Từ Iron đến Diamond: Hành trình thăng hạng trong hệ thống LP của LOOP', excerpt: 'Làm thế nào để tích lũy LP nhanh nhất? Chiến lược của các thành viên đã đạt rank Diamond chia sẻ...', cat: 'LP System', time: '6 phút', author: 'Akira Sato', date: '18/03/2026', img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=600&q=80', featured: false, color: DS.purple },
  { id: 3, title: 'React 19 + TypeScript 5.4: Những tính năng cần biết cho developer 2026', excerpt: 'Server Components, use() hook và TypeScript inference mới — tổng hợp toàn diện những thay đổi ảnh hưởng đến dự án của bạn...', cat: 'Tech', time: '12 phút', author: 'Ryo Hashimoto', date: '15/03/2026', img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=600&q=80', featured: false, color: DS.cyan },
  { id: 4, title: 'SEO cho SaaS B2B: Chiến lược tăng organic traffic 300% trong 6 tháng', excerpt: 'Case study thực tế từ dự án VNRetail: Từ 0 đến 50K organic visits/tháng với chi phí tối thiểu...', cat: 'Marketing', time: '10 phút', author: 'Yuna Park', date: '12/03/2026', img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=600&q=80', featured: false, color: DS.green },
  { id: 5, title: 'Kubernetes cho Digital Agency: Khi nào cần và khi nào không?', excerpt: 'Phân tích chi tiết chi phí-lợi ích của việc chuyển sang K8s. Không phải dự án nào cũng cần orchestration phức tạp...', cat: 'DevOps', time: '15 phút', author: 'Shin Watanabe', date: '10/03/2026', img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=600&q=80', featured: false, color: DS.amber },
  { id: 6, title: 'UX Writing cho người Việt: Ngôn ngữ UI phù hợp với thị trường nội địa', excerpt: 'Những lỗi thường gặp khi viết nội dung giao diện cho người dùng Việt Nam và cách khắc phục hiệu quả...', cat: 'Design', time: '7 phút', author: 'Mei Lin', date: '08/03/2026', img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=600&q=80', featured: false, color: DS.red },
];

const CATS = ['Tất cả', 'Design', 'Tech', 'Marketing', 'DevOps', 'LP System'];
const catColors: Record<string, string> = { Design: DS.blue, Tech: DS.cyan, Marketing: DS.green, DevOps: DS.amber, 'LP System': DS.purple };

export default function BlogPage() {
  const [activeCat, setActiveCat] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const featured = POSTS.find(p => p.featured)!;
  const filtered = POSTS.filter(p => !p.featured && (activeCat === 'Tất cả' || p.cat === activeCat) && (p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>
      {/* Header */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.22em' }}>BLOG & INSIGHTS</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 38, fontWeight: 900, letterSpacing: '0.05em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
            KIẾN THỨC & CASE STUDY
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>Cập nhật xu hướng công nghệ, thiết kế và chiến lược digital marketing từ đội ngũ chuyên gia LOOP.</p>
        </div>
      </section>

      {/* Featured post */}
      <section className="px-6 mb-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 cursor-pointer"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
            whileHover={{ borderColor: `${DS.blue}40`, boxShadow: `0 8px 40px rgba(59,130,246,0.12)` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ height: 320, overflow: 'hidden' }}>
              <img src={featured.img} alt={featured.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2.5 py-1 rounded-full" style={{ background: `${catColors[featured.cat] || DS.blue}15`, border: `1px solid ${catColors[featured.cat] || DS.blue}30`, color: catColors[featured.cat] || DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>
                  ★ BÀI NỔI BẬT · {featured.cat}
                </span>
              </div>
              <h2 style={{ color: DS.text, fontSize: 22, fontWeight: 700, lineHeight: 1.4, marginBottom: 12 }}>{featured.title}</h2>
              <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>{featured.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5" style={{ color: DS.text4, fontSize: 12 }}>
                    <User size={12} /> {featured.author}
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: DS.text4, fontSize: 12 }}>
                    <Clock size={12} /> {featured.time}
                  </div>
                </div>
                <Link to={`/blog/${featured.id}`} style={{ color: DS.blue, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontFamily: DS.mono }}>
                  ĐỌC NGAY <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters + Search */}
      <section className="px-6 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {CATS.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                style={{ padding: '7px 16px', borderRadius: 30, fontSize: 12, cursor: 'pointer', background: activeCat === cat ? GRD.primary : 'transparent', border: activeCat === cat ? 'none' : `1px solid ${DS.border}`, color: activeCat === cat ? '#fff' : DS.text3, transition: 'all 0.2s' }}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <Search size={14} style={{ color: DS.text4 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bài viết..."
              style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, width: 200, fontFamily: DS.body }} />
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post, i) => (
            <Link key={post.id} to={`/blog/${post.id}`} style={{ textDecoration: 'none' }}>
            <motion.div className="rounded-2xl overflow-hidden cursor-pointer group"
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ borderColor: `${post.color}40`, boxShadow: `0 8px 24px ${post.color}15` }}
            >
              <div style={{ height: 180, overflow: 'hidden' }}>
                <img src={post.img} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ color: catColors[post.cat] || post.color, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.12em', padding: '2px 8px', borderRadius: 4, background: `${catColors[post.cat] || post.color}15`, border: `1px solid ${catColors[post.cat] || post.color}25` }}>
                    {post.cat.toUpperCase()}
                  </span>
                </div>
                <h3 style={{ color: DS.text, fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.title}
                </h3>
                <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <div className="flex items-center gap-3">
                    <span style={{ color: DS.text4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} />{post.author}</span>
                    <span style={{ color: DS.text4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{post.time}</span>
                  </div>
                  <span style={{ color: post.color, fontSize: 11, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 4 }}>Đọc <ArrowRight size={11} /></span>
                </div>
              </div>
            </motion.div>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div style={{ color: DS.text4, fontSize: 40, marginBottom: 12 }}>◎</div>
            <div style={{ color: DS.text3, fontSize: 14 }}>Không tìm thấy bài viết phù hợp</div>
          </div>
        )}
      </section>
    </div>
  );
}