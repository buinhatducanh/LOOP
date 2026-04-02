import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, User, Tag, Share2, Bookmark, ThumbsUp, MessageSquare } from 'lucide-react';
import { DS } from '../components/layout/ds';
import { useI18n } from '@/hooks/useI18n';

const catColors: Record<string, string> = {
  Design: DS.blue,
  Tech: DS.cyan,
  Marketing: DS.green,
  DevOps: DS.amber,
  'LP System': DS.purple,
};

const POSTS = [
  {
    id: 1,
    title: 'Xu hướng Web Design 2026: Dark Mode, Glassmorphism và AI-Generated UI',
    cat: 'Design',
    time: '8 phút',
    author: 'Mei Lin',
    date: '20/03/2026',
    img: 'https://images.unsplash.com/photo-1588336443962-49d88df004a1?auto=format&fit=crop&w=1200&q=80',
    content: [
      { type: 'p', text: 'Trong kỷ nguyên số hóa ngày càng sâu rộng, thiết kế giao diện web đang trải qua một cuộc cách mạng mới. Năm 2026 chứng kiến sự hội tụ của ba xu hướng lớn: Dark Mode thuần thục, Glassmorphism tinh tế và AI-Generated UI thông minh — tạo nên một hệ sinh thái thiết kế hoàn toàn mới.' },
      { type: 'h2', text: '1. Dark Mode — Từ Xu Hướng Đến Tiêu Chuẩn' },
      { type: 'p', text: 'Dark Mode không còn là tùy chọn mà đã trở thành yêu cầu mặc định. Nghiên cứu cho thấy 82% người dùng chủ động chuyển sang chế độ tối khi sử dụng ứng dụng vào ban đêm, và 67% giữ nguyên cài đặt này suốt ngày.' },
      { type: 'h2', text: '2. Glassmorphism 2.0 — Tinh Tế Hơn, Hiệu Quả Hơn' },
      { type: 'p', text: 'Glassmorphism thế hệ đầu thường bị chỉ trích vì gây mất tập trung và khó đọc. Phiên bản 2026 học được bài học đó: backdrop-blur được sử dụng có chọn lọc, độ mờ được tinh chỉnh theo layer hierarchy.' },
      { type: 'h2', text: '3. AI-Generated UI — Thực Tế Hay Viễn Cảnh?' },
      { type: 'p', text: 'Các công cụ như Figma AI, Adobe Firefly đã bắt đầu tạo ra wireframe và mockup đạt chất lượng production. Vai trò của designer chuyển hóa từ người tạo ra pixels thành người định hướng và tinh chỉnh output của AI.' },
    ],
  },
  {
    id: 2,
    title: 'Từ Iron đến Diamond: Hành trình thăng hạng trong hệ thống LP của LOOP',
    cat: 'LP System',
    time: '6 phút',
    author: 'Akira Sato',
    date: '18/03/2026',
    img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=1200&q=80',
    content: [
      { type: 'p', text: 'Hệ thống LP (Loops Point) của LOOP không chỉ là điểm thưởng — đây là công cụ ghi nhận đóng góp và xây dựng văn hóa cộng đồng. Hành trình từ Iron đến Diamond đòi hỏi sự kiên trì và chiến lược.' },
      { type: 'h2', text: 'LP Là Gì Và Hoạt Động Như Thế Nào?' },
      { type: 'p', text: 'LP là điểm thưởng nội bộ, không có giá trị tiền tệ. Bạn tích lũy LP qua các hoạt động: hoàn thành dự án, giới thiệu khách hàng mới, tham gia khóa học Academy, và đóng góp vào cộng đồng LOOP.' },
      { type: 'h2', text: 'Chiến Lược Của Các Diamond Member' },
      { type: 'p', text: 'Qua phỏng vấn các thành viên Diamond, chúng tôi rút ra 3 điểm chung: Tập trung vào giá trị thực, tích cực mentoring thành viên mới, và hoàn thành Academy courses sớm để unlock các multiplier.' },
    ],
  },
  {
    id: 3,
    title: 'React 19 + TypeScript 5.4: Những tính năng cần biết cho developer 2026',
    cat: 'Tech',
    time: '12 phút',
    author: 'Ryo Hashimoto',
    date: '15/03/2026',
    img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=1200&q=80',
    content: [
      { type: 'p', text: 'React 19 và TypeScript 5.4 mang đến những thay đổi đáng kể cho cộng đồng developer Việt Nam. Bài viết này tổng hợp những điểm quan trọng nhất bạn cần nắm để không bị tụt hậu trong năm 2026.' },
      { type: 'h2', text: 'React Server Components — Sẵn Sàng Production' },
      { type: 'p', text: 'RSC không còn là thử nghiệm. Với React 19, Server Components được tích hợp native vào framework, cho phép rendering trực tiếp trên server mà không gửi JavaScript xuống client.' },
      { type: 'h2', text: 'Hook use() — Async Mà Không Cần useEffect' },
      { type: 'p', text: 'Hook use() mới cho phép await Promise trực tiếp trong component body, kết hợp với Suspense để handle loading state tự động.' },
    ],
  },
  {
    id: 4,
    title: 'SEO cho SaaS B2B: Chiến lược tăng organic traffic 300% trong 6 tháng',
    cat: 'Marketing',
    time: '10 phút',
    author: 'Yuna Park',
    date: '12/03/2026',
    img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=1200&q=80',
    content: [
      { type: 'p', text: 'SEO cho SaaS B2B có đặc thù riêng: cycle quyết định dài, người mua là doanh nghiệp, và giá trị lifetime cao. Chiến lược SEO cần phản ánh những đặc điểm này.' },
      { type: 'h2', text: 'Case Study: VNRetail Platform' },
      { type: 'p', text: 'Trong 6 tháng, chúng tôi đã đưa VNRetail từ 0 organic traffic lên 50.000 visits/tháng. Chiến lược gồm 3 giai đoạn: Technical SEO foundation, Content architecture theo buyer journey, và Link building qua thought leadership.' },
    ],
  },
  {
    id: 5,
    title: 'Kubernetes cho Digital Agency: Khi nào cần và khi nào không?',
    cat: 'DevOps',
    time: '15 phút',
    author: 'Shin Watanabe',
    date: '10/03/2026',
    img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=1200&q=80',
    content: [
      { type: 'p', text: 'Kubernetes là công cụ mạnh mẽ — nhưng không phải cho mọi trường hợp. Bài viết này giúp bạn ra quyết định có cơ sở về việc liệu K8s có phù hợp với dự án của bạn hay không.' },
      { type: 'h2', text: 'Khi Nào Nên Dùng Kubernetes?' },
      { type: 'p', text: 'K8s phù hợp khi: có nhiều microservices cần orchestrate, cần auto-scaling theo load, có đội DevOps đủ năng lực maintain, và dự án có SLA cao cần zero-downtime deployment.' },
      { type: 'h2', text: 'Khi Nào Không Cần?' },
      { type: 'p', text: 'Docker Compose + VPS thường là lựa chọn thực dụng hơn cho dự án nhỏ, startup giai đoạn đầu, hoặc team không có DevOps chuyên trách.' },
    ],
  },
  {
    id: 6,
    title: 'UX Writing cho người Việt: Ngôn ngữ UI phù hợp với thị trường nội địa',
    cat: 'Design',
    time: '7 phút',
    author: 'Mei Lin',
    date: '08/03/2026',
    img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=1200&q=80',
    content: [
      { type: 'p', text: 'UX Writing là kỹ năng thường bị xem nhẹ trong quy trình thiết kế Việt Nam. Nhưng ngôn ngữ trong giao diện ảnh hưởng trực tiếp đến conversion rate và user satisfaction.' },
      { type: 'h2', text: 'Lỗi #1: Dịch Thẳng Từ Tiếng Anh' },
      { type: 'p', text: 'UX Writing tốt không phải là dịch — mà là viết lại cho phù hợp với tâm lý người dùng Việt. Ví dụ: "Submit" nên thành "Xác nhận" thay vì "Gửi đi".' },
      { type: 'h2', text: 'Lỗi #2: Ngôi Không Nhất Quán' },
      { type: 'p', text: 'Hãy quyết định một "voice" và stick với nó — dùng "bạn" hoặc "quý khách" xuyên suốt, không trộn lẫn.' },
    ],
  },
];

