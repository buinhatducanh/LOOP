import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, Calendar, Users, TrendingUp, Star, Clock, Monitor } from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { DemoViewer } from '../components/ui/DemoViewer';
import { projectsService } from '../../api/projects.service';
import type { PortfolioProject } from '../store/loopStore';
import { useLocaleStore } from '../store/localeStore';

const USE_MOCK_FALLBACK = ((import.meta as any).env.VITE_USE_MOCK_FALLBACK as string) !== 'false';

// ── Fallback mock data (used when BE is offline) ─────────────────────────────
const FALLBACK: Record<string, any> = {
  '1': {
    id: '1', title: 'VNRetail Platform', tag: 'E-commerce SaaS', cat: 'SaaS',
    color: DS.blue,
    img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=900&q=80',
    client: 'VNRetail JSC', year: '2025', duration: '5 tháng', budget: '350,000,000 VNĐ', team: '6 người',
    metric1: '+320%', m1label: 'Tăng trưởng doanh thu',
    metric2: '50K', m2label: 'Active users',
    metric3: '99.8%', m3label: 'Uptime SLA',
    challenge: 'VNRetail cần chuyển đổi hệ thống bán hàng legacy sang nền tảng SaaS hiện đại, hỗ trợ đa tenant và scale hàng triệu SKU. Hệ thống cũ không tích hợp được payment gateway và không có real-time inventory.',
    solution: 'Chúng tôi xây dựng nền tảng SaaS multi-tenant với kiến trúc microservices trên AWS. Frontend React + Next.js, backend Node.js + Rust cho high-performance engine, PostgreSQL + Redis cho data layer. Tích hợp VNPAY, Momo và ViettelPay.',
    result: 'Ra mắt sau 5 tháng. Doanh thu tăng 320% trong 6 tháng đầu. Hệ thống xử lý 50K concurrent users không lag. Khách hàng tiết kiệm 40% chi phí vận hành so với hệ thống cũ.',
    tags: ['React', 'Next.js', 'Node.js', 'AWS', 'PostgreSQL', 'Redis', 'Docker'],
    features: ['Multi-tenant SaaS architecture', 'Real-time inventory sync', 'Payment gateway VNPAY/Momo', 'Analytics dashboard', 'Mobile app iOS + Android', 'Auto-scaling infrastructure'],
    lp: 17500,
    testimonial: { name: 'Nguyễn Minh Tuấn', role: 'CEO, VNRetail JSC', quote: 'LOOP Solutions đã thay đổi hoàn toàn cách chúng tôi vận hành. Doanh thu tăng gấp 4 lần chỉ sau 6 tháng ra mắt. Đội ngũ cực kỳ chuyên nghiệp và đúng deadline.' },
    hasDemo: true,
    demoUrl: 'https://demo.vercel.store',
    maskedUrl: 'demo.loop-solutions.vn/vnretail',
    demoTitle: 'VNRetail Platform — Live Demo',
  },
  '2': {
    id: '2', title: 'MedApp Vietnam', tag: 'Mobile Health App', cat: 'App',
    color: DS.purple,
    img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=900&q=80',
    client: 'HealthTech Vietnam', year: '2025', duration: '4 tháng', budget: '180,000,000 VNĐ', team: '4 người',
    metric1: '200K', m1label: 'Lượt tải xuống',
    metric2: '4.9★', m2label: 'App Store rating',
    metric3: '98%', m3label: 'User retention 30 ngày',
    challenge: 'Xây dựng ứng dụng y tế kết nối bệnh nhân với bác sĩ tại nhà. Yêu cầu bảo mật cao, real-time video call và tích hợp thanh toán bảo hiểm y tế.',
    solution: 'React Native cross-platform, WebRTC cho video consultation, end-to-end encryption, tích hợp API bảo hiểm y tế nhà nước và hệ thống xếp lịch intelligent.',
    result: '200K downloads trong 3 tháng đầu. Rating 4.9/5 trên cả App Store và Google Play. Đã phục vụ 50K lượt tư vấn y tế thành công.',
    tags: ['React Native', 'Firebase', 'WebRTC', 'Node.js', 'PostgreSQL'],
    features: ['Video call tư vấn HD', 'Bảo mật end-to-end', 'Thanh toán bảo hiểm', 'AI triage cơ bản', 'Lịch sử bệnh án', 'Thông báo nhắc nhở'],
    lp: 9000,
    testimonial: { name: 'Dr. Trần Thị Mai', role: 'Medical Director', quote: 'MedApp giúp chúng tôi tiếp cận bệnh nhân ở vùng sâu vùng xa. Thiết kế đơn giản nhưng đầy đủ tính năng chuyên môn.' },
    hasDemo: true,
    demoUrl: 'https://www.figma.com/embed?embed_host=share&url=https://www.figma.com/community',
    maskedUrl: 'demo.loop-solutions.vn/medapp',
    demoTitle: 'MedApp Vietnam — UI Prototype',
  },
  '3': {
    id: '3', title: 'AnalyticsPro Dashboard', tag: 'Data Analytics SaaS', cat: 'SaaS',
    color: DS.cyan,
    img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=900&q=80',
    client: 'DataViet Corp', year: '2024', duration: '3 tháng', budget: '120,000,000 VNĐ', team: '3 người',
    metric1: '#1', m1label: 'Market Share VN',
    metric2: '99.9%', m2label: 'Uptime 12 tháng',
    metric3: '<2s', m3label: 'Query latency 100M rows',
    challenge: 'Cần dashboard analytics real-time xử lý 100M+ data points với latency dưới 2 giây. Người dùng non-tech cần tự tạo report không cần lập trình.',
    solution: 'Kiến trúc event-driven với BigQuery + materialized views. React + Recharts/D3.js frontend. No-code report builder drag-and-drop. Auto-generated PDF reports.',
    result: 'Trở thành #1 analytics platform cho SME tại Việt Nam. 500+ doanh nghiệp đang sử dụng. Latency đạt 1.8s cho 100M rows.',
    tags: ['React', 'D3.js', 'BigQuery', 'Python', 'dbt', 'Recharts'],
    features: ['No-code report builder', 'Real-time data sync', 'Auto PDF export', 'Alert system', 'Multi-source connector', 'Role-based access'],
    lp: 6000,
    hasDemo: true,
    demoUrl: 'https://example.com',
    maskedUrl: 'demo.loop-solutions.vn/analyticspro',
    demoTitle: 'AnalyticsPro Dashboard — Live Demo',
  },
  '4': {
    id: '4', title: 'EduViet Portal', tag: 'EdTech Platform', cat: 'Website',
    color: DS.green,
    img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=900&q=80',
    client: 'EduViet Foundation', year: '2024', duration: '3 tháng', budget: '75,000,000 VNĐ', team: '3 người',
    metric1: '10K', m1label: 'Học viên đăng ký',
    metric2: '+180%', m2label: 'Engagement rate',
    metric3: '95', m3label: 'PageSpeed score',
    challenge: 'Xây dựng nền tảng học trực tuyến với video streaming, quiz tương tác và certificate tự động cho 10K+ học viên.',
    solution: 'Next.js SSR, Cloudflare Stream cho video, interactive quiz engine, auto-generate PDF certificate, Supabase backend.',
    result: '10K học viên trong 2 tháng đầu. PageSpeed 95+. Engagement tăng 180% so với nền tảng cũ.',
    tags: ['Next.js', 'Supabase', 'Cloudflare', 'TypeScript', 'Tailwind'],
    features: ['Video streaming CDN', 'Interactive quiz', 'Auto certificate', 'Progress tracking', 'Forum thảo luận', 'Mobile responsive'],
    lp: 3750,
    hasDemo: false,
    demoUrl: '',
    maskedUrl: '',
    demoTitle: '',
  },
  '5': {
    id: '5', title: 'StartupHub Landing', tag: 'Corporate Website', cat: 'Website',
    color: DS.amber,
    img: 'https://images.unsplash.com/photo-1588336443962-49d88df004a1?auto=format&fit=crop&w=900&q=80',
    client: 'StartupHub Vietnam', year: '2025', duration: '3 tuần', budget: '25,000,000 VNĐ', team: '2 người',
    metric1: '98', m1label: 'PageSpeed score',
    metric2: '+45%', m2label: 'Conversion rate',
    metric3: '<0.5s', m3label: 'FCP (First Paint)',
    challenge: 'Landing page cần chuyển đổi cao, tốc độ cực nhanh và animation ấn tượng để thu hút investor và startup founding team.',
    solution: 'React + Vite, Motion animations, critical CSS inline, image optimization, A/B testing tích hợp.',
    result: '+45% conversion rate. PageSpeed 98. Đã thu hút 120+ startup đăng ký trong tháng đầu.',
    tags: ['React', 'Vite', 'Motion', 'TypeScript'],
    features: ['Micro-interactions', 'A/B testing ready', 'Performance 98+', 'CMS tích hợp', 'Analytics events'],
    lp: 1250,
    hasDemo: true,
    demoUrl: 'https://vercel.com/solutions/nextjs',
    maskedUrl: 'demo.loop-solutions.vn/startuphub',
    demoTitle: 'StartupHub Landing — Live Preview',
  },
  '6': {
    id: '6', title: 'FinDash Enterprise', tag: 'FinTech Dashboard', cat: 'SaaS',
    color: DS.red,
    img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=900&q=80',
    client: 'FinCorp Vietnam', year: '2025', duration: '6 tháng', budget: '500,000,000 VNĐ', team: '8 người',
    metric1: '2B+', m1label: 'VNĐ được quản lý',
    metric2: '500+', m2label: 'Giao dịch/ngày',
    metric3: '99.99%', m3label: 'Uptime mission-critical',
    challenge: 'Nền tảng fintech enterprise cần xử lý 500+ giao dịch/ngày với bảo mật banking-grade, audit trail đầy đủ và compliance với quy định MAS/SBV.',
    solution: 'Kiến trúc zero-trust security, Rust cho transaction engine, React dashboard, end-to-end encryption, HSM integration, full audit log.',
    result: 'Đang quản lý 2B+ VNĐ. Zero security incident. Compliance 100% với SBV regulations. Giảm 60% chi phí vận hành so với giải pháp cũ.',
    tags: ['React', 'Rust', 'PostgreSQL', 'Redis', 'HSM', 'AWS'],
    features: ['Banking-grade security', 'Real-time transaction', 'Full audit trail', 'Compliance reporting', 'Multi-sig authorization', 'AI fraud detection'],
    lp: 25000,
    testimonial: { name: 'Lê Quang Đức', role: 'CTO, FinCorp Vietnam', quote: 'Giải pháp đúng yêu cầu, bảo mật cao và đội ngũ hiểu sâu về fintech Việt Nam. Không có vendor nào khác làm được điều này trong thời gian 6 tháng.' },
    hasDemo: false,
    demoUrl: '',
    maskedUrl: '',
    demoTitle: '',
  },
};

