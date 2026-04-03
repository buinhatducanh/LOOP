/**
 * MediaBookingPage — Wizard flow for LOOP Media Services
 * Book Chụp · Book Quay · Làm Content
 * Multi-step wizard matching BookingWizardPage pattern
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, Video, FileText, Check, ArrowRight, ArrowLeft,
  Sparkles, X, Plus, Minus, Calendar, Shield, Clock,
  MapPin, Users, Star, Zap, Image, Film, Palette,
  Sun, Moon, Sunset, Music, Mic, Aperture, Layers, Heart
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useLoopStore, type Order } from '../store/loopStore';

// ── Helpers ──────────────────────────────────────────────────────────────
const fmtVND = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

// ── Media Services Data ──────────────────────────────────────────────────
const MEDIA_SERVICES = [
  {
    id: 'photo', icon: <Camera size={28} /> as ReactNode, title: 'Book Chụp ảnh', color: '#F59E0B',
    desc: 'Chụp ảnh sản phẩm, doanh nghiệp, sự kiện, chân dung — chất lượng studio chuyên nghiệp.',
    basePrice: 5_000_000,
    image: 'https://images.unsplash.com/photo-1745847768366-d44dcef9ef35?auto=format&fit=crop&w=400&h=240&crop=entropy',
    highlights: ['Studio & On-location', 'RAW + JPEG', 'Chỉnh màu chuyên nghiệp'],
  },
  {
    id: 'video', icon: <Video size={28} /> as ReactNode, title: 'Book Quay phim', color: '#EF4444',
    desc: 'Quay TVC, phóng sự, review sản phẩm, event recap — 4K cinematic chuyên nghiệp.',
    basePrice: 15_000_000,
    image: 'https://images.unsplash.com/photo-1611348817005-b49bab4a0ddd?auto=format&fit=crop&w=400&h=240&crop=entropy',
    highlights: ['4K Cinematic', 'Drone aerial', 'Color grading'],
  },
  {
    id: 'content', icon: <FileText size={28} /> as ReactNode, title: 'Làm Content', color: '#818CF8',
    desc: 'Sáng tạo nội dung đa nền tảng — TikTok, Reels, YouTube, blog, social media.',
    basePrice: 8_000_000,
    image: 'https://images.unsplash.com/photo-1640725804478-ebf80960a3f4?auto=format&fit=crop&w=400&h=240&crop=entropy',
    highlights: ['Multi-platform', 'Script writing', 'Trend catching'],
    perMonth: true,
  },
];

// ── Package tiers ────────────────────────────────────────────────────────
const MEDIA_PACKAGES = [
  {
    id: 'basic', name: 'Basic', multiplier: 1, color: DS.text3,
    desc: 'Gói cơ bản cho nhu cầu nhỏ, cá nhân, startup',
    features: ['1 buổi chụp/quay (4h)', 'Tối đa 30 ảnh / 1 video ngắn', 'Chỉnh sửa cơ bản', 'Giao file trong 5 ngày'],
    lp: 30,
  },
  {
    id: 'pro', name: 'Professional', multiplier: 2.5, color: '#F59E0B',
    desc: 'Gói chuyên nghiệp cho doanh nghiệp, thương hiệu',
    features: ['2 buổi chụp/quay (full day)', 'Unlimited ảnh / 3 video', 'Chỉnh sửa nâng cao + retouch', 'Motion graphics', 'Giao file trong 3 ngày', 'Không giới hạn chỉnh sửa'],
    lp: 100,
    popular: true,
  },
  {
    id: 'premium', name: 'Premium', multiplier: 4.5, color: '#818CF8',
    desc: 'Gói cao cấp — chiến dịch lớn, brand campaign',
    features: ['Không giới hạn buổi (1 tuần)', 'Unlimited output', 'Color grading cinematic', 'Storyboard & creative direction', '2 nhiếp ảnh gia / quay phim', 'Priority delivery 24h', 'Licensed music', 'Drone & gimbal'],
    lp: 300,
  },
];

// ── Add-on features per service ──────────────────────────────────────────
const MEDIA_ADDONS: Record<string, { id: string; label: string; price: number; icon: ReactNode }[]> = {
  photo: [
    { id: 'drone', label: 'Chụp flycam / Drone aerial', price: 3_000_000, icon: <Sun size={14} /> },
    { id: 'model', label: 'Thuê model chuyên nghiệp', price: 5_000_000, icon: <Users size={14} /> },
    { id: 'studio', label: 'Thuê studio cao cấp (full day)', price: 4_000_000, icon: <Aperture size={14} /> },
    { id: 'retouch', label: 'Retouch da / beauty chuyên sâu', price: 2_500_000, icon: <Palette size={14} /> },
    { id: 'express', label: 'Giao file nhanh (24h)', price: 2_000_000, icon: <Zap size={14} /> },
    { id: 'print', label: 'In ảnh canvas / album cao cấp', price: 3_500_000, icon: <Image size={14} /> },
  ],
  video: [
    { id: 'drone', label: 'Quay flycam / Drone cinematic', price: 5_000_000, icon: <Sun size={14} /> },
    { id: 'actor', label: 'Thuê diễn viên / MC', price: 8_000_000, icon: <Users size={14} /> },
    { id: 'music', label: 'Licensed music & SFX', price: 3_000_000, icon: <Music size={14} /> },
    { id: 'motion', label: 'Motion graphics & animation', price: 6_000_000, icon: <Film size={14} /> },
    { id: 'voiceover', label: 'Voice-over chuyên nghiệp', price: 2_500_000, icon: <Mic size={14} /> },
    { id: 'subtitles', label: 'Phụ đề song ngữ (VI/EN)', price: 1_500_000, icon: <FileText size={14} /> },
  ],
  content: [
    { id: 'script', label: 'Script writing & storyboard', price: 3_000_000, icon: <FileText size={14} /> },
    { id: 'kol', label: 'KOL/Influencer collab setup', price: 10_000_000, icon: <Star size={14} /> },
    { id: 'seo', label: 'SEO-optimized blog content', price: 4_000_000, icon: <Layers size={14} /> },
    { id: 'social', label: 'Quản lý đăng bài 1 tháng', price: 5_000_000, icon: <Heart size={14} /> },
    { id: 'design', label: 'Thiết kế thumbnail & banner', price: 2_500_000, icon: <Palette size={14} /> },
    { id: 'analytics', label: 'Content performance report', price: 2_000_000, icon: <Zap size={14} /> },
  ],
};

// ── Team ─────────────────────────────────────────────────────────────────
const MEDIA_TEAM = [
  { id: 'haru', name: 'Haru Tanaka', role: 'Lead Photographer', rank: 'KIM CƯƠNG', rankColor: '#818CF8', rankSymbol: '💠', img: 'https://images.unsplash.com/photo-1612192279155-f7fab0a4f377?auto=format&fit=crop&w=80&h=80&crop=faces', specialty: 'Product · Portrait · Event' },
  { id: 'linh', name: 'Trần Thu Linh', role: 'Senior Videographer', rank: 'HỒNG NGỌC', rankColor: '#EF4444', rankSymbol: '❤️‍🔥', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&crop=faces', specialty: 'TVC · Cinematic · Drone' },
  { id: 'kai', name: 'Kai Nguyen', role: 'Creative Director', rank: 'KIM CƯƠNG', rankColor: '#818CF8', rankSymbol: '💠', img: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=80&h=80&crop=faces', specialty: 'Content · Strategy · Branding' },
  { id: 'mina', name: 'Mina Phạm', role: 'Content Creator', rank: 'BẠCH KIM', rankColor: '#E5E4E2', rankSymbol: '💎', img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=80&h=80&crop=faces', specialty: 'TikTok · Reels · YouTube' },
];

// ── Shooting styles ──────────────────────────────────────────────────────
const SHOOT_STYLES: Record<string, { id: string; label: string; icon: ReactNode; desc: string }[]> = {
  photo: [
    { id: 'product', label: 'Chụp sản phẩm', icon: <Image size={16} />, desc: 'Lookbook, flat-lay, 360°' },
    { id: 'portrait', label: 'Chân dung / Headshot', icon: <Users size={16} />, desc: 'Profile, team, editorial' },
    { id: 'event', label: 'Sự kiện', icon: <Sparkles size={16} />, desc: 'Hội nghị, tiệc, khai trương' },
    { id: 'food', label: 'Ẩm thực', icon: <Star size={16} />, desc: 'Menu, food styling' },
    { id: 'real-estate', label: 'Bất động sản', icon: <MapPin size={16} />, desc: 'Nội thất, kiến trúc, aerial' },
    { id: 'fashion', label: 'Thời trang', icon: <Heart size={16} />, desc: 'Lookbook, campaign, catalog' },
  ],
  video: [
    { id: 'tvc', label: 'TVC / Quảng cáo', icon: <Film size={16} />, desc: '15s-60s, phát TV & digital' },
    { id: 'corporate', label: 'Phóng sự doanh nghiệp', icon: <Users size={16} />, desc: 'Giới thiệu công ty, culture' },
    { id: 'product-review', label: 'Review sản phẩm', icon: <Star size={16} />, desc: 'Unboxing, demo, tutorial' },
    { id: 'event-recap', label: 'Event recap', icon: <Sparkles size={16} />, desc: 'Highlights, aftermovie' },
    { id: 'interview', label: 'Phỏng vấn / Podcast', icon: <Mic size={16} />, desc: 'Multi-cam, chuyên nghiệp' },
    { id: 'aerial', label: 'Quay flycam', icon: <Sun size={16} />, desc: 'Cinematic aerial, timelapse' },
  ],
  content: [
    { id: 'tiktok', label: 'TikTok / Reels', icon: <Film size={16} />, desc: 'Short-form, viral, trend' },
    { id: 'youtube', label: 'YouTube', icon: <Video size={16} />, desc: 'Long-form, vlog, series' },
    { id: 'blog', label: 'Blog / Copywriting', icon: <FileText size={16} />, desc: 'SEO, story, thought leader' },
    { id: 'social', label: 'Social Media Kit', icon: <Heart size={16} />, desc: 'Post designs, captions, calendar' },
    { id: 'brand', label: 'Brand Story', icon: <Sparkles size={16} />, desc: 'Brand film + key visuals' },
    { id: 'campaign', label: 'Campaign Pack', icon: <Layers size={16} />, desc: 'Full funnel content set' },
  ],
};

// ── Time slots ───────────────────────────────────────────────────────────
const TIME_SLOTS = [
  { id: 'morning', label: 'Sáng', time: '08:00 — 12:00', icon: <Sun size={16} />, color: '#F59E0B' },
  { id: 'afternoon', label: 'Chiều', time: '13:00 — 17:00', icon: <Sunset size={16} />, color: '#EF4444' },
  { id: 'evening', label: 'Tối', time: '18:00 — 22:00', icon: <Moon size={16} />, color: '#818CF8' },
  { id: 'fullday', label: 'Cả ngày', time: '08:00 — 18:00', icon: <Clock size={16} />, color: '#14B8A6' },
];

const STEP_LABELS = ['Dịch vụ', 'Phong cách', 'Gói', 'Add-ons', 'Team', 'Lịch hẹn', 'Xem lại', 'Thanh toán'];

// ══════════════════════════════════════════════════════════════════════════
// ── PROGRESS BAR ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full" style={{ padding: '20px 0' }}>
      {/* Mobile: simple */}
      <div className="md:hidden flex items-center gap-2 px-4">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: rgba('#FFFFFF', 0.06) }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: GRD.primary }}
            animate={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, flexShrink: 0 }}>
          {step + 1}/{STEP_LABELS.length}
        </span>
      </div>

      {/* Desktop: full steps */}
      <div className="hidden md:flex items-center justify-between max-w-3xl mx-auto px-4">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-col items-center" style={{ flex: i < STEP_LABELS.length - 1 ? 1 : 'none' }}>
            <div className="flex items-center w-full">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: i < step ? GRD.primary : i === step ? rgba(DS.blue, 0.2) : rgba('#FFFFFF', 0.06),
                  border: i === step ? `2px solid ${DS.blue}` : i < step ? 'none' : `1px solid ${rgba('#FFFFFF', 0.12)}`,
                  boxShadow: i === step ? `0 0 16px ${rgba(DS.blue, 0.5)}` : 'none',
                }}
              >
                {i < step ? (
                  <Check size={13} style={{ color: '#fff' }} />
                ) : (
                  <span style={{ color: i === step ? DS.blue : DS.text5, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{i + 1}</span>
                )}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1" style={{ background: i < step ? GRD.primary : rgba('#FFFFFF', 0.06) }} />
              )}
            </div>
            <div style={{ color: i === step ? DS.blue : i < step ? DS.text4 : DS.text5, fontSize: 8, fontFamily: DS.mono, marginTop: 6, letterSpacing: '0.08em', textAlign: 'center' }}>
              {label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── PRICE SIDEBAR ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function PriceSidebar({
  service, pkg, addons, styles, lpDiscount, lpBalance,
}: {
  service: typeof MEDIA_SERVICES[0] | null;
  pkg: typeof MEDIA_PACKAGES[0] | null;
  addons: string[];
  styles: string[];
  lpDiscount: number;
  lpBalance: number;
}) {
  const basePrice = service ? service.basePrice * (pkg?.multiplier ?? 1) : 0;
  const addonPrices = service
    ? (MEDIA_ADDONS[service.id] ?? []).filter(a => addons.includes(a.id)).reduce((s, a) => s + a.price, 0)
    : 0;
  const subtotal = basePrice + addonPrices;
  const discountAmt = Math.min(lpDiscount * 500, subtotal * 0.2);
  const total = subtotal - discountAmt;
  const lpEarned = Math.floor(total / 1_000_000) * 40;

  return (
    <div
      className="rounded-2xl overflow-hidden sticky top-24"
      style={{ background: rgba(DS.bgCard, 0.9), border: `1px solid ${DS.border}`, backdropFilter: 'blur(20px)' }}
    >
      {/* Header */}
      <div className="px-5 py-4" style={{ background: service ? `linear-gradient(135deg, ${rgba(service.color, 0.8)}, ${rgba(DS.purple, 0.7)})` : GRD.primary }}>
        <div style={{ color: '#fff', fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 2 }}>TỔNG GIÁ ƯỚC TÍNH</div>
        <div style={{ color: '#fff', fontFamily: DS.heading, fontSize: 28, fontWeight: 900 }}>
          {fmtVND(total)}
        </div>
        {service?.perMonth && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: DS.mono }}>/tháng</div>}
      </div>

      <div className="p-5 space-y-3">
        {service && (
          <div className="flex justify-between">
            <span style={{ color: DS.text3, fontSize: 12 }}>{service.title}</span>
            <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(service.basePrice)}</span>
          </div>
        )}
        {pkg && pkg.multiplier > 1 && (
          <div className="flex justify-between">
            <span style={{ color: DS.text3, fontSize: 12 }}>Gói {pkg.name}</span>
            <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>×{pkg.multiplier}</span>
          </div>
        )}
        {styles.length > 0 && (
          <div className="flex justify-between">
            <span style={{ color: DS.text3, fontSize: 12 }}>Phong cách ({styles.length})</span>
            <span style={{ color: DS.cyan, fontSize: 12, fontFamily: DS.mono }}>✓</span>
          </div>
        )}
        {addonPrices > 0 && (
          <div className="flex justify-between">
            <span style={{ color: DS.text3, fontSize: 12 }}>Add-ons ({addons.length})</span>
            <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(addonPrices)}</span>
          </div>
        )}

        {subtotal > 0 && (
          <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
            <span style={{ color: DS.text3, fontSize: 12 }}>Tạm tính</span>
            <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(subtotal)}</span>
          </div>
        )}

        {discountAmt > 0 && (
          <div className="flex justify-between p-2 rounded-lg" style={{ background: rgba(DS.purple, 0.1) }}>
            <span style={{ color: DS.purple, fontSize: 12 }}>◈ Giảm LP ({lpDiscount.toLocaleString()})</span>
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

      {lpEarned > 0 && (
        <div className="mx-5 mb-5 p-3 rounded-xl" style={{ background: rgba(DS.purple, 0.1), border: `1px solid ${rgba(DS.purple, 0.2)}` }}>
          <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 4 }}>LP THƯỞNG SẼ NHẬN</div>
          <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>+{lpEarned.toLocaleString()} LP</div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── STEP 1: CHỌN DỊCH VỤ MEDIA ──────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function StepService({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        CHỌN DỊCH VỤ MEDIA
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Bạn cần dịch vụ media nào? Chọn một để bắt đầu.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MEDIA_SERVICES.map(svc => (
          <motion.button
            key={svc.id}
            onClick={() => onSelect(svc.id)}
            className="text-left rounded-2xl overflow-hidden transition-all"
            style={{
              background: selected === svc.id ? rgba(svc.color, 0.06) : rgba(DS.bgCard, 0.6),
              border: selected === svc.id ? `2px solid ${rgba(svc.color, 0.5)}` : `1px solid ${DS.border}`,
              boxShadow: selected === svc.id ? `0 0 30px ${rgba(svc.color, 0.15)}` : 'none',
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Preview image */}
            <div className="relative h-36 overflow-hidden">
              <img src={svc.image} alt={svc.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${DS.bg}, transparent 60%)` }} />
              {selected === svc.id && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: svc.color, boxShadow: `0 0 12px ${svc.color}` }}>
                  <Check size={14} style={{ color: '#fff' }} />
                </div>
              )}
              <div className="absolute bottom-3 left-4" style={{ color: svc.color }}>
                {svc.icon}
              </div>
            </div>

            <div className="p-4">
              <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{svc.title}</div>
              <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>{svc.desc}</div>

              {/* Highlights */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {svc.highlights.map(h => (
                  <span key={h} style={{
                    fontSize: 9, fontFamily: DS.mono, color: svc.color,
                    background: rgba(svc.color, 0.08), padding: '2px 7px', borderRadius: 5,
                  }}>{h}</span>
                ))}
              </div>

              <div style={{ color: svc.color, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>
                Từ {fmtVND(svc.basePrice)}{svc.perMonth ? '/tháng' : ''}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── STEP 2: PHONG CÁCH ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function StepStyle({ serviceId, selected, onToggle }: { serviceId: string; selected: string[]; onToggle: (id: string) => void }) {
  const styles = SHOOT_STYLES[serviceId] ?? [];
  const svc = MEDIA_SERVICES.find(s => s.id === serviceId);
  const color = svc?.color ?? DS.blue;

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        CHỌN PHONG CÁCH
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>
        Chọn một hoặc nhiều phong cách {serviceId === 'photo' ? 'chụp ảnh' : serviceId === 'video' ? 'quay phim' : 'nội dung'} bạn cần.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {styles.map(st => {
          const isSelected = selected.includes(st.id);
          return (
            <motion.button
              key={st.id}
              onClick={() => onToggle(st.id)}
              className="text-left p-4 rounded-xl flex items-center gap-3"
              style={{
                background: isSelected ? rgba(color, 0.08) : rgba(DS.bgCard, 0.5),
                border: isSelected ? `1.5px solid ${rgba(color, 0.45)}` : `1px solid ${DS.border}`,
                cursor: 'pointer',
                boxShadow: isSelected ? `0 0 16px ${rgba(color, 0.12)}` : 'none',
              }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: isSelected ? rgba(color, 0.15) : rgba('#FFFFFF', 0.05), color: isSelected ? color : DS.text4 }}>
                {st.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: isSelected ? DS.text : DS.text3, fontSize: 13, fontWeight: 600 }}>{st.label}</div>
                <div style={{ color: DS.text5, fontSize: 11 }}>{st.desc}</div>
              </div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: isSelected ? color : rgba('#FFFFFF', 0.06), border: isSelected ? 'none' : `1px solid ${rgba('#FFFFFF', 0.12)}` }}>
                {isSelected && <Check size={11} style={{ color: '#fff' }} />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── STEP 3: GÓI ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function StepPackage({ selected, onSelect, serviceId }: { selected: string; onSelect: (id: string) => void; serviceId: string }) {
  const service = MEDIA_SERVICES.find(s => s.id === serviceId);
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        CHỌN GÓI DỊCH VỤ
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Lựa chọn gói phù hợp với quy mô dự án media của bạn.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MEDIA_PACKAGES.map(pkg => {
          const price = (service?.basePrice ?? 0) * pkg.multiplier;
          return (
            <motion.button
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              className="text-left p-5 rounded-2xl relative overflow-hidden"
              style={{
                background: selected === pkg.id ? rgba(pkg.color, 0.06) : rgba(DS.bgCard, 0.6),
                border: selected === pkg.id ? `2px solid ${rgba(pkg.color, 0.5)}` : pkg.popular ? `1px solid ${rgba(DS.amber, 0.3)}` : `1px solid ${DS.border}`,
                boxShadow: selected === pkg.id ? `0 0 24px ${rgba(pkg.color, 0.12)}` : 'none',
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.015 }}
            >
              {pkg.popular && (
                <div className="absolute top-0 left-0 right-0 py-1 text-center"
                  style={{ background: `linear-gradient(135deg, ${DS.amber}, #EF4444)`, fontSize: 9, color: '#fff', fontFamily: DS.mono, letterSpacing: '0.15em' }}>
                  ★ PHỔ BIẾN NHẤT
                </div>
              )}
              <div style={{ marginTop: pkg.popular ? 20 : 0 }}>
                <div style={{ color: pkg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 8 }}>
                  {pkg.name.toUpperCase()}
                </div>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, marginBottom: 4 }}>
                  {fmtVND(price)}
                </div>
                {service?.perMonth && <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>/tháng</div>}
                <div style={{ color: DS.text3, fontSize: 12, marginBottom: 14 }}>{pkg.desc}</div>
                <div className="space-y-2">
                  {pkg.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={11} style={{ color: pkg.color || DS.green, flexShrink: 0 }} />
                      <span style={{ color: DS.text3, fontSize: 11 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono }}>◈ +{pkg.lp} LP điểm thưởng</span>
                </div>
                {selected === pkg.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: pkg.color || DS.blue }}>
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

// ══════════════════════════════════════════════════════════════════════════
// ── STEP 4: ADD-ONS ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function StepAddons({ serviceId, selected, onToggle }: { serviceId: string; selected: string[]; onToggle: (id: string) => void }) {
  const opts = MEDIA_ADDONS[serviceId] ?? [];
  const svc = MEDIA_SERVICES.find(s => s.id === serviceId);
  const color = svc?.color ?? DS.blue;

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        TÙY CHỌN BỔ SUNG
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Nâng cấp chất lượng đầu ra với các add-ons chuyên nghiệp.</p>
      <div className="space-y-3">
        {opts.map(opt => {
          const isOn = selected.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              className="w-full text-left p-4 rounded-xl flex items-center gap-4"
              style={{
                background: isOn ? rgba(color, 0.06) : rgba(DS.bgCard, 0.5),
                border: isOn ? `1.5px solid ${rgba(color, 0.4)}` : `1px solid ${DS.border}`,
                cursor: 'pointer',
              }}
              whileHover={{ scale: 1.005 }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: isOn ? rgba(color, 0.15) : rgba('#FFFFFF', 0.05), color: isOn ? color : DS.text4 }}>
                {opt.icon}
              </div>
              <div className="flex-1">
                <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
              </div>
              <div style={{ color: color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
                +{fmtVND(opt.price)}
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: isOn ? color : rgba('#FFFFFF', 0.06), border: isOn ? 'none' : `1px solid ${rgba('#FFFFFF', 0.12)}` }}>
                {isOn ? <Check size={12} style={{ color: '#fff' }} /> : <Plus size={11} style={{ color: DS.text4 }} />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── STEP 5: TEAM ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function StepTeam({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        CHỌN CREATIVE LEAD
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Chọn người dẫn dắt dự án media của bạn.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEDIA_TEAM.map(t => (
          <motion.button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="text-left p-5 rounded-2xl flex items-center gap-4"
            style={{
              background: selected === t.id ? rgba(DS.blue, 0.06) : rgba(DS.bgCard, 0.6),
              border: selected === t.id ? `2px solid ${rgba(DS.blue, 0.4)}` : `1px solid ${DS.border}`,
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.015 }}
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `2px solid ${rgba(t.rankColor, 0.4)}` }}>
              <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{t.name}</div>
              <div style={{ color: DS.text3, fontSize: 12, marginBottom: 4 }}>{t.role}</div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12 }}>{t.rankSymbol}</span>
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

// ══════════════════════════════════════════════════════════════════════════
// ── STEP 6: LỊCH HẸN ───────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function StepSchedule({
  date, setDate, timeSlot, setTimeSlot, location, setLocation, note, setNote,
}: {
  date: string; setDate: (v: string) => void;
  timeSlot: string; setTimeSlot: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  note: string; setNote: (v: string) => void;
}) {
  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        ĐẶT LỊCH HẸN
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Chọn ngày, khung giờ và địa điểm.</p>

      <div className="space-y-6">
        {/* Date picker */}
        <div>
          <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
            <Calendar size={12} className="inline mr-2" />NGÀY CHỤP / QUAY
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              background: rgba(DS.bgCard, 0.6), border: `1px solid ${DS.border}`, borderRadius: 12,
              padding: '12px 16px', color: DS.text, fontSize: 14, outline: 'none', fontFamily: DS.body,
              width: '100%', maxWidth: 320, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Time slots */}
        <div>
          <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
            <Clock size={12} className="inline mr-2" />KHUNG GIỜ
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TIME_SLOTS.map(ts => (
              <button
                key={ts.id}
                onClick={() => setTimeSlot(ts.id)}
                className="p-3 rounded-xl text-center cursor-pointer transition-all duration-200"
                style={{
                  background: timeSlot === ts.id ? rgba(ts.color, 0.1) : rgba(DS.bgCard, 0.5),
                  border: timeSlot === ts.id ? `2px solid ${rgba(ts.color, 0.5)}` : `1px solid ${DS.border}`,
                  boxShadow: timeSlot === ts.id ? `0 0 12px ${rgba(ts.color, 0.15)}` : 'none',
                }}
              >
                <div className="flex justify-center mb-1.5" style={{ color: ts.color }}>{ts.icon}</div>
                <div style={{ color: timeSlot === ts.id ? DS.text : DS.text3, fontSize: 13, fontWeight: 600 }}>{ts.label}</div>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{ts.time}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
            <MapPin size={12} className="inline mr-2" />ĐỊA ĐIỂM
          </label>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="VD: Studio LOOP, 123 Nguyễn Huệ, Q1, HCM"
            style={{
              width: '100%', background: rgba(DS.bgCard, 0.6), border: `1px solid ${DS.border}`, borderRadius: 12,
              padding: '12px 16px', color: DS.text, fontSize: 14, outline: 'none', fontFamily: DS.body, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Note */}
        <div>
          <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
            GHI CHÚ THÊM (TÙY CHỌN)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Mô tả concept, mood board, yêu cầu đặc biệt..."
            rows={3}
            style={{
              width: '100%', background: rgba(DS.bgCard, 0.6), border: `1px solid ${DS.border}`, borderRadius: 12,
              padding: '12px 16px', color: DS.text, fontSize: 14, outline: 'none', fontFamily: DS.body,
              resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Preview */}
        {date && timeSlot && (
          <motion.div
            className="p-4 rounded-xl"
            style={{ background: rgba(DS.blue, 0.06), border: `1px solid ${rgba(DS.blue, 0.15)}` }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} style={{ color: DS.blue }} />
              <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em' }}>LỊCH HẸN XÁC NHẬN</span>
            </div>
            <div style={{ color: DS.text3, fontSize: 13 }}>
              📅 <strong style={{ color: DS.text }}>{new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              <br />
              ⏰ <strong style={{ color: DS.text }}>{TIME_SLOTS.find(t => t.id === timeSlot)?.time}</strong>
              {location && <><br />📍 <strong style={{ color: DS.text }}>{location}</strong></>}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── STEP 7: XEM LẠI ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function StepReview({
  serviceId, pkgId, styles, addons, teamId, date, timeSlot, location, note,
}: {
  serviceId: string; pkgId: string; styles: string[]; addons: string[];
  teamId: string; date: string; timeSlot: string; location: string; note: string;
}) {
  const svc = MEDIA_SERVICES.find(s => s.id === serviceId);
  const pkg = MEDIA_PACKAGES.find(p => p.id === pkgId);
  const team = MEDIA_TEAM.find(t => t.id === teamId);
  const styleLabels = (SHOOT_STYLES[serviceId] ?? []).filter(s => styles.includes(s.id)).map(s => s.label);
  const addonOpts = (MEDIA_ADDONS[serviceId] ?? []).filter(a => addons.includes(a.id));
  const ts = TIME_SLOTS.find(t => t.id === timeSlot);

  const rows = [
    { label: 'Dịch vụ', value: svc?.title ?? '—', color: svc?.color },
    { label: 'Gói', value: pkg?.name ?? '—', color: pkg?.color || DS.blue },
    { label: 'Phong cách', value: styleLabels.length ? styleLabels.join(', ') : '—', color: DS.cyan },
    { label: 'Creative Lead', value: team?.name ?? '—', color: team?.rankColor },
    { label: 'Ngày', value: date ? new Date(date).toLocaleDateString('vi-VN') : '—' },
    { label: 'Khung giờ', value: ts ? `${ts.label} (${ts.time})` : '—' },
    { label: 'Địa điểm', value: location || '—' },
  ];

  return (
    <div>
      <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 8 }}>
        XEM LẠI ĐƠN HÀNG
      </h3>
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Kiểm tra lại trước khi xác nhận booking.</p>

      <div className="space-y-4">
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
          <div className="px-5 py-3" style={{ background: rgba(svc?.color ?? DS.blue, 0.08), borderBottom: `1px solid ${DS.border}` }}>
            <span style={{ color: svc?.color ?? DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>THÔNG TIN BOOKING</span>
          </div>
          <div className="p-5 space-y-3">
            {rows.map(r => (
              <div key={r.label} className="flex justify-between">
                <span style={{ color: DS.text4, fontSize: 13 }}>{r.label}</span>
                <span style={{ color: r.color ?? DS.text, fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {addonOpts.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
            <div className="px-5 py-3" style={{ background: rgba(DS.amber, 0.08), borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>ADD-ONS ({addonOpts.length})</span>
            </div>
            <div className="p-5 space-y-2">
              {addonOpts.map(a => (
                <div key={a.id} className="flex justify-between">
                  <span style={{ color: DS.text3, fontSize: 13 }}>{a.label}</span>
                  <span style={{ color: DS.amber, fontSize: 13, fontFamily: DS.mono }}>+{fmtVND(a.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {note && (
          <div className="p-4 rounded-xl" style={{ background: rgba('#FFFFFF', 0.02), border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>GHI CHÚ</div>
            <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.6 }}>{note}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── STEP 8: THANH TOÁN ──────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function StepPayment({
  lpBalance, lpDiscount, setLpDiscount, name, setName, email, setEmail,
  phone, setPhone, company, setCompany, submitted, onConfirm, orderId,
}: {
  lpBalance: number; lpDiscount: number; setLpDiscount: (n: number) => void;
  name: string; setName: (s: string) => void;
  email: string; setEmail: (s: string) => void;
  phone: string; setPhone: (s: string) => void;
  company: string; setCompany: (s: string) => void;
  submitted: boolean;
  onConfirm: () => void;
  orderId: string;
}) {
  const [payMethod, setPayMethod] = useState('bank');
  const payMethods = [
    { id: 'bank', label: 'Chuyển khoản', icon: '🏦' },
    { id: 'vnpay', label: 'VNPay QR', icon: '📱' },
    { id: 'momo', label: 'Momo', icon: '💜' },
  ];

  if (submitted) {
    return (
      <motion.div className="text-center py-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: rgba(DS.green, 0.15), border: `2px solid ${rgba(DS.green, 0.4)}` }}>
          <Check size={36} style={{ color: DS.green }} />
        </div>
        <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 12 }}>
          BOOKING THÀNH CÔNG!
        </h3>
        {orderId && (
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-xl"
            style={{ background: rgba(DS.blue, 0.1), border: `1px solid ${rgba(DS.blue, 0.25)}` }}>
            <span style={{ color: DS.text4, fontSize: 12 }}>Mã booking:</span>
            <span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{orderId}</span>
          </div>
        )}
        <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, maxWidth: 400, margin: '0 auto 32px' }}>
          Đội ngũ Media LOOP Solutions sẽ liên hệ với bạn trong vòng 1 giờ để xác nhận lịch hẹn và chuẩn bị concept.
        </p>
        <div className="inline-block px-5 py-3 rounded-xl mb-6" style={{ background: rgba(DS.purple, 0.1), border: `1px solid ${rgba(DS.purple, 0.3)}` }}>
          <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 4 }}>LP THƯỞNG BOOKING</div>
          <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 24, fontWeight: 900 }}>+300 LP</div>
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
      <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>Điền thông tin để xác nhận booking.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[
          { label: 'Họ và tên *', value: name, set: setName, placeholder: 'Nguyễn Văn A' },
          { label: 'Email *', value: email, set: setEmail, placeholder: 'name@company.vn' },
          { label: 'Số điện thoại *', value: phone, set: setPhone, placeholder: '0901 234 567' },
          { label: 'Công ty / Thương hiệu', value: company, set: setCompany, placeholder: 'Tên brand' },
        ].map(f => (
          <div key={f.label}>
            <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>{f.label}</label>
            <input
              value={f.value}
              onChange={e => f.set(e.target.value)}
              placeholder={f.placeholder}
              style={{
                width: '100%', background: rgba(DS.bgCard, 0.6), border: `1px solid ${DS.border}`,
                borderRadius: 10, padding: '11px 14px', color: DS.text, fontSize: 14,
                outline: 'none', fontFamily: DS.body, boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>

      {/* LP Discount */}
      {lpBalance > 0 && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: rgba(DS.purple, 0.06), border: `1px solid ${rgba(DS.purple, 0.2)}` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', marginBottom: 2 }}>◈ DÙNG LP ĐỂ GIẢM GIÁ</div>
              <div style={{ color: DS.text4, fontSize: 11 }}>Số dư: {lpBalance.toLocaleString()} LP · 1,000 LP = 500,000 VNĐ (tối đa 20%)</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setLpDiscount(Math.max(0, lpDiscount - 1000))}
              style={{ width: 32, height: 32, borderRadius: 8, background: rgba('#FFFFFF', 0.06), border: `1px solid ${DS.border}`, color: DS.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Minus size={14} />
            </button>
            <div style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 16, fontWeight: 700, minWidth: 80, textAlign: 'center' }}>
              {lpDiscount.toLocaleString()} LP
            </div>
            <button onClick={() => setLpDiscount(Math.min(lpBalance, lpDiscount + 1000))}
              style={{ width: 32, height: 32, borderRadius: 8, background: rgba('#FFFFFF', 0.06), border: `1px solid ${DS.border}`, color: DS.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Payment method */}
      <div className="mb-6">
        <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
          PHƯƠNG THỨC ĐẶT CỌC (30%)
        </label>
        <div className="flex gap-3 flex-wrap">
          {payMethods.map(m => (
            <button
              key={m.id}
              onClick={() => setPayMethod(m.id)}
              style={{
                padding: '10px 18px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                background: payMethod === m.id ? rgba(DS.blue, 0.12) : rgba(DS.bgCard, 0.5),
                border: payMethod === m.id ? `1.5px solid ${rgba(DS.blue, 0.5)}` : `1px solid ${DS.border}`,
                color: payMethod === m.id ? DS.blue : DS.text3,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => { if (name && email && phone) onConfirm(); }}
        style={{
          background: name && email && phone ? GRD.primary : rgba('#FFFFFF', 0.1),
          color: name && email && phone ? '#fff' : DS.text4,
          fontSize: 15, fontWeight: 700, padding: '14px 32px', borderRadius: 14, border: 'none',
          cursor: name && email && phone ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: name && email && phone ? `0 0 30px ${rgba(DS.purple, 0.4)}` : 'none',
          transition: 'all 0.3s',
        }}
      >
        <Camera size={16} />
        Xác nhận Booking
        <ArrowRight size={15} />
      </button>
      <div style={{ color: DS.text5, fontSize: 11, marginTop: 10 }}>
        * Đặt cọc 30% để giữ lịch. Thanh toán phần còn lại sau khi nhận sản phẩm.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ──────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
export default function MediaBookingPage() {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState('');
  const [shootStyles, setShootStyles] = useState<string[]>([]);
  const [pkgId, setPkgId] = useState('pro');
  const [addons, setAddons] = useState<string[]>([]);
  const [teamId, setTeamId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [lpDiscount, setLpDiscount] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');

  const { addOrder } = useLoopStore();
  const LP_BALANCE = 15200;

  const service = MEDIA_SERVICES.find(s => s.id === serviceId) ?? null;
  const pkg = MEDIA_PACKAGES.find(p => p.id === pkgId) ?? null;

  const toggleStyle = (id: string) => setShootStyles(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAddon = (id: string) => setAddons(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const canNext = () => {
    if (step === 0) return !!serviceId;
    if (step === 1) return shootStyles.length > 0;
    if (step === 2) return !!pkgId;
    if (step === 4) return !!teamId;
    if (step === 5) return !!date && !!timeSlot;
    return true;
  };

  const handleSubmit = () => {
    const svc = MEDIA_SERVICES.find(s => s.id === serviceId);
    const pk = MEDIA_PACKAGES.find(p => p.id === pkgId);
    const basePrice = svc ? svc.basePrice * (pk?.multiplier ?? 1) : 0;
    const addonPrices = (MEDIA_ADDONS[serviceId] ?? []).filter(a => addons.includes(a.id)).reduce((s, a) => s + a.price, 0);
    const total = basePrice + addonPrices;
    const orderId = `MDA-${Date.now().toString().slice(-4)}`;
    setNewOrderId(orderId);

    const newOrder: Order = {
      id: orderId,
      clientId: 9, clientName: name, clientCompany: company || 'Khách hàng mới',
      clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&h=80&crop=faces',
      type: 'service',
      serviceType: 'thiet-ke-web' as any,
      serviceTitle: svc?.title,
      title: `[MEDIA] ${svc?.title ?? 'Media'} — ${pk?.name ?? 'Gói'} (${company || name})`,
      budget: total,
      lpUsed: lpDiscount,
      lpReward: Math.floor(total / 1_000_000) * 40,
      status: 'pending_payment',
      progress: 0,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      updatedAt: new Date().toLocaleDateString('vi-VN'),
      invoiceId: `INV-${orderId}`,
      tags: ['media', serviceId, ...shootStyles.slice(0, 2)],
      messages: [{
        id: 'm_init', senderId: 'admin', senderName: 'LOOP Media',
        content: `Booking ${svc?.title} đã được ghi nhận! Lịch hẹn: ${date ? new Date(date).toLocaleDateString('vi-VN') : ''} ${TIME_SLOTS.find(t => t.id === timeSlot)?.time ?? ''}. Địa điểm: ${location || 'TBD'}`,
        type: 'system', timestamp: new Date().toLocaleString('vi-VN'), read: true,
      }],
    };
    addOrder(newOrder);
    setSubmitted(true);
  };

  const steps = [
    <StepService key={0} selected={serviceId} onSelect={(id) => { setServiceId(id); setShootStyles([]); setAddons([]); }} />,
    <StepStyle key={1} serviceId={serviceId} selected={shootStyles} onToggle={toggleStyle} />,
    <StepPackage key={2} selected={pkgId} onSelect={setPkgId} serviceId={serviceId} />,
    <StepAddons key={3} serviceId={serviceId} selected={addons} onToggle={toggleAddon} />,
    <StepTeam key={4} selected={teamId} onSelect={setTeamId} />,
    <StepSchedule key={5} date={date} setDate={setDate} timeSlot={timeSlot} setTimeSlot={setTimeSlot} location={location} setLocation={setLocation} note={note} setNote={setNote} />,
    <StepReview key={6} serviceId={serviceId} pkgId={pkgId} styles={shootStyles} addons={addons} teamId={teamId} date={date} timeSlot={timeSlot} location={location} note={note} />,
    <StepPayment key={7} lpBalance={LP_BALANCE} lpDiscount={lpDiscount} setLpDiscount={setLpDiscount} name={name} setName={setName} email={email} setEmail={setEmail} phone={phone} setPhone={setPhone} company={company} setCompany={setCompany} submitted={submitted} onConfirm={handleSubmit} orderId={newOrderId} />,
  ];

  const svcColor = service?.color ?? DS.blue;

  return (
    <div style={{ background: DS.bg, minHeight: '100vh', fontFamily: DS.body, paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${rgba(svcColor, 0.06)} 0%, transparent 100%)`, borderBottom: `1px solid ${DS.border}` }}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full"
                style={{ background: rgba(svcColor, 0.1), border: `1px solid ${rgba(svcColor, 0.25)}` }}>
                <Camera size={11} style={{ color: svcColor }} />
                <span style={{ color: svcColor, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>LOOP MEDIA SERVICES</span>
              </div>
              <h1 style={{
                fontFamily: DS.heading, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 900, letterSpacing: '0.06em',
                background: `linear-gradient(135deg, #FFFFFF, ${DS.text3})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                BOOK DỊCH VỤ MEDIA
              </h1>
              <p style={{ color: DS.text3, fontSize: 13, marginTop: 4 }}>
                Chụp ảnh · Quay phim · Làm Content — 8 bước đơn giản · Báo giá VNĐ real-time
              </p>
            </div>
            <Link to="/" style={{
              color: DS.text4, fontSize: 13, textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, border: `1px solid ${DS.border}`,
            }}>
              <X size={13} /> Thoát
            </Link>
          </div>

          <ProgressBar step={step} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: step content */}
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
                    background: step === 0 ? rgba('#FFFFFF', 0.04) : rgba('#FFFFFF', 0.06),
                    border: `1px solid ${DS.border}`,
                    color: step === 0 ? DS.text5 : DS.text3,
                    cursor: step === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontWeight: 500,
                  }}
                >
                  <ArrowLeft size={15} /> Quay lại
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
                      background: canNext() ? GRD.primary : rgba('#FFFFFF', 0.06),
                      border: 'none',
                      color: canNext() ? '#fff' : DS.text5,
                      cursor: canNext() ? 'pointer' : 'not-allowed',
                      fontSize: 14, fontWeight: 700,
                      boxShadow: canNext() ? `0 0 20px ${rgba(DS.purple, 0.35)}` : 'none',
                    }}
                  >
                    {step === steps.length - 2 ? 'Thanh toán' : 'Tiếp theo'}
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
              addons={addons}
              styles={shootStyles}
              lpDiscount={lpDiscount}
              lpBalance={LP_BALANCE}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
