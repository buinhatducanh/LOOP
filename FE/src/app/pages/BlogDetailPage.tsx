import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, User, Tag, Share2, Bookmark, ThumbsUp, MessageSquare } from 'lucide-react';
import { DS } from '../components/layout/ds';
import { blogService } from '../../api/blog.service';
import type { BlogDetail } from '../../api/blog.service';
import { useLocaleStore } from '../store/localeStore';

const catColors: Record<string, string> = {
  Design: DS.blue,
  Tech: DS.cyan,
  Marketing: DS.green,
  DevOps: DS.amber,
  'LP System': DS.purple,
};

// FALLBACK_POSTS removed — BlogDetailPage fetches by slug from API only

function LoadingState() {
  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ height: 420, background: DS.bgCard }} />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div style={{ height: 48, width: '60%', background: DS.bgCard, borderRadius: 8, marginBottom: 24 }} />
        <div style={{ height: 16, width: '100%', background: DS.bgCard, borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 16, width: '80%', background: DS.bgCard, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ background: DS.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 64 }}>
      <div style={{ color: DS.text5, fontSize: 64, fontFamily: DS.mono }}>404</div>
      <div style={{ color: DS.text3, fontSize: 18 }}>Bài viết không tồn tại</div>
      <button onClick={() => navigate('/blog')} style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>
        ← Quay lại Blog
      </button>
    </div>
  );
}

export default function BlogDetailPage() {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount] = useState(42);
  const { locale } = useLocaleStore();

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    blogService.getPostBySlug(slug, locale)
      .then(fetched => {
        if (!cancelled) setPost(fetched);
      })
      .catch(() => {
        if (!cancelled) setPost(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug, locale]);

  if (loading) return <LoadingState />;
  if (!post) return <NotFound />;

  // catColor unused — using postCat
  const cat = catColors[post.author.name] ? 'Tech' : 'Tech'; // fallback
  const postCat = cat;
  const postColor = catColors[postCat] || DS.blue;

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64, minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        <img src={post.coverImage} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(9,9,18,0.95) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 24px 40px' }}>
          <div className="max-w-4xl mx-auto w-full">
            <button
              onClick={() => navigate('/blog')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: DS.text4, fontSize: 13, fontFamily: DS.mono,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer', marginBottom: 20,
              }}
            >
              <ArrowLeft size={13} /> QUAY LẠI BLOG
            </button>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span style={{ color: postColor, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em', background: `${postColor}20`, border: `1px solid ${postColor}40`, borderRadius: 4, padding: '3px 10px' }}>
                {postCat.toUpperCase()}
              </span>
              <span style={{ color: DS.text5, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} /> {Math.ceil(post.content.split(' ').length / 200)} phút đọc
              </span>
              <span style={{ color: DS.text5, fontSize: 12 }}>{post.publishedAt}</span>
            </div>
            <h1 style={{ fontFamily: DS.heading, fontSize: 'clamp(20px, 3.5vw, 34px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, maxWidth: 800 }}>
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
            <div className="flex items-center gap-4 mb-10 pb-8 flex-wrap" style={{ borderBottom: `1px solid ${DS.border}` }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${postColor}60, ${postColor}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${postColor}40`, flexShrink: 0 }}>
                <User size={18} style={{ color: postColor }} />
              </div>
              <div>
                <div style={{ color: DS.text2, fontSize: 14, fontWeight: 600 }}>{post.author.name}</div>
                <div style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono }}>LOOP Solutions · Senior Specialist</div>
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={() => setLiked(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${liked ? postColor : DS.border}`, background: liked ? `${postColor}15` : 'transparent', color: liked ? postColor : DS.text5 }}>
                  <ThumbsUp size={13} /> {liked ? likeCount + 1 : likeCount}
                </button>
                <button onClick={() => setSaved(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${saved ? DS.amber : DS.border}`, background: saved ? `${DS.amber}15` : 'transparent', color: saved ? DS.amber : DS.text5 }}>
                  <Bookmark size={13} />
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: `1px solid ${DS.border}`, background: 'transparent', color: DS.text5 }}>
                  <Share2 size={13} />
                </button>
              </div>
            </div>

            {/* Article content */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
              {(post.contentBlocks.length > 0 ? post.contentBlocks : [{ type: 'p' as const, text: post.content }]).map((block, i) =>
                block.type === 'h2' ? (
                  <h2 key={`b-${i}`} style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 700, color: DS.text, marginTop: 28, paddingTop: 20, borderTop: `1px solid ${DS.border}` }}>
                    {block.text}
                  </h2>
                ) : (
                  <p key={`b-${i}`} style={{ color: DS.text3, fontSize: 15, lineHeight: 1.9 }}>{block.text}</p>
                )
              )}
            </motion.div>

            {/* Tags */}
            <div className="flex items-center gap-3 mt-10 pt-8 flex-wrap" style={{ borderTop: `1px solid ${DS.border}` }}>
              <Tag size={14} style={{ color: DS.text5 }} />
              {[postCat, 'LOOP Solutions', '2026'].map((tag) => (
                <span key={tag} style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, borderRadius: 4, padding: '3px 10px' }}>
                  #{tag}
                </span>
              ))}
            </div>

            {/* Comments */}
            <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${DS.border}` }}>
              <div className="flex items-center gap-2 mb-6" style={{ color: DS.text3, fontSize: 14, fontFamily: DS.mono, letterSpacing: '0.1em' }}>
                <MessageSquare size={15} /> BÌNH LUẬN (12)
              </div>
              <div style={{ color: DS.text5, fontSize: 13, textAlign: 'center', padding: '32px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: `1px dashed ${DS.border}` }}>
                Đăng nhập để tham gia thảo luận →{' '}
                <Link to="/dang-nhap" style={{ color: postColor, textDecoration: 'none' }}>Đăng nhập</Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post info */}
            <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── THÔNG TIN BÀI VIẾT</div>
              {[
                { label: 'Chuyên mục', value: postCat },
                { label: 'Thời gian đọc', value: `${Math.ceil(post.content.split(' ').length / 200)} phút` },
                { label: 'Ngày đăng', value: post.publishedAt },
                { label: 'Tác giả', value: post.author.name },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.text5, fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="rounded-2xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${postColor}12, rgba(0,0,0,0))`, border: `1px solid ${postColor}25` }}>
              <div style={{ color: postColor, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 8 }}>LOOP ACADEMY</div>
              <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Học sâu hơn về {postCat}</div>
              <Link to="/hoc-vien" style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 8, fontSize: 12, fontFamily: DS.mono, background: postColor, color: '#000', textDecoration: 'none', fontWeight: 700 }}>
                XEM KHÓA HỌC
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