// ── NDA Notice (for projects without public demo) ─────────────────────────────
function NdaNotice({ color }: { color: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 rounded-2xl"
      style={{ background: 'rgba(15,23,42,0.6)', border: `1px dashed ${color}30` }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div style={{ color: DS.text4, fontSize: 14, textAlign: 'center', lineHeight: 1.7 }}>
        Demo bị hạn chế theo thỏa thuận NDA với khách hàng.<br />
        <span style={{ color: DS.text5, fontSize: 12 }}>Liên hệ để xem demo riêng theo lịch hẹn.</span>
      </div>
      <Link to="/dat-lich"
        style={{ color, fontSize: 13, border: `1px solid ${color}30`, padding: '8px 20px', borderRadius: 10, textDecoration: 'none', background: `${color}08` }}>
        Đặt lịch xem demo riêng
      </Link>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id: slug } = useParams<{ id: string }>();

  // API state
  const [apiProject, setApiProject] = useState<PortfolioProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { locale } = useLocaleStore();

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    projectsService.getProjectBySlug(slug, locale)
      .then(p => {
        if (cancelled) return;
        if (!p) { setNotFound(true); }
        else {
          // fmt removed - PortfolioProject already has formatted fields
          // const fmt = (n) => n ? n.toLocaleString('vi-VN') + ' VNĐ' : '';
          setApiProject({
            id: p.id,
            title: p.title,
            tag: p.tag,
            cat: p.cat,
            color: p.color,
            img: p.img,
            client: p.client,
            year: p.year,
            duration: p.duration,
            budget: p.budget,
            team: p.team,
            metric1: p.metric1,
            m1label: p.m1label,
            metric2: p.metric2,
            m2label: p.m2label,
            metric3: p.metric3,
            m3label: p.m3label,
            challenge: p.challenge,
            solution: p.solution,
            result: p.result,
            tags: p.tags,
            features: p.features,
            lp: p.lp,
            testimonial: p.testimonial,
            hasDemo: p.hasDemo,
            demoUrl: p.demoUrl,
            maskedUrl: p.maskedUrl,
            demoTitle: p.demoTitle,
          } as any);
        }
      })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, locale]);

  // Fallback when API is offline
  const fallback = FALLBACK[slug ?? ''] ?? FALLBACK['1'];
  const project = (apiProject ?? (USE_MOCK_FALLBACK ? fallback : null)) as any;
  const [showDemo, setShowDemo] = useState(false);

  if (!loading && !project) {
    return (
      <div style={{ background: DS.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 64 }}>
        <div style={{ color: DS.text5, fontSize: 64, fontFamily: DS.mono }}>503</div>
        <div style={{ color: DS.text3, fontSize: 18 }}>Không tải được dữ liệu dự án</div>
        <div style={{ color: DS.text4, fontSize: 13, textAlign: 'center', maxWidth: 420 }}>
          API hiện không khả dụng và chế độ fallback đã tắt.
          Vui lòng thử lại sau hoặc bật VITE_USE_MOCK_FALLBACK=true trong môi trường dev.
        </div>
        <Link to="/du-an" style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13, textDecoration: 'none' }}>
          ← Quay lại Portfolio
        </Link>
      </div>
    );
  }

  if (!project) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>
        <div style={{ height: 420, background: DS.bgCard }} />
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div style={{ height: 48, width: '55%', background: DS.bgCard, borderRadius: 8, marginBottom: 24 }} />
          <div style={{ height: 16, width: '100%', background: DS.bgCard, borderRadius: 4, marginBottom: 12 }} />
          <div style={{ height: 16, width: '75%', background: DS.bgCard, borderRadius: 4 }} />
        </div>
      </div>
    );
  }

  // Not found
  if (notFound) {
    return (
      <div style={{ background: DS.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 64 }}>
        <div style={{ color: DS.text5, fontSize: 64, fontFamily: DS.mono }}>404</div>
        <div style={{ color: DS.text3, fontSize: 18 }}>Dự án không tồn tại</div>
        <Link to="/du-an" style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13, textDecoration: 'none' }}>
          ← Quay lại Portfolio
        </Link>
      </div>
    );
  }

  const infoItems = [
    { icon: <Users size={14} />, label: 'Khách hàng', value: project.client },
    { icon: <Calendar size={14} />, label: 'Năm thực hiện', value: project.year },
    { icon: <Clock size={14} />, label: 'Thời gian', value: project.duration },
    { icon: <TrendingUp size={14} />, label: 'Ngân sách', value: project.budget },
    { icon: <Users size={14} />, label: 'Team size', value: project.team },
  ];

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>
      {/* Hero image */}
      <div className="relative" style={{ height: 420, overflow: 'hidden' }}>
        <img src={project.img} alt={project.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.3) 0%, rgba(2,6,23,0.85) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-5xl mx-auto">
          <Link to="/du-an" className="inline-flex items-center gap-2 mb-4"
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Tất cả dự án
          </Link>
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full"
            style={{ background: `${project.color}20`, border: `1px solid ${project.color}40` }}>
            <span style={{ color: project.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em' }}>{project.tag.toUpperCase()}</span>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h1 style={{ fontFamily: DS.heading, fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, letterSpacing: '0.04em', color: '#fff', marginBottom: 0, lineHeight: 1.15 }}>
              {project.title}
            </h1>
            {/* Demo CTA in hero */}
            {project.hasDemo && (
              <button onClick={() => setShowDemo(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl"
                style={{ background: `${project.color}20`, border: `1px solid ${project.color}50`, color: project.color, fontSize: 13, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                <Monitor size={15} /> Xem Demo Trực Tiếp
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics bar */}
      <div className="w-full" style={{ background: 'rgba(15,23,42,0.8)', borderBottom: `1px solid ${DS.border}` }}>
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-3 gap-4">
          {[
            { val: project.metric1, label: project.m1label },
            { val: project.metric2, label: project.m2label },
            { val: project.metric3, label: project.m3label },
          ].map((m, i) => (
            <div key={i} className="text-center">
              <div style={{ color: project.color, fontFamily: DS.heading, fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 900, textShadow: `0 0 16px ${project.color}50` }}>{m.val}</div>
              <div style={{ color: DS.text4, fontSize: 12, marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main */}
          <div className="lg:col-span-2 space-y-10">
            {/* Challenge → Solution → Result */}
            {[
              { title: 'THÁCH THỨC', content: project.challenge, color: DS.red },
              { title: 'GIẢI PHÁP', content: project.solution, color: DS.blue },
              { title: 'KẾT QUẢ', content: project.result, color: DS.green },
            ].map(s => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${s.color}50, transparent)` }} />
                  <span style={{ color: s.color, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.2em' }}>{s.title}</span>
                </div>
                <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.9 }}>{s.content}</p>
              </motion.div>
            ))}

            {/* Features */}
            <div>
              <h3 style={{ color: DS.text, fontSize: 16, fontFamily: DS.heading, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 14 }}>TÍNH NĂNG CHÍNH</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {project.features.map((f: any) => (
                  <div key={f} className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ background: 'rgba(15,23,42,0.4)', border: `1px solid ${DS.border}` }}>
                    <Check size={13} style={{ color: project.color, flexShrink: 0 }} />
                    <span style={{ color: DS.text3, fontSize: 13 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Demo Section ─────────────────────────────────────────────── */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${project.color}50, transparent)` }} />
                <div className="flex items-center gap-2">
                  <Monitor size={14} style={{ color: project.color }} />
                  <span style={{ color: project.color, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.2em' }}>XEM DEMO DỰ ÁN</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {showDemo && project.hasDemo ? (
                  <motion.div key="demo" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <DemoViewer
                      demoUrl={project.demoUrl}
                      maskedUrl={project.maskedUrl}
                      previewImg={project.img}
                      title={project.demoTitle}
                      accentColor={project.color}
                      height={420}
                    />
                    <div className="mt-3 p-3 rounded-xl flex items-start gap-3"
                      style={{ background: `${project.color}08`, border: `1px solid ${project.color}20` }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={project.color} strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.7 }}>
                        Demo này được hiển thị trực tiếp trên hệ thống LOOP để bảo vệ đường dẫn gốc của dự án. 
                        URL thực được mã hóa và không thể sao chép từ trình duyệt. 
                        <span style={{ color: project.color }}> Chỉ xem được tại đây.</span>
                      </p>
                    </div>
                  </motion.div>
                ) : !project.hasDemo ? (
                  <NdaNotice color={project.color} />
                ) : (
                  <motion.div key="launch" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group"
                    style={{ border: `1px solid ${project.color}30`, height: 280 }}
                    onClick={() => setShowDemo(true)}>
                    <img src={project.img} alt={project.title} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                      style={{ background: 'rgba(2,6,23,0.55)' }}>
                      <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${project.color}90, ${project.color}50)`, boxShadow: `0 0 40px ${project.color}50`, border: `1px solid ${project.color}60`, backdropFilter: 'blur(8px)' }}>
                          <Monitor size={32} style={{ color: '#fff' }} />
                        </div>
                        <div className="px-6 py-2.5 rounded-xl"
                          style={{ background: 'rgba(2,6,23,0.8)', border: `1px solid ${project.color}40`, backdropFilter: 'blur(12px)' }}>
                          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Xem Demo Trực Tiếp</span>
                        </div>
                      </motion.div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(8px)' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DS.green} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono }}>URL được bảo vệ</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(8px)' }}>
                          <Monitor size={10} style={{ color: DS.text4 }} />
                          <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>Preview only</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Testimonial */}
            {project.testimonial && (
              <div className="p-6 rounded-2xl" style={{ background: `${project.color}08`, border: `1px solid ${project.color}25` }}>
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} style={{ color: DS.amber, fill: DS.amber }} />)}
                </div>
                <p style={{ color: DS.text2, fontSize: 14, lineHeight: 1.8, fontStyle: 'italic', marginBottom: 16 }}>
                  "{project.testimonial.quote}"
                </p>
                <div>
                  <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{project.testimonial.name}</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>{project.testimonial.role}</div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Project info */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>THÔNG TIN DỰ ÁN</div>
              <div className="space-y-3.5">
                {infoItems.map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ color: DS.text4, fontSize: 12 }}>
                      <span style={{ color: project.color }}>{item.icon}</span>
                      {item.label}
                    </div>
                    <span style={{ color: DS.text, fontSize: 12, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>TECH STACK</div>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((t: any) => (
                  <span key={t} style={{ color: project.color, fontSize: 10, fontFamily: DS.mono, padding: '3px 8px', borderRadius: 4, background: `${project.color}10`, border: `1px solid ${project.color}25` }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Demo quick access */}
            {project.hasDemo && (
              <div className="p-5 rounded-2xl" style={{ background: `${project.color}08`, border: `1px solid ${project.color}25` }}>
                <div style={{ color: project.color, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>
                  <Monitor size={12} style={{ display: 'inline', marginRight: 6 }} />
                  DEMO TRỰC TIẾP
                </div>
                <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                  Xem demo giao diện thực tế ngay trên nền tảng LOOP. URL gốc được bảo vệ hoàn toàn.
                </p>
                <button onClick={() => { setShowDemo(true); window.scrollTo({ top: 600, behavior: 'smooth' }); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
                  style={{ background: `${project.color}15`, border: `1px solid ${project.color}30`, color: project.color, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <Monitor size={14} /> Mở Demo
                </button>
              </div>
            )}

            {/* LP earned */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)' }}>
              <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 8 }}>◈ LP ĐIỂM THƯỞNG</div>
              <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, marginBottom: 4 }}>+{project.lp.toLocaleString()} LP</div>
              <div style={{ color: DS.text5, fontSize: 11 }}>Đã được thêm vào tài khoản khách hàng sau khi hoàn thành.</div>
            </div>

            {/* CTA */}
            <Link to="/dat-lich"
              style={{ display: 'block', background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 700, padding: '13px 20px', borderRadius: 12, textDecoration: 'none', textAlign: 'center', boxShadow: '0 0 24px rgba(129,140,248,0.3)' }}>
              Bắt đầu dự án tương tự
            </Link>
            <Link to="/du-an"
              style={{ display: 'block', color: DS.text3, fontSize: 13, padding: '11px 20px', borderRadius: 12, textDecoration: 'none', textAlign: 'center', border: `1px solid ${DS.border}` }}>
              Xem thêm dự án
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
