import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,
  ChevronRight, Users, Calendar, Layers, Sparkles, CreditCard,
  Zap, Star, Award, Clock, MapPin, Phone, Mail, Shield, X, Plus, Minus
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useLoopStore, type Order } from '../store/loopStore';

// ── Format helpers ────────────────────────────────────────────────────────
const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

// ── Data ─────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: 'web', icon: <Globe size={28} /> as ReactNode, title: 'Thiết kế & Phát triển Website', color: DS.blue,
    desc: 'Landing page, corporate site, e-commerce — chuẩn React/Next.js, tốc độ cao.',
    basePrice: 15_000_000,
  },
  {
    id: 'app', icon: <Code2 size={28} /> as ReactNode, title: 'Phát triển App & SaaS Platform', color: DS.purple,
    desc: 'Mobile app (React Native), web app, nền tảng SaaS cho doanh nghiệp.',
    basePrice: 80_000_000,
  },
  {
    id: 'dashboard', icon: <BarChart3 size={28} /> as ReactNode, title: 'Dashboard & Data Analytics', color: DS.cyan,
    desc: 'Real-time dashboard, báo cáo tự động, data visualization chuyên nghiệp.',
    basePrice: 25_000_000,
  },
  {
    id: 'seo', icon: <Target size={28} /> as ReactNode, title: 'SEO & Digital Marketing', color: DS.green,
    desc: 'Tăng trưởng organic, Google Ads, content strategy — gói tháng linh hoạt.',
    basePrice: 8_000_000,
    perMonth: true,
  },
];

const PACKAGES = [
  {
    id: 'starter', name: 'Starter', multiplier: 1, color: DS.text3,
    desc: 'Phù hợp cá nhân, startup giai đoạn đầu',
    features: ['Thiết kế cơ bản', 'Responsive design', 'SEO cơ bản', 'Bảo hành 3 tháng'],
    lp: 50,
  },
  {
    id: 'business', name: 'Business', multiplier: 2.2, color: DS.blue,
    desc: 'Doanh nghiệp vừa, sản phẩm cần scale',
    features: ['Thiết kế độc quyền', 'CMS tích hợp', 'Analytics dashboard', 'Bảo hành 6 tháng', 'Không giới hạn sửa'],
    lp: 120,
    popular: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', multiplier: 3.8, color: DS.purple,
    desc: 'Doanh nghiệp lớn, yêu cầu cao về tính năng',
    features: ['Tùy chỉnh hoàn toàn', 'API & Integrations', 'SLA 99.9%', 'Dedicated PM', 'Support 24/7', 'Bảo hành 12 tháng'],
    lp: 250,
  },
];

const FEATURE_OPTIONS: Record<string, { id: string; label: string; price: number; icon: ReactNode }[]> = {
  web: [
    { id: 'cms', label: 'Tích hợp CMS (Sanity/Contentful)', price: 5_000_000, icon: <Layers size={14} /> },
    { id: 'i18n', label: 'Đa ngôn ngữ (i18n)', price: 3_000_000, icon: <Globe size={14} /> },
    { id: 'ecom', label: 'E-commerce (giỏ hàng, thanh toán)', price: 12_000_000, icon: <CreditCard size={14} /> },
    { id: 'blog', label: 'Blog & Content module', price: 2_500_000, icon: <Star size={14} /> },
    { id: 'analytics', label: 'Analytics dashboard riêng', price: 4_000_000, icon: <BarChart3 size={14} /> },
  ],
  app: [
    { id: 'auth', label: 'Auth & User management', price: 6_000_000, icon: <Shield size={14} /> },
    { id: 'notification', label: 'Push notification', price: 3_500_000, icon: <Zap size={14} /> },
    { id: 'payment', label: 'Tích hợp thanh toán (VNPAY/Momo)', price: 8_000_000, icon: <CreditCard size={14} /> },
    { id: 'chat', label: 'In-app chat & messaging', price: 7_000_000, icon: <Users size={14} /> },
    { id: 'analytics', label: 'Analytics & event tracking', price: 4_000_000, icon: <BarChart3 size={14} /> },
  ],
  dashboard: [
    { id: 'realtime', label: 'Real-time data sync', price: 5_000_000, icon: <Zap size={14} /> },
    { id: 'export', label: 'Export PDF/Excel tự động', price: 3_000_000, icon: <Layers size={14} /> },
    { id: 'alert', label: 'Alert & notification system', price: 4_000_000, icon: <Star size={14} /> },
    { id: 'api', label: 'API & webhook integration', price: 6_000_000, icon: <Code2 size={14} /> },
    { id: 'ml', label: 'ML predictions & insights', price: 15_000_000, icon: <BarChart3 size={14} /> },
  ],
  seo: [
    { id: 'ads', label: 'Quản lý Google Ads', price: 3_000_000, icon: <Target size={14} /> },
    { id: 'content', label: 'Content marketing (4 bài/tháng)', price: 4_000_000, icon: <Star size={14} /> },
    { id: 'social', label: 'Social media management', price: 2_500_000, icon: <Users size={14} /> },
    { id: 'audit', label: 'Technical SEO audit monthly', price: 2_000_000, icon: <BarChart3 size={14} /> },
  ],
};

