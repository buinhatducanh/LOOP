import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, Globe, Code2, BarChart3, Target, Monitor, ArrowLeft } from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useParams, Link } from 'react-router';
import { DemoViewer } from '../components/ui/DemoViewer';
import { servicesService } from '../../api/services.service';
import type { Service } from '../../store/loopStore';
import { useLocaleStore } from '../store/localeStore';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const USE_MOCK_FALLBACK = (import.meta.env.VITE_USE_MOCK_FALLBACK as string) !== 'false';

const FALLBACK_SERVICES: Record<string, {
  id: string; icon: ReactNode; color: string;
  title: string; subtitle: string; desc: string;
  startPrice: number; endPrice: number; perMonth?: boolean;
  features: string[]; process: { title: string; desc: string }[];
  tech: string[]; lp: number; img: string;
  cases: { name: string; metric: string; img: string }[];
  faqs: { q: string; a: string }[];
  demoUrl: string; maskedUrl: string; demoTitle: string;
}> = {
  'thiet-ke-web': {
    id: 'thiet-ke-web', icon: <Globe size={32} />, color: DS.blue,
    title: 'Thiết kế & Phát triển Website',
    subtitle: 'Từ landing page đến e-commerce platform cao cấp',
    desc: 'Chúng tôi xây dựng website cao cấp, tốc độ cao và tối ưu chuyển đổi. Mỗi dự án được thiết kế riêng theo thương hiệu, đảm bảo performance và UX tốt nhất. Tất cả sản phẩm đều đạt chuẩn Core Web Vitals và sẵn sàng để scale.',
    startPrice: 15_000_000, endPrice: 200_000_000,
    features: ['Thiết kế UI/UX độc đáo theo brand', 'Responsive 100% thiết bị', 'Core Web Vitals ≥ 90', 'SEO on-page tích hợp', 'CMS tùy chọn (Sanity, Contentful)', 'E-commerce & Payment gateway', 'Multi-language (i18n)', 'Analytics & Heatmap', 'Bàn giao full source code', 'Bảo hành 6 tháng'],
    process: [
      { title: 'Discovery & Wireframe', desc: 'Phân tích brand, UX research và tạo wireframe chi tiết.' },
      { title: 'UI Design & Prototype', desc: 'Thiết kế Figma hoàn chỉnh, interactive prototype để review.' },
      { title: 'Development Sprint', desc: 'Code React/Next.js với CI/CD, code review từng PR.' },
      { title: 'QA & Performance', desc: 'Test đa thiết bị, lighthouse audit và tối ưu tốc độ.' },
      { title: 'Launch & Handover', desc: 'Deploy, training, bàn giao source và nhận LP điểm thưởng.' },
    ],
    tech: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Sanity CMS', 'Vercel/AWS'],
    lp: 50,
    img: 'https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=800&q=80',
    cases: [
      { name: 'StartupHub Landing', metric: '+45% Conversion Rate', img: 'https://images.unsplash.com/photo-1588336443962-49d88df004a1?auto=format&fit=crop&w=400&q=80' },
      { name: 'EduViet Portal', metric: '98 PageSpeed Score', img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=400&q=80' },
    ],
    faqs: [
      { q: 'Thời gian hoàn thành thường là bao lâu?', a: 'Tùy dự án: Landing page 2-3 tuần, website đầy đủ 4-8 tuần, platform phức tạp 3-6 tháng.' },
      { q: 'Tôi có nhận được source code không?', a: 'Có, bạn nhận full source code, tài liệu kỹ thuật và quyền sở hữu hoàn toàn sau khi thanh toán.' },
      { q: 'LP điểm thưởng được tính như thế nào?', a: 'Mỗi 1,000,000 VNĐ giao dịch bạn nhận 50 LP. LP là điểm thưởng nội bộ, có thể dùng để giảm giá dịch vụ tiếp theo.' },
    ],
    demoUrl: 'https://demo.vercel.store',
    maskedUrl: 'demo.loop-solutions.vn/web-demo',
    demoTitle: 'Website Demo — LOOP Solutions',
  },
  'phat-trien-app': {
    id: 'phat-trien-app', icon: <Code2 size={32} />, color: DS.purple,
    title: 'Phát triển App & SaaS Platform',
    subtitle: 'Mobile app, web app và nền tảng SaaS enterprise',
    desc: 'Từ MVP đến sản phẩm enterprise với hàng triệu người dùng. Chúng tôi xây dựng ứng dụng mobile (React Native), web app và nền tảng SaaS với kiến trúc microservices, đảm bảo scalability và performance cao.',
    startPrice: 80_000_000, endPrice: 1_000_000_000,
    features: ['Phân tích & thiết kế kiến trúc system', 'React Native / Flutter Mobile', 'Backend Node.js / Rust', 'Database design & optimization', 'API RESTful & GraphQL', 'Microservices & Docker', 'CI/CD pipeline tự động', 'Monitor & Alerting system', 'SLA 99.9% Uptime', 'Dedicated tech support'],
    process: [
      { title: 'Architecture Design', desc: 'System design, ERD, API contract và tech stack planning.' },
      { title: 'Sprint Planning', desc: 'Chia nhỏ feature theo user story, estimate và sprint planning.' },
      { title: 'Agile Development', desc: 'Sprint 2 tuần, daily standup, demo cuối sprint.' },
      { title: 'Staging & Testing', desc: 'UAT, performance testing và security audit.' },
      { title: 'Production Launch', desc: 'Blue-green deployment, monitoring setup và go-live support.' },
    ],
    tech: ['React Native', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'AWS/GCP', 'Docker', 'K8s', 'Rust'],
    lp: 50,
    img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=800&q=80',
    cases: [
      { name: 'MedApp Vietnam', metric: '200K Downloads', img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=400&q=80' },
      { name: 'VNRetail Platform', metric: '+320% Revenue', img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=400&q=80' },
    ],
    faqs: [
      { q: 'MVP mất bao lâu để hoàn thành?', a: 'MVP cơ bản thường mất 6-10 tuần. Chúng tôi ưu tiên core features để ra thị trường nhanh nhất.' },
      { q: 'Bạn có hỗ trợ sau khi launch không?', a: 'Có, chúng tôi cung cấp gói maintenance hàng tháng, hotfix khẩn cấp và scale-up support.' },
      { q: 'LP điểm thưởng được tính như thế nào?', a: 'Mỗi 1,000,000 VNĐ giao dịch bạn nhận 50 LP điểm thưởng để dùng cho dự án tiếp theo.' },
    ],
    demoUrl: 'https://example.com',
    maskedUrl: 'demo.loop-solutions.vn/saas-platform',
    demoTitle: 'SaaS Platform Demo — LOOP Solutions',
  },
  'dashboard-analytics': {
    id: 'dashboard-analytics', icon: <BarChart3 size={32} />, color: DS.cyan,
    title: 'Dashboard & Data Analytics',
    subtitle: 'Biến dữ liệu thành insight hành động được',
    desc: 'Thiết kế và xây dựng hệ thống dashboard real-time, báo cáo tự động và data visualization. Chúng tôi tích hợp dữ liệu từ nhiều nguồn, xây dựng pipeline và tạo insight giúp bạn ra quyết định chính xác hơn.',
    startPrice: 25_000_000, endPrice: 300_000_000,
    features: ['Dashboard real-time multi-source', 'Data visualization D3.js/Recharts', 'Báo cáo tự động PDF/Excel', 'Data pipeline ETL', 'Alert & notification system', 'BigQuery/Snowflake integration', 'API & Webhook integration', 'User permission & roles', 'Mobile-responsive dashboard', 'ML predictions (tùy chọn)'],
    process: [
      { title: 'Data Audit', desc: 'Khảo sát nguồn dữ liệu, quality và business requirements.' },
      { title: 'Schema Design', desc: 'Thiết kế data model, KPI definition và metric mapping.' },
      { title: 'Pipeline Build', desc: 'Xây dựng ETL pipeline và data warehouse.' },
      { title: 'Dashboard Dev', desc: 'Phát triển UI charts, filters và drill-down views.' },
      { title: 'Training & Handover', desc: 'Training sử dụng, documentation và LP điểm thưởng.' },
    ],
    tech: ['React', 'D3.js', 'Recharts', 'Python', 'BigQuery', 'dbt', 'Airbyte', 'PostgreSQL'],
    lp: 50,
    img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=800&q=80',
    cases: [
      { name: 'AnalyticsPro Dashboard', metric: '#1 Market Share', img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=400&q=80' },
      { name: 'FinDash Enterprise', metric: '500+ transactions/day', img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=400&q=80' },
    ],
    faqs: [
      { q: 'Dashboard có thể xử lý bao nhiêu data?', a: 'Chúng tôi thiết kế để scale theo nhu cầu. Đã xử lý trên 100M rows với latency dưới 2 giây.' },
      { q: 'Tôi có thể tự thêm chart mới không?', a: 'Có, chúng tôi xây dựng no-code builder để team non-tech có thể tự tạo report.' },
    ],
    demoUrl: 'https://example.com',
    maskedUrl: 'demo.loop-solutions.vn/analytics-dashboard',
    demoTitle: 'Analytics Dashboard Demo — LOOP Solutions',
  },
  'seo-marketing': {
    id: 'seo-marketing', icon: <Target size={32} />, color: DS.green,
    title: 'SEO & Digital Marketing',
    subtitle: 'Tăng trưởng organic bền vững, data-driven',
    desc: 'Chiến lược SEO kỹ thuật + content marketing toàn diện. Chúng tôi audit website, xây dựng content plan và triển khai link building để đưa bạn lên top Google trong 3-6 tháng. Báo cáo minh bạch hàng tháng.',
    startPrice: 8_000_000, endPrice: 50_000_000, perMonth: true,
    features: ['Technical SEO audit & fix', 'Keyword research & strategy', 'On-page optimization', 'Content strategy & production', 'Link building (white hat)', 'Google Ads management', 'Analytics & tag setup', 'Monthly performance report', 'Competitor analysis', 'CRO recommendations'],
    process: [
      { title: 'Site Audit', desc: 'Technical audit: crawl errors, speed, schema, Core Web Vitals.' },
      { title: 'Strategy Planning', desc: 'Keyword research, content gap analysis và link plan.' },
      { title: 'Implementation', desc: 'Fix technical issues, tối ưu on-page và publish content.' },
      { title: 'Link Building', desc: 'Outreach, guest post và digital PR.' },
      { title: 'Monthly Review', desc: 'Báo cáo ranking, traffic và LP điểm thưởng tích lũy.' },
    ],
    tech: ['SEMrush', 'Ahrefs', 'Google Analytics 4', 'Search Console', 'Screaming Frog', 'Data Studio'],
    lp: 50,
    img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=800&q=80',
    cases: [
      { name: 'EduViet Portal', metric: '+350% Organic Traffic', img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=400&q=80' },
      { name: 'VNRetail Platform', metric: '#1 Google keyword', img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=400&q=80' },
    ],
    faqs: [
      { q: 'Bao lâu thì thấy kết quả SEO?', a: 'Thường 3-6 tháng cho kết quả đáng kể. Tháng đầu tập trung fix technical, tháng 2-3 content, tháng 4+ thấy ranking cải thiện.' },
      { q: 'Báo cáo được gửi khi nào?', a: 'Mỗi tháng 1 báo cáo chi tiết về ranking, traffic, conversions và LP tích lũy.' },
    ],
    demoUrl: 'https://example.com',
    maskedUrl: 'demo.loop-solutions.vn/seo-report',
    demoTitle: 'SEO Report Dashboard Demo — LOOP Solutions',
  },
};

const SLUG_MAP: Record<string, string> = {
  '1': 'thiet-ke-web',
  '2': 'phat-trien-app',
  '3': 'dashboard-analytics',
  '4': 'seo-marketing',
  'thiet-ke-web': 'thiet-ke-web',
  'phat-trien-app': 'phat-trien-app',
  'dashboard-analytics': 'dashboard-analytics',
  'seo-marketing': 'seo-marketing',
};

export default function ServiceDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const slug = SLUG_MAP[id] ?? Object.keys(FALLBACK_SERVICES)[0];

  // API state
  const [apiSvc, setApiSvc] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const { locale } = useLocaleStore();

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    servicesService.getServiceBySlug(slug, locale)
      .then(s => { if (!cancelled) setApiSvc(s); })
      .catch(() => { if (!cancelled) setApiSvc(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug, locale]);

  const fallbackSvc = FALLBACK_SERVICES[slug] ?? Object.values(FALLBACK_SERVICES)[0];
  const svc = apiSvc ?? (USE_MOCK_FALLBACK ? fallbackSvc : null);
  const [showDemo, setShowDemo] = useState(false);

  if (!loading && !svc) {
    return (
      <div style={{ background: DS.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 64 }}>
        <div style={{ color: DS.text5, fontSize: 64, fontFamily: DS.mono }}>503</div>
        <div style={{ color: DS.text3, fontSize: 18 }}>Không tải được dữ liệu dịch vụ</div>
        <div style={{ color: DS.text4, fontSize: 13, textAlign: 'center', maxWidth: 420 }}>
          API hiện không khả dụng và chế độ fallback đã tắt.
          Vui lòng thử lại sau hoặc bật VITE_USE_MOCK_FALLBACK=true trong môi trường dev.
        </div>
        <Link to="/dich-vu" style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13, textDecoration: 'none' }}>
          ← Quay lại danh sách dịch vụ
        </Link>
      </div>
    );
  }

  if (!svc) return null;

  if (loading) {
    return (
      <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div style={{ height: 80, width: '60%', background: DS.bgCard, borderRadius: 8, marginBottom: 24 }} />
          <div style={{ height: 16, width: '100%', background: DS.bgCard, borderRadius: 4, marginBottom: 12 }} />
          <div style={{ height: 16, width: '70%', background: DS.bgCard, borderRadius: 4 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>
      {/* Hero */}
      <section className="py-20 px-6 relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.6) 0%, transparent 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <Link to="/dich-vu" className="inline-flex items-center gap-2 mb-6" style={{ color: DS.text4, fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={14} />
            Tất cả dịch vụ
          </Link>
          <div className="flex items-start gap-6 flex-wrap">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}30` }}>
              <span style={{ color: svc.color }}>{svc.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full" style={{ background: `${svc.color}10`, border: `1px solid ${svc.color}25` }}>
                <span style={{ color: svc.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>DỊCH VỤ CHUYÊN NGHIỆP</span>
              </div>
              <h1 style={{ fontFamily: DS.heading, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, letterSpacing: '0.04em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 10 }}>
                {svc.title}
              </h1>
              <p style={{ color: DS.text3, fontSize: 16, marginBottom: 6 }}>{svc.subtitle}</p>
              <div className="flex items-center gap-6 flex-wrap mt-4">
                <div>
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>GIÁ TỪ (VNĐ)</div>
                  <div style={{ color: svc.color, fontSize: 20, fontFamily: DS.heading, fontWeight: 900 }}>
                    {fmtVND(svc.startPrice)}{svc.perMonth ? '/tháng' : ''}
                  </div>
                </div>
                <div style={{ width: 1, height: 40, background: DS.border }} />
                <div>
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 2 }}>LP ĐIỂM THƯỞNG</div>
                  <div style={{ color: DS.purple, fontSize: 14, fontFamily: DS.mono }}>◈ {svc.lp} LP / 1M VNĐ</div>
                </div>
                <div style={{ width: 1, height: 40, background: DS.border }} />
                <button onClick={() => setShowDemo(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
                  style={{ background: `${svc.color}12`, border: `1px solid ${svc.color}30`, color: svc.color, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <Monitor size={14} /> Xem Demo
                </button>
                <Link to="/dat-lich" style={{ background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 700, padding: '11px 24px', borderRadius: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 24px rgba(129,140,248,0.3)' }}>
                  Đặt lịch tư vấn <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo Section ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 mb-12">
        <AnimatePresence mode="wait">
          {showDemo ? (
            <motion.div key="demo" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Monitor size={15} style={{ color: svc.color }} />
                  <span style={{ color: svc.color, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.15em' }}>DEMO GIAO DIỆN THỰC TẾ</span>
                </div>
                <button onClick={() => setShowDemo(false)}
                  style={{ color: DS.text4, background: 'rgba(255,255,255,0.05)', border: `1px solid ${DS.border}`, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Đóng</span>
                </button>
              </div>
              <DemoViewer
                demoUrl={svc.demoUrl}
                maskedUrl={svc.maskedUrl}
                previewImg={svc.img}
                title={svc.demoTitle}
                accentColor={svc.color}
                height={400}
              />
              <div className="mt-3 p-3 rounded-xl flex items-start gap-3"
                style={{ background: `${svc.color}06`, border: `1px solid ${svc.color}15` }}>
                <Monitor size={13} style={{ color: svc.color, flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.7 }}>
                  Đây là bản demo giao diện từ dự án thực tế của LOOP Solutions. URL gốc được mã hóa và bảo vệ — chỉ có thể xem trực tiếp trên nền tảng này.
                  Để xem chi tiết hoặc request demo riêng, <Link to="/dat-lich" style={{ color: svc.color }}>đặt lịch tư vấn</Link>.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-2xl overflow-hidden relative cursor-pointer group"
              style={{ border: `1px solid ${DS.border}`, height: 300 }}
              onClick={() => setShowDemo(true)}>
              <img src={svc.img} alt={svc.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: 'rgba(2,6,23,0.5)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `${svc.color}80`, boxShadow: `0 0 30px ${svc.color}40`, border: `1px solid ${svc.color}60` }}>
                  <Monitor size={26} style={{ color: '#fff' }} />
                </div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>Xem Demo Giao Diện</div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(2,6,23,0.8)', border: `1px solid ${svc.color}30`, backdropFilter: 'blur(8px)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DS.green} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono }}>URL được bảo vệ · Chỉ xem tại LOOP</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content grid */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 12 }}>TỔNG QUAN DỊCH VỤ</h2>
              <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.9 }}>{svc.desc}</p>
            </div>

            {/* Process */}
            <div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 16 }}>QUY TRÌNH THỰC HIỆN</h2>
              <div className="space-y-4">
                {svc.process.map((p, i) => (
                  <motion.div key={p.title} className="flex gap-5 p-4 rounded-xl"
                    style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${DS.border}` }}
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GRD.primary }}>
                      <span style={{ color: '#fff', fontFamily: DS.mono, fontSize: 12, fontWeight: 700 }}>0{i + 1}</span>
                    </div>
                    <div>
                      <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
                      <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>{p.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Case studies */}
            <div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 16 }}>DỰ ÁN LIÊN QUAN</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {svc.cases.map(c => (
                  <div key={c.name} className="rounded-xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
                    <img src={c.img} alt={c.name} className="w-full object-cover" style={{ height: 140 }} />
                    <div className="p-4">
                      <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
                      <div style={{ color: DS.green, fontSize: 12, fontFamily: DS.mono }}>↑ {c.metric}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 16 }}>CÂU HỎI THƯỜNG GẶP</h2>
              <div className="space-y-4">
                {svc.faqs.map(faq => (
                  <div key={faq.q} className="p-5 rounded-xl" style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${DS.border}` }}>
                    <div style={{ color: svc.color, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Q: {faq.q}</div>
                    <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>{faq.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Features */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>TÍNH NĂNG BAO GỒM</div>
              <div className="space-y-2.5">
                {svc.features.map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check size={13} style={{ color: svc.color, flexShrink: 0, marginTop: 1.5 }} />
                    <span style={{ color: DS.text3, fontSize: 12, lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech stack */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>TECH STACK</div>
              <div className="flex flex-wrap gap-2">
                {svc.tech.map(t => (
                  <span key={t} style={{ color: svc.color, fontSize: 10, fontFamily: DS.mono, padding: '3px 8px', borderRadius: 4, background: `${svc.color}10`, border: `1px solid ${svc.color}25` }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Demo access */}
            <div className="p-5 rounded-2xl" style={{ background: `${svc.color}08`, border: `1px solid ${svc.color}25` }}>
              <div style={{ color: svc.color, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>
                <Monitor size={12} style={{ display: 'inline', marginRight: 6 }} />
                XEM DEMO GIAO DIỆN
              </div>
              <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
                Demo thực tế từ dự án đã triển khai. URL gốc được bảo vệ, chỉ xem được trực tiếp trên LOOP.
              </p>
              <button onClick={() => { setShowDemo(true); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl"
                style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}30`, color: svc.color, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Monitor size={14} /> Mở Demo
              </button>
            </div>

            {/* LP Info */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)' }}>
              <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 10 }}>◈ LP ĐIỂM THƯỞNG</div>
              <p style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7 }}>
                Tích lũy <strong style={{ color: DS.purple }}>{svc.lp} LP</strong> cho mỗi 1,000,000 VNĐ giao dịch. LP là điểm thưởng nội bộ — dùng để giảm giá dịch vụ hoặc đổi quyền lợi cao cấp.
              </p>
            </div>

            {/* CTA */}
            <Link to="/dat-lich" style={{ display: 'block', background: GRD.primary, color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 20px', borderRadius: 14, textDecoration: 'none', textAlign: 'center', boxShadow: '0 0 30px rgba(129,140,248,0.35)' }}>
              Đặt lịch tư vấn miễn phí
              <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, opacity: 0.8 }}>Nhận 500 LP điểm thưởng ngay hôm nay</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}