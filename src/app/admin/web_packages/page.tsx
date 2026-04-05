"use client";

/**
 * Web Packages Admin Page — LOOP Solutions
 * Route: /admin/web_packages
 * Wire: /api/admin/packages/web-packages
 *
 * Full rewrite to match DESIGN LOOPS WebPackagesTab (615 lines):
 * - 4 KPI cards + SVG revenue bar chart
 * - Search + filter (active/inactive) + sort
 * - PackageRow with expandable features
 * - EditModal (full form) + AddPackageModal
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit3, Save, X, Search, ToggleRight, ToggleLeft,
  CheckCircle2, ArrowUpDown, Package, DollarSign, CalendarClock,
  PlusCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type WebPackage = {
  id: string;
  industry: string;
  icon: string;
  color: string;
  gradFrom: string;
  gradTo: string;
  tagline: string;
  description: string;
  category: string;
  trialDays: number;
  trialPrice: number;
  fullPrice: number;
  activateTime: string;
  badge?: string;
  badgeColor?: string;
  features: string[];
  demoFeatures: string[];
  previewImg: string;
  lp: number;
  active: boolean;
  orderCount: number;
  trialRequests: number;
  revenue: number;
};

// ── Init mock data (fallback when API unavailable) ───────────────────────────

const INIT_PACKAGES: WebPackage[] = [
  { id: "nha-hang", industry: "Website Nhà hàng", icon: "🍽️", color: "#EF4444", gradFrom: "#EF4444", gradTo: "#F97316", tagline: "Đặt bàn · Giao hàng · Quản lý", description: "Giải pháp toàn diện cho nhà hàng hiện đại", category: "ăn uống", trialDays: 7, trialPrice: 0, fullPrice: 8_800_000, activateTime: "2 giờ", badge: "HOT", badgeColor: "#EF4444", features: ["Website demo đẹp", "Menu online", "Đặt bàn trực tuyến", "Giao hàng tích hợp", "Quản lý đơn hàng", "Hỗ trợ SEO cơ bản", "Giao diện mobile", "Báo cáo doanh thu"], demoFeatures: ["Đặt bàn", "Menu online", "Giao hàng"], previewImg: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80", lp: 500, active: true, orderCount: 14, trialRequests: 38, revenue: 123_200_000 },
  { id: "spa-salon", industry: "Website Tiệm tóc/Spa", icon: "💇", color: "#EC4899", gradFrom: "#EC4899", gradTo: "#F472B6", tagline: "Đặt lịch · Tích điểm · Nhắn nhắc", description: "Tăng doanh số cho tiệm làm tóc và spa", category: "sức khỏe", trialDays: 5, trialPrice: 0, fullPrice: 6_600_000, activateTime: "2 giờ", badge: "SALE", badgeColor: "#F59E0B", features: ["Website spa mẫu", "Đặt lịch online", "Hệ thống tích điểm", "Nhắc lịch tự động", "Quản lý khách hàng", "Tích hợp Google Maps", "Giao diện di động", "Bảng giá dịch vụ"], demoFeatures: ["Đặt lịch", "Tích điểm", "Nhắc lịch"], previewImg: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80", lp: 350, active: true, orderCount: 11, trialRequests: 29, revenue: 72_600_000 },
  { id: "khach-san", industry: "Website Khách sạn", icon: "🏨", color: "#3B82F6", gradFrom: "#3B82F6", gradTo: "#60A5FA", tagline: "Booking trực tuyến · Quản lý phòng", description: "Hệ thống đặt phòng thông minh cho khách sạn", category: "lưu trú", trialDays: 7, trialPrice: 0, fullPrice: 15_000_000, activateTime: "4 giờ", features: ["Giao diện sang trọng", "Booking trực tuyến", "Quản lý phòng trống", "Thanh toán tích hợp", "Đánh giá khách hàng", "Hỗ trợ đa ngôn ngữ", "Tích hợp OTA", "Báo cáo chi tiết"], demoFeatures: ["Booking", "Quản lý phòng", "Thanh toán"], previewImg: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80", lp: 800, active: true, orderCount: 6, trialRequests: 18, revenue: 90_000_000 },
  { id: "cuahang", industry: "Website Cửa hàng", icon: "🏪", color: "#22C55E", gradFrom: "#22C55E", gradTo: "#4ADE80", tagline: "Bán hàng · Kho · Giao hàng", description: "Quản lý cửa hàng từ online đến offline", category: "mua sắm", trialDays: 5, trialPrice: 0, fullPrice: 9_900_000, activateTime: "2 giờ", badge: "NEW", badgeColor: "#22C55E", features: ["Website bán hàng", "Quản lý kho", "Tích hợp vận chuyển", "Mã giảm giá", "Đánh giá sản phẩm", "So sánh giá", "Giao diện mobile", "Hỗ trợ đa cửa hàng"], demoFeatures: ["Bán hàng", "Kho hàng", "Vận chuyển"], previewImg: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80", lp: 500, active: true, orderCount: 9, trialRequests: 26, revenue: 89_100_000 },
  { id: "coffe", industry: "Website Quán Cà phê", icon: "☕", color: "#92400E", gradFrom: "#92400E", gradTo: "#D97706", tagline: "Đặt món · Tích hợp giao hàng", description: "Giải pháp số cho quán cà phê hiện đại", category: "ăn uống", trialDays: 7, trialPrice: 0, fullPrice: 7_700_000, activateTime: "2 giờ", features: ["Website quán cà phê", "Đặt món online", "Giao hàng tích hợp", "Hệ thống tích điểm", "Thanh toán online", "Menu động", "Blog ẩm thực", "Hỗ trợ đa ngôn ngữ"], demoFeatures: ["Đặt món", "Tích điểm", "Giao hàng"], previewImg: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80", lp: 400, active: true, orderCount: 7, trialRequests: 20, revenue: 53_900_000 },
  { id: "phongkham", industry: "Website Phòng khám", icon: "🏥", color: "#14B8A6", gradFrom: "#14B8A6", gradTo: "#2DD4BF", tagline: "Đặt lịch khám · Hồ sơ bệnh nhân", description: "Quản lý phòng khám chuyên nghiệp", category: "sức khỏe", trialDays: 10, trialPrice: 0, fullPrice: 12_000_000, activateTime: "4 giờ", features: ["Website phòng khám", "Đặt lịch khám online", "Hồ sơ bệnh nhân", "Nhắc lịch tự động", "Kê đơn điện tử", "Báo cáo thống kê", "Tích hợp BHYT", "Hỗ trợ telemedicine"], demoFeatures: ["Đặt lịch", "Hồ sơ", "Nhắc lịch"], previewImg: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80", lp: 650, active: true, orderCount: 4, trialRequests: 11, revenue: 48_000_000 },
  { id: "bds", industry: "Website Bất động sản", icon: "🏠", color: "#8B5CF6", gradFrom: "#8B5CF6", gradTo: "#A78BFA", tagline: "Dự án · Môi giới · Listing", description: "Nền tảng bất động sản chuyên nghiệp", category: "bất động sản", trialDays: 5, trialPrice: 0, fullPrice: 22_000_000, activateTime: "6 giờ", features: ["Website bất động sản", "Dự án 3D", "Listing sản phẩm", "Tìm kiếm nâng cao", "Bản đồ tích hợp", "Virtual tour 360°", "Môi giới CRM", "Báo cáo hiệu quả"], demoFeatures: ["Listing", "Bản đồ", "Virtual tour"], previewImg: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80", lp: 1_200, active: false, orderCount: 2, trialRequests: 7, revenue: 44_000_000 },
  { id: "giaoduc", industry: "Website Giáo dục", icon: "🎓", color: "#0EA5E9", gradFrom: "#0EA5E9", gradTo: "#38BDF8", tagline: "Khóa học · Đăng ký · Thanh toán", description: "Nền tảng học trực tuyến cho trung tâm", category: "giáo dục", trialDays: 7, trialPrice: 0, fullPrice: 11_000_000, activateTime: "4 giờ", features: ["Website trung tâm", "Khóa học online", "Đăng ký học phí", "Thanh toán tích hợp", "Học bổng", "Bảng điểm", "Lịch học", "Hỗ trợ đa lớp"], demoFeatures: ["Khóa học", "Đăng ký", "Thanh toán"], previewImg: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80", lp: 600, active: true, orderCount: 5, trialRequests: 15, revenue: 55_000_000 },
];

const CATEGORIES = ["ăn uống", "sức khỏe", "lưu trú", "mua sắm", "giáo dục", "bất động sản"];
const COLORS = ["#3B82F6", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#14B8A6", "#EC4899", "#C084FC", "#06B6D4", "#D97706"];

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  pkg,
  onClose,
  onSave,
}: {
  pkg: WebPackage;
  onClose: () => void;
  onSave: (updated: Partial<WebPackage>) => void;
}) {
  const [form, setForm] = useState({
    industry: pkg.industry,
    tagline: pkg.tagline,
    description: pkg.description,
    trialDays: pkg.trialDays,
    fullPrice: pkg.fullPrice,
    activateTime: pkg.activateTime,
    lp: pkg.lp,
    badge: pkg.badge ?? "",
    features: pkg.features.join("\n"),
    demoFeatures: pkg.demoFeatures.join("\n"),
  });

  const handleSave = () => {
    onSave({
      industry: form.industry,
      tagline: form.tagline,
      description: form.description,
      trialDays: Number(form.trialDays),
      fullPrice: Number(form.fullPrice),
      activateTime: form.activateTime,
      lp: Number(form.lp),
      badge: form.badge || undefined,
      badgeColor: pkg.badgeColor ?? pkg.color,
      features: form.features.split("\n").filter(Boolean),
      demoFeatures: form.demoFeatures.split("\n").filter(Boolean),
    });
    onClose();
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6, letterSpacing: "0.1em" }}>{label}</label>
      {children}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(12px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${pkg.color}35`, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, background: `${pkg.color}08`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{pkg.icon}</span>
              <div>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>── CHỈNH SỬA GÓI WEB</div>
                <div style={{ color: pkg.color, fontSize: 15, fontWeight: 700 }}>{pkg.industry}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
        </div>

        {/* Form */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="TÊN GÓI WEB">
              <input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="BADGE (HOT, PREMIUM...)">
              <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="Để trống nếu không có" style={inputStyle} />
            </Field>
          </div>

          <Field label="TAGLINE">
            <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} style={inputStyle} />
          </Field>

          <Field label="MÔ TẢ NGẮN">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="NGÀY DÙNG THỬ">
              <input type="number" min={1} max={30} value={form.trialDays}
                onChange={e => setForm(f => ({ ...f, trialDays: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="GIÁ FULL (VNĐ)">
              <input type="number" value={form.fullPrice}
                onChange={e => setForm(f => ({ ...f, fullPrice: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="LP THƯỞNG">
              <input type="number" value={form.lp}
                onChange={e => setForm(f => ({ ...f, lp: Number(e.target.value) }))} style={inputStyle} />
            </Field>
          </div>

          <Field label="TÍNH NĂNG ĐẦY ĐỦ (mỗi dòng 1 tính năng)">
            <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              rows={5} style={{ ...inputStyle, resize: "vertical", fontFamily: DS.mono, fontSize: 12 }} />
          </Field>

          <Field label="TÍNH NĂNG DEMO (hiển thị trên card, tối đa 3)">
            <textarea value={form.demoFeatures} onChange={e => setForm(f => ({ ...f, demoFeatures: e.target.value }))}
              rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: DS.mono, fontSize: 12 }} />
          </Field>

          {/* Preview */}
          <div style={{ padding: "1rem", borderRadius: 12, background: `${pkg.color}08`, border: `1px solid ${pkg.color}25` }}>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 8 }}>XEM TRƯỚC</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 24 }}>{pkg.icon}</span>
              <div>
                <div style={{ color: pkg.color, fontSize: 13, fontWeight: 700 }}>{form.industry}</div>
                <div style={{ color: DS.text5, fontSize: 11 }}>{form.tagline}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>FREE {form.trialDays}N</div>
                <div style={{ color: pkg.color, fontSize: 15, fontWeight: 800 }}>{Number(form.fullPrice).toLocaleString("vi-VN")} VNĐ</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleSave}
            style={{ flex: 2, background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Save size={14} /> Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Add Package Modal ─────────────────────────────────────────────────────────

function AddPackageModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (pkg: WebPackage) => void;
}) {
  const [form, setForm] = useState({
    industry: "",
    icon: "🌐",
    tagline: "",
    description: "",
    category: "ăn uống",
    trialDays: 5,
    fullPrice: 9_900_000,
    activateTime: "2 giờ",
    lp: 500,
    badge: "",
    color: "#3B82F6",
    features: "",
    demoFeatures: "",
  });

  const handleAdd = () => {
    if (!form.industry.trim()) return;
    const newPkg: WebPackage = {
      id: form.industry.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      industry: form.industry,
      icon: form.icon,
      color: form.color,
      gradFrom: form.color,
      gradTo: form.color,
      tagline: form.tagline,
      description: form.description,
      category: form.category,
      trialDays: form.trialDays,
      trialPrice: 0,
      fullPrice: form.fullPrice,
      activateTime: form.activateTime,
      badge: form.badge || undefined,
      badgeColor: form.color,
      features: form.features.split("\n").filter(Boolean),
      demoFeatures: form.demoFeatures.split("\n").filter(Boolean),
      previewImg: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=600&q=80",
      lp: form.lp,
      active: true,
      orderCount: 0,
      trialRequests: 0,
      revenue: 0,
    };
    onAdd(newPkg);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none",
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.92)", backdropFilter: "blur(12px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={e => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${DS.blue}35`, borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>── THÊM GÓI WEB MỚI</div>
              <div style={{ color: DS.blue, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Tạo loại website mới</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Field label="TÊN GÓI WEB">
              <input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                placeholder="Website Nhà hàng" style={inputStyle} />
            </Field>
            <Field label="ICON (EMOJI)">
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="🍽️" style={{ ...inputStyle, fontSize: 20, textAlign: "center" }} />
            </Field>
          </div>

          <Field label="MÀU SẮC CHÍNH">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${form.color === c ? "#fff" : "transparent"}`, cursor: "pointer", boxShadow: form.color === c ? `0 0 8px ${c}` : "none" }} />
              ))}
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="DANH MỤC">
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="BADGE (TÙY CHỌN)">
              <input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                placeholder="HOT, NEW..." style={inputStyle} />
            </Field>
          </div>

          <Field label="TAGLINE">
            <input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              placeholder="Tính năng 1 · Tính năng 2 · Tính năng 3" style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="NGÀY DÙNG THỬ">
              <input type="number" min={1} max={30} value={form.trialDays}
                onChange={e => setForm(f => ({ ...f, trialDays: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="GIÁ FULL (VNĐ)">
              <input type="number" value={form.fullPrice}
                onChange={e => setForm(f => ({ ...f, fullPrice: Number(e.target.value) }))} style={inputStyle} />
            </Field>
            <Field label="LP THƯỞNG">
              <input type="number" value={form.lp}
                onChange={e => setForm(f => ({ ...f, lp: Number(e.target.value) }))} style={inputStyle} />
            </Field>
          </div>

          <Field label="TÍNH NĂNG (mỗi dòng 1 tính năng)">
            <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              rows={3} placeholder={"Báo giá Website\nNhận báo giá online\nQuản lý khách hàng..."}
              style={{ ...inputStyle, resize: "vertical", fontFamily: DS.mono, fontSize: 12 }} />
          </Field>

          <Field label="TÍNH NĂNG DEMO (tối đa 3 dòng, hiển thị trên card)">
            <textarea value={form.demoFeatures} onChange={e => setForm(f => ({ ...f, demoFeatures: e.target.value }))}
              rows={2} placeholder={"Nhận báo giá\nQuản lý\nBáo cáo"}
              style={{ ...inputStyle, resize: "none", fontFamily: DS.mono, fontSize: 12 }} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleAdd} disabled={!form.industry.trim()}
            style={{ flex: 2, background: form.industry.trim() ? GRD.primary : DS.bgCard2, color: form.industry.trim() ? "#fff" : DS.text5, border: "none", borderRadius: 10, padding: "10px", cursor: form.industry.trim() ? "pointer" : "default", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={14} /> Thêm gói web
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Package Row (expandable) ──────────────────────────────────────────────────

function PackageRow({
  pkg,
  onEdit,
  onToggle,
}: {
  pkg: WebPackage;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: `1px solid ${pkg.active ? DS.border : DS.border + "50"}`, borderRadius: 16, overflow: "hidden", opacity: pkg.active ? 1 : 0.55 }}>
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "1rem", background: DS.bgCard2 }}>
        {/* Icon + name */}
        <div style={{ minWidth: 200, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>{pkg.icon}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: pkg.active ? DS.text : DS.text4, fontSize: 13, fontWeight: 700 }}>{pkg.industry}</span>
              {pkg.badge && (
                <span style={{ color: pkg.badgeColor ?? pkg.color, fontSize: 8, fontFamily: DS.mono, background: `${pkg.badgeColor ?? pkg.color}15`, border: `1px solid ${pkg.badgeColor ?? pkg.color}30`, padding: "1px 6px", borderRadius: 6 }}>{pkg.badge}</span>
              )}
            </div>
            <div style={{ color: DS.text5, fontSize: 10 }}>{pkg.category}</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>FREE/{pkg.trialDays}N</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>{pkg.trialRequests} yêu cầu</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: pkg.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{Number(pkg.fullPrice).toLocaleString("vi-VN")}</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>VNĐ / gói full</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{pkg.orderCount}</div>
            <div style={{ color: DS.text5, fontSize: 9 }}>Đơn đã mua</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
              {pkg.revenue >= 1_000_000 ? `${(pkg.revenue / 1_000_000).toFixed(0)}M` : pkg.revenue.toLocaleString("vi-VN")}
            </div>
            <div style={{ color: DS.text5, fontSize: 9 }}>Doanh thu VNĐ</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button onClick={onToggle}
            style={{ background: "none", border: "none", cursor: "pointer", color: pkg.active ? DS.green : DS.text5, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: DS.mono }}>
            {pkg.active ? <ToggleRight size={22} style={{ color: DS.green }} /> : <ToggleLeft size={22} />}
          </button>
          <button onClick={onEdit}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: `${pkg.color}12`, border: `1px solid ${pkg.color}30`, color: pkg.color, cursor: "pointer", fontSize: 11, fontFamily: DS.mono }}>
            <Edit3 size={12} /> Sửa
          </button>
          <button onClick={() => setExpanded(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: DS.text5, padding: 4 }}>
            {expanded ? <X size={15} /> : <PlusCircle size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded features */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "1rem", background: DS.bgCard, borderTop: `1px solid ${DS.border}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px" }}>
                {pkg.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckCircle2 size={10} style={{ color: pkg.color, flexShrink: 0 }} />
                    <span style={{ color: DS.text4, fontSize: 11 }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${DS.border}` }}>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>DEMO: </span>
                {pkg.demoFeatures.map(f => (
                  <span key={f} style={{ color: pkg.color, fontSize: 10, fontFamily: DS.mono, background: `${pkg.color}10`, border: `1px solid ${pkg.color}25`, padding: "2px 8px", borderRadius: 5 }}>{f}</span>
                ))}
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginLeft: "auto" }}>
                  Kích hoạt: {pkg.activateTime} · LP thưởng: {pkg.lp.toLocaleString()} LP
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function WebPackagesPage() {
  const qc = useQueryClient();
  const [packages, setPackages] = useState<WebPackage[]>(INIT_PACKAGES);
  const [editPkg, setEditPkg] = useState<WebPackage | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"revenue" | "orders" | "price" | "trial">("revenue");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "web-packages"],
    queryFn: () => adminApi.get<{ data: WebPackage[] }>("/api/admin/packages/web-packages", { params: {} }),
  });

  // Use API data when available, fallback to local state
  const allPackages = (data?.data?.length ?? 0) > 0 ? (data?.data ?? []) : packages;

  const filtered = useMemo(() => {
    let list = allPackages;
    if (filterActive === "active") list = list.filter((p: WebPackage) => p.active);
    if (filterActive === "inactive") list = list.filter((p: WebPackage) => !p.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: WebPackage) => p.industry.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sortBy === "revenue") sorted.sort((a, b) => b.revenue - a.revenue);
    else if (sortBy === "orders") sorted.sort((a, b) => b.orderCount - a.orderCount);
    else if (sortBy === "price") sorted.sort((a, b) => b.fullPrice - a.fullPrice);
    else if (sortBy === "trial") sorted.sort((a, b) => b.trialRequests - a.trialRequests);
    return sorted;
  }, [allPackages, filterActive, search, sortBy]);

  const totalRevenue = allPackages.reduce((s: number, p: WebPackage) => s + p.revenue, 0);
  const totalOrders = allPackages.reduce((s: number, p: WebPackage) => s + p.orderCount, 0);
  const totalTrials = allPackages.reduce((s: number, p: WebPackage) => s + p.trialRequests, 0);
  const activeCount = allPackages.filter((p: WebPackage) => p.active).length;

  const toggle = (id: string) => setPackages(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  const update = (id: string, data: Partial<WebPackage>) => setPackages(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const addPkg = (pkg: WebPackage) => setPackages(prev => [...prev, pkg]);

  // SVG mini bar chart for revenue distribution
  const maxRevenue = Math.max(...allPackages.map((p: WebPackage) => p.revenue), 1);
  const BAR_W = 24;
  const CHART_H = 48;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Gói Web Doanh Nghiệp
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {allPackages.length} gói · {activeCount} đang hoạt động
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono, boxShadow: "0 0 16px rgba(129,140,248,0.3)" }}>
            <Plus size={13} /> Thêm gói web
          </button>
        </div>
      </div>

      {/* KPI overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Tổng doanh thu", value: totalRevenue >= 1_000_000 ? `${(totalRevenue / 1_000_000).toFixed(0)}M VNĐ` : totalRevenue.toLocaleString("vi-VN"), color: DS.green, icon: <DollarSign size={18} /> },
          { label: "Đơn hàng đã bán", value: totalOrders, color: DS.blue, icon: <Package size={18} /> },
          { label: "Yêu cầu dùng thử", value: totalTrials, color: DS.amber, icon: <CalendarClock size={18} /> },
          { label: "Gói đang active", value: `${activeCount}/${allPackages.length}`, color: DS.purple, icon: <ToggleRight size={18} /> },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.mono, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue distribution SVG chart */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 16 }}>── DOANH THU THEO GÓI WEB</div>
        <div style={{ overflowX: "auto" }}>
          <svg width={Math.max(allPackages.length * (BAR_W + 12) + 40, 400)} height={CHART_H + 36} style={{ display: "block", minWidth: 400 }}>
            {allPackages.map((p: WebPackage, i: number) => {
              const barH = Math.max((p.revenue / maxRevenue) * CHART_H, 2);
              const x = i * (BAR_W + 12) + 20;
              const y = CHART_H - barH;
              return (
                <g key={p.id}>
                  <rect x={x} y={y} width={BAR_W} height={barH} rx={4}
                    fill={p.active ? p.color : DS.border}
                    opacity={p.active ? 0.85 : 0.4}
                  />
                  <foreignObject x={x + BAR_W / 2 - 9} y={CHART_H + 4} width={18} height={18}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>{p.icon}</span>
                  </foreignObject>
                  {p.revenue > 0 && (
                    <text x={x + BAR_W / 2} y={y - 3} textAnchor="middle" style={{ fontSize: 8, fill: p.color, fontFamily: "monospace" }}>
                      {(p.revenue / 1_000_000).toFixed(0)}M
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: DS.bgCard, border: `1px solid ${DS.border}`, flex: 1 }}>
            <Search size={13} style={{ color: DS.text5 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm gói web theo tên, danh mục..."
              style={{ background: "none", border: "none", outline: "none", color: DS.text3, fontSize: 13, flex: 1 }} />
          </div>

          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <ArrowUpDown size={12} style={{ color: DS.text5 }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              style={{ background: "none", border: "none", outline: "none", color: DS.text4, fontSize: 12, fontFamily: DS.mono, cursor: "pointer" }}>
              <option value="revenue">Doanh thu</option>
              <option value="orders">Đơn hàng</option>
              <option value="trial">Dùng thử</option>
              <option value="price">Giá</option>
            </select>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(["all", "active", "inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              style={{ padding: "4px 12px", borderRadius: 20, fontSize: 10, fontFamily: DS.mono, cursor: "pointer", border: `1px solid ${filterActive === f ? DS.blue : DS.border}`, background: filterActive === f ? "rgba(59,130,246,0.12)" : "none", color: filterActive === f ? DS.blue : DS.text5 }}>
              {f === "all" ? `TẤT CẢ (${allPackages.length})` : f === "active" ? `ACTIVE (${activeCount})` : `ẨN (${allPackages.length - activeCount})`}
            </button>
          ))}
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginLeft: "auto" }}>
            {filtered.length} / {allPackages.length} gói web
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 120px", gap: 16, padding: "0 1rem", marginBottom: 8 }}>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em" }}>TÊN GÓI WEB</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em" }}>
          <span style={{ textAlign: "center" }}>DÙNG THỬ / YÊU CẦU</span>
          <span style={{ textAlign: "center" }}>GIÁ FULL</span>
          <span style={{ textAlign: "center" }}>ĐƠN ĐÃ BÁN</span>
          <span style={{ textAlign: "center" }}>DOANH THU</span>
        </div>
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.12em", textAlign: "right" }}>THAO TÁC</div>
      </div>

      {/* Package list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <AnimatePresence>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12 }}>
              <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>Không tìm thấy gói web</div>
            </div>
          ) : (
            filtered.map((pkg: WebPackage, i: number) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.04 }}
              >
                <PackageRow
                  pkg={pkg}
                  onEdit={() => setEditPkg(pkg)}
                  onToggle={() => toggle(pkg.id)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editPkg && (
          <EditModal
            pkg={editPkg}
            onClose={() => setEditPkg(null)}
            onSave={data => {
              update(editPkg.id, data);
              setEditPkg(null);
            }}
          />
        )}
        {showAdd && <AddPackageModal onClose={() => setShowAdd(false)} onAdd={addPkg} />}
      </AnimatePresence>
    </div>
  );
}

// Re-export refresh icon for use
import { RefreshCw } from "lucide-react";