export default function BlogDetailPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(42);

  const numId = Number(id);
  const post = POSTS.find((p) => p.id === numId);
  const related = POSTS.filter((p) => p.id !== numId).slice(0, 3);

  if (!post) {
    return (
      <div
        style={{
          background: DS.bg,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div style={{ color: DS.text5, fontSize: 64, fontFamily: DS.mono }}>404</div>
        <div style={{ color: DS.text3, fontSize: 18 }}>{t('blog.detail.notFound')}</div>
        <Link to="/blog" style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13 }}>
          ← {t('blog.detail.backToBlog')}
        </Link>
      </div>
    );
  }

  const catColor = catColors[post.cat] ?? DS.blue;

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64, minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        <img
          src={post.img}
          alt={post.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(9,9,18,0.95) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 24px 40px',
          }}
        >
          <div className="max-w-4xl mx-auto w-full">
            <button
              onClick={() => navigate('/blog')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: DS.text4,
                fontSize: 13,
                fontFamily: DS.mono,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                marginBottom: 20,
              }}
            >
              <ArrowLeft size={13} /> {t('blog.detail.backToBlog').toUpperCase()}
            </button>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span
                style={{
                  color: catColor,
                  fontSize: 10,
                  fontFamily: DS.mono,
                  letterSpacing: '0.2em',
                  background: `${catColor}20`,
                  border: `1px solid ${catColor}40`,
                  borderRadius: 4,
                  padding: '3px 10px',
                }}
              >
                {post.cat.toUpperCase()}
              </span>
              <span
                style={{
                  color: DS.text5,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Clock size={11} /> {t('blog.detail.readTime', { min: Number(post.time.replace(/\D/g, '')) })}
              </span>
              <span style={{ color: DS.text5, fontSize: 12 }}>{post.date}</span>
            </div>
            <h1
              style={{
                fontFamily: DS.heading,
                fontSize: 'clamp(20px, 3.5vw, 34px)',
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.3,
                maxWidth: 800,
              }}
            >
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2">
            {/* Author row */}
            <div
              className="flex items-center gap-4 mb-10 pb-8 flex-wrap"
              style={{ borderBottom: `1px solid ${DS.border}` }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${catColor}60, ${catColor}20)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${catColor}40`,
                  flexShrink: 0,
                }}
              >
                <User size={18} style={{ color: catColor }} />
              </div>
              <div>
                <div style={{ color: DS.text2, fontSize: 14, fontWeight: 600 }}>{post.author}</div>
                <div style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono }}>
                  {t('blog.detail.authorRole')}
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => {
                    setLiked((v) => !v);
                    setLikeCount((c) => (liked ? c - 1 : c + 1));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: 'pointer',
                    border: `1px solid ${liked ? catColor : DS.border}`,
                    background: liked ? `${catColor}15` : 'transparent',
                    color: liked ? catColor : DS.text5,
                  }}
                >
                  <ThumbsUp size={13} /> {likeCount}
                </button>
                <button
                  onClick={() => setSaved((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: 'pointer',
                    border: `1px solid ${saved ? DS.amber : DS.border}`,
                    background: saved ? `${DS.amber}15` : 'transparent',
                    color: saved ? DS.amber : DS.text5,
                  }}
                >
                  <Bookmark size={13} />
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: 'pointer',
                    border: `1px solid ${DS.border}`,
                    background: 'transparent',
                    color: DS.text5,
                  }}
                >
                  <Share2 size={13} />
                </button>
              </div>
            </div>

            {/* Article content */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {post.content.map((block, i) =>
                block.type === 'h2' ? (
                  <h2
                    key={`b-${i}`}
                    style={{
                      fontFamily: DS.heading,
                      fontSize: 20,
                      fontWeight: 700,
                      color: DS.text,
                      marginTop: 28,
                      paddingTop: 20,
                      borderTop: `1px solid ${DS.border}`,
                    }}
                  >
                    {block.text}
                  </h2>
                ) : (
                  <p key={`b-${i}`} style={{ color: DS.text3, fontSize: 15, lineHeight: 1.9 }}>
                    {block.text}
                  </p>
                )
              )}
            </motion.div>

            {/* Tags */}
            <div
              className="flex items-center gap-3 mt-10 pt-8 flex-wrap"
              style={{ borderTop: `1px solid ${DS.border}` }}
            >
              <Tag size={14} style={{ color: DS.text5 }} />
              {[post.cat, 'LOOP Solutions', '2026'].map((tag) => (
                <span
                  key={tag}
                  style={{
                    color: DS.text5,
                    fontSize: 11,
                    fontFamily: DS.mono,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${DS.border}`,
                    borderRadius: 4,
                    padding: '3px 10px',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Comments */}
            <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${DS.border}` }}>
              <div
                className="flex items-center gap-2 mb-6"
                style={{ color: DS.text3, fontSize: 14, fontFamily: DS.mono, letterSpacing: '0.1em' }}
              >
                <MessageSquare size={15} /> {t('blog.detail.comments')}
              </div>
              <div
                style={{
                  color: DS.text5,
                  fontSize: 13,
                  textAlign: 'center',
                  padding: '32px 0',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 12,
                  border: `1px dashed ${DS.border}`,
                }}
              >
                {t('blog.detail.loginToComment')}{' '}
                <Link
                  to="/dang-nhap"
                  style={{ color: catColor, textDecoration: 'none' }}
                >
                  {t('blog.detail.login')}
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post info */}
            <div
              className="rounded-2xl p-5"
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
            >
              <div
                style={{
                  color: DS.text5,
                  fontSize: 10,
                  fontFamily: DS.mono,
                  letterSpacing: '0.15em',
                  marginBottom: 12,
                }}
              >
                ── {t('blog.detail.postInfo')}
              </div>
              {[
                { label: t('blog.detail.category'), value: post.cat },
                { label: t('blog.detail.readTimeShort', { min: post.time }) },
                { label: t('blog.detail.publishedOn'), value: post.date },
                { label: t('blog.article.author'), value: post.author },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2"
                  style={{ borderBottom: `1px solid ${DS.border}` }}
                >
                  <span style={{ color: DS.text5, fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Related */}
            <div
              className="rounded-2xl p-5"
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
            >
              <div
                style={{
                  color: DS.text5,
                  fontSize: 10,
                  fontFamily: DS.mono,
                  letterSpacing: '0.15em',
                  marginBottom: 16,
                }}
              >
                ── {t('blog.detail.relatedShort')}
              </div>
              <div className="space-y-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/blog/${r.id}`}
                    style={{ display: 'block', textDecoration: 'none' }}
                  >
                    <div className="flex gap-3 hover:opacity-80 transition-opacity">
                      <img
                        src={r.img}
                        alt={r.title}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 8,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div
                          style={{
                            color: DS.text2,
                            fontSize: 12,
                            lineHeight: 1.5,
                            marginBottom: 3,
                          }}
                        >
                          {r.title.slice(0, 55)}...
                        </div>
                        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                          {t('blog.detail.readTimeShort', { min: Number(r.time.replace(/\D/g, '')) })}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                background: `linear-gradient(135deg, ${catColor}12, rgba(0,0,0,0))`,
                border: `1px solid ${catColor}25`,
              }}
            >
              <div
                style={{
                  color: catColor,
                  fontSize: 10,
                  fontFamily: DS.mono,
                  letterSpacing: '0.2em',
                  marginBottom: 8,
                }}
              >
                {t('blog.detail.academyCta')}
              </div>
              <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                {t('blog.detail.learnMore')} {post.cat}
              </div>
              <Link
                to="/hoc-vien"
                style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: DS.mono,
                  background: catColor,
                  color: '#000',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                {t('blog.detail.viewCourses')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