const TALENTS = [
  { id: 'akira', name: 'Akira Sato', role: 'Lead Full-stack Dev', rank: 'DIAMOND', rankColor: '#818CF8', rankSymbol: '✦', img: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=80&h=80&crop=faces', specialty: 'React, Node.js, AWS' },
  { id: 'yuna', name: 'Yuna Park', role: 'UI/UX Design Lead', rank: 'RUBY', rankColor: '#EF4444', rankSymbol: '♦', img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=80&h=80&crop=faces', specialty: 'Figma, Design Systems' },
  { id: 'shin', name: 'Shin Watanabe', role: 'DevOps & Backend', rank: 'DIAMOND', rankColor: '#818CF8', rankSymbol: '✦', img: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=80&h=80&crop=faces', specialty: 'Docker, K8s, Rust' },
  { id: 'mei', name: 'Mei Lin', role: 'Mobile & SEO Expert', rank: 'RUBY', rankColor: '#EF4444', rankSymbol: '♦', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&crop=faces', specialty: 'React Native, SEO' },
];

const EXTRAS = [
  { id: 'hosting', label: 'Hosting & Domain 1 năm', price: 3_000_000, icon: <Globe size={16} />, color: DS.blue },
  { id: 'maintenance', label: 'Bảo trì & cập nhật 1 năm', price: 5_000_000, icon: <Shield size={16} />, color: DS.green },
  { id: 'analytics-setup', label: 'Setup Google Analytics 4', price: 1_500_000, icon: <BarChart3 size={16} />, color: DS.cyan },
  { id: 'training', label: 'Training & hướng dẫn sử dụng (3 buổi)', price: 2_000_000, icon: <Users size={16} />, color: DS.purple },
  { id: 'priority', label: 'Priority support 24/7 (6 tháng)', price: 4_500_000, icon: <Zap size={16} />, color: DS.amber },
  { id: 'seo-basic', label: 'SEO cơ bản & submission', price: 1_200_000, icon: <Target size={16} />, color: DS.red },
];

const STEP_LABELS = [
  'Dịch vụ', 'Gói', 'Tính năng', 'Team', 'Lịch', 'Thêm', 'Xem lại', 'Thanh toán'
];

// ── Progress Bar ───────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full" style={{ padding: '20px 0' }}>
      <div className="flex items-center justify-between max-w-3xl mx-auto px-4">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-col items-center" style={{ flex: i < 7 ? 1 : 'none' }}>
            <div className="flex items-center w-full">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: i < step ? GRD.primary : i === step ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                  border: i === step ? '2px solid #3B82F6' : i < step ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  boxShadow: i === step ? '0 0 16px rgba(59,130,246,0.5)' : 'none',
                }}
              >
                {i < step ? (
                  <Check size={13} style={{ color: '#fff' }} />
                ) : (
                  <span style={{ color: i === step ? DS.blue : DS.text5, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{i + 1}</span>
                )}
              </div>
              {i < 7 && (
                <div className="flex-1 h-0.5 mx-1" style={{ background: i < step ? GRD.primary : 'rgba(255,255,255,0.06)' }} />
              )}
            </div>
            <div style={{ color: i === step ? DS.blue : i < step ? DS.text4 : DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 6, letterSpacing: '0.08em', textAlign: 'center' }}>
              {label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live Price Sidebar ────────────────────────────────────────────────────
function PriceSidebar({
  service, pkg, features, extras, lpDiscount, lpBalance,
}: {
  service: typeof SERVICES[0] | null;
  pkg: typeof PACKAGES[0] | null;
  features: string[];
  extras: string[];
  lpDiscount: number;
  lpBalance: number;
}) {
  const basePrice = service ? service.basePrice * (pkg?.multiplier ?? 1) : 0;
  const featurePrices = service
    ? (FEATURE_OPTIONS[service.id] ?? []).filter(f => features.includes(f.id)).reduce((s, f) => s + f.price, 0)
    : 0;
  const extraPrices = EXTRAS.filter(e => extras.includes(e.id)).reduce((s, e) => s + e.price, 0);
  const subtotal = basePrice + featurePrices + extraPrices;
  const discountAmt = Math.min(lpDiscount * 500, subtotal * 0.2);
  const total = subtotal - discountAmt;
  const lpEarned = Math.floor(total / 1_000_000) * 50;

  return (
    <div
      className="rounded-2xl overflow-hidden sticky top-6"
      style={{ background: 'rgba(15,23,42,0.9)', border: `1px solid ${DS.border}`, backdropFilter: 'blur(20px)' }}
    >
      <div className="px-5 py-4" style={{ background: GRD.primary }}>
        <div style={{ color: '#fff', fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 2 }}>TỔNG GIÁ ƯỚC TÍNH</div>
        <div style={{ color: '#fff', fontFamily: DS.heading, fontSize: 28, fontWeight: 900 }}>
          {fmtVND(total)}
        </div>
        {service?.perMonth && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: DS.mono }}>/tháng</div>}
      </div>

      <div className="p-5 space-y-3">
        {service && (
          <div className="flex justify-between">
            <span style={{ color: DS.text3, fontSize: 12 }}>{service.title.split('&')[0].trim()}</span>
            <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(service.basePrice)}</span>
          </div>
        )}
        {pkg && pkg.multiplier > 1 && (
          <div className="flex justify-between">
            <span style={{ color: DS.text3, fontSize: 12 }}>Gói {pkg.name}</span>
            <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>×{pkg.multiplier}</span>
          </div>
        )}
        {featurePrices > 0 && (
          <div className="flex justify-between">
            <span style={{ color: DS.text3, fontSize: 12 }}>Tính năng thêm ({features.length})</span>
            <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(featurePrices)}</span>
          </div>
        )}
        {extraPrices > 0 && (
          <div className="flex justify-between">
            <span style={{ color: DS.text3, fontSize: 12 }}>Dịch vụ bổ sung ({extras.length})</span>
            <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(extraPrices)}</span>
          </div>
        )}

        {subtotal > 0 && (
          <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
            <span style={{ color: DS.text3, fontSize: 12 }}>Tạm tính</span>
            <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(subtotal)}</span>
          </div>
        )}

        {discountAmt > 0 && (
          <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(129,140,248,0.1)' }}>
            <span style={{ color: DS.purple, fontSize: 12 }}>◈ Giảm LP ({lpDiscount.toLocaleString()} LP)</span>
            <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>-{fmtVND(discountAmt)}</span>
          </div>
        )}

        {total > 0 && (
          <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
            <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>TỔNG CỘNG</span>
            <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(total)}</span>
          </div>
        )}
      </div>

      {/* LP Earn Preview */}
      {lpEarned > 0 && (
        <div className="mx-5 mb-5 p-3 rounded-xl" style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
          <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 4 }}>LP ĐIỂM THƯỞNG SẼ NHẬN</div>
          <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>+{lpEarned.toLocaleString()} LP</div>
          <div style={{ color: DS.text5, fontSize: 10, marginTop: 2 }}>Sau khi hoàn thành dự án</div>
        </div>
      )}

      {lpBalance > 0 && (
        <div className="mx-5 mb-5 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>Số dư LP của bạn</div>
          <div style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 16, fontWeight: 700 }}>{lpBalance.toLocaleString()} LP</div>
          <div style={{ color: DS.text5, fontSize: 10 }}>1,000 LP = 500,000 VNĐ (tối đa 20%)</div>
        </div>
      )}
    </div>
  );
}

