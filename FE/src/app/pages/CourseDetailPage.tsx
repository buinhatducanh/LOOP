import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Play, Clock, Users, Star, Check, ChevronDown, ChevronUp,
  BookOpen, Award, Zap, X, Lock, Unlock, ChevronRight, ChevronLeft,
  SkipForward, SkipBack, Volume2, Maximize2, Pause, Download,
  MessageCircle, ThumbsUp, FileText, Shield,
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useIsMobile } from '../components/ui/use-mobile';
import { useI18n } from '../hooks/useI18n';

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// ── Course data ───────────────────────────────────────────────────────────────
const COURSES: Record<string, {
  id: number; title: string; instructor: string; instructorRole: string;
  instructorBio: string; instructorImg: string;
  duration: string; students: string; rating: number;
  reviews: number; price: number; lpPrice: number; lpReward: number;
  color: string; level: string; cat: string;
  img: string; updatedAt: string; lectures: number; certificate: boolean;
  desc: string;
  highlights: string[];
  objectives: string[];
  curriculum: { chapter: string; duration: string; lessons: { title: string; duration: string; free?: boolean; type?: 'video' | 'quiz' | 'project' }[] }[];
  requirements: string[];
  targetAudience: string[];
  testimonials: { name: string; avatar: string; rating: number; date: string; comment: string }[];
  included: string[];
}> = {
  '1': {
    id: 1, title: 'React & Next.js 14 Từ Zero Đến Hero', instructor: 'Akira Sato',
    instructorRole: 'Lead Full-stack · Diamond Rank',
    instructorBio: '10+ năm kinh nghiệm xây dựng sản phẩm SaaS. Từng là Senior Engineer tại các công ty công nghệ Nhật Bản và Việt Nam. Mentor cho 4,100+ học viên. Chuyên gia về React ecosystem và system design.',
    instructorImg: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=100&h=100&crop=faces',
    duration: '32h', students: '2.4K', rating: 4.9, reviews: 312,
    price: 2_000_000, lpPrice: 4000, lpReward: 200,
    color: DS.blue, level: 'Intermediate', cat: 'Frontend',
    img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=900&q=80',
    updatedAt: '15/03/2026', lectures: 48, certificate: true,
    desc: 'Khóa học toàn diện nhất về React 18 và Next.js 14 tại Việt Nam. Từ nền tảng đến production-ready app. Bao gồm Server Components, Streaming, Caching, TypeScript, Tailwind và deployment trên Vercel.',
    highlights: ['48 bài giảng · 32 giờ nội dung', 'Project thực tế cuối khóa', 'Discord community support', 'Cập nhật lifetime miễn phí'],
    objectives: [
      'Hiểu sâu React 18 concurrent features và hooks',
      'Xây dựng Next.js 14 app với App Router và Server Components',
      'TypeScript nâng cao trong React ecosystem',
      'Tích hợp Tailwind CSS và design systems',
      'State management với Zustand và React Query',
      'Deploy production-grade app lên Vercel/AWS',
      'Performance optimization và Core Web Vitals',
      'Authentication, authorization và security best practices',
    ],
    curriculum: [
      { chapter: 'Nền tảng React 18', duration: '3h 45p', lessons: [
        { title: 'Giới thiệu React 18 và Concurrent Mode', duration: '45p', free: true, type: 'video' },
        { title: 'JSX, Components và Props', duration: '38p', free: true, type: 'video' },
        { title: 'State, Events và Lifecycle', duration: '52p', type: 'video' },
        { title: 'Hooks nâng cao: useCallback, useMemo, useRef', duration: '60p', type: 'video' },
        { title: 'Custom hooks và patterns', duration: '48p', type: 'video' },
        { title: 'Quiz: React Fundamentals', duration: '15p', type: 'quiz' },
      ]},
      { chapter: 'Next.js 14 App Router', duration: '4h 10p', lessons: [
        { title: 'Giới thiệu Next.js 14 và App Router', duration: '40p', type: 'video' },
        { title: 'Server Components vs Client Components', duration: '55p', type: 'video' },
        { title: 'Data fetching và caching strategies', duration: '65p', type: 'video' },
        { title: 'Route Groups, Layouts và Loading UI', duration: '50p', type: 'video' },
        { title: 'Error handling và Suspense', duration: '40p', type: 'video' },
      ]},
      { chapter: 'TypeScript & State Management', duration: '3h 20p', lessons: [
        { title: 'TypeScript với React — Từ Basics đến Generics', duration: '72p', type: 'video' },
        { title: 'Zustand — Global state đơn giản nhưng mạnh', duration: '45p', type: 'video' },
        { title: 'React Query & SWR cho data fetching', duration: '58p', type: 'video' },
        { title: 'Quiz: State Management Patterns', duration: '15p', type: 'quiz' },
      ]},
      { chapter: 'Production & Deployment', duration: '3h 25p', lessons: [
        { title: 'Performance optimization và Lighthouse', duration: '62p', type: 'video' },
        { title: 'Testing với Vitest và React Testing Library', duration: '55p', type: 'video' },
        { title: 'CI/CD với GitHub Actions và Vercel', duration: '40p', type: 'video' },
        { title: 'Final Project: SaaS Landing Page', duration: '90p', type: 'project' },
      ]},
    ],
    requirements: ['JavaScript ES6+ cơ bản', 'HTML/CSS cơ bản', 'Hiểu khái niệm lập trình cơ bản'],
    targetAudience: ['Frontend developer muốn nâng cao', 'Backend developer chuyển sang fullstack', 'Designer muốn code', 'Sinh viên CNTT muốn tìm việc nhanh'],
    testimonials: [
      { name: 'Trần Minh Khoa', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&h=50&crop=faces', rating: 5, date: '12/03/2026', comment: 'Khóa học tốt nhất tôi từng học. Giảng viên giải thích rất rõ ràng, có project thực tế. Sau khóa này tôi đã tự xây được một SaaS hoàn chỉnh.' },
      { name: 'Lê Thu Hằng', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=50&h=50&crop=faces', rating: 5, date: '08/03/2026', comment: 'Sau khóa này tôi đã xây được portfolio và kiếm được job senior Frontend. Xứng đáng từng đồng bỏ ra.' },
      { name: 'Phạm Văn Đức', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=50&h=50&crop=faces', rating: 4, date: '01/03/2026', comment: 'Nội dung đầy đủ, cập nhật liên tục. Xứng đáng với giá tiền. Mong có thêm bài về micro-frontend.' },
    ],
    included: ['48 bài học video HD', 'File source code mỗi chương', 'Certificate PDF có QR xác thực', 'Discord community riêng', 'Cập nhật content lifetime', 'Hỗ trợ Q&A 24h'],
  },
  '2': {
    id: 2, title: 'UI/UX Design System với Figma & Tailwind', instructor: 'Mei Lin',
    instructorRole: 'Design Lead · Ruby Rank',
    instructorBio: '8 năm thiết kế UI/UX cho startup và enterprise. Từng làm việc tại Singapore và HCM. Mentor cho 1,800+ học viên về Design Systems.',
    instructorImg: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&crop=faces',
    duration: '18h', students: '1.8K', rating: 4.8, reviews: 245,
    price: 1_500_000, lpPrice: 3000, lpReward: 150,
    color: DS.purple, level: 'Beginner', cat: 'Design',
    img: 'https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=900&q=80',
    updatedAt: '10/03/2026', lectures: 32, certificate: true,
    desc: 'Học thiết kế UI/UX chuyên nghiệp với Figma và triển khai design system bằng Tailwind CSS. Phù hợp cả designer lẫn developer muốn làm đẹp UI.',
    highlights: ['32 bài giảng · 18 giờ nội dung', 'Design System hoàn chỉnh', 'File Figma mẫu included', 'Cập nhật lifetime miễn phí'],
    objectives: [
      'Thành thạo Figma từ cơ bản đến nâng cao',
      'Xây dựng design system hoàn chỉnh với components',
      'Auto-layout và responsive design trong Figma',
      'Triển khai design thành code với Tailwind CSS',
      'Figma to Code workflow hiệu quả',
      'User research và UX writing cơ bản',
    ],
    curriculum: [
      { chapter: 'Figma Fundamentals', duration: '2h 30p', lessons: [
        { title: 'Figma interface và workflow cơ bản', duration: '30p', free: true, type: 'video' },
        { title: 'Components, Variants và Slots', duration: '45p', free: true, type: 'video' },
        { title: 'Auto Layout nâng cao', duration: '40p', type: 'video' },
        { title: 'Quiz: Figma Basics', duration: '15p', type: 'quiz' },
      ]},
      { chapter: 'Design System', duration: '3h 20p', lessons: [
        { title: 'Color system và typography scale', duration: '38p', type: 'video' },
        { title: 'Component library từ A đến Z', duration: '60p', type: 'video' },
        { title: 'Design tokens và variables', duration: '42p', type: 'video' },
        { title: 'Responsive & mobile-first design', duration: '40p', type: 'video' },
      ]},
      { chapter: 'Tailwind Implementation', duration: '2h 13p', lessons: [
        { title: 'Tailwind CSS cơ bản và config', duration: '35p', type: 'video' },
        { title: 'Translate Figma to Tailwind', duration: '50p', type: 'video' },
        { title: 'Custom design system với Tailwind', duration: '48p', type: 'video' },
        { title: 'Final Project: Landing Page Design', duration: '60p', type: 'project' },
      ]},
    ],
    requirements: ['Không cần kinh nghiệm thiết kế', 'Máy tính và account Figma miễn phí'],
    targetAudience: ['Designer mới bắt đầu', 'Frontend dev muốn làm UI tốt hơn', 'Product manager muốn prototype'],
    testimonials: [
      { name: 'Nguyễn Thị Lan', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=50&h=50&crop=faces', rating: 5, date: '05/03/2026', comment: 'Bắt đầu từ số 0, sau 18 giờ tôi đã có thể thiết kế UI chuyên nghiệp. Course rất có cấu trúc.' },
      { name: 'Hoàng Văn Nam', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&h=50&crop=faces', rating: 5, date: '28/02/2026', comment: 'Giảng viên rất kiên nhẫn và chi tiết. Cực kỳ recommend cho ai mới vào nghề design.' },
    ],
    included: ['32 bài học video HD', 'File Figma template', 'Certificate PDF có QR xác thực', 'Discord community', 'Cập nhật content lifetime'],
  },
  '3': {
    id: 3, title: 'Node.js API & PostgreSQL: Production-Ready', instructor: 'Ryo Hashimoto',
    instructorRole: 'Backend Architect · Diamond Rank',
    instructorBio: '12 năm backend engineering. Architect cho các hệ thống xử lý hàng triệu request/ngày. Chuyên gia PostgreSQL và microservices.',
    instructorImg: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=100&h=100&crop=faces',
    duration: '26h', students: '1.2K', rating: 4.9, reviews: 189,
    price: 2_500_000, lpPrice: 5000, lpReward: 250,
    color: DS.cyan, level: 'Advanced', cat: 'Backend',
    img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=900&q=80',
    updatedAt: '08/03/2026', lectures: 56, certificate: true,
    desc: 'Xây dựng REST API production-ready với Node.js, TypeScript và PostgreSQL. Bao gồm authentication, caching, testing và deployment với Docker trên AWS.',
    highlights: ['56 bài giảng · 26 giờ nội dung', 'API production-ready', 'Docker + AWS deployment', 'Cập nhật lifetime'],
    objectives: [
      'Node.js và Express.js architecture patterns',
      'PostgreSQL advanced: indexing, query optimization',
      'Authentication JWT và OAuth2',
      'Redis caching và session management',
      'API documentation với OpenAPI/Swagger',
      'Testing với Jest và Supertest',
      'Docker containerization và AWS deployment',
      'Security best practices và OWASP top 10',
    ],
    curriculum: [
      { chapter: 'Node.js Core', duration: '2h 43p', lessons: [
        { title: 'Node.js event loop và async programming', duration: '55p', free: true, type: 'video' },
        { title: 'Express.js architecture và middleware', duration: '48p', free: true, type: 'video' },
        { title: 'TypeScript cho Node.js', duration: '60p', type: 'video' },
      ]},
      { chapter: 'Database & ORM', duration: '2h 50p', lessons: [
        { title: 'PostgreSQL nâng cao: indexing và explain', duration: '70p', type: 'video' },
        { title: 'Prisma ORM và database migrations', duration: '55p', type: 'video' },
        { title: 'Redis caching patterns', duration: '45p', type: 'video' },
      ]},
      { chapter: 'Security & Testing', duration: '2h 55p', lessons: [
        { title: 'JWT, OAuth2 và refresh token strategy', duration: '65p', type: 'video' },
        { title: 'API testing với Jest và Supertest', duration: '58p', type: 'video' },
        { title: 'Docker và CI/CD pipeline', duration: '52p', type: 'video' },
        { title: 'Final Project: Production API', duration: '90p', type: 'project' },
      ]},
    ],
    requirements: ['JavaScript/Node.js cơ bản', 'SQL cơ bản', 'Biết sử dụng terminal'],
    targetAudience: ['Backend developer muốn production skills', 'Fullstack dev muốn strengthen backend', 'Fresher muốn đi sâu backend'],
    testimonials: [
      { name: 'Vũ Thanh Tùng', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=50&h=50&crop=faces', rating: 5, date: '10/03/2026', comment: 'Sau khóa này tôi tự build được API cho startup của mình. Rất thực chiến và đúng production mindset!' },
    ],
    included: ['56 bài học video HD', 'API starter template', 'Certificate PDF có QR xác thực', 'Discord community', 'Source code từng chương'],
  },
};

const DEFAULT_COURSE = COURSES['1'];
const USER_LP = 15_200;

const levelColor: Record<string, string> = {
  Beginner: DS.green, Intermediate: DS.blue, Advanced: DS.amber, Expert: DS.red,
};
const levelVN: Record<string, string> = {
  Beginner: 'Cơ bản', Intermediate: 'Trung cấp', Advanced: 'Nâng cao', Expert: 'Chuyên gia',
};
const levelI18nKey: Record<string, string> = {
  Beginner: 'academy.detail.levelBeginner',
  Intermediate: 'academy.detail.levelIntermediate',
  Advanced: 'academy.detail.levelAdvanced',
  Expert: 'academy.detail.levelExpert',
};

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ course, onClose, onSuccess, t }: {
  course: typeof DEFAULT_COURSE;
  onClose: () => void;
  onSuccess: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [payMode, setPayMode] = useState<'vnd' | 'lp-partial' | 'lp-full'>('vnd');
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [processing, setProcessing] = useState(false);

  const lpPartialMax = Math.min(Math.floor(course.price * 0.5 / 500) * 1000, USER_LP);
  const lpSaved = Math.round(lpPartialMax / 1000) * 500_000;
  const partialRemain = course.price - lpSaved;
  const canFullLP = USER_LP >= course.lpPrice;

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 1800);
  };

  const payModes = [
    {
      key: 'vnd', label: t('academy.payment.modeVndLabel'),
      sub: fmtVND(course.price),
      subColor: DS.blue,
      note: t('academy.payment.modeVndNote', { price: fmtVND(course.price * 1.3) }),
      noteColor: DS.green,
      enabled: true,
    },
    {
      key: 'lp-partial', label: t('academy.payment.modeLpPartialLabel'),
      sub: `${lpPartialMax.toLocaleString('vi-VN')} LP + ${fmtVND(partialRemain)}`,
      subColor: DS.purple,
      note: t('academy.payment.modeLpPartialNote', { saved: fmtVND(lpSaved) }),
      noteColor: DS.green,
      enabled: lpPartialMax >= 1000,
    },
    {
      key: 'lp-full', label: t('academy.payment.modeLpFullLabel'),
      sub: `${course.lpPrice.toLocaleString('vi-VN')} LP`,
      subColor: DS.amber,
      note: canFullLP ? t('academy.payment.modeLpFullNoteSaved') : t('academy.payment.modeLpFullNoteNeed', { needed: (course.lpPrice - USER_LP).toLocaleString() }),
      noteColor: canFullLP ? DS.green : DS.red,
      enabled: canFullLP,
    },
  ] as const;

  const payLabel = payMode === 'vnd' ? t('academy.payment.payVnd', { price: fmtVND(course.price) })
    : payMode === 'lp-partial' ? t('academy.payment.payLpPartial', { lp: lpPartialMax.toLocaleString(), price: fmtVND(partialRemain) })
    : t('academy.payment.payLpFull', { lp: course.lpPrice.toLocaleString() });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, boxShadow: '0 0 60px rgba(129,140,248,0.15)' }}>

        {step === 'success' ? (
          <div className="p-12 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <div className="text-7xl mb-6">🎉</div>
            </motion.div>
            <div style={{ color: DS.green, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 10 }}>
              {t('academy.payment.successTitle')}
            </div>
            <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
              {t('academy.payment.successWelcome')} <span style={{ color: DS.text }}>{course.title}</span>
            </p>
            <p style={{ color: DS.text4, fontSize: 13, marginBottom: 24 }}>
              {t('academy.payment.successReward', { lp: String(course.lpReward) })}
            </p>
            <div className="p-4 rounded-2xl mb-6" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div style={{ color: DS.green, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', marginBottom: 4 }}>{t('academy.payment.benefitsUnlocked')}</div>
              {course.included.map(f => (
                <div key={f} className="flex items-center gap-2 mt-2">
                  <Check size={11} style={{ color: DS.green }} />
                  <span style={{ color: DS.text3, fontSize: 12 }}>{f}</span>
                </div>
              ))}
            </div>
            <button onClick={onSuccess}
              style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 28px rgba(129,140,248,0.4)' }}>
              {t('academy.payment.startLearning')}
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-4" style={{ borderBottom: `1px solid ${DS.border}` }}>
              <div>
                <div style={{ color: DS.text, fontSize: 16, fontWeight: 700 }}>{t('academy.payment.title')}</div>
                <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{t('academy.payment.subtitle')}</div>
              </div>
              <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Course preview */}
              <div className="flex gap-3 p-3 rounded-2xl mb-5" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={course.img} alt={course.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ color: DS.text, fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginBottom: 4 }}>{course.title}</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>👤 {course.instructor} · {course.duration} · {course.lectures} bài</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} style={{ color: DS.amber, fill: DS.amber }} />)}
                    <span style={{ color: DS.amber, fontSize: 11, marginLeft: 3, fontWeight: 700 }}>{course.rating}</span>
                  </div>
                </div>
              </div>

              {/* LP Balance */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl mb-4" style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.15)' }}>
                <span style={{ color: DS.text4, fontSize: 12 }}>◈ {t('academy.payment.yourLpBalance')}</span>
                <span style={{ color: DS.purple, fontFamily: DS.mono, fontWeight: 700, fontSize: 14 }}>{USER_LP.toLocaleString('vi-VN')} LP</span>
              </div>

              {/* Payment modes */}
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 10 }}>{t('academy.payment.paymentModes')}</div>
              <div className="space-y-2.5 mb-5">
                {payModes.map(m => (
                  <label key={m.key}
                    className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: payMode === m.key ? `${m.key === 'vnd' ? DS.blue : m.key === 'lp-partial' ? DS.purple : DS.amber}08` : 'transparent',
                      border: `1px solid ${payMode === m.key ? (m.key === 'vnd' ? DS.blue : m.key === 'lp-partial' ? DS.purple : DS.amber) + '40' : DS.border}`,
                      opacity: m.enabled ? 1 : 0.45,
                    }}>
                    <input type="radio" name="pay" checked={payMode === m.key}
                      onChange={() => m.enabled && setPayMode(m.key as typeof payMode)}
                      disabled={!m.enabled}
                      style={{ accentColor: m.key === 'vnd' ? DS.blue : m.key === 'lp-partial' ? DS.purple : DS.amber }} />
                    <div className="flex-1">
                      <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{m.label}</div>
                      <div style={{ color: m.subColor, fontFamily: DS.mono, fontSize: 15, fontWeight: 700 }}>{m.sub}</div>
                      <div style={{ color: m.noteColor, fontSize: 11, marginTop: 2 }}>{m.note}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* LP reward */}
              <div className="flex items-center gap-2 p-3 rounded-xl mb-5" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <Zap size={12} style={{ color: DS.green }} />
                <span style={{ color: DS.text4, fontSize: 12 }}>
                  {t('academy.payment.lpRewardNote', { lp: String(course.lpReward) })}
                </span>
              </div>

              <button onClick={handlePay} disabled={processing}
                style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 28px rgba(129,140,248,0.35)', opacity: processing ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {processing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    {t('academy.payment.processing')}
                  </>
                ) : payLabel}
              </button>
              <div style={{ color: DS.text5, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
                🔒 {t('academy.payment.secureNote')}
              </div>

              {/* Additional enrollment details */}
              <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.1em', marginBottom: 8 }}>{t('academy.payment.enrollmentBenefits')}</div>
                {[
                  { icon: '🎬', text: t('academy.payment.benefitLectures', { n: course.lectures }) },
                  { icon: '📝', text: t('academy.payment.benefitCode') },
                  { icon: '💬', text: t('academy.payment.benefitComments') },
                  { icon: '🏆', text: t('academy.payment.benefitCertificate') },
                  { icon: '◈', text: t('academy.payment.benefitLp', { lp: String(course.lpReward) }) },
                  { icon: '♾️', text: t('academy.payment.benefitLifetime') },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2 mt-2">
                    <span style={{ fontSize: 12 }}>{b.icon}</span>
                    <span style={{ color: DS.text3, fontSize: 11 }}>{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Enrollment guarantee */}
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <Shield size={16} style={{ color: DS.green, flexShrink: 0 }} />
                <div>
                  <div style={{ color: DS.green, fontSize: 11, fontWeight: 700 }}>{t('academy.payment.refundTitle')}</div>
                  <div style={{ color: DS.text4, fontSize: 10 }}>{t('academy.payment.refundBody')}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── Free Trial Player ─────────────────────────────────────────────────────────
function FreeTrialModal({ course, onClose, onEnroll, t }: {
  course: typeof DEFAULT_COURSE;
  onClose: () => void;
  onEnroll: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const freeLessons = course.curriculum.flatMap((ch) =>
    ch.lessons.filter(l => l.free).map(l => ({ ...l, chapter: ch.chapter }))
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = freeLessons[currentIdx];
  const isLast = currentIdx === freeLessons.length - 1;

  useEffect(() => {
    setProgress(0);
    setPlaying(false);
  }, [currentIdx]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(intervalRef.current!); setPlaying(false); return 100; }
          return p + 0.5;
        });
      }, 150);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [playing]);

  const dur = current?.duration ?? '0p';
  const seconds = (parseInt(dur) || 0) * 60;
  const elapsed = Math.floor((progress / 100) * seconds);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, boxShadow: '0 0 80px rgba(59,130,246,0.15)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ background: 'rgba(5,12,30,0.8)', borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginRight: 10 }}>{t('academy.freeTrial.header')}</span>
            <span style={{ color: DS.text4, fontSize: 11 }}>{t('academy.freeTrial.headerSub', { n: String(freeLessons.length) })}</span>
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Video area */}
        <div className="relative" style={{ background: '#000', height: 300 }}>
          <img src={course.img} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>
              {t('academy.freeTrial.lessonCounter', { current: String(currentIdx + 1), total: String(freeLessons.length) })}
            </div>
            <div style={{ color: DS.text, fontSize: 17, fontWeight: 700, textAlign: 'center', maxWidth: 400, marginBottom: 20, lineHeight: 1.4 }}>
              {current?.title}
            </div>
            <button onClick={() => setPlaying(p => !p)}
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: GRD.primary, border: 'none', cursor: 'pointer', boxShadow: '0 0 32px rgba(59,130,246,0.5)' }}>
              {playing
                ? <Pause size={22} style={{ color: '#fff' }} />
                : <Play size={22} style={{ color: '#fff', marginLeft: 3, fill: '#fff' }} />}
            </button>
            <div style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, marginTop: 16 }}>
              {fmt(elapsed)} / {dur}
            </div>
          </div>

          {/* Next lesson lock overlay at 90% */}
          {isLast && progress >= 90 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(4px)' }}>
              <Lock size={28} style={{ color: DS.amber, marginBottom: 14 }} />
              <div style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{t('academy.freeTrial.trialEndTitle')}</div>
              <div style={{ color: DS.text4, fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                {t('academy.freeTrial.trialEndSub', { n: String(course.lectures) })}
              </div>
              <button onClick={onEnroll}
                style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('academy.freeTrial.enrollNow', { price: fmtVND(course.price) })}
              </button>
            </motion.div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: GRD.primary, transition: 'width 0.15s linear' }} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'rgba(5,12,30,0.7)', borderTop: `1px solid ${DS.border}` }}>
          <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
            style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer', opacity: currentIdx === 0 ? 0.3 : 1 }}>
            <SkipBack size={18} />
          </button>
          <button onClick={() => setPlaying(p => !p)}
            style={{ color: DS.text, background: 'none', border: 'none', cursor: 'pointer' }}>
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={() => setCurrentIdx(i => Math.min(freeLessons.length - 1, i + 1))} disabled={isLast}
            style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer', opacity: isLast ? 0.3 : 1 }}>
            <SkipForward size={18} />
          </button>
          <div className="flex-1" style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, cursor: 'pointer' }}
            onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setProgress((e.clientX - r.left) / r.width * 100); }}>
            <div style={{ height: '100%', width: `${progress}%`, background: GRD.blue, borderRadius: 2 }} />
          </div>
          <Volume2 size={16} style={{ color: DS.text4 }} />
          <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmt(elapsed)}</span>
        </div>

        {/* Lesson list */}
        <div className="p-4" style={{ borderTop: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 10 }}>{t('academy.freeTrial.trialLessons')}</div>
          <div className="space-y-2">
            {freeLessons.map((l, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left"
                style={{ background: i === currentIdx ? 'rgba(59,130,246,0.1)' : 'transparent', border: `1px solid ${i === currentIdx ? DS.blue + '30' : 'transparent'}`, cursor: 'pointer' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: i === currentIdx ? GRD.blue : 'rgba(255,255,255,0.05)' }}>
                  {i === currentIdx && playing
                    ? <Pause size={11} style={{ color: '#fff' }} />
                    : <Play size={11} style={{ color: i === currentIdx ? '#fff' : DS.text4, fill: i === currentIdx ? '#fff' : DS.text4, marginLeft: 2 }} />}
                </div>
                <div className="flex-1">
                  <div style={{ color: i === currentIdx ? DS.text : DS.text3, fontSize: 12, fontWeight: i === currentIdx ? 600 : 400 }}>{l.title}</div>
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>{l.chapter} · {l.duration}</div>
                </div>
                <span style={{ color: DS.green, fontSize: 9, fontFamily: DS.mono, border: '1px solid rgba(34,197,94,0.3)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>FREE</span>
              </button>
            ))}

            {/* Locked lessons hint */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl opacity-50"
              style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Lock size={11} style={{ color: DS.text5 }} />
              </div>
              <div style={{ color: DS.text5, fontSize: 12 }}>{t('academy.freeTrial.lockedLessons', { n: String(course.lectures - freeLessons.length) })}</div>
            </div>
          </div>

          <button onClick={onEnroll}
            className="mt-4 w-full py-3 rounded-2xl"
            style={{ background: GRD.primary, color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 24px rgba(129,140,248,0.35)' }}>
            {t('academy.freeTrial.unlockAll', { price: fmtVND(course.price), lp: String(course.lpPrice.toLocaleString()) })}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Course Player (after enrollment) ─────────────────────────────────────────
type LessonWithMeta = {
  title: string; duration: string; free?: boolean; type?: string;
  chapterTitle: string; chapterIdx: number; lessonIdx: number; globalIdx: number;
};

function CoursePlayer({ course, onClose, t }: {
  course: typeof DEFAULT_COURSE;
  onClose: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const allLessons: LessonWithMeta[] = course.curriculum.flatMap((ch, ci) =>
    ch.lessons.map((l, li) => ({ ...l, chapterTitle: ch.chapter, chapterIdx: ci, lessonIdx: li, globalIdx: 0 }))
  ).map((l, gi) => ({ ...l, globalIdx: gi }));

  const [globalIdx, setGlobalIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarInitRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [comments, setComments] = useState<{ id: number; user: string; avatar: string; text: string; time: string; likes: number }[]>([
    { id: 1, user: 'Trần Minh Khoa', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=50&h=50&crop=faces', text: 'Bài này giảng rất rõ ràng! Cảm ơn giảng viên.', time: '2 ngày trước', likes: 12 },
    { id: 2, user: 'Lê Thu Hằng', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=50&h=50&crop=faces', text: 'Cho mình hỏi phần useCallback có dùng được với async function không ạ?', time: '1 ngày trước', likes: 5 },
  ]);
  const [newComment, setNewComment] = useState('');
  const [showCodeExercise, setShowCodeExercise] = useState(false);
  const [codeValue, setCodeValue] = useState('// Viết code của bạn ở đây\nfunction HelloWorld() {\n  return <h1>Hello World</h1>;\n}\n');
  const [codeOutput, setCodeOutput] = useState('');
  const [videoGateLocked, setVideoGateLocked] = useState(false);
  const VIDEO_GATE_THRESHOLD = 35;

  const current = allLessons[globalIdx];
  const total = allLessons.length;
  const totalCompleted = completed.size;
  const courseProgress = Math.round((totalCompleted / total) * 100);
  const allDone = totalCompleted === total;

  useEffect(() => {
    setVidProgress(0);
    setPlaying(false);
  }, [globalIdx]);

  // Open sidebar on desktop by default, keep closed on mobile
  useEffect(() => {
    if (isMobile !== undefined && !sidebarInitRef.current) {
      sidebarInitRef.current = true;
      setSidebarOpen(!isMobile);
    }
  }, [isMobile]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setVidProgress(p => {
          if (p >= 100) {
            clearInterval(intervalRef.current!);
            setPlaying(false);
            setCompleted(s => new Set([...s, globalIdx]));
            return 100;
          }
          return p + 0.4;
        });
      }, 120);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [playing, globalIdx]);

  const goNext = useCallback(() => {
    if (vidProgress < VIDEO_GATE_THRESHOLD && !completed.has(globalIdx)) {
      setVideoGateLocked(true);
      setTimeout(() => setVideoGateLocked(false), 3000);
      return;
    }
    if (globalIdx < total - 1) { setGlobalIdx(i => i + 1); }
  }, [globalIdx, total, vidProgress, completed, VIDEO_GATE_THRESHOLD]);

  const goPrev = useCallback(() => {
    if (globalIdx > 0) { setGlobalIdx(i => i - 1); }
  }, [globalIdx]);

  const markComplete = () => {
    setCompleted(s => new Set([...s, globalIdx]));
  };

  const dur = current?.duration ?? '0p';
  const seconds = (parseInt(dur) || 0) * 60;
  const elapsed = Math.floor((vidProgress / 100) * seconds);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const typeIcon = (t?: string) => t === 'quiz' ? '📝' : t === 'project' ? '🛠' : '▶';

  const chapterGroups = course.curriculum.map((ch, ci) => ({
    ...ch,
    lessons: allLessons.filter(l => l.chapterIdx === ci),
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: DS.bg, fontFamily: DS.body }}>

      {/* Top bar */}
      <div className="flex items-center gap-3 flex-shrink-0"
        style={{ background: 'rgba(5,12,30,0.98)', borderBottom: `1px solid ${DS.border}`, height: 52, padding: isMobile ? '0 12px' : '0 20px' }}>
        <button onClick={onClose} className="flex items-center gap-2"
          style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px', flexShrink: 0 }}>
          <ArrowLeft size={16} />
          {!isMobile && <span style={{ fontSize: 13 }}>{t('academy.player.back')}</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: DS.text, fontSize: isMobile ? 12 : 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isMobile ? current?.title : course.title}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isMobile && <div style={{ color: DS.text4, fontSize: 12 }}>{t('academy.player.lessonProgress', { done: String(totalCompleted), total: String(total) })}</div>}
          <div style={{ width: isMobile ? 60 : 100, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${courseProgress}%`, background: GRD.primary, borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
          <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{courseProgress}%</div>
        </div>

        <button onClick={() => setSidebarOpen(s => !s)}
          style={{ color: DS.text4, background: 'rgba(255,255,255,0.06)', border: `1px solid ${DS.border}`, borderRadius: 8, padding: isMobile ? '6px 8px' : '5px 10px', cursor: 'pointer', fontSize: 11, flexShrink: 0 }}>
          {sidebarOpen ? (isMobile ? '✕' : t('academy.player.sidebarHide')) : (isMobile ? '☰' : t('academy.player.sidebarShow'))}
        </button>
      </div>

      {/* Body */}
      <div className={`flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Video area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video */}
          <div className="flex-1 relative" style={{ background: '#000', minHeight: 0 }}>
            <img src={course.img} alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>
                {typeIcon(current?.type)} {current?.chapterTitle?.toUpperCase()}
              </div>
              <div style={{ color: DS.text, fontSize: 'clamp(14px, 2vw, 20px)', fontWeight: 700, textAlign: 'center', maxWidth: 500, lineHeight: 1.4 }}>
                {current?.title}
              </div>
              <button onClick={() => setPlaying(p => !p)}
                className="w-18 h-18 rounded-full flex items-center justify-center"
                style={{ width: 72, height: 72, background: GRD.primary, border: 'none', cursor: 'pointer', boxShadow: '0 0 40px rgba(59,130,246,0.5)' }}>
                {playing
                  ? <Pause size={26} style={{ color: '#fff' }} />
                  : <Play size={26} style={{ color: '#fff', marginLeft: 4, fill: '#fff' }} />}
              </button>
              {vidProgress === 100 && !allDone && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={goNext}
                  style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t('academy.player.nextLesson')} <ChevronRight size={15} />
                </motion.button>
              )}
              {/* Video gate progress indicator */}
              {vidProgress > 0 && vidProgress < VIDEO_GATE_THRESHOLD && !completed.has(globalIdx) && (
                <div style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={12} /> {t('academy.player.gateLocked', { pct: String(Math.ceil(VIDEO_GATE_THRESHOLD - vidProgress)) })}
                </div>
              )}
              {vidProgress >= VIDEO_GATE_THRESHOLD && vidProgress < 100 && !completed.has(globalIdx) && (
                <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Unlock size={12} /> {t('academy.player.gateUnlocked')}
                </div>
              )}
            </div>

            {/* Certificate overlay when all done */}
            {allDone && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(8px)' }}>
                <div className="text-6xl mb-4">🏆</div>
                <div style={{ color: DS.amber, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 8 }}>{t('academy.certificate.congrats')}</div>
                <div style={{ color: DS.text3, fontSize: 14, marginBottom: 20, textAlign: 'center' }}>
                  {t('academy.certificate.completed', { lp: String(course.lpReward) })}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: GRD.gold, color: '#000', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  <Award size={16} /> {t('academy.certificate.downloadPdf')}
                </button>
              </motion.div>
            )}
          </div>

          {/* Video controls */}
          <div style={{ background: 'rgba(5,12,30,0.95)', borderTop: `1px solid ${DS.border}` }}>
            {/* Seek bar */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}
              onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setVidProgress((e.clientX - r.left) / r.width * 100); }}>
              <div style={{ height: '100%', width: `${vidProgress}%`, background: GRD.primary, transition: 'width 0.1s linear' }} />
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5">
              <button onClick={goPrev} disabled={globalIdx === 0}
                style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer', opacity: globalIdx === 0 ? 0.3 : 1 }}>
                <SkipBack size={18} />
              </button>
              <button onClick={() => setPlaying(p => !p)}
                style={{ color: DS.text, background: 'none', border: 'none', cursor: 'pointer' }}>
                {playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={goNext} disabled={globalIdx === total - 1}
                style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer', opacity: globalIdx === total - 1 ? 0.3 : 1 }}>
                <SkipForward size={18} />
              </button>
              <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                {fmt(elapsed)} / {dur}
              </span>
              <div className="flex-1" />
              {!isMobile && (
                <button onClick={markComplete}
                  style={{ color: completed.has(globalIdx) ? DS.green : DS.text4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                  <Check size={14} style={{ color: completed.has(globalIdx) ? DS.green : DS.text4 }} />
                  {completed.has(globalIdx) ? t('academy.player.markedComplete') : t('academy.player.markComplete')}
                </button>
              )}
              {isMobile && (
                <button onClick={markComplete}
                  style={{ color: completed.has(globalIdx) ? DS.green : DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Check size={16} style={{ color: completed.has(globalIdx) ? DS.green : DS.text4 }} />
                </button>
              )}
              <Volume2 size={16} style={{ color: DS.text4 }} />
              {!isMobile && <Maximize2 size={16} style={{ color: DS.text4, cursor: 'pointer' }} />}
            </div>
          </div>

          {/* Lesson info & resources */}
          <div className="px-4 py-4 overflow-y-auto" style={{ background: DS.bgCard, borderTop: `1px solid ${DS.border}`, maxHeight: isMobile ? 220 : 180 }}>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{current?.title}</div>
            <div style={{ color: DS.text4, fontSize: 12 }}>{current?.chapterTitle} · {current?.duration} · {typeIcon(current?.type)} {current?.type === 'quiz' ? 'Quiz' : current?.type === 'project' ? 'Project' : 'Video'}</div>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, color: DS.text4, fontSize: 12, cursor: 'pointer' }}>
                <FileText size={12} /> {t('academy.player.lessonMaterials')}
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, color: DS.text4, fontSize: 12, cursor: 'pointer' }}>
                <Download size={12} /> {t('academy.player.sourceCode')}
              </button>
              <button onClick={() => setShowCodeExercise(e => !e)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: showCodeExercise ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showCodeExercise ? DS.purple + '40' : DS.border}`, color: showCodeExercise ? DS.purple : DS.text4, fontSize: 12, cursor: 'pointer' }}>
                <FileText size={12} /> {t('academy.player.codeExercise')}
              </button>
              {!completed.has(globalIdx) && (
                <button onClick={markComplete} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: DS.green, fontSize: 12, cursor: 'pointer' }}>
                  <Check size={12} /> {t('academy.player.completeThis')}
                </button>
              )}
            </div>

            {/* Video Gate Warning */}
            {videoGateLocked && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 rounded-xl flex items-center gap-3"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Lock size={14} style={{ color: DS.amber, flexShrink: 0 }} />
                <span style={{ color: DS.amber, fontSize: 12 }}>
                  {t('academy.player.gateWarning', { threshold: String(VIDEO_GATE_THRESHOLD), current: String(Math.round(vidProgress)) })}
                </span>
              </motion.div>
            )}

            {/* Code Exercise Panel */}
            {showCodeExercise && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.purple}30` }}>
                <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(129,140,248,0.08)', borderBottom: `1px solid ${DS.purple}20` }}>
                  <span style={{ color: DS.purple, fontSize: 12, fontWeight: 700 }}>🛠 {t('academy.player.codeExercisePanel', { title: current?.title ?? '' })}</span>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setCodeOutput('✅ Output: Hello World\n\n🎉 Bài làm đúng! Component render thành công.');
                    }} style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
                      ▶ {t('academy.player.runCode')}
                    </button>
                    <button onClick={() => setShowCodeExercise(false)}
                      style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`} style={{ minHeight: 150 }}>
                  <textarea value={codeValue} onChange={e => setCodeValue(e.target.value)}
                    style={{ background: '#0a0f1a', color: DS.green, fontFamily: DS.mono, fontSize: 12, padding: 12, border: 'none', borderRight: `1px solid ${DS.border}`, outline: 'none', resize: 'none', minHeight: 150 }} />
                  <div style={{ background: '#050a15', padding: 12, fontFamily: DS.mono, fontSize: 11, color: codeOutput.includes('✅') ? DS.green : DS.text4, whiteSpace: 'pre-wrap' }}>
                    {codeOutput || t('academy.player.outputPlaceholder')}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Comments Section */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={14} style={{ color: DS.text4 }} />
                <span style={{ color: DS.text3, fontSize: 13, fontWeight: 600 }}>{t('academy.player.comments', { count: String(comments.length) })}</span>
              </div>
              <div className="flex gap-2 mb-3">
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder={t('academy.player.commentPlaceholder')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      setComments(prev => [...prev, { id: Date.now(), user: 'Bạn', avatar: 'https://images.unsplash.com/photo-1746105625407-5d49d69a2a47?auto=format&fit=crop&w=50&h=50&crop=faces', text: newComment, time: 'Vừa xong', likes: 0 }]);
                      setNewComment('');
                    }
                  }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, borderRadius: 8, padding: '8px 12px', color: DS.text, fontSize: 12, outline: 'none' }} />
                <button onClick={() => {
                  if (newComment.trim()) {
                    setComments(prev => [...prev, { id: Date.now(), user: 'Bạn', avatar: 'https://images.unsplash.com/photo-1746105625407-5d49d69a2a47?auto=format&fit=crop&w=50&h=50&crop=faces', text: newComment, time: 'Vừa xong', likes: 0 }]);
                    setNewComment('');
                  }
                }} style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                  {t('academy.player.send')}
                </button>
              </div>
              <div className="space-y-2" style={{ maxHeight: 140, overflowY: 'auto' }}>
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <img src={c.avatar} alt={c.user} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: DS.text, fontSize: 11, fontWeight: 700 }}>{c.user}</span>
                        <span style={{ color: DS.text5, fontSize: 9 }}>{c.time}</span>
                      </div>
                      <div style={{ color: DS.text3, fontSize: 12, marginTop: 1 }}>{c.text}</div>
                    </div>
                    <button onClick={() => setComments(prev => prev.map(cm => cm.id === c.id ? { ...cm, likes: cm.likes + 1 } : cm))}
                      className="flex items-center gap-1 flex-shrink-0" style={{ color: DS.text5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10 }}>
                      <ThumbsUp size={10} /> {c.likes}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: lesson list */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Mobile backdrop */}
              {isMobile && (
                <motion.div
                  key="sidebar-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40"
                  style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
                  onClick={() => setSidebarOpen(false)}
                />
              )}
            <motion.div
              key="sidebar-panel"
              initial={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 340, opacity: 1 }}
              exit={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`overflow-y-auto ${isMobile ? 'fixed top-0 right-0 bottom-0 z-50' : 'flex-shrink-0'}`}
              style={{
                background: 'rgba(5,12,30,0.98)',
                borderLeft: `1px solid ${DS.border}`,
                width: isMobile ? '85vw' : 340,
                maxWidth: 340,
              }}>
              <div className="px-4 py-3 sticky top-0 z-10 flex items-center justify-between gap-2" style={{ background: 'rgba(5,12,30,0.98)', borderBottom: `1px solid ${DS.border}` }}>
                <div>
                  <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{t('academy.player.courseContent')}</div>
                  <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{t('academy.player.courseProgress', { done: String(totalCompleted), total: String(total), pct: String(courseProgress) })}</div>
                </div>
                {isMobile && (
                  <button onClick={() => setSidebarOpen(false)}
                    style={{ color: DS.text4, background: 'rgba(255,255,255,0.06)', border: `1px solid ${DS.border}`, borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {chapterGroups.map((ch, ci) => (
                <div key={ci}>
                  <div className="px-4 py-2.5 sticky" style={{ background: 'rgba(15,23,42,0.8)', top: 48 }}>
                    <div style={{ color: DS.text3, fontSize: 11, fontWeight: 700 }}>{ci + 1}. {ch.chapter}</div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{ch.duration}</div>
                  </div>
                  {ch.lessons.map((lesson) => {
                    const done = completed.has(lesson.globalIdx);
                    const active = lesson.globalIdx === globalIdx;
                    return (
                      <button key={lesson.globalIdx} onClick={() => { setGlobalIdx(lesson.globalIdx); if (isMobile) setSidebarOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        style={{
                          background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                          boxShadow: active ? `inset 3px 0 0 ${DS.blue}` : 'none',
                          outline: 'none',
                          cursor: 'pointer',
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: done ? 'rgba(34,197,94,0.15)' : active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)' }}>
                          {done
                            ? <Check size={11} style={{ color: DS.green }} />
                            : active
                            ? <Play size={11} style={{ color: DS.blue, fill: DS.blue, marginLeft: 2 }} />
                            : <span style={{ fontSize: 10 }}>{typeIcon(lesson.type)}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ color: active ? DS.text : done ? DS.text4 : DS.text3, fontSize: 12, fontWeight: active ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lesson.title}
                          </div>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>{lesson.duration}</div>
                        </div>
                        {done && <ThumbsUp size={11} style={{ color: DS.green, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Certificate section */}
              <div className="p-4 m-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Award size={16} style={{ color: DS.amber }} />
                  <span style={{ color: DS.amber, fontSize: 12, fontWeight: 700 }}>{t('academy.certificate.title')}</span>
                  {allDone
                    ? <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, marginLeft: 'auto' }}>{t('academy.certificate.unlocked')}</span>
                    : <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginLeft: 'auto' }}>{courseProgress}%</span>}
                </div>
                {allDone
                  ? <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl"
                      style={{ background: GRD.gold, color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <Download size={14} /> {t('academy.certificate.downloadPdf')}
                    </button>
                  : <div style={{ color: DS.text5, fontSize: 11 }}>{t('academy.certificate.completeToUnlock', { lp: String(course.lpReward) })}</div>}
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const { t } = useI18n();
  const { id = '1' } = useParams<{ id: string }>();
  const course = COURSES[id] ?? DEFAULT_COURSE;

  const [openChapter, setOpenChapter] = useState<number | null>(0);
  const [showPayment, setShowPayment] = useState(false);
  const [showFreeTrial, setShowFreeTrial] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const totalLessons = course.curriculum.reduce((s, c) => s + c.lessons.length, 0);
  const freeLessons = course.curriculum.flatMap(ch => ch.lessons.filter(l => l.free));

  const handleEnroll = () => {
    setShowFreeTrial(false);
    setShowPayment(true);
  };

  const handlePurchaseSuccess = () => {
    setShowPayment(false);
    setEnrolled(true);
    setShowPlayer(true);
  };

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }} className="pb-20 lg:pb-0">
      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPayment && (
          <PaymentModal course={course} onClose={() => setShowPayment(false)} onSuccess={handlePurchaseSuccess} t={t} />
        )}
        {showFreeTrial && (
          <FreeTrialModal course={course} onClose={() => setShowFreeTrial(false)} onEnroll={handleEnroll} t={t} />
        )}
        {showPlayer && (
          <CoursePlayer course={course} onClose={() => setShowPlayer(false)} t={t} />
        )}
      </AnimatePresence>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,1) 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 py-8 lg:px-6 lg:py-12">
          <Link to="/hoc-vien" className="inline-flex items-center gap-2 mb-6"
            style={{ color: DS.text4, fontSize: 13, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> {t('academy.detail.backToCourses')}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* Left: course info */}
            <div className="lg:col-span-2">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span style={{ color: levelColor[course.level], fontSize: 10, fontFamily: DS.mono, fontWeight: 700, letterSpacing: '0.15em', background: `${levelColor[course.level]}15`, border: `1px solid ${levelColor[course.level]}30`, padding: '3px 10px', borderRadius: 4 }}>
                  {t(levelI18nKey[course.level]).toUpperCase()}
                </span>
                <span style={{ color: course.color, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', background: `${course.color}10`, border: `1px solid ${course.color}25`, padding: '3px 10px', borderRadius: 4 }}>
                  {course.cat.toUpperCase()}
                </span>
                {enrolled && (
                  <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', padding: '3px 10px', borderRadius: 4 }}>
                    {t('academy.detail.enrolled')}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: DS.heading, fontSize: 'clamp(22px, 3.5vw, 36px)', fontWeight: 900, letterSpacing: '0.04em', color: DS.text, marginBottom: 16, lineHeight: 1.25 }}>
                {course.title}
              </h1>
              <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>{course.desc}</p>

              {/* Stats */}
              <div className="flex items-center gap-5 flex-wrap mb-5">
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} style={{ color: DS.amber, fill: s <= Math.floor(course.rating) ? DS.amber : 'none' }} />)}
                  <span style={{ color: DS.amber, fontFamily: DS.mono, fontSize: 14, fontWeight: 700, marginLeft: 4 }}>{course.rating}</span>
                  <span style={{ color: DS.text4, fontSize: 12 }}>({course.reviews} {t('academy.detail.reviews')})</span>
                </div>
                <div className="flex items-center gap-1.5" style={{ color: DS.text3, fontSize: 13 }}>
                  <Users size={13} style={{ color: DS.text4 }} />{course.students} {t('academy.detail.students')}
                </div>
                <div className="flex items-center gap-1.5" style={{ color: DS.text3, fontSize: 13 }}>
                  <Clock size={13} style={{ color: DS.text4 }} />{course.duration} · {totalLessons} {t('academy.detail.lessons')}
                </div>
                <div className="flex items-center gap-1.5" style={{ color: DS.text3, fontSize: 13 }}>
                  <BookOpen size={13} style={{ color: DS.text4 }} />{t('academy.detail.updated')} {course.updatedAt}
                </div>
              </div>

              {/* Instructor mini */}
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, display: 'inline-flex' }}>
                <img src={course.instructorImg} alt={course.instructor} className="w-10 h-10 rounded-xl object-cover" style={{ border: `2px solid ${course.color}50` }} />
                <div>
                  <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{course.instructor}</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>{course.instructorRole}</div>
                </div>
              </div>
            </div>

            {/* Right: Purchase card (sticky) */}
            <div className="lg:sticky lg:top-20">
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.98)', border: `1px solid ${DS.border}`, boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
                {/* Thumbnail */}
                <div className="relative" style={{ height: 190, overflow: 'hidden' }}>
                  <img src={course.img} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <button onClick={() => setShowFreeTrial(true)}
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', boxShadow: '0 0 24px rgba(0,0,0,0.4)' }}>
                      <Play size={20} style={{ color: '#000', fill: '#000', marginLeft: 3 }} />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span style={{ color: DS.text3, fontSize: 12, background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                      ▶ {t('academy.detail.freePreview', { n: String(freeLessons.length) })}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  {/* Prices */}
                  <div className="flex items-end gap-3 mb-1">
                    <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 28, fontWeight: 900 }}>
                      {fmtVND(course.price)}
                    </div>
                    <div style={{ color: DS.text5, fontSize: 13, textDecoration: 'line-through', paddingBottom: 3 }}>
                      {fmtVND(course.price * 1.3)}
                    </div>
                  </div>
                  <div style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, marginBottom: 4 }}>
                    ◈ {t('academy.detail.orLpFull', { lp: String(course.lpPrice.toLocaleString()) })}
                  </div>
                  <div className="flex items-center gap-1.5 mb-5" style={{ color: DS.red, fontSize: 12 }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: DS.red, display: 'inline-block' }} />
                    {t('academy.detail.urgency')}
                  </div>

                  {enrolled ? (
                    <button onClick={() => setShowPlayer(true)}
                      style={{ width: '100%', background: GRD.primary, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 0 24px rgba(129,140,248,0.4)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Play size={16} style={{ fill: '#fff' }} /> {t('academy.detail.continueLearning')}
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setShowPayment(true)}
                        style={{ width: '100%', background: GRD.primary, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 0 24px rgba(129,140,248,0.4)', marginBottom: 10 }}>
                        {t('academy.detail.buyNow')}
                      </button>
                      <button onClick={() => setShowFreeTrial(true)}
                        style={{ width: '100%', background: 'transparent', color: DS.text3, fontSize: 14, padding: '11px', borderRadius: 10, border: `1px solid ${DS.border}`, cursor: 'pointer', marginBottom: 16 }}>
                        🎬 {t('academy.detail.freeTrial', { n: String(freeLessons.length) })}
                      </button>
                    </>
                  )}

                  {/* LP reward */}
                  <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
                    <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.1em', marginBottom: 4 }}>◈ {t('academy.detail.lpRewardLabel')}</div>
                    <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>+{course.lpReward} LP</div>
                    <div style={{ color: DS.text5, fontSize: 10, marginTop: 2 }}>{t('academy.detail.lpRewardSub')}</div>
                  </div>

                  {/* Included */}
                  <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>{t('academy.detail.included')}</div>
                  <div className="space-y-2">
                    {course.included.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <Check size={12} style={{ color: DS.green, flexShrink: 0 }} />
                        <span style={{ color: DS.text3, fontSize: 12 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shield */}
                <div className="flex items-center justify-center gap-2 py-3" style={{ borderTop: `1px solid ${DS.border}`, background: 'rgba(255,255,255,0.02)' }}>
                  <Shield size={12} style={{ color: DS.text5 }} />
                  <span style={{ color: DS.text5, fontSize: 11 }}>{t('academy.detail.refundNote')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body Content ───────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 lg:px-6 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">

            {/* Highlights */}
            <div className="grid grid-cols-2 gap-3">
              {course.highlights.map(h => (
                <div key={h} className="flex items-center gap-2.5 p-3 rounded-xl"
                  style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${DS.border}` }}>
                  <Zap size={12} style={{ color: course.color, flexShrink: 0 }} />
                  <span style={{ color: DS.text3, fontSize: 12 }}>{h}</span>
                </div>
              ))}
            </div>

            {/* Objectives */}
            <div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 16 }}>{t('academy.detail.objectives')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.objectives.map(o => (
                  <div key={o} className="flex items-start gap-2.5 p-3 rounded-xl"
                    style={{ background: 'rgba(15,23,42,0.4)', border: `1px solid ${DS.border}` }}>
                    <Check size={13} style={{ color: course.color, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: DS.text3, fontSize: 13, lineHeight: 1.6 }}>{o}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>{t('academy.detail.curriculum')}</h2>
              <div style={{ color: DS.text4, fontSize: 12, marginBottom: 14 }}>
                {course.curriculum.length} {t('academy.detail.chapters')} · {totalLessons} {t('academy.detail.lessons')} · {course.duration} {t('academy.detail.totalTime')}
              </div>
              <div className="space-y-2">
                {course.curriculum.map((ch, ci) => (
                  <div key={ch.chapter} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
                    <button onClick={() => setOpenChapter(openChapter === ci ? null : ci)}
                      className="w-full flex items-center justify-between p-4"
                      style={{ background: openChapter === ci ? 'rgba(59,130,246,0.06)' : 'rgba(15,23,42,0.5)', cursor: 'pointer', border: 'none', textAlign: 'left' }}>
                      <div>
                        <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{ci + 1}. {ch.chapter}</div>
                        <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>
                          {ch.lessons.length} {t('academy.detail.lessons')} · {ch.duration} · {ch.lessons.filter(l => l.free).length > 0 && <span style={{ color: DS.green }}>{ch.lessons.filter(l => l.free).length} {t('academy.detail.free')}</span>}
                        </div>
                      </div>
                      {openChapter === ci ? <ChevronUp size={16} style={{ color: DS.text4 }} /> : <ChevronDown size={16} style={{ color: DS.text4 }} />}
                    </button>

                    <AnimatePresence>
                      {openChapter === ci && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          style={{ overflow: 'hidden', borderTop: `1px solid ${DS.border}` }}>
                          {ch.lessons.map(lesson => (
                            <div key={lesson.title} className="flex items-center justify-between px-4 py-3"
                              style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ background: lesson.free ? 'rgba(34,197,94,0.1)' : lesson.type === 'quiz' ? 'rgba(245,158,11,0.1)' : lesson.type === 'project' ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.04)' }}>
                                  {lesson.type === 'quiz'
                                    ? <span style={{ fontSize: 11 }}>📝</span>
                                    : lesson.type === 'project'
                                    ? <span style={{ fontSize: 11 }}>🛠</span>
                                    : <Play size={10} style={{ color: lesson.free ? DS.green : DS.text5, fill: lesson.free ? DS.green : DS.text5 }} />}
                                </div>
                                <span style={{ color: DS.text3, fontSize: 13 }}>{lesson.title}</span>
                                {lesson.free && (
                                  <button onClick={() => setShowFreeTrial(true)}
                                    style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, border: '1px solid rgba(34,197,94,0.3)', padding: '1px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.05)', cursor: 'pointer' }}>
                                    {t('academy.detail.watchFree')}
                                  </button>
                                )}
                                {!lesson.free && !enrolled && (
                                  <Lock size={10} style={{ color: DS.text5 }} />
                                )}
                              </div>
                              <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, flexShrink: 0 }}>{lesson.duration}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 16 }}>{t('academy.detail.instructor')}</h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 p-5 rounded-2xl" style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${DS.border}` }}>
                <img src={course.instructorImg} alt={course.instructor} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover flex-shrink-0" style={{ border: `2px solid ${course.color}50` }} />
                <div>
                  <div style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{course.instructor}</div>
                  <div style={{ color: course.color, fontSize: 12, fontFamily: DS.mono, marginBottom: 10 }}>{course.instructorRole}</div>
                  <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>{course.instructorBio}</p>
                </div>
              </div>
            </div>

            {/* Testimonials */}
            <div>
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 16 }}>
                {t('academy.detail.testimonials')}
                <span style={{ color: DS.amber, fontSize: 15, marginLeft: 12 }}>★ {course.rating}</span>
                <span style={{ color: DS.text4, fontSize: 12, fontWeight: 400, marginLeft: 8 }}>({course.reviews} {t('academy.detail.reviews')})</span>
              </h2>

              {/* Rating breakdown - pure SVG chart */}
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 p-5 rounded-2xl mb-6" style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${DS.border}` }}>
                <div className="text-center flex-shrink-0">
                  <div style={{ color: DS.amber, fontFamily: DS.heading, fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{course.rating}</div>
                  <div className="flex justify-center gap-0.5 my-2">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} style={{ color: DS.amber, fill: DS.amber }} />)}
                  </div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>{t('academy.detail.overallRating')}</div>
                </div>
                <div className="flex-1 space-y-2">
                  {[5,4,3,2,1].map(stars => {
                    const pct = stars === 5 ? 82 : stars === 4 ? 13 : stars === 3 ? 4 : stars === 2 ? 1 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <div className="flex gap-0.5 flex-shrink-0">
                          {[1,2,3,4,5].map(i => <Star key={i} size={10} style={{ color: DS.amber, fill: i <= stars ? DS.amber : 'none' }} />)}
                        </div>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: DS.amber, borderRadius: 9999 }} />
                        </div>
                        <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, flexShrink: 0 }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                {course.testimonials.map(t => (
                  <motion.div key={t.name} className="p-5 rounded-xl"
                    style={{ background: 'rgba(15,23,42,0.6)', border: `1px solid ${DS.border}` }}
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <div className="flex items-center gap-3 mb-3">
                      <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-xl object-cover" />
                      <div>
                        <div style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                        <div style={{ color: DS.text5, fontSize: 11 }}>{t.date}</div>
                      </div>
                      <div className="flex gap-0.5 ml-auto">
                        {[1,2,3,4,5].map(s => <Star key={s} size={12} style={{ color: DS.amber, fill: s <= t.rating ? DS.amber : 'none' }} />)}
                      </div>
                    </div>
                    <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7, fontStyle: 'italic' }}>"{t.comment}"</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Requirements */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>{t('academy.detail.requirements')}</div>
              <div className="space-y-2">
                {course.requirements.map(r => (
                  <div key={r} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: course.color }} />
                    <span style={{ color: DS.text3, fontSize: 12 }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target audience */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>{t('academy.detail.targetAudience')}</div>
              <div className="space-y-2">
                {course.targetAudience.map(a => (
                  <div key={a} className="flex items-start gap-2">
                    <Check size={11} style={{ color: DS.green, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: DS.text3, fontSize: 12 }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LP Info */}
            <div className="p-5 rounded-2xl" style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.2)' }}>
              <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 8 }}>◈ {t('academy.detail.lpSystem')}</div>
              <div className="space-y-2" style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7 }}>
                <div>{t('academy.detail.lpEarn', { lp: String(course.lpReward) })}</div>
                <div>{t('academy.detail.lpUse')}</div>
                <div>{t('academy.detail.lpRate')}</div>
              </div>
            </div>

            {/* Share & gift */}
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>{t('academy.detail.shareCourse')}</div>
              <div className="flex gap-2">
                {['Facebook', 'Twitter', 'LinkedIn'].map(s => (
                  <button key={s} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, color: DS.text4, fontSize: 10, padding: '7px 4px', borderRadius: 8, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Back */}
            <Link to="/hoc-vien" style={{ display: 'block', color: DS.text3, fontSize: 13, padding: '11px', borderRadius: 10, textDecoration: 'none', textAlign: 'center', border: `1px solid ${DS.border}` }}>
              ← {t('academy.detail.moreCourses')}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom CTA ────────────────────────────────────────── */}
      {!enrolled ? (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30"
          style={{ background: 'rgba(5,12,30,0.97)', borderTop: `1px solid ${DS.border}`, backdropFilter: 'blur(16px)', padding: '12px 16px' }}>
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="flex-1 min-w-0">
              <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 17, fontWeight: 900, lineHeight: 1 }}>
                {fmtVND(course.price)}
              </div>
              <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, marginTop: 3 }}>
                hoặc {course.lpPrice.toLocaleString()} LP
              </div>
            </div>
            <button onClick={() => setShowFreeTrial(true)}
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${DS.border}`, color: DS.text3, fontSize: 12, padding: '10px 13px', borderRadius: 10, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
              🎬 {t('academy.detail.freeTrialShort')}
            </button>
            <button onClick={() => setShowPayment(true)}
              style={{ background: GRD.primary, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, boxShadow: '0 0 20px rgba(129,140,248,0.4)', whiteSpace: 'nowrap' }}>
              {t('academy.detail.buyNowShort')}
            </button>
          </div>
        </div>
      ) : (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30"
          style={{ background: 'rgba(5,12,30,0.97)', borderTop: `1px solid ${DS.border}`, backdropFilter: 'blur(16px)', padding: '12px 16px' }}>
          <button onClick={() => setShowPlayer(true)} className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-3 rounded-xl"
            style={{ background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 0 24px rgba(129,140,248,0.4)', display: 'flex' }}>
            <Play size={16} style={{ fill: '#fff' }} /> Tiếp tục học
          </button>
        </div>
      )}
    </div>
  );
}
