/**
 * ServicesPage — LOOP Solutions
 * Primary: Gói Web Doanh Nghiệp (industry-specific ready-to-use websites, 3-5 day trial)
 * Secondary: Dịch vụ Tùy chỉnh · Bảng giá
 */
import { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, Globe, Code2, BarChart3, Search, ChevronRight, ArrowRight,
  Zap, MousePointer, ShoppingCart, X, Rocket, Palette, TrendingUp,
  Shield, Clock, Star, Play, Eye, Sparkles, LayoutGrid, List,
  CalendarClock, BadgeCheck, Flame, ChevronDown, ChevronUp,
  Phone, BookOpen,
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';

// ── hex → rgba() helper (Motion requires rgba, not 8-digit hex) ───────────────
function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// ── Web Business Packages ──────────────────────────────────────────────────────

export interface WebPackage {
  id: string;
  industry: string;
  icon: string;
  color: string;
  gradFrom: string;
  gradTo: string;
  tagline: string;
  description: string;
  trialDays: number;
  trialPrice: number;
  fullPrice: number;
  activateTime: string;
  badge?: string;
  badgeColor?: string;
  features: string[];
  demoFeatures: string[];
  previewImg: string;
  category: 'ăn uống' | 'sức khỏe' | 'lưu trú' | 'mua sắm' | 'giáo dục' | 'bất động sản';
  popular?: boolean;
  lp: number;
}

export const WEB_PACKAGES: WebPackage[] = [
  {
    id: 'nha-hang',
    icon: '🍜',
    color: '#F59E0B',
    gradFrom: '#F59E0B',
    gradTo: '#EF4444',
    tagline: 'Thực đơn online · Đặt bàn · Giao hàng',
    description: 'Website nhà hàng chuyên nghiệp với thực đơn đẹp, đặt bàn trực tuyến, tích hợp giao hàng và quản lý review khách hàng.',
    trialDays: 5,
    trialPrice: 0,
    fullPrice: 7_900_000,
    activateTime: '2 giờ',
    badge: 'PHỔ BIẾN NHẤT',
    badgeColor: '#F59E0B',
    features: ['Thực đơn dạng ảnh + mô tả', 'Đặt bàn online (form + xác nhận)', 'Tích hợp Grab/ShopeeFood', 'Gallery ảnh món ăn', 'Review & Rating khách hàng', 'Bản đồ & giờ mở cửa', 'Fanpage tích hợp', 'SEO tối ưu cho từ khóa địa phương'],
    demoFeatures: ['Thực đơn đầy đủ', 'Form đặt bàn', 'Giao diện responsive'],
    previewImg: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    category: 'ăn uống',
    popular: true,
    lp: 395,
  },
  {
    id: 'spa',
    icon: '💆',
    color: '#C084FC',
    gradFrom: '#C084FC',
    gradTo: '#818CF8',
    tagline: 'Booking online · Gallery dịch vụ · Voucher',
    description: 'Website spa sang trọng với bảng giá dịch vụ, đặt lịch trực tuyến, gallery before/after và hệ thống voucher ưu đãi.',
    trialDays: 5,
    trialPrice: 0,
    fullPrice: 8_500_000,
    activateTime: '2 giờ',
    badge: 'HOT',
    badgeColor: '#EF4444',
    features: ['Booking online có nhắc nhở qua SMS', 'Gallery before/after ấn tượng', 'Bảng giá dịch vụ đẹp', 'Hệ thống voucher & ưu đãi', 'Đội ngũ chuyên viên', 'Video giới thiệu', 'Tích hợp Zalo OA', 'Form tư vấn da miễn phí'],
    demoFeatures: ['Booking lịch hẹn', 'Gallery dịch vụ', 'Voucher online'],
    previewImg: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80',
    category: 'sức khỏe',
    popular: true,
    lp: 425,
  },
  {
    id: 'nha-thuoc',
    industry: 'Web Nhà thuốc',
    icon: '💊',
    color: '#22C55E',
    gradFrom: '#22C55E',
    gradTo: '#14B8A6',
    tagline: 'Tra cứu thuốc · Đặt hàng · Tư vấn dược sĩ',
    description: 'Website nhà thuốc uy tín với hệ thống tra cứu thuốc, đặt hàng online, tư vấn từ dược sĩ và quản lý đơn thuốc.',
    trialDays: 3,
    trialPrice: 0,
    fullPrice: 9_900_000,
    activateTime: '4 giờ',
    features: ['Tra cứu thuốc thông minh (tên, hoạt chất)', 'Đặt hàng online giao tận nhà', 'Chat tư vấn với dược sĩ', 'Hồ sơ bệnh nhân & nhắc uống thuốc', 'Nhập xuất tồn kho cơ bản', 'Chứng nhận GPP & giấy phép', 'Blog sức khỏe SEO', 'Kết nối bảo hiểm y tế'],
    demoFeatures: ['Tra cứu thuốc', 'Đặt hàng online', 'Chatbot tư vấn'],
    previewImg: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=600&q=80',
    category: 'sức khỏe',
    lp: 495,
  },
  {
    id: 'cafe',
    industry: 'Web Café & Trà sữa',
    icon: '☕',
    color: '#D97706',
    gradFrom: '#D97706',
    gradTo: '#F59E0B',
    tagline: 'Menu digital · Không gian · Order online',
    description: 'Website café trendy với menu digital đẹp, giới thiệu không gian, tính năng order takeaway và loyalty card tích điểm.',
    trialDays: 5,
    trialPrice: 0,
    fullPrice: 6_500_000,
    activateTime: '2 giờ',
    features: ['Menu digital với filter đồ uống', 'Order takeaway & pickup', 'Loyalty card tích điểm', 'Gallery không gian check-in', 'Nhạc playlist Spotify tích hợp', 'WiFi password hiển thị thông minh', 'Sự kiện & ưu đãi đặc biệt', 'Review Google Maps tích hợp'],
    demoFeatures: ['Menu digital', 'Order online', 'Loyalty card'],
    previewImg: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=600&q=80',
    category: 'ăn uống',
    lp: 325,
  },
  {
    id: 'khach-san',
    industry: 'Web Khách sạn & Resort',
    icon: '🏨',
    color: '#3B82F6',
    gradFrom: '#3B82F6',
    gradTo: '#06B6D4',
    tagline: 'Đặt phòng · Gallery · Tiện nghi',
    description: 'Website khách sạn sang trọng với hệ thống đặt phòng real-time, gallery 360°, giới thiệu tiện nghi và tích hợp OTA.',
    trialDays: 5,
    trialPrice: 0,
    fullPrice: 14_900_000,
    activateTime: '4 giờ',
    badge: 'PREMIUM',
    badgeColor: '#3B82F6',
    features: ['Đặt phòng real-time với lịch availability', 'Gallery 360° virtual tour', 'Giới thiệu loại phòng & tiện nghi', 'Tích hợp Booking.com, Agoda, AirBnB', 'Bản đồ điểm tham quan xung quanh', 'Đa ngôn ngữ (VI/EN/ZH)', 'Chatbot 24/7 tư vấn', 'CMS quản lý giá phòng theo ngày'],
    demoFeatures: ['Đặt phòng', 'Virtual tour 360°', 'Đa ngôn ngữ'],
    previewImg: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    category: 'lưu trú',
    lp: 745,
  },
  {
    id: 'gym',
    industry: 'Web Gym & Fitness',
    icon: '💪',
    color: '#EF4444',
    gradFrom: '#EF4444',
    gradTo: '#F97316',
    tagline: 'Lịch tập · Đăng ký thành viên · PTv',
    description: 'Website gym năng động với lịch tập hàng tuần, đăng ký gói thành viên, hồ sơ huấn luyện viên và tracking kết quả.',
    trialDays: 3,
    trialPrice: 0,
    fullPrice: 8_900_000,
    activateTime: '2 giờ',
    features: ['Lịch tập lớp nhóm hàng tuần', 'Đăng ký gói thành viên online', 'Hồ sơ huấn luyện viên PT', 'Gallery thiết bị & không gian', 'Tracking tiến độ tập luyện', 'Blog dinh dưỡng & thể hình', 'Chương trình referral', 'App mobile companion (add-on)'],
    demoFeatures: ['Lịch tập', 'Đăng ký thành viên', 'Hồ sơ PT'],
    previewImg: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    category: 'sức khỏe',
    lp: 445,
  },
  {
    id: 'bat-dong-san',
    industry: 'Web Bất động sản',
    icon: '🏠',
    color: '#14B8A6',
    gradFrom: '#14B8A6',
    gradTo: '#818CF8',
    tagline: 'Tìm kiếm BĐS · Virtual tour · CRM',
    description: 'Website bất động sản chuyên nghiệp với công cụ tìm kiếm thông minh, virtual tour 360°, bản đồ tích hợp và CRM quản lý leads.',
    trialDays: 5,
    trialPrice: 0,
    fullPrice: 18_900_000,
    activateTime: '6 giờ',
    badge: 'ENTERPRISE',
    badgeColor: '#14B8A6',
    features: ['Tìm kiếm BĐS theo bộ lọc nâng cao', 'Virtual tour 360° từng căn', 'Bản đồ tích hợp Google Maps', 'CRM quản lý leads tự động', 'Tính toán trả góp ngân hàng', 'So sánh căn hộ side-by-side', 'Form đặt cọc & hợp đồng online', 'Dashboard báo cáo môi giới'],
    demoFeatures: ['Tìm kiếm BĐS', 'Bản đồ', 'CRM leads'],
    previewImg: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80',
    category: 'bất động sản',
    lp: 945,
  },
  {
    id: 'phong-kham',
    industry: 'Web Phòng khám',
    icon: '🏥',
    color: '#06B6D4',
    gradFrom: '#06B6D4',
    gradTo: '#22C55E',
    tagline: 'Đặt lịch khám · Hồ sơ bác sĩ · Tư vấn',
    description: 'Website phòng khám chuyên nghiệp với hệ thống đặt lịch khám, hồ sơ bác sĩ, tư vấn online và quản lý hồ sơ bệnh nhân.',
    trialDays: 3,
    trialPrice: 0,
    fullPrice: 12_900_000,
    activateTime: '4 giờ',
    features: ['Đặt lịch khám online (số thứ tự)', 'Hồ sơ bác sĩ & chuyên khoa', 'Tư vấn video call', 'Kết quả xét nghiệm online', 'Nhắc lịch khám qua SMS/Zalo', 'Blog sức khỏe chuyên ngành', 'Chứng nhận & giấy phép hiển thị', 'Báo giá dịch vụ y tế minh bạch'],
    demoFeatures: ['Đặt lịch khám', 'Hồ sơ bác sĩ', 'Tư vấn online'],
    previewImg: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    category: 'sức khỏe',
    lp: 645,
  },
  {
    id: 'thoi-trang',
    industry: 'Web Shop Thời trang',
    icon: '👗',
    color: '#EC4899',
    gradFrom: '#EC4899',
    gradTo: '#C084FC',
    tagline: 'Catalog · Giỏ hàng · Size guide',
    description: 'Website thời trang sành điệu với catalog sản phẩm, giỏ hàng, size guide, lookbook và tích hợp thanh toán online.',
    trialDays: 5,
    trialPrice: 0,
    fullPrice: 9_900_000,
    activateTime: '2 giờ',
    features: ['Catalog sản phẩm + bộ lọc thông minh', 'Giỏ hàng & checkout an toàn', 'Size guide tương tác', 'Lookbook & outfit inspirations', 'Wish list & so sánh sản phẩm', 'Tích hợp VNPAY/MoMo/ZaloPay', 'Flash sale countdown timer', 'Loyalty points tích điểm'],
    demoFeatures: ['Catalog + filter', 'Giỏ hàng', 'Thanh toán online'],
    previewImg: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    category: 'mua sắm',
    lp: 495,
  },
  {
    id: 'truong-hoc',
    industry: 'Web Trường học & Trung tâm',
    icon: '🎓',
    color: '#818CF8',
    gradFrom: '#818CF8',
    gradTo: '#3B82F6',
    tagline: 'Tuyển sinh · Khóa học · E-learning',
    description: 'Website giáo dục chuyên nghiệp với thông tin tuyển sinh, giới thiệu khóa học, hồ sơ giáo viên và nền tảng học online cơ bản.',
    trialDays: 5,
    trialPrice: 0,
    fullPrice: 11_900_000,
    activateTime: '4 giờ',
    features: ['Tuyển sinh online & tư vấn học phí', 'Catalog khóa học đầy đủ', 'Hồ sơ giáo viên & thành tích', 'Video bài giảng demo', 'E-learning module cơ bản', 'Phụ huynh theo dõi tiến trình', 'Lịch khai giảng & sự kiện', 'Hệ thống học bổng online'],
    demoFeatures: ['Tuyển sinh online', 'Khóa học', 'E-learning'],
    previewImg: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80',
    category: 'giáo dục',
    lp: 595,
  },
];

const CATEGORIES = ['tất cả', 'ăn uống', 'sức khỏe', 'lưu trú', 'mua sắm', 'giáo dục', 'bất động sản'] as const;
type Category = typeof CATEGORIES[number];

// ── Trial/Buy Modal ────────────────────────────────────────────────────────────

function PackageModal({ pkg, onClose }: { pkg: WebPackage; onClose: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState<'detail' | 'trial' | 'buy' | 'success'>('detail');
  const [flowType, setFlowType] = useState<'trial' | 'buy'>('trial');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleTrial = () => { setFlowType('trial'); setStep('trial'); };
  const handleBuy = () => { setFlowType('buy'); setStep('buy'); };
  const handleConfirm = () => setStep('success');

  const faqs = [
    { q: t('services.faqQ1'), a: t('services.faqA1', { days: pkg.trialDays }) },
    { q: t('services.faqQ2'), a: t('services.faqA2') },
    { q: t('services.faqQ3'), a: t('services.faqA3') },
    { q: t('services.faqQ4'), a: t('services.faqA4') },
  ];

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(16px)' }} />
      <motion.div className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{ background: DS.bgCard, border: `1px solid ${pkg.color}35`, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: `0 0 80px ${pkg.color}20` }}
        initial={{ scale: 0.93, y: 30 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}>

        {/* Hero image */}
        <div className="relative flex-shrink-0" style={{ height: 180, overflow: 'hidden' }}>
          <img src={pkg.previewImg} alt={pkg.industry} className="w-full h-full object-cover" />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${pkg.gradFrom}30, rgba(15,23,42,0.95))` }} />
          <button onClick={onClose} className="absolute top-4 right-4"
            style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(4px)' }}>
            <X size={16} />
          </button>
          {pkg.badge && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full"
              style={{ background: `${pkg.badgeColor}20`, border: `1px solid ${pkg.badgeColor}50`, backdropFilter: 'blur(8px)' }}>
              <span style={{ color: pkg.badgeColor, fontSize: 9, fontFamily: DS.mono, fontWeight: 700 }}>{pkg.badge}</span>
            </div>
          )}
          <div className="absolute bottom-4 left-5">
            <div style={{ fontSize: 28 }}>{pkg.icon}</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>{pkg.industry}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{pkg.tagline}</div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'detail' && (
              <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-5">
                {/* Trial badge */}
                <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: `${pkg.color}0A`, border: `1px solid ${pkg.color}30` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${pkg.color}20` }}>
                    <CalendarClock size={20} style={{ color: pkg.color }} />
                  </div>
                  <div className="flex-1">
                    <div style={{ color: pkg.color, fontSize: 13, fontWeight: 700 }}>{t('services.modalFreeTrial', { days: pkg.trialDays })}</div>
                    <div style={{ color: DS.text4, fontSize: 11 }}>{t('services.modalActivate', { time: pkg.activateTime })}</div>
                  </div>
                  <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, background: 'rgba(34,197,94,0.12)', padding: '4px 10px', borderRadius: 8 }}>FREE</div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>{t('services.modalTrialSection')}</div>
                    <div style={{ color: DS.green, fontSize: 24, fontWeight: 900 }}>{t('services.modalTrialFree')}</div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>{t('services.modalTrialDays', { days: pkg.trialDays, time: pkg.activateTime })}</div>
                  </div>
                  <div className="p-4 rounded-2xl text-center" style={{ background: `${pkg.color}08`, border: `1px solid ${pkg.color}30` }}>
                    <div style={{ color: pkg.color, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>{t('services.modalFullSection')}</div>
                    <div style={{ color: pkg.color, fontSize: 20, fontWeight: 900 }}>{new Intl.NumberFormat('vi-VN').format(pkg.fullPrice)}</div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>{t('services.modalFullWarranty')}</div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>{t('services.modalFeatures')} ({pkg.features.length})</div>
                  <div className="grid grid-cols-2 gap-2">
                    {pkg.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check size={11} style={{ color: pkg.color, flexShrink: 0, marginTop: 2 }} />
                        <span style={{ color: DS.text3, fontSize: 12 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAQ */}
                <div>
                  <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 10 }}>FAQ</div>
                  <div className="space-y-1.5">
                    {faqs.map((faq, i) => (
                      <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
                        <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="w-full flex items-center justify-between px-4 py-3"
                          style={{ background: DS.bgCard2, border: 'none', cursor: 'pointer', color: DS.text3, fontSize: 13, textAlign: 'left' }}>
                          <span>{faq.q}</span>
                          {openFaq === i ? <ChevronUp size={14} style={{ color: DS.text5 }} /> : <ChevronDown size={14} style={{ color: DS.text5 }} />}
                        </button>
                        <AnimatePresence>
                          {openFaq === i && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                              <div className="px-4 py-3" style={{ background: DS.bgCard, borderTop: `1px solid ${DS.border}` }}>
                                <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.7 }}>{faq.a}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LP note */}
                <div className="p-3 rounded-xl" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)' }}>
                  <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono }}>{t('services.formLPReward')}: </span>
                  <span style={{ color: DS.text4, fontSize: 12 }}>{t('services.formLPRewardMsg', { lp: pkg.lp.toLocaleString() })}</span>
                </div>
              </motion.div>
            )}

            {(step === 'trial' || step === 'buy') && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6 space-y-4">
                <div style={{ color: DS.text, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {step === 'trial' ? t('services.modalTrialActivate', { days: pkg.trialDays }) : t('services.modalBuyActivate', { price: new Intl.NumberFormat('vi-VN').format(pkg.fullPrice) })}
                </div>
                <div style={{ color: DS.text4, fontSize: 12, marginBottom: 16 }}>
                  {step === 'trial' ? t('services.modalTrialSub', { time: pkg.activateTime }) : t('services.modalBuySub')}
                </div>
                <div className="space-y-3">
                  {[
                    { label: t('services.formName'), placeholder: t('services.formNamePlaceholder') },
                    { label: t('services.formPhone'), placeholder: t('services.formPhonePlaceholder') },
                    { label: t('services.formEmail'), placeholder: t('services.formEmailPlaceholder') },
                    { label: t('services.formBusiness'), placeholder: t('services.formBusinessPlaceholder', { name: pkg.industry.replace('Web ', '') }) },
                    ...(step === 'buy' ? [{ label: t('services.formDomain'), placeholder: t('services.formDomainPlaceholder') }] : []),
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 5 }}>{f.label.toUpperCase()}</label>
                      <input placeholder={f.placeholder}
                        style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 14px', color: DS.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep('detail')}
                    style={{ padding: '12px 16px', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 12, color: DS.text3, cursor: 'pointer', fontSize: 13 }}>
                    ← {t('services.formBack')}
                  </button>
                  <button onClick={handleConfirm}
                    style={{ flex: 1, background: step === 'trial' ? 'linear-gradient(135deg, #22C55E, #14B8A6)' : GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                    {step === 'trial' ? `✓ ${t('services.formConfirmTrial')}` : `✓ ${t('services.formConfirmBuy')}`}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center">
                <motion.div style={{ fontSize: 56, marginBottom: 16 }}
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 0.6 }}>
                  {flowType === 'trial' ? '🎉' : '🚀'}
                </motion.div>
                <div style={{ color: DS.text, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                  {flowType === 'trial' ? t('services.formSuccessTrial') : t('services.formSuccessBuy')}
                </div>
                <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.8, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
                  {flowType === 'trial'
                    ? t('services.formSuccessTrialMsg', { time: pkg.activateTime })
                    : t('services.formSuccessBuyMsg')}
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={onClose}
                    style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                    {t('services.formDone')}
                  </button>
                  <Link to="/dat-lich" onClick={onClose}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 12, background: DS.bgCard2, border: `1px solid ${DS.border}`, color: DS.text3, fontSize: 13, textDecoration: 'none' }}>
                    <Phone size={13} /> {t('services.formBookConsult')}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky footer CTAs */}
        {step === 'detail' && (
          <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: `1px solid ${DS.border}`, background: DS.bgCard }}>
            <button onClick={handleTrial}
              className="flex items-center justify-center gap-2"
              style={{ flex: 1, background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,184,166,0.15))', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 12, padding: '13px', cursor: 'pointer', color: DS.green, fontSize: 14, fontWeight: 700 }}>
              <Play size={14} /> {t('services.pkgTrial', { days: pkg.trialDays })}
            </button>
            <button onClick={handleBuy}
              className="flex items-center justify-center gap-2"
              style={{ flex: 1, background: GRD.primary, border: 'none', borderRadius: 12, padding: '13px', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 700, boxShadow: `0 0 24px ${pkg.color}30` }}>
              <ShoppingCart size={14} /> {t('services.pkgBuyNow')}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Package Card ───────────────────────────────────────────────────────────────

function PackageCard({ pkg, layout, onClick }: { pkg: WebPackage; layout: 'grid' | 'list'; onClick: () => void }) {
  const { t } = useI18n();

  if (layout === 'list') {
    return (
      <motion.div onClick={onClick}
        className="flex items-center gap-5 p-4 rounded-2xl cursor-pointer"
        style={{ background: DS.bgCard, borderWidth: 1, borderStyle: 'solid', borderColor: DS.border, boxShadow: '0 0 0px rgba(0,0,0,0)' }}
        whileHover={{ borderColor: hexRgba(pkg.color, 0.271), x: 4, boxShadow: `0 4px 24px ${hexRgba(pkg.color, 0.071)}` }}>
        <div className="relative flex-shrink-0" style={{ width: 72, height: 56, borderRadius: 12, overflow: 'hidden' }}>
          <img src={pkg.previewImg} alt={pkg.industry} className="w-full h-full object-cover" />
          <div style={{ position: 'absolute', inset: 0, background: `${pkg.gradFrom}30` }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 22 }}>{pkg.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{pkg.industry}</span>
            {pkg.badge && <span style={{ color: pkg.badgeColor, fontSize: 8, fontFamily: DS.mono, background: `${pkg.badgeColor}18`, padding: '1px 6px', borderRadius: 6 }}>{pkg.badge}</span>}
          </div>
          <div style={{ color: DS.text5, fontSize: 11, marginBottom: 4 }}>{pkg.tagline}</div>
          <div className="flex items-center gap-3">
            <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono, background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5 }}>{t('services.pkgTrialBadge', { days: pkg.trialDays })}</span>
            <span style={{ color: DS.text5, fontSize: 10 }}>{t('services.pkgActivate', { time: pkg.activateTime })}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div style={{ color: pkg.color, fontSize: 15, fontWeight: 800 }}>{new Intl.NumberFormat('vi-VN').format(pkg.fullPrice)}</div>
          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{t('services.pkgPrice')}</div>
        </div>
        <ChevronRight size={16} style={{ color: DS.text5, flexShrink: 0 }} />
      </motion.div>
    );
  }

  return (
    <motion.div onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer relative group"
      style={{ background: DS.bgCard, borderWidth: 1, borderStyle: 'solid', borderColor: DS.border, boxShadow: '0 0 0px rgba(0,0,0,0)' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ borderColor: hexRgba(pkg.color, 0.314), boxShadow: `0 12px 48px ${hexRgba(pkg.color, 0.094)}`, y: -4 }}>

      {/* Preview image */}
      <div className="relative" style={{ height: 140, overflow: 'hidden' }}>
        <img src={pkg.previewImg} alt={pkg.industry} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${pkg.gradFrom}20, rgba(15,23,42,0.92))` }} />

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {pkg.badge && (
            <span style={{ color: pkg.badgeColor, fontSize: 8, fontFamily: DS.mono, fontWeight: 700, background: `${pkg.badgeColor}20`, border: `1px solid ${pkg.badgeColor}40`, padding: '2px 7px', borderRadius: 8, backdropFilter: 'blur(6px)' }}>
              {pkg.badge}
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span style={{ color: DS.green, fontSize: 9, fontFamily: DS.mono, fontWeight: 700, background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.4)', padding: '2px 7px', borderRadius: 8, backdropFilter: 'blur(6px)' }}>
            {t('services.pkgTrialBadge', { days: pkg.trialDays }).toUpperCase()}
          </span>
        </div>

        {/* Icon */}
        < <div className="absolute bottom-3 left-4">
          <span style={{ fontSize: 28, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>{pkg.icon}</span>
        </div>
      </div>

      <div className="p-4">
        <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{pkg.industry}</div>
        <div style={{ color: DS.text5, fontSize: 11, marginBottom: 12 }}>{pkg.tagline}</div>

        {/* Demo features pills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {pkg.demoFeatures.map(f => (
            <span key={f} style={{ color: pkg.color, fontSize: 9, fontFamily: DS.mono, background: `${pkg.color}10`, border: `1px solid ${pkg.color}25`, padding: '2px 7px', borderRadius: 5 }}>{f}</span>
          ))}
        </div>

        {/* Price row */}
        <div className="flex items-end justify-between pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginBottom: 1 }}>{t('services.pkgFull')}</div>
            <div style={{ color: pkg.color, fontSize: 15, fontWeight: 800 }}>
              {new Intl.NumberFormat('vi-VN').format(pkg.fullPrice)} <span style={{ fontSize: 10, fontFamily: DS.mono }}>VNĐ</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ background: `${pkg.color}12`, border: `1px solid ${pkg.color}30` }}>
            <Eye size={12} style={{ color: pkg.color }} />
            <span style={{ color: pkg.color, fontSize: 11, fontWeight: 700 }}>{t('services.pkgViewDetails')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Services Page ─────────────────────────────────────────────────────────

const PAGE_TABS = ['tabWebPackage', 'tabCustom', 'tabPricing'] as const;
type PageTab = typeof PAGE_TABS[number];

export default function ServicesPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<PageTab>('tabWebPackage');
  const [category, setCategory] = useState<Category>('tất cả');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [selectedPkg, setSelectedPkg] = useState<WebPackage | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');

  const filtered = WEB_PACKAGES
    .filter(p => category === 'tất cả' || p.category === category)
    .sort((a, b) => {
      if (sortBy === 'popular') return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      if (sortBy === 'price-asc') return a.fullPrice - b.fullPrice;
      return b.fullPrice - a.fullPrice;
    });

  const popularCount = WEB_PACKAGES.filter(p => p.popular).length;

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64, minHeight: '100vh' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(29,78,216,0.1) 0%, rgba(129,140,248,0.04) 60%, transparent 100%)' }}>
        {/* Animated grid background */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div className="max-w-4xl mx-auto relative">
          <motion.div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles size={11} style={{ color: DS.blue }} />
            <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.22em' }}>WEBSITE DOANH NGHIỆP KÍCH HOẠT NGAY</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontFamily: DS.heading, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: '0.04em', marginBottom: 16 }}>
            <span style={{ background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DỊCH VỤ</span>
            {' '}
            <span style={{ background: `linear-gradient(135deg, #3B82F6, #818CF8, #14B8A6)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WEB GÓI</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ color: DS.text3, fontSize: 16, lineHeight: 1.8, marginBottom: 20, maxWidth: 560, margin: '0 auto 20px' }}>
            Website doanh nghiệp sẵn sàng theo ngành — dùng thử <strong style={{ color: DS.green }}>3-5 ngày MIỄN PHÍ</strong>, kích hoạt trong <strong style={{ color: DS.blue }}>2 giờ</strong>, giá cố định minh bạch.
          </motion.p>

          {/* Quick stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mb-10">
            {[
              { val: `${WEB_PACKAGES.length}`, labelKey: 'services.statsTypes', color: DS.blue, icon: '🌐' },
              { val: 'FREE', labelKey: 'services.statsFreeTrial', color: DS.green, icon: '🎯' },
              { val: '2 giờ', labelKey: 'services.statsActivation', color: DS.amber, icon: '⚡' },
              { val: '100%', labelKey: 'services.statsFixedPrice', color: DS.purple, icon: '✅' },
            ].map(s => (
              <div key={s.labelKey} className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                <span>{s.icon}</span>
                <span style={{ color: s.color, fontFamily: DS.mono, fontSize: 13, fontWeight: 800 }}>{s.val}</span>
                <span style={{ color: DS.text5, fontSize: 11 }}>{t(s.labelKey)}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TAB NAV ──────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 px-6 py-3" style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${DS.border}` }}>
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          {PAGE_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '7px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${activeTab === tab ? DS.blue + '50' : DS.border}`, background: activeTab === tab ? 'rgba(59,130,246,0.12)' : 'none', color: activeTab === tab ? DS.blue : DS.text4, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              {tab === 'tabWebPackage' && <Zap size={12} style={{ display: 'inline', marginRight: 5, marginBottom: -1 }} />}
              {t(`services.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── TAB: GÓI WEB DOANH NGHIỆP ─────────────────────────────────── */}
        {activeTab === 'tabWebPackage' && (
          <motion.section key="goi-web" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-10 px-6">
            <div className="max-w-6xl mx-auto">

              {/* Toolbar */}
              <div className="flex flex-col gap-4 mb-8">
                {/* Category filter */}
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const count = cat === 'tất cả' ? WEB_PACKAGES.length : WEB_PACKAGES.filter(p => p.category === cat).length;
                    const catKey: Record<Category, string> = {
                      'tất cả': 'services.catAll',
                      'ăn uống': 'services.catFood',
                      'sức khỏe': 'services.catHealth',
                      'lưu trú': 'services.catLodging',
                      'mua sắm': 'services.catRetail',
                      'giáo dục': 'services.catEducation',
                      'bất động sản': 'services.catRealEstate',
                    };
                    return (
                      <motion.button key={cat} onClick={() => setCategory(cat)}
                        style={{ padding: '6px 16px', borderRadius: 20, fontSize: 12, fontFamily: DS.mono, cursor: 'pointer', border: `1px solid ${category === cat ? DS.blue : DS.border}`, background: category === cat ? 'rgba(59,130,246,0.12)' : 'none', color: category === cat ? DS.blue : DS.text5 }}
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                        {t(catKey[cat])} ({count})
                      </motion.button>
                    );
                  })}
                </div>

                {/* Sort + layout */}
                <div className="flex items-center gap-3">
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: '6px 12px', color: DS.text4, fontSize: 12, fontFamily: DS.mono, outline: 'none', cursor: 'pointer' }}>
                    <option value="popular">{t('services.sortPopular')}</option>
                    <option value="price-asc">{t('services.sortPriceAsc')}</option>
                    <option value="price-desc">{t('services.sortPriceDesc')}</option>
                  </select>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => setLayout('grid')}
                      style={{ padding: '7px 10px', borderRadius: 8, background: layout === 'grid' ? 'rgba(59,130,246,0.12)' : 'none', border: `1px solid ${layout === 'grid' ? DS.blue + '40' : DS.border}`, color: layout === 'grid' ? DS.blue : DS.text5, cursor: 'pointer' }}>
                      <LayoutGrid size={14} />
                    </button>
                    <button onClick={() => setLayout('list')}
                      style={{ padding: '7px 10px', borderRadius: 8, background: layout === 'list' ? 'rgba(59,130,246,0.12)' : 'none', border: `1px solid ${layout === 'list' ? DS.blue + '40' : DS.border}`, color: layout === 'list' ? DS.blue : DS.text5, cursor: 'pointer' }}>
                      <List size={14} />
                    </button>
                  </div>
                  <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>{filtered.length} {t('services.statsTypes').toLowerCase()}</span>
                </div>
              </div>

              {/* Package grid/list */}
              {layout === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((pkg, i) => (
                    <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <PackageCard pkg={pkg} layout="grid" onClick={() => setSelectedPkg(pkg)} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((pkg, i) => (
                    <motion.div key={pkg.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <PackageCard pkg={pkg} layout="list" onClick={() => setSelectedPkg(pkg)} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Bottom CTA banner */}
              <motion.div className="mt-12 rounded-3xl p-8 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(129,140,248,0.08))', border: '1px solid rgba(129,140,248,0.25)' }}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 10 }}>{t('services.ctaNotFound')}</div>
                <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, marginBottom: 10 }}>{t('services.ctaCustomDesign')}</h3>
                <p style={{ color: DS.text3, fontSize: 14, marginBottom: 20 }}>{t('services.ctaCustomDesc')}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/dat-lich" style={{ background: GRD.primary, color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={14} /> {t('services.ctaFreeConsult')}
                  </Link>
                  <button onClick={() => setActiveTab('tabCustom')}
                    style={{ padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: `1px solid ${DS.border}`, color: DS.text3, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {t('services.ctaViewCustom')} <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ── TAB: DỊCH VỤ TÙY CHỈNH ──────────────────────────────────── */}
        {activeTab === 'tabCustom' && (
          <motion.section key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-10 px-6">
            <div className="max-w-6xl mx-auto space-y-10">
              {[
                { id: 'thiet-ke-web', icon: <Globe size={28} />, title: 'Thiết kế & Phát triển Website', desc: 'Website cao cấp, tối ưu tốc độ và trải nghiệm người dùng. Mỗi dự án thiết kế riêng theo thương hiệu, đảm bảo Core Web Vitals ≥ 90 và chuyển đổi tối đa.', features: ['Thiết kế UI/UX độc đáo', 'Responsive 100% thiết bị', 'Core Web Vitals ≥ 90', 'SEO on-page tích hợp', 'Bàn giao source code', 'Bảo hành 6 tháng'], priceFrom: 15_000_000, priceTo: 200_000_000, color: DS.blue, image: 'https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=600&q=80', tags: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] },
                { id: 'phat-trien-app', icon: <Code2 size={28} />, title: 'Phát triển App & Nền tảng SaaS', desc: 'Từ MVP đến enterprise. Ứng dụng mobile, web app và SaaS với kiến trúc scalable, sẵn sàng cho hàng triệu người dùng.', features: ['Phân tích & thiết kế kiến trúc', 'React Native / Flutter', 'API & Microservices', 'Database design', 'CI/CD pipeline', 'SLA 99.9% uptime'], priceFrom: 80_000_000, priceTo: 1_000_000_000, color: DS.purple, image: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=600&q=80', tags: ['React Native', 'Node.js', 'PostgreSQL', 'AWS'] },
                { id: 'dashboard', icon: <BarChart3 size={28} />, title: 'Dashboard & Data Analytics', desc: 'Biến dữ liệu thành insight. Real-time dashboard, báo cáo tự động và data visualization.', features: ['Dashboard real-time', 'Data visualization', 'Báo cáo tự động', 'Tích hợp nguồn dữ liệu', 'Alert & notification', 'Export PDF/Excel'], priceFrom: 25_000_000, priceTo: 300_000_000, color: DS.cyan, image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80', tags: ['React', 'D3.js', 'Python', 'BigQuery'] },
                { id: 'seo', icon: <TrendingUp size={28} />, title: 'SEO & Digital Marketing', desc: 'Tăng trưởng organic bền vững. Technical SEO audit, content strategy và Google Ads management.', features: ['Audit SEO kỹ thuật', 'Content strategy', 'On-page optimization', 'Link building', 'Google Ads management', 'Monthly reporting'], priceFrom: 8_000_000, priceTo: 50_000_000, color: DS.green, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80', tags: ['SEMrush', 'Ahrefs', 'Google Analytics 4'] },
              ].map((svc, i) => (
                <motion.div key={svc.id}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch rounded-3xl overflow-hidden"
                  style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}>
                  <div className={i % 2 === 1 ? 'lg:order-2' : ''} style={{ height: 300, overflow: 'hidden' }}>
                    <img src={svc.image} alt={svc.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div className={`p-8 flex flex-col ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}30` }}>
                      <span style={{ color: svc.color }}>{svc.icon}</span>
                    </div>
                    <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: '0.04em', marginBottom: 10 }}>{svc.title}</h2>
                    <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>{svc.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {svc.tags.map(t => (
                        <span key={t} style={{ color: svc.color, fontSize: 10, fontFamily: DS.mono, padding: '2px 8px', borderRadius: 4, background: `${svc.color}12`, border: `1px solid ${svc.color}25` }}>{t}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {svc.features.map(f => (
                        <div key={f} className="flex items-center gap-1.5">
                          <Check size={11} style={{ color: svc.color, flexShrink: 0 }} />
                          <span style={{ color: DS.text3, fontSize: 11 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div>
                        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{t('services.customPriceFrom')}</div>
                        <div style={{ color: svc.color, fontSize: 16, fontWeight: 800 }}>{fmtVND(svc.priceFrom)}</div>
                      </div>
                      <Link to="/dat-lich" style={{ display: 'flex', alignItems: 'center', gap: 7, background: GRD.primary, color: '#fff', padding: '10px 18px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                        {t('services.customConsult')} <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── TAB: BẢNG GIÁ ────────────────────────────────────────────── */}
        {activeTab === 'tabPricing' && (
          <motion.section key="pricing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-10 px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <h2 style={{ fontFamily: DS.heading, fontSize: 28, fontWeight: 900, color: DS.text, marginBottom: 8 }}>{t('services.pricingHeader')}</h2>
                <p style={{ color: DS.text3, fontSize: 14 }}>{t('services.pricingSubheader')}</p>
              </div>

              {/* Web Package pricing table */}
              <div className="rounded-3xl overflow-hidden mb-8" style={{ border: `1px solid ${DS.border}` }}>
                <div className="px-6 py-4" style={{ background: DS.bgCard2, borderBottom: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── {t('services.webSectionLabel')}</span>
                </div>
                <div style={{ background: DS.bgCard }}>
                  {WEB_PACKAGES.map((pkg, i) => (
                    <div key={pkg.id} className="flex items-center gap-4 px-6 py-4"
                      style={{ borderBottom: i < WEB_PACKAGES.length - 1 ? `1px solid ${DS.border}` : 'none' }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{pkg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{pkg.industry}</div>
                        <div style={{ color: DS.text5, fontSize: 11 }}>{pkg.tagline}</div>
                      </div>
                      <div className="text-center px-4 flex-shrink-0">
                        <div style={{ color: DS.green, fontSize: 11, fontWeight: 700, fontFamily: DS.mono }}>{t('services.webTableTrial')}</div>
                        <div style={{ color: DS.text5, fontSize: 9 }}>{t('services.webTableTrialDays', { days: pkg.trialDays })}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div style={{ color: pkg.color, fontSize: 14, fontWeight: 800 }}>{new Intl.NumberFormat('vi-VN').format(pkg.fullPrice)}</div>
                        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>{t('services.pkgPrice')}</div>
                      </div>
                      <button onClick={() => setSelectedPkg(pkg)}
                        style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 8, background: `${pkg.color}12`, border: `1px solid ${pkg.color}30`, color: pkg.color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        {t('services.webTableSee')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom services pricing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { name: 'planStarter', price: '15,000,000', subKey: 'services.planStarterSub', color: DS.text4, featureKey: 'services.planStarterFeatures', ctaKey: 'services.planStartNow', lp: 750, popular: false },
                  { name: 'planBusiness', price: '45,000,000', subKey: 'services.planBusinessSub', color: DS.blue, featureKey: 'services.planBusinessFeatures', ctaKey: 'services.planChooseBusiness', lp: 2250, popular: true },
                  { name: 'planEnterprise', priceKey: 'planCustomPrice', subKey: 'services.planEnterpriseSub', color: DS.purple, featureKey: 'services.planEnterpriseFeatures', ctaKey: 'services.planContactConsult', lp: 0, popular: false },
                ].map(plan => (
                  <motion.div key={plan.name}
                    className="rounded-3xl p-6 relative"
                    style={{ background: plan.popular ? `linear-gradient(135deg, ${DS.blue}12, rgba(129,140,248,0.08))` : DS.bgCard, border: `2px solid ${plan.popular ? DS.blue + '50' : DS.border}` }}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2" style={{ transform: 'translateX(-50%)', background: GRD.primary, color: '#fff', fontSize: 9, fontFamily: DS.mono, fontWeight: 700, padding: '3px 14px', borderRadius: 20 }}>
                        {t('services.planPopular')}
                      </div>
                    )}
                    <div style={{ color: plan.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700, marginBottom: 4 }}>{t(`services.${plan.name}`)}</div>
                    <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{plan.price ?? t(`services.${plan.priceKey}`)}</div>
                    {(plan.price) && <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>{t('services.planVND')}</div>}
                    <div style={{ color: DS.text4, fontSize: 12, marginBottom: 16 }}>{t(plan.subKey)}</div>
                    <div className="space-y-2 mb-6">
                      {t(plan.featureKey).split(', ').map((f: string) => (
                        <div key={f} className="flex items-center gap-2">
                          <Check size={11} style={{ color: plan.color, flexShrink: 0 }} />
                          <span style={{ color: DS.text3, fontSize: 12 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    {plan.lp > 0 && <div style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, marginBottom: 12 }}>{t('services.planLPReward', { lp: plan.lp.toLocaleString() })}</div>}
                    <Link to="/dat-lich"
                      style={{ display: 'block', textAlign: 'center', background: plan.popular ? GRD.primary : 'none', border: plan.popular ? 'none' : `1px solid ${DS.border}`, color: plan.popular ? '#fff' : DS.text3, padding: '11px', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                      {t(plan.ctaKey)}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* LP info */}
              <div className="mt-8 p-6 rounded-3xl text-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(129,140,248,0.06))', border: '1px solid rgba(129,140,248,0.25)' }}>
                <div style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 8 }}>{t('services.lpProgram')}</div>
                <div className="flex flex-wrap justify-center gap-6">
                  {[{ val: '50 LP', labelKey: 'services.lpPerMillion', color: DS.blue }, { val: '500 LP', labelKey: 'services.lpReferral', color: DS.purple }, { val: '20%', labelKey: 'services.lpMaxDiscount', color: DS.cyan }].map(s => (
                    <div key={s.labelKey} className="text-center">
                      <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 900 }}>{s.val}</div>
                      <div style={{ color: DS.text4, fontSize: 11 }}>{t(s.labelKey)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {selectedPkg && (
          <PackageModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