// ── Step components ────────────────────────────────────────────────────────

function Step1_Service({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        CHỌN DỊCH VỤ
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Bạn cần loại dịch vụ nào? Mỗi dịch vụ đều được báo giá bằng VNĐ.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map(svc => (
          <motion.button
            key={svc.id}
            onClick={() => onSelect(svc.id)}
            className="text-left p-5 rounded-2xl transition-all"
            style={{
              background: selected === svc.id ? `${svc.color}12` : 'rgba(15,23,42,0.6)',
              border: selected === svc.id ? `1.5px solid ${svc.color}60` : `1px solid ${DS.border}`,
              boxShadow: selected === svc.id ? `0 0 24px ${svc.color}20` : 'none',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.015 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${svc.color}15`, border: `1px solid ${svc.color}30` }}>
                <span style={{ color: svc.color }}>{svc.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{svc.title}</div>
                <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>{svc.desc}</div>
                <div style={{ color: svc.color, fontSize: 12, fontFamily: DS.mono }}>
                  Từ {fmtVND(svc.basePrice)}{svc.perMonth ? '/tháng' : ''}
                </div>
              </div>
              {selected === svc.id && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: svc.color }}>
                  <Check size={13} style={{ color: '#fff' }} />
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Step2_Package({ selected, onSelect, serviceId }: { selected: string; onSelect: (id: string) => void; serviceId: string }) {
  const service = SERVICES.find(s => s.id === serviceId);
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        CHỌN GÓI DỊCH VỤ
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Lựa chọn gói phù hợp với quy mô và nhu cầu của bạn.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PACKAGES.map(pkg => {
          const price = (service?.basePrice ?? 0) * pkg.multiplier;
          return (
            <motion.button
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              className="text-left p-5 rounded-2xl relative overflow-hidden"
              style={{
                background: selected === pkg.id ? `${pkg.color}10` : 'rgba(15,23,42,0.6)',
                border: selected === pkg.id ? `1.5px solid ${pkg.color}60` : pkg.popular ? '1px solid rgba(59,130,246,0.3)' : `1px solid ${DS.border}`,
                boxShadow: selected === pkg.id ? `0 0 24px ${pkg.color}15` : 'none',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.015 }}
            >
              {pkg.popular && (
                <div className="absolute top-0 left-0 right-0 py-1 text-center" style={{ background: GRD.primary, fontSize: 9, color: '#fff', fontFamily: DS.mono, letterSpacing: '0.15em' }}>
                  ★ PHỔ BIẾN NHẤT
                </div>
              )}
              <div style={{ marginTop: pkg.popular ? 20 : 0 }}>
                <div style={{ color: pkg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>{pkg.name.toUpperCase()}</div>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
                  {fmtVND(price)}
                </div>
                {service?.perMonth && <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>/tháng</div>}
                <div style={{ color: DS.text3, fontSize: 12, marginBottom: 14 }}>{pkg.desc}</div>
                <div className="space-y-2">
                  {pkg.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={11} style={{ color: pkg.color, flexShrink: 0 }} />
                      <span style={{ color: DS.text3, fontSize: 11 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono }}>◈ +{pkg.lp} LP điểm thưởng/tháng</span>
                </div>
                {selected === pkg.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: pkg.color }}>
                    <Check size={12} style={{ color: '#fff' }} />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Step3_Configure({ serviceId, selected, onToggle }: { serviceId: string; selected: string[]; onToggle: (id: string) => void }) {
  const opts = FEATURE_OPTIONS[serviceId] ?? [];
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        CẤU HÌNH TÍNH NĂNG
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Tùy chọn thêm tính năng để mở rộng phạm vi dự án. Tất cả giá bằng VNĐ.</p>
      {opts.length === 0 ? (
        <div style={{ color: DS.text3, fontSize: 14 }}>Gói này đã bao gồm tất cả tính năng cần thiết.</div>
      ) : (
        <div className="space-y-3">
          {opts.map(opt => (
            <motion.button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              className="w-full text-left p-4 rounded-xl flex items-center gap-4"
              style={{
                background: selected.includes(opt.id) ? 'rgba(59,130,246,0.1)' : 'rgba(15,23,42,0.5)',
                border: selected.includes(opt.id) ? '1.5px solid rgba(59,130,246,0.4)' : `1px solid ${DS.border}`,
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.005 }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: selected.includes(opt.id) ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)' }}>
                <span style={{ color: selected.includes(opt.id) ? DS.blue : DS.text4 }}>{opt.icon}</span>
              </div>
              <div className="flex-1">
                <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
              </div>
              <div style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
                +{fmtVND(opt.price)}
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: selected.includes(opt.id) ? DS.blue : 'rgba(255,255,255,0.08)', border: selected.includes(opt.id) ? 'none' : '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                {selected.includes(opt.id) ? <Check size={13} style={{ color: '#fff' }} /> : <Plus size={11} style={{ color: DS.text4 }} />}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

function Step4_Talent({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        CHỌN PROJECT MANAGER
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Chọn PM phụ trách dự án của bạn. Tất cả đều từ rank Ruby trở lên.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TALENTS.map(t => (
          <motion.button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="text-left p-5 rounded-2xl flex items-center gap-4"
            style={{
              background: selected === t.id ? 'rgba(59,130,246,0.1)' : 'rgba(15,23,42,0.6)',
              border: selected === t.id ? '1.5px solid rgba(59,130,246,0.4)' : `1px solid ${DS.border}`,
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.015 }}
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `2px solid ${t.rankColor}50` }}>
              <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{t.name}</div>
              <div style={{ color: DS.text3, fontSize: 12, marginBottom: 4 }}>{t.role}</div>
              <div className="flex items-center gap-2">
                <span style={{ color: t.rankColor, fontSize: 12 }}>{t.rankSymbol}</span>
                <span style={{ color: t.rankColor, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{t.rank}</span>
              </div>
              <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 4 }}>{t.specialty}</div>
            </div>
            {selected === t.id && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: DS.blue }}>
                <Check size={12} style={{ color: '#fff' }} />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Step5_Schedule({ startDate, setStartDate, duration, setDuration }: {
  startDate: string; setStartDate: (v: string) => void;
  duration: string; setDuration: (v: string) => void;
}) {
  const durations = [
    { val: '2', label: '2 tuần' }, { val: '4', label: '1 tháng' },
    { val: '8', label: '2 tháng' }, { val: '12', label: '3 tháng' },
    { val: '24', label: '6 tháng' }, { val: 'custom', label: 'Tùy chỉnh' },
  ];

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        LỊCH TRÌNH DỰ ÁN
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Chọn ngày bắt đầu và thời gian dự kiến hoàn thành.</p>

      <div className="space-y-6">
        <div>
          <label style={{ color: DS.text3, fontSize: 13, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
            NGÀY BẮT ĐẦU DỰ KIẾN
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{
              background: 'rgba(15,23,42,0.6)',
              border: `1px solid ${DS.border}`,
              borderRadius: 12,
              padding: '12px 16px',
              color: DS.text,
              fontSize: 14,
              outline: 'none',
              fontFamily: DS.body,
              width: '100%',
              maxWidth: 320,
            }}
          />
        </div>

        <div>
          <label style={{ color: DS.text3, fontSize: 13, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
            THỜI GIAN THỰC HIỆN
          </label>
          <div className="flex flex-wrap gap-3">
            {durations.map(d => (
              <button
                key={d.val}
                onClick={() => setDuration(d.val)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontFamily: DS.mono,
                  cursor: 'pointer',
                  background: duration === d.val ? GRD.primary : 'rgba(15,23,42,0.6)',
                  border: duration === d.val ? 'none' : `1px solid ${DS.border}`,
                  color: duration === d.val ? '#fff' : DS.text3,
                  boxShadow: duration === d.val ? '0 0 16px rgba(59,130,246,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {startDate && duration && duration !== 'custom' && (
          <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} style={{ color: DS.blue }} />
              <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em' }}>TIMELINE DỰ KIẾN</span>
            </div>
            <div style={{ color: DS.text3, fontSize: 13 }}>
              Bắt đầu: <strong style={{ color: DS.text }}>{new Date(startDate).toLocaleDateString('vi-VN')}</strong>
              {' → '}
              Hoàn thành: <strong style={{ color: DS.green }}>
                {new Date(new Date(startDate).getTime() + parseInt(duration) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step6_Extras({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        DỊCH VỤ BỔ SUNG
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Thêm các dịch vụ hỗ trợ để đảm bảo dự án thành công lâu dài. Giá VNĐ một lần.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {EXTRAS.map(ext => (
          <motion.button
            key={ext.id}
            onClick={() => onToggle(ext.id)}
            className="text-left p-4 rounded-xl flex items-center gap-3"
            style={{
              background: selected.includes(ext.id) ? `${ext.color}0C` : 'rgba(15,23,42,0.5)',
              border: selected.includes(ext.id) ? `1.5px solid ${ext.color}50` : `1px solid ${DS.border}`,
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ext.color}15` }}>
              <span style={{ color: ext.color }}>{ext.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{ext.label}</div>
              <div style={{ color: ext.color, fontSize: 12, fontFamily: DS.mono, marginTop: 2 }}>+{fmtVND(ext.price)}</div>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: selected.includes(ext.id) ? ext.color : 'rgba(255,255,255,0.06)', border: selected.includes(ext.id) ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
              {selected.includes(ext.id) ? <Check size={12} style={{ color: '#fff' }} /> : <Plus size={11} style={{ color: DS.text4 }} />}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Step7_Review({
  serviceId, pkgId, features, talentId, extras, startDate, duration,
}: {
  serviceId: string; pkgId: string; features: string[]; talentId: string;
  extras: string[]; startDate: string; duration: string;
}) {
  const svc = SERVICES.find(s => s.id === serviceId);
  const pkg = PACKAGES.find(p => p.id === pkgId);
  const talent = TALENTS.find(t => t.id === talentId);
  const featureOpts = (FEATURE_OPTIONS[serviceId] ?? []).filter(f => features.includes(f.id));
  const extraOpts = EXTRAS.filter(e => extras.includes(e.id));

  const rows = [
    { label: 'Dịch vụ', value: svc?.title ?? '—', color: svc?.color },
    { label: 'Gói', value: pkg?.name ?? '—', color: DS.blue },
    { label: 'PM / Lead', value: talent?.name ?? '—', color: talent ? talent.rankColor : DS.text3 },
    { label: 'Bắt đầu', value: startDate ? new Date(startDate).toLocaleDateString('vi-VN') : '—' },
    { label: 'Thời gian', value: duration === 'custom' ? 'Tùy chỉnh' : duration === '2' ? '2 tuần' : `${parseInt(duration)/4} tháng` },
  ];

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        XEM LẠI ĐƠN HÀNG
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Kiểm tra lại thông tin trước khi tiến hành thanh toán.</p>

      <div className="space-y-4">
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
          <div className="px-5 py-3" style={{ background: 'rgba(59,130,246,0.08)', borderBottom: `1px solid ${DS.border}` }}>
            <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>THÔNG TIN DỰ ÁN</span>
          </div>
          <div className="p-5 space-y-3">
            {rows.map(r => (
              <div key={r.label} className="flex justify-between">
                <span style={{ color: DS.text4, fontSize: 13 }}>{r.label}</span>
                <span style={{ color: r.color ?? DS.text, fontSize: 13, fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {featureOpts.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
            <div className="px-5 py-3" style={{ background: 'rgba(20,184,166,0.08)', borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.cyan, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>TÍNH NĂNG BỔ SUNG ({featureOpts.length})</span>
            </div>
            <div className="p-5 space-y-2">
              {featureOpts.map(f => (
                <div key={f.id} className="flex justify-between">
                  <span style={{ color: DS.text3, fontSize: 13 }}>{f.label}</span>
                  <span style={{ color: DS.cyan, fontSize: 13, fontFamily: DS.mono }}>+{fmtVND(f.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {extraOpts.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
            <div className="px-5 py-3" style={{ background: 'rgba(129,140,248,0.08)', borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>DỊCH VỤ BỔ SUNG ({extraOpts.length})</span>
            </div>
            <div className="p-5 space-y-2">
              {extraOpts.map(e => (
                <div key={e.id} className="flex justify-between">
                  <span style={{ color: DS.text3, fontSize: 13 }}>{e.label}</span>
                  <span style={{ color: DS.purple, fontSize: 13, fontFamily: DS.mono }}>+{fmtVND(e.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step8_Payment({
  lpBalance, lpDiscount, setLpDiscount, name, setName, email, setEmail,
  phone, setPhone, company, setCompany, submitted, setSubmitted, onConfirm, orderId,
}: {
  lpBalance: number; lpDiscount: number; setLpDiscount: (n: number) => void;
  name: string; setName: (s: string) => void;
  email: string; setEmail: (s: string) => void;
  phone: string; setPhone: (s: string) => void;
  company: string; setCompany: (s: string) => void;
  submitted: boolean; setSubmitted: (b: boolean) => void;
  onConfirm: (n: string, em: string, ph: string, co: string) => void;
  orderId: string;
}) {
  const payMethods = [
    { id: 'bank', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
    { id: 'vnpay', label: 'VNPay QR', icon: '📱' },
    { id: 'momo', label: 'Momo', icon: '💜' },
  ];
  const [payMethod, setPayMethod] = useState('bank');

  if (submitted) {
    return (
      <motion.div className="text-center py-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}>
          <Check size={36} style={{ color: DS.green }} />
        </div>
        <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 12 }}>
          YÊU CẦU ĐÃ GỬI THÀNH CÔNG!
        </h3>
        {orderId && (
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <span style={{ color: DS.text4, fontSize: 12 }}>Mã đơn:</span>
            <span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{orderId}</span>
          </div>
        )}
        <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, maxWidth: 400, margin: '0 auto 32px' }}>
          Đội ngũ LOOP Solutions sẽ liên hệ với bạn trong vòng 2 giờ làm việc để xác nhận và bắt đầu dự án.
        </p>
        <div className="inline-block px-5 py-3 rounded-xl mb-6" style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.3)' }}>
          <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 4 }}>LP ĐIỂM THƯỞNG ĐĂNG KÝ</div>
          <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 24, fontWeight: 900 }}>+500 LP</div>
        </div>
        <br />
        <div className="flex items-center justify-center gap-3 flex-wrap mt-4">
          <Link to="/khach-hang" style={{ background: GRD.primary, color: '#fff', fontSize: 14, fontWeight: 600, padding: '12px 28px', borderRadius: 10, textDecoration: 'none' }}>
            Vào Customer Portal →
          </Link>
          <Link to="/" style={{ color: DS.text3, fontSize: 14, padding: '12px 20px', borderRadius: 10, textDecoration: 'none', border: `1px solid ${DS.border}` }}>
            Về trang chủ
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        THÔNG TIN & THANH TOÁN
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Điền thông tin để LOOP Solutions liên hệ xác nhận và tạo hợp đồng.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[
          { label: 'Họ và tên *', value: name, set: setName, placeholder: 'Nguyễn Văn A' },
          { label: 'Email công ty *', value: email, set: setEmail, placeholder: 'name@company.vn' },
          { label: 'Số điện thoại *', value: phone, set: setPhone, placeholder: '0901 234 567' },
          { label: 'Tên công ty', value: company, set: setCompany, placeholder: 'ABC Company' },
        ].map(f => (
          <div key={f.label}>
            <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>{f.label}</label>
            <input
              value={f.value}
              onChange={e => f.set(e.target.value)}
              placeholder={f.placeholder}
              style={{ width: '100%', background: 'rgba(15,23,42,0.6)', border: `1px solid ${DS.border}`, borderRadius: 10, padding: '11px 14px', color: DS.text, fontSize: 14, outline: 'none', fontFamily: DS.body, boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      {/* LP Discount */}
      {lpBalance > 0 && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', marginBottom: 2 }}>◈ DÙNG LP ĐIỂM THƯỞNG ĐỂ GIẢM GIÁ</div>
              <div style={{ color: DS.text4, fontSize: 11 }}>Số dư: {lpBalance.toLocaleString()} LP · 1,000 LP = 500,000 VNĐ (tối đa 20%)</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setLpDiscount(Math.max(0, lpDiscount - 1000))} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${DS.border}`, color: DS.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Minus size={14} />
            </button>
            <div style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 16, fontWeight: 700, minWidth: 80, textAlign: 'center' }}>
              {lpDiscount.toLocaleString()} LP
            </div>
            <button onClick={() => setLpDiscount(Math.min(lpBalance, lpDiscount + 1000))} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${DS.border}`, color: DS.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Payment method */}
      <div className="mb-6">
        <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>PHƯƠNG THỨC THANH TOÁN ĐẶT CỌC (30%)</label>
        <div className="flex gap-3 flex-wrap">
          {payMethods.map(m => (
            <button
              key={m.id}
              onClick={() => setPayMethod(m.id)}
              style={{
                padding: '10px 18px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                background: payMethod === m.id ? 'rgba(59,130,246,0.15)' : 'rgba(15,23,42,0.5)',
                border: payMethod === m.id ? '1.5px solid rgba(59,130,246,0.5)' : `1px solid ${DS.border}`,
                color: payMethod === m.id ? DS.blue : DS.text3,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          if (name && email && phone) onConfirm(name, email, phone, company);
        }}
        style={{
          background: name && email && phone ? GRD.primary : 'rgba(255,255,255,0.1)',
          color: name && email && phone ? '#fff' : DS.text4,
          fontSize: 15, fontWeight: 700, padding: '14px 32px', borderRadius: 14, border: 'none',
          cursor: name && email && phone ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: name && email && phone ? '0 0 30px rgba(129,140,248,0.4)' : 'none',
          transition: 'all 0.3s',
        }}
      >
        <Shield size={16} />
        Gửi yêu cầu & Đặt lịch tư vấn
        <ArrowRight size={15} />
      </button>
      <div style={{ color: DS.text5, fontSize: 11, marginTop: 10 }}>
        * Thanh toán đặt cọc 30% sau khi ký hợp đồng. Số còn lại thanh toán theo tiến độ dự án.
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function BookingWizardPage() {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState('');
  const [pkgId, setPkgId] = useState('business');
  const [features, setFeatures] = useState<string[]>([]);
  const [talentId, setTalentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const [lpDiscount, setLpDiscount] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');

  const { addOrder } = useLoopStore();
  const LP_BALANCE = 15200;

  const service = SERVICES.find(s => s.id === serviceId) ?? null;
  const pkg = PACKAGES.find(p => p.id === pkgId) ?? null;

  const toggleFeature = (id: string) => setFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const toggleExtra = (id: string) => setExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

  const canNext = () => {
    if (step === 0) return !!serviceId;
    if (step === 1) return !!pkgId;
    if (step === 3) return !!talentId;
    if (step === 4) return !!startDate && !!duration;
    return true;
  };

  const handleSubmit = (n: string, em: string, ph: string, co: string) => {
    const svc = SERVICES.find(s => s.id === serviceId);
    const pkg = PACKAGES.find(p => p.id === pkgId);
    const basePrice = svc ? svc.basePrice * (pkg?.multiplier ?? 1) : 0;
    const featPrices = (FEATURE_OPTIONS[serviceId] ?? []).filter(f => features.includes(f.id)).reduce((s, f) => s + f.price, 0);
    const extraPrices = EXTRAS.filter(e => extras.includes(e.id)).reduce((s, e) => s + e.price, 0);
    const total = Math.round((basePrice + featPrices + extraPrices) * 1.1);
    const lpEarned = Math.round(total / 1_000_000) * (pkg?.lp ?? 50);
    const orderId = `ORD-${Date.now().toString().slice(-4)}`;
    setNewOrderId(orderId);

    const svcTypeMap: Record<string, string> = {
      web: 'thiet-ke-web', app: 'phat-trien-app',
      dashboard: 'dashboard-analytics', seo: 'seo-marketing',
    };

    const newOrder: Order = {
      id: orderId,
      clientId: 9, clientName: n, clientCompany: co || company || 'Khách hàng mới',
      clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&crop=faces',
      type: 'service',
      serviceType: svcTypeMap[serviceId] as any,
      serviceTitle: svc?.title,
      title: `${svc?.title ?? 'Dịch vụ'} — ${pkg?.name ?? 'Gói'} (${co || 'New Client'})`,
      budget: total,
      lpUsed: lpDiscount,
      lpReward: lpEarned,
      status: 'pending_payment',
      progress: 0,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN'),
      invoiceId: `INV-${orderId}`,
      tags: features.length > 0 ? features : [svc?.id ?? 'web'],
      messages: [
        {
          id: 'm_init', senderId: 'admin', senderName: 'LOOP System',
          content: `Cảm ơn ${n} đã đặt dịch vụ ${svc?.title ?? ''}! Chúng tôi sẽ liên hệ qua ${em} trong vòng 2 giờ làm việc để xác nhận và tạo hợp đồng.`,
          type: 'system',
          timestamp: new Date().toLocaleString('vi-VN'), read: true,
        }
      ],
    };
    addOrder(newOrder);
    setSubmitted(true);
  };

  const steps = [
    <Step1_Service key={0} selected={serviceId} onSelect={setServiceId} />,
    <Step2_Package key={1} selected={pkgId} onSelect={setPkgId} serviceId={serviceId} />,
    <Step3_Configure key={2} serviceId={serviceId} selected={features} onToggle={toggleFeature} />,
    <Step4_Talent key={3} selected={talentId} onSelect={setTalentId} />,
    <Step5_Schedule key={4} startDate={startDate} setStartDate={setStartDate} duration={duration} setDuration={setDuration} />,
    <Step6_Extras key={5} selected={extras} onToggle={toggleExtra} />,
    <Step7_Review key={6} serviceId={serviceId} pkgId={pkgId} features={features} talentId={talentId} extras={extras} startDate={startDate} duration={duration} />,
    <Step8_Payment key={7} lpBalance={LP_BALANCE} lpDiscount={lpDiscount} setLpDiscount={setLpDiscount} name={name} setName={setName} email={email} setEmail={setEmail} phone={phone} setPhone={setPhone} company={company} setCompany={setCompany} submitted={submitted} setSubmitted={setSubmitted} onConfirm={handleSubmit} orderId={newOrderId} />,
  ];

  return (
    <div style={{ background: DS.bg, minHeight: '100vh', fontFamily: DS.body, paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, rgba(29,78,216,0.08) 0%, transparent 100%)', borderBottom: `1px solid ${DS.border}` }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <Sparkles size={11} style={{ color: DS.blue }} />
                <span style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>ĐẶT LỊCH TƯ VẤN</span>
              </div>
              <h1 style={{ fontFamily: DS.heading, fontSize: 28, fontWeight: 900, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CẤU HÌNH DỰ ÁN CỦA BẠN
              </h1>
              <p style={{ color: DS.text3, fontSize: 13, marginTop: 4 }}>8 bước đơn giản · Báo giá VNĐ real-time · Nhận 500 LP điểm thưởng</p>
            </div>
            <Link to="/" style={{ color: DS.text4, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px solid ${DS.border}` }}>
              <X size={13} />
              Thoát
            </Link>
          </div>

          {/* Progress */}
          <ProgressBar step={step} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Step content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {steps[step]}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            {!submitted && (
              <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: `1px solid ${DS.border}` }}>
                <button
                  onClick={() => setStep(s => Math.max(0, s - 1))}
                  disabled={step === 0}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10,
                    background: step === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${DS.border}`,
                    color: step === 0 ? DS.text5 : DS.text3,
                    cursor: step === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontWeight: 500,
                  }}
                >
                  <ArrowLeft size={15} />
                  Quay lại
                </button>

                <div style={{ color: DS.text5, fontSize: 12, fontFamily: DS.mono }}>
                  {step + 1} / {steps.length}
                </div>

                {step < steps.length - 1 && (
                  <button
                    onClick={() => { if (canNext()) setStep(s => s + 1); }}
                    disabled={!canNext()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10,
                      background: canNext() ? GRD.primary : 'rgba(255,255,255,0.06)',
                      border: 'none',
                      color: canNext() ? '#fff' : DS.text5,
                      cursor: canNext() ? 'pointer' : 'not-allowed',
                      fontSize: 14, fontWeight: 700,
                      boxShadow: canNext() ? '0 0 20px rgba(129,140,248,0.35)' : 'none',
                    }}
                  >
                    {step === steps.length - 2 ? 'Xem lại' : 'Tiếp theo'}
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Price sidebar */}
          <div className="hidden lg:block">
            <PriceSidebar
              service={service}
              pkg={pkg}
              features={features}
              extras={extras}
              lpDiscount={lpDiscount}
              lpBalance={LP_BALANCE}
            />
          </div>
        </div>
      </div>
    </div>
  );
}