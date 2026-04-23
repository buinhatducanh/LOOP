"use client";

/**
 * PricingTab — Admin tab for managing Service Tiers
 * /admin/services → "Bảng Giá" tab
 *
 * Layout: top-level service tabs (Website | SEO | App/SaaS | Dashboard)
 *   Each service has sub-tabs: "Bảng Giá" + service-specific sub-tab
 *     Website: "Bảng Giá" | "Tính Năng [MATRIX]"
 *     SEO:     "Bảng Giá SEO" | "Tính Năng SEO [MATRIX]"
 *     App/Dashboard: "Bảng Giá" only
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { Plus, Edit2, Trash2, X, Layers, DollarSign, Globe } from "lucide-react";
import { SEOPackageFeaturesTab } from "./SEOPackageFeaturesTab";
import { WebPackageFeatureTable, type WebPackageFeature } from "@/components/landing/WebPackageFeatureTable";

// ── Types ─────────────────────────────────────────────────────────────────────

type ServiceTier = {
  id: string;
  serviceKey: string;
  level: number;
  name: string;
  nameEn?: string;
  shortDesc?: string;
  shortDescEn?: string;
  basePrice: number;
  marketPrice?: number;
  lpReward: number;
  sortOrder: number;
  isActive: boolean;
};

// Top-level service branches
type ServiceBranch = "web" | "seo" | "app" | "dashboard";

const BRANCH_COLORS: Record<ServiceBranch, string> = {
  web: "#3B82F6",
  seo: "#F59E0B",
  app: "#8B5CF6",
  dashboard: "#EC4899",
};
const BRANCH_LABELS: Record<ServiceBranch, string> = {
  web: "Website",
  seo: "SEO",
  app: "App/SaaS",
  dashboard: "Dashboard",
};
const BRANCH_ICONS: Record<ServiceBranch, React.ReactNode> = {
  web: <Globe size={13} />,
  seo: <span>🔍</span>,
  app: <span>📱</span>,
  dashboard: <span>📊</span>,
};

const SERVICE_KEYS = ["web", "app", "dashboard", "seo"] as const;
const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

// ── Tier Row ──────────────────────────────────────────────────────────────────

function TierRow({ tier, onEdit, onDelete }: {
  tier: ServiceTier;
  onEdit: (t: ServiceTier) => void;
  onDelete: (t: ServiceTier) => void;
}) {
  const qc = useQueryClient();
  const color = BRANCH_COLORS[tier.serviceKey as ServiceBranch] ?? DS.blue;

  const toggleActive = useMutation({
    mutationFn: async () => {
      await adminApi.put<{ data: ServiceTier }>(`/api/admin/service-tiers/${tier.id}`, { isActive: !tier.isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminServiceTiers() }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${tier.isActive ? color + "30" : DS.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: tier.isActive ? 1 : 0.55,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
          {tier.level === 1 ? "B" : tier.level === 2 ? "B2" : "E"}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
          <p style={{ color: DS.text, fontWeight: 700, fontSize: 14 }}>{tier.name}</p>
          {tier.nameEn && (
            <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>/ {tier.nameEn}</p>
          )}
        </div>
        {tier.shortDesc && (
          <p style={{ color: DS.text4, fontSize: 11 }}>{tier.shortDesc}</p>
        )}
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ color: DS.text, fontFamily: DS.mono, fontWeight: 700, fontSize: 13 }}>
          {fmtVND(tier.basePrice)}
        </div>
        {!!tier.marketPrice && tier.marketPrice > tier.basePrice && (
          <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, textDecoration: "line-through" }}>
            {fmtVND(tier.marketPrice)}
          </span>
        )}
      </div>

      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 48 }}>
        <div style={{ color: DS.purple, fontFamily: DS.mono, fontSize: 11 }}>
          +{tier.lpReward} LP
        </div>
      </div>

      <button
        onClick={() => toggleActive.mutate()}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 9,
          fontFamily: DS.mono,
          cursor: "pointer",
          background: tier.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${tier.isActive ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: tier.isActive ? DS.green : DS.red,
          transition: "all 0.2s",
        }}
      >
        {tier.isActive ? "Active" : "Off"}
      </button>

      <button
        onClick={() => onEdit(tier)}
        style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer", padding: 4 }}
      >
        <Edit2 size={14} />
      </button>
      <button
        onClick={() => onDelete(tier)}
        style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer", padding: 4 }}
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
}

// ── Tier Modal ────────────────────────────────────────────────────────────────

function TierModal({ tier, serviceKey, defaultLevel, onClose, onSaved }: {
  tier?: ServiceTier | null;
  serviceKey?: string;
  defaultLevel?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [svcKey, setSvcKey] = useState(tier?.serviceKey ?? serviceKey ?? "web");
  const [level, setLevel] = useState(tier?.level ?? defaultLevel ?? 1);
  const [name, setName] = useState(tier?.name ?? "");
  const [nameEn, setNameEn] = useState(tier?.nameEn ?? "");
  const [shortDesc, setShortDesc] = useState(tier?.shortDesc ?? "");
  const [shortDescEn, setShortDescEn] = useState(tier?.shortDescEn ?? "");
  const [basePrice, setBasePrice] = useState(tier?.basePrice?.toString() ?? "");
  const [marketPrice, setMarketPrice] = useState(tier?.marketPrice?.toString() ?? "");
  const [lpReward, setLpReward] = useState(tier?.lpReward?.toString() ?? "50");
  const [sortOrder, setSortOrder] = useState(tier?.sortOrder?.toString() ?? "1");
  const isEdit = !!tier;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        serviceKey: svcKey,
        level,
        name,
        nameEn: nameEn || undefined,
        shortDesc: shortDesc || undefined,
        shortDescEn: shortDescEn || undefined,
        basePrice: parseInt(basePrice) || 0,
        marketPrice: marketPrice ? parseInt(marketPrice) : undefined,
        lpReward: parseInt(lpReward) || 50,
        sortOrder: parseInt(sortOrder) || level,
        isActive: true,
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/service-tiers/${tier.id}`, payload);
      } else {
        await adminApi.post("/api/admin/service-tiers", payload);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.adminServiceTiers() }); onSaved(); },
    onError: (err) => { setToast({ message: err instanceof Error ? err.message : "Lưu thất bại", type: "error" }); },
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: DS.body,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: DS.bgCard3,
          border: `1px solid ${DS.border}`,
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: DS.text, fontWeight: 800, fontSize: 18, fontFamily: DS.heading }}>
            {isEdit ? "Sửa Gói Dịch Vụ" : "Tạo Gói Dịch Vụ"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Dịch vụ</label>
              <select value={svcKey} onChange={e => setSvcKey(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {SERVICE_KEYS.map(k => (
                  <option key={k} value={k} style={{ background: DS.bgCard3 }}>
                    {BRANCH_LABELS[k as ServiceBranch]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Level (1/2/3)</label>
              <input type="number" value={level} onChange={e => setLevel(parseInt(e.target.value) || 1)} min={1} max={3} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Tên gói (VI)</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: SEO Cơ Bản" style={inputStyle} />
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Tên gói (EN)</label>
            <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Basic SEO" style={inputStyle} />
          </div>

          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Mô tả ngắn (VI)</label>
            <input value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="Tối ưu 5 từ khóa, báo cáo tháng" style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Giá (VNĐ)</label>
              <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="2000000" style={inputStyle} />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Giá thị trường</label>
              <input type="number" value={marketPrice} onChange={e => setMarketPrice(e.target.value)} placeholder="3000000" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>LP thưởng</label>
              <input type="number" value={lpReward} onChange={e => setLpReward(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Sort order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !name || !basePrice}
          style={{
            width: "100%", marginTop: 20, padding: "12px",
            background: (save.isPending || !name || !basePrice) ? "rgba(255,255,255,0.05)" : GRD.primary,
            color: (save.isPending || !name || !basePrice) ? DS.text4 : "#fff",
            border: "none", borderRadius: 10, cursor: (save.isPending || !name || !basePrice) ? "not-allowed" : "pointer",
            fontWeight: 700, fontSize: 14,
          }}
        >
          {save.isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo gói mới"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ tier, onClose, onDeleted }: { tier: ServiceTier; onClose: () => void; onDeleted: () => void }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async () => {
      await adminApi.delete(`/api/admin/service-tiers/${tier.id}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.adminServiceTiers() }); onDeleted(); },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: DS.bgCard3, border: `1px solid rgba(239,68,68,0.3)`,
          borderRadius: 16, padding: 24, width: "100%", maxWidth: 400,
        }}
      >
        <h3 style={{ color: DS.red, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
          Xóa Gói Dịch Vụ?
        </h3>
        <p style={{ color: DS.text3, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Bạn đang xóa gói <strong style={{ color: DS.text }}>{tier.name}</strong> ({tier.serviceKey} — Level {tier.level}). Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => del.mutate()}
            disabled={del.isPending}
            style={{
              flex: 1, padding: "10px", background: "rgba(239,68,68,0.15)", color: DS.red,
              border: "1px solid rgba(239,68,68,0.4)", borderRadius: 10, cursor: "pointer", fontWeight: 700,
            }}
          >
            {del.isPending ? "Đang xóa..." : "Xóa"}
          </button>
          <button onClick={onClose} style={{
            padding: "10px 16px", background: "transparent", border: `1px solid ${DS.border}`,
            color: DS.text3, borderRadius: 10, cursor: "pointer",
          }}>
            Hủy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Web Feature Matrix Sub-tab ───────────────────────────────────────────────

const WEB_FEATURE_MATRIX_FALLBACK: WebPackageFeature[] = [
  // ── 1. Giao diện & Hiển thị ──────────────────────────────────
  { id: "ui-responsive", label: "Tự động co giãn màn hình", labelEn: "Responsive Display", description: "Hiển thị đẹp trên cả điện thoại, iPad và máy tính.", category: "Giao diện", includedTiers: [1, 2, 3, 4] },
  { id: "ui-nav", label: "Bố cục điều hướng thông minh", labelEn: "Smart Navigation Layout", description: "Sắp xếp nút bấm hợp lý để giữ chân khách ở lại lâu hơn.", category: "Giao diện", includedTiers: [1, 2, 3, 4] },
  { id: "ui-custom", label: "Vẽ giao diện độc quyền riêng", labelEn: "Custom Exclusive Design", description: "Không dùng mẫu có sẵn, vẽ riêng theo đúng nhận diện thương hiệu.", category: "Giao diện", extraPrice: 3_000_000, includedTiers: [3, 4] },
  { id: "ui-animation", label: "Hiệu ứng chuyển động", labelEn: "Animation & Micro-interactions", description: "Ảnh nổi lên, nút bấm phát sáng khi lướt chuột tạo cảm giác cao cấp.", category: "Giao diện", includedTiers: [2, 3, 4] },

  // ── 2. Tính năng Cốt lõi ───────────────────────────────────
  { id: "core-form", label: "Biểu mẫu thu thập khách", labelEn: "Lead Capture Forms", description: "Khách điền Tên/SĐT, dữ liệu báo thẳng về email của bạn.", category: "Tính năng cốt lõi", includedTiers: [1, 2, 3, 4] },
  { id: "core-blog", label: "Trang Blog & Tin tức", labelEn: "Blog & News Pages", description: "Nơi đăng tải bài viết chia sẻ kiến thức, mẹo vặt, tin công ty.", category: "Tính năng cốt lõi", includedTiers: [2, 3, 4] },
  { id: "core-cms", label: "Hệ thống Quản trị (CMS)", labelEn: "Content Management System", description: "Giao diện thao tác như dùng Word, tự thay chữ/ảnh không cần biết code.", category: "Tính năng cốt lõi", extraPrice: 5_000_000, includedTiers: [2, 3, 4] },
  { id: "core-i18n", label: "Dịch thuật Đa ngôn ngữ", labelEn: "Multi-language (i18n)", description: "Thêm nút chuyển đổi tiếng Anh, Nhật, Hàn... cho khách quốc tế.", category: "Tính năng cốt lõi", extraPrice: 3_000_000, includedTiers: [2, 3, 4] },

  // ── 3. Quản trị & Vận hành Nội bộ ──────────────────────────
  { id: "admin-roles", label: "Tài khoản & Phân quyền", labelEn: "Account & Role-based Access", description: "Cấp quyền riêng cho nhân viên (VD: chỉ được đăng bài, không được xem doanh thu).", category: "Quản trị", includedTiers: [2, 3, 4] },
  { id: "admin-dashboard", label: "Bảng biểu đồ Thống kê", labelEn: "Admin Dashboard & Charts", description: "Màn hình tổng quan xem hôm nay có bao nhiêu người vào, bán được bao nhiêu.", category: "Quản trị", includedTiers: [2, 3, 4] },
  { id: "admin-ai", label: "Tìm kiếm Thông minh (AI)", labelEn: "AI-powered Smart Search", description: "Khách gõ sai chính tả hay không dấu hệ thống vẫn hiểu và gợi ý đúng.", category: "Quản trị", extraPrice: 4_000_000, includedTiers: [3, 4] },

  // ── 4. Khả năng Marketing & Lên Top Google (SEO) ───────────
  { id: "seo-config", label: "Cấu hình Chuẩn SEO", labelEn: "Standard SEO Configuration", description: "Đảm bảo các tiêu chuẩn kỹ thuật để Google dễ dàng đẩy web lên trang nhất.", category: "SEO & Marketing", includedTiers: [1, 2, 3, 4] },
  { id: "seo-social", label: "Hiển thị đẹp trên Mạng xã hội", labelEn: "Social Media Preview", description: "Hình ảnh, tiêu đề hiển thị chuẩn kích thước khi share link qua Zalo, Facebook.", category: "SEO & Marketing", includedTiers: [1, 2, 3, 4] },
  { id: "seo-analytics", label: "Lắp đặt Công cụ đo lường Google", labelEn: "Google Analytics & GSC Setup", description: "Giúp bạn biết khách hàng đến từ đâu, độ tuổi nào, thích xem gì nhất.", category: "SEO & Marketing", extraPrice: 1_500_000, includedTiers: [1, 2, 3, 4] },
  { id: "seo-ai", label: "Trợ lý AI Viết bài", labelEn: "AI Content Marketing Assistant", description: "Tích hợp AI tự động soạn thảo bài viết chuẩn marketing ngay trong trang quản trị.", category: "SEO & Marketing", extraPrice: 6_000_000, includedTiers: [3, 4] },

  // ── 5. Cỗ máy Thương mại & Chốt đơn ───────────────────────
  { id: "ecom-categories", label: "Quản lý Danh mục", labelEn: "Product Category Management", description: "Phân loại hàng hóa khoa học, hiển thị nhiều ảnh, màu sắc, kích cỡ (size).", category: "Thương mại", extraPrice: 5_000_000, includedTiers: [2, 3, 4] },
  { id: "ecom-cart", label: "Giỏ hàng & Đặt hàng", labelEn: "Shopping Cart & Checkout", description: "Khách gom nhiều đồ, điền thông tin nhận hàng và tự động tính tổng tiền.", category: "Thương mại", extraPrice: 12_000_000, includedTiers: [3, 4] },
  { id: "ecom-coupons", label: "Tạo Mã giảm giá & Giờ vàng", labelEn: "Coupons & Flash Sale", description: "Làm các coupon giảm 50k, hoặc đồng hồ đếm ngược kích thích mua.", category: "Thương mại", extraPrice: 3_000_000, includedTiers: [3, 4] },
  { id: "ecom-loyalty", label: "Tích điểm Thành viên", labelEn: "Loyalty Points System", description: "Khách mua nhiều được cộng điểm để đổi lấy ưu đãi cho lần sau.", category: "Thương mại", extraPrice: 5_000_000, includedTiers: [3, 4] },
  { id: "ecom-inventory", label: "Quản lý tồn Kho tự động", labelEn: "Auto Inventory Management", description: "Tự động trừ số lượng khi có đơn, báo đỏ khi hàng sắp hết.", category: "Thương mại", extraPrice: 4_000_000, includedTiers: [3, 4] },

  // ── 6. Nâng cao, Tốc độ & Bảo mật ─────────────────────────
  { id: "adv-security", label: "Bảo mật Đa lớp & Chống Hacker", labelEn: "Multi-layer Security & SSL", description: "Ổ khóa xanh (SSL) bảo vệ dữ liệu khách hàng tuyệt đối.", category: "Nâng cao", includedTiers: [1, 2, 3, 4] },
  { id: "adv-speed", label: "Ép xung Tốc độ tải trang", labelEn: "Page Speed Optimization", description: "Dùng công nghệ nén ảnh, giúp web mở lên ngay lập tức dưới 3 giây.", category: "Nâng cao", extraPrice: 2_000_000, includedTiers: [2, 3, 4] },
  { id: "adv-api", label: "Kết nối Phần mềm thứ 3", labelEn: "3rd-party Software Integration", description: "Tự động đẩy dữ liệu sang phần mềm bạn đang dùng (MISA, KiotViet, GHTK...).", category: "Nâng cao", extraPrice: 6_000_000, includedTiers: [3, 4] },
  { id: "adv-payments", label: "Tích hợp Cổng quét mã Thanh toán", labelEn: "Payment Gateway Integration", description: "Khách trả tiền trực tiếp qua MoMo, VNPay, ZaloPay, quẹt thẻ Visa.", category: "Nâng cao", extraPrice: 5_000_000, includedTiers: [3, 4] },
];

function WebFeatureMatrixTab() {
  const [selectedTier, setSelectedTier] = useState(1);
  const [features, setFeatures] = useState<WebPackageFeature[]>(WEB_FEATURE_MATRIX_FALLBACK);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editFeature, setEditFeature] = useState<Partial<WebPackageFeature> | null>(null);

  const toggleTier = (featureId: string, tier: number) => {
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      const has = f.includedTiers.includes(tier);
      return {
        ...f,
        includedTiers: has
          ? f.includedTiers.filter(t => t !== tier)
          : [...f.includedTiers, tier].sort((a, b) => a - b),
      };
    }));
  };

  const TIER_NAMES = ["", "Landing Page", "Bán Hàng", "Doanh Nghiệp", "Theo Yêu Cầu"];
  const TIER_COLORS = ["#94A3B8", "#6EB1A8", "#3B82F6", "#8B5CF6", "#EC4899"];

  const categories = [...new Set(features.map(f => f.category))];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h4 style={{ color: DS.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Ma Trận Tính Năng Website</h4>
          <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
            Tick vào ô để chọn tính năng có trong mỗi gói (4 cột × {features.length} tính năng)
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditFeature({ id: "", label: "", description: "", category: "Giao diện", includedTiers: [1, 2, 3, 4] }); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: `${DS.blue}15`, border: `1px solid ${DS.blue}40`, borderRadius: 8, color: DS.blue, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
        >
          <Plus size={12} /> Thêm Tính Năng
        </button>
      </div>

      {/* Tier column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "40px 1fr repeat(4, 100px)",
        gap: 0,
        marginBottom: 8,
        padding: "8px 12px",
        background: "rgba(15,23,42,0.8)",
        borderRadius: "10px 10px 0 0",
        border: `1px solid ${DS.border}`,
        borderBottom: "none",
      }}>
        <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>#</span>
        <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.1em" }}>TÊN TÍNH NĂNG</span>
        {TIER_NAMES.slice(1).map((name, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{
              color: selectedTier === i + 1 ? TIER_COLORS[i + 1] : DS.text4,
              fontSize: 9,
              fontFamily: DS.mono,
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: "pointer",
            }}>
              {name.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Category sections */}
      {categories.map(cat => {
        const catFeatures = features.filter(f => f.category === cat);
        const catColors: Record<string, string> = {
          "Giao diện": "#6EB1A8", "Tính năng cốt lõi": "#3B82F6",
          "Quản trị": "#8B5CF6", "SEO & Marketing": "#F59E0B",
          "Thương mại": "#EC4899", "Nâng cao": "#10B981",
        };
        const catColor = catColors[cat] ?? "#94A3B8";
        return (
          <div key={cat} style={{ marginBottom: 10, border: `1px solid ${catColor}25`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{
              padding: "8px 12px",
              background: `${catColor}0C`,
              borderBottom: `1px solid ${catColor}20`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: catColor, fontWeight: 700, fontSize: 11, fontFamily: DS.mono }}>{cat.toUpperCase()}</span>
              <span style={{ background: `${catColor}15`, color: catColor, fontSize: 9, fontFamily: DS.mono, padding: "1px 5px", borderRadius: 4 }}>{catFeatures.length}</span>
            </div>
            {catFeatures.map((f, fi) => (
              <div key={f.id} style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr repeat(4, 100px)",
                gap: 0,
                padding: "8px 12px",
                borderBottom: fi < catFeatures.length - 1 ? `1px solid ${DS.border}` : "none",
                background: f.includedTiers.includes(selectedTier) ? `${catColor}06` : "transparent",
                transition: "background 0.15s",
              }}>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{fi + 1}</span>
                <div>
                  <div style={{ color: DS.text, fontSize: 12, fontWeight: 600 }}>{f.label}</div>
                  {typeof f.extraPrice === 'number' && f.extraPrice > 0 && (
                    <span style={{ color: DS.amber, fontSize: 9, fontFamily: DS.mono }}>+{fmtVND(f.extraPrice)}</span>
                  )}
                </div>
                {[1, 2, 3, 4].map(tier => {
                  const has = f.includedTiers.includes(tier);
                  return (
                    <div key={tier} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <button
                        onClick={() => toggleTier(f.id, tier)}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: has
                            ? tier === selectedTier ? `${TIER_COLORS[tier]}25` : "rgba(34,197,94,0.1)"
                            : "rgba(239,68,68,0.06)",
                          border: has
                            ? tier === selectedTier ? `2px solid ${TIER_COLORS[tier]}` : "1.5px solid rgba(34,197,94,0.3)"
                            : `1.5px solid rgba(239,68,68,0.2)`,
                          cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}
                      >
                        {has && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tier === selectedTier ? TIER_COLORS[tier] : "#22C55E"} strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {!has && (
                          <span style={{ color: "rgba(239,68,68,0.3)", fontSize: 10 }}>—</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <span style={{ color: DS.text4, fontSize: 11 }}>Có trong gói</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(239,68,68,0.06)", border: "1.5px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "rgba(239,68,68,0.3)", fontSize: 10 }}>—</span>
          </div>
          <span style={{ color: DS.text4, fontSize: 11 }}>Không có</span>
        </div>
      </div>

      {/* Add/Edit Feature Modal */}
      <AnimatePresence>
        {(showAdd || editingIdx !== null) && editFeature && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowAdd(false); setEditingIdx(null); setEditFeature(null); } }}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ background: DS.bgCard3, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 500 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ color: DS.text, fontWeight: 800, fontSize: 16 }}>{editingIdx !== null ? "Sửa Tính Năng" : "Thêm Tính Năng Mới"}</h3>
                <button onClick={() => { setShowAdd(false); setEditingIdx(null); setEditFeature(null); }} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={16} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input value={editFeature.label ?? ""} onChange={e => setEditFeature({ ...editFeature, label: e.target.value })}
                  placeholder="Tên tính năng (VI)" style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />
                <input value={editFeature.labelEn ?? ""} onChange={e => setEditFeature({ ...editFeature, labelEn: e.target.value })}
                  placeholder="Tên tính năng (EN)" style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />
                <select value={editFeature.category ?? "Giao diện"} onChange={e => setEditFeature({ ...editFeature, category: e.target.value })}
                  style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", fontFamily: DS.body, boxSizing: "border-box", cursor: "pointer" }}>
                  {categories.map(c => <option key={c} value={c} style={{ background: DS.bgCard3 }}>{c}</option>)}
                  <option value="Giao diện" style={{ background: DS.bgCard3 }}>Giao diện</option>
                  <option value="Tính năng cốt lõi" style={{ background: DS.bgCard3 }}>Tính năng cốt lõi</option>
                  <option value="Quản trị" style={{ background: DS.bgCard3 }}>Quản trị</option>
                  <option value="SEO & Marketing" style={{ background: DS.bgCard3 }}>SEO & Marketing</option>
                  <option value="Thương mại" style={{ background: DS.bgCard3 }}>Thương mại</option>
                  <option value="Nâng cao" style={{ background: DS.bgCard3 }}>Nâng cao</option>
                  <option value="Khác" style={{ background: DS.bgCard3 }}>Khác</option>
                </select>
                <textarea value={editFeature.description ?? ""} onChange={e => setEditFeature({ ...editFeature, description: e.target.value })}
                  placeholder="Mô tả tính năng..." rows={3}
                  style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", fontFamily: DS.body, boxSizing: "border-box", resize: "vertical" }} />
                <input type="number" value={editFeature.extraPrice ?? ""} onChange={e => setEditFeature({ ...editFeature, extraPrice: parseInt(e.target.value) || undefined })}
                  placeholder="Giá bổ sung (VNĐ, để trống = miễn phí)" style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />
              </div>
              <button
                onClick={() => {
                  if (!editFeature.label) return;
                  if (editingIdx !== null) {
                    setFeatures(prev => prev.map((f, i) => i === editingIdx ? { ...f, ...editFeature, id: editFeature.id || f.id } as WebPackageFeature : f));
                  } else {
                    setFeatures(prev => [...prev, { ...editFeature, id: editFeature.id || `feat-${Date.now()}` } as WebPackageFeature]);
                  }
                  setShowAdd(false);
                  setEditingIdx(null);
                  setEditFeature(null);
                }}
                style={{ width: "100%", marginTop: 16, padding: "10px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              >
                {editingIdx !== null ? "Lưu thay đổi" : "Thêm tính năng"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PricingTab Root ────────────────────────────────────────────────────────────

export function PricingTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Top-level service tab
  const [activeBranch, setActiveBranch] = useState<ServiceBranch>("web");
  // Sub-tab: "pricing" | "features"
  const [subTab, setSubTab] = useState<"pricing" | "features">("pricing");

  const [editTier, setEditTier] = useState<ServiceTier | null | undefined>(undefined);
  const [deleteTier, setDeleteTier] = useState<ServiceTier | null>(null);
  const [showCreateForService, setShowCreateForService] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.adminServiceTiers(),
    queryFn: async () => {
      const res = await adminApi.get<{ data: ServiceTier[] }>("/api/admin/service-tiers");
      return res;
    },
  });

  const allTiers = data?.data ?? [];

  const tiersByService = useMemo(() => {
    const map: Record<string, ServiceTier[]> = {};
    for (const key of SERVICE_KEYS) {
      map[key] = allTiers.filter(t => t.serviceKey === key).sort((a, b) => a.level - b.level);
    }
    return map;
  }, [allTiers]);

  const activeTiers = tiersByService[activeBranch] ?? [];
  const totalActive = allTiers.filter(t => t.isActive).length;

  const branches: ServiceBranch[] = ["web", "seo", "app", "dashboard"];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>
            Cấu Hình Bảng Giá
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {totalActive} gói đang hoạt động · Quản lý riêng theo từng dịch vụ
          </p>
        </div>
        <button
          onClick={() => setShowCreateForService(activeBranch)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
            background: BRANCH_COLORS[activeBranch], color: "#fff", border: "none",
            borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
          }}
        >
          <Plus size={14} /> Thêm Gói Mới
        </button>
      </div>

      {/* ── Top-level service branch selector (bold, clear separation) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        marginBottom: 20,
      }}>
        {branches.map(branch => {
          const tiers = tiersByService[branch] ?? [];
          const active = tiers.filter(t => t.isActive).length;
          const color = BRANCH_COLORS[branch];
          const isActive = activeBranch === branch;
          return (
            <motion.button
              key={branch}
              onClick={() => { setActiveBranch(branch); setSubTab("pricing"); }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                background: isActive ? `${color}15` : DS.bgCard,
                border: `1.5px solid ${isActive ? color + "50" : DS.border}`,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
                boxShadow: isActive ? `0 0 20px ${color}15` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${color}20`,
                  border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ color, fontSize: 14 }}>{BRANCH_ICONS[branch]}</span>
                </div>
                <span style={{ color: isActive ? color : DS.text, fontWeight: 800, fontSize: 14, fontFamily: DS.heading, transition: "color 0.2s" }}>
                  {BRANCH_LABELS[branch]}
                </span>
                {isActive && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, marginLeft: "auto" }} />
                )}
              </div>
              <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                {active}/{tiers.length} gói active
              </div>
              {branch === "web" && (
                <div style={{ marginTop: 4, display: "flex", gap: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: `${color}15`, color: color, fontFamily: DS.mono }}>Bảng Giá</span>
                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: `${color}15`, color: color, fontFamily: DS.mono }}>Tính Năng</span>
                </div>
              )}
              {branch === "seo" && (
                <div style={{ marginTop: 4, display: "flex", gap: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: `${color}15`, color: color, fontFamily: DS.mono }}>Bảng Giá</span>
                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: `${color}15`, color: color, fontFamily: DS.mono }}>Matrix</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Sub-tabs (only for branches that have features) ── */}
      {(activeBranch === "web" || activeBranch === "seo") && (
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${DS.border}`, marginBottom: 16 }}>
          <button
            onClick={() => setSubTab("pricing")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
              borderBottom: subTab === "pricing" ? `2px solid ${BRANCH_COLORS[activeBranch]}` : "2px solid transparent",
              background: "none", border: "none", borderRadius: 0,
              color: subTab === "pricing" ? DS.text : DS.text4,
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            <DollarSign size={13} />
            {activeBranch === "seo" ? "Bảng Giá SEO" : "Bảng Giá Website"}
          </button>
          <button
            onClick={() => setSubTab("features")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
              borderBottom: subTab === "features" ? `2px solid ${BRANCH_COLORS[activeBranch]}` : "2px solid transparent",
              background: "none", border: "none", borderRadius: 0,
              color: subTab === "features" ? DS.text : DS.text4,
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              transition: "all 0.15s",
            }}
          >
            <Layers size={13} />
            {activeBranch === "web" ? "Tính Năng Website" : "Tính Năng SEO"}
            <span style={{
              background: `${BRANCH_COLORS[activeBranch]}20`,
              color: BRANCH_COLORS[activeBranch],
              fontSize: 9, fontFamily: DS.mono,
              padding: "1px 5px", borderRadius: 9999,
            }}>
              MATRIX
            </span>
          </button>
        </div>
      )}

      {/* ── Pricing sub-tab: Tier table ── */}
      {subTab === "pricing" && (
        <div>
          {/* Tier level header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 90px 90px 80px auto",
            gap: 12,
            padding: "4px 16px",
            marginBottom: 4,
          }}>
            {["#", "GÓI", "GIÁ", "GIÁ THỊ TRƯỜNG", "LP", "HÀNH ĐỘNG"].map(h => (
              <span key={h} style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{h}</span>
            ))}
          </div>

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${BRANCH_COLORS[activeBranch]}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activeTiers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14, background: DS.bgCard, borderRadius: 12, border: `1px dashed ${DS.border}` }}>
                  Chưa có gói nào cho {BRANCH_LABELS[activeBranch]}. Nhấn "Thêm Gói Mới" để tạo gói đầu tiên.
                </div>
              ) : (
                activeTiers.map(tier => (
                  <TierRow key={tier.id} tier={tier} onEdit={setEditTier} onDelete={setDeleteTier} />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Features sub-tab ── */}
      {subTab === "features" && (
        <div>
          {activeBranch === "web" && <WebFeatureMatrixTab />}
          {activeBranch === "seo" && <SEOPackageFeaturesTab />}
        </div>
      )}

      {/* Marketing hint */}
      <div style={{
        marginTop: 24, padding: "14px 16px", borderRadius: 12,
        background: `${DS.pink}08`, border: `1px solid ${DS.pink}20`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div>
          <p style={{ color: DS.text2, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
            Website & SEO có tab con riêng để quản lý Ma Trận Tính Năng
          </p>
          <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
            PricingTab này điều khiển trực tiếp nội dung trang Bảng Giá công khai. Thay đổi có hiệu lực ngay.
          </p>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editTier !== undefined && (
          <TierModal
            tier={editTier}
            onClose={() => setEditTier(undefined)}
            onSaved={() => setEditTier(undefined)}
          />
        )}
        {deleteTier && (
          <DeleteModal
            tier={deleteTier}
            onClose={() => setDeleteTier(null)}
            onDeleted={() => setDeleteTier(null)}
          />
        )}
        {showCreateForService && (
          <TierModal
            serviceKey={showCreateForService}
            defaultLevel={(tiersByService[showCreateForService]?.length ?? 0) + 1}
            onClose={() => setShowCreateForService(null)}
            onSaved={() => setShowCreateForService(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: DS.bgCard, border: `1px solid ${toast.type === "error" ? DS.red : DS.green}`,
          borderRadius: 12, padding: "12px 20px", minWidth: 260,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <div style={{ color: toast.type === "error" ? DS.red : DS.green, fontSize: 13, fontFamily: "monospace" }}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
