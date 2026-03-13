"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator,
  ChevronDown,
  Info,
  Send,
  Loader2,
  Check,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────

interface Variant {
  id: string;
  variantName: string;
  description: string | null;
  price: number;
}

interface Feature {
  id: string;
  featureName: string;
  description: string | null;
  logicLevel: string;
  isRequired: boolean;
  variants: Variant[];
}

interface FeatureGroup {
  id: string;
  groupName: string;
  slug: string;
  sortOrder: number;
  features: Feature[];
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + " ₫";

// ─── Main Component ─────────────────────────────────────────────

export function PricingCalculator() {
  const [groups, setGroups] = useState<FeatureGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch data
  useEffect(() => {
    fetch("/api/pricing/calculator")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("API returned non-array:", data);
          return;
        }
        setGroups(data);
        // Auto-select cheapest variant for required features
        const defaults: Record<string, string> = {};
        for (const group of data) {
          for (const feature of group.features) {
            if (feature.isRequired && feature.variants.length > 0) {
              // Variants already sorted by price ASC from API
              defaults[feature.id] = feature.variants[0].id;
            }
          }
        }
        setSelections(defaults);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build variant lookup
  const variantMap = useMemo(() => {
    const map: Record<string, Variant & { featureName: string }> = {};
    for (const g of groups) {
      for (const f of g.features) {
        for (const v of f.variants) {
          map[v.id] = { ...v, featureName: f.featureName };
        }
      }
    }
    return map;
  }, [groups]);

  // Calculate total
  const totalPrice = useMemo(() => {
    return Object.values(selections).reduce((sum, variantId) => {
      const variant = variantMap[variantId];
      return sum + (variant?.price || 0);
    }, 0);
  }, [selections, variantMap]);

  // Selected items for quote
  const selectedItems = useMemo(() => {
    return Object.entries(selections)
      .filter(([, variantId]) => variantId)
      .map(([featureId, variantId]) => {
        const variant = variantMap[variantId];
        return {
          featureId,
          featureName: variant?.featureName || "",
          variantId,
          variantName: variant?.variantName || "",
          price: variant?.price || 0,
        };
      })
      .filter((item) => item.price > 0);
  }, [selections, variantMap]);

  const handleSelect = useCallback((featureId: string, variantId: string) => {
    setSelections((prev) => {
      if (variantId === "") {
        const next = { ...prev };
        delete next[featureId];
        return next;
      }
      return { ...prev, [featureId]: variantId };
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <Check className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            Đã gửi yêu cầu thành công!
          </h2>
          <p className="mb-6 text-slate-400">
            Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để tư vấn chi tiết.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại trang Bảng giá
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-lg sticky top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/pricing"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Bảng giá
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Tổng ước tính:</span>
            <motion.span
              key={totalPrice}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-lg font-bold text-green-400 font-mono"
            >
              {formatPrice(totalPrice)}
            </motion.span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Title */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
            <Calculator className="h-7 w-7 text-white" />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-white md:text-4xl">
            Tùy chỉnh{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Báo giá Website
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-slate-400">
            Chọn các tính năng bạn cần — giá tổng sẽ tự động cập nhật ngay lập tức.
            Chỉ trả cho những gì bạn thực sự cần.
          </p>
        </div>

        {/* Feature Groups */}
        <div className="space-y-8">
          {groups.map((group, groupIndex) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden"
            >
              {/* Group Header */}
              <div className="flex items-center gap-3 border-b border-slate-800/50 px-6 py-4 bg-gradient-to-r from-slate-800/50 to-transparent">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                  <Sparkles size={16} className="text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">{group.groupName}</h2>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {group.features.length} tính năng
                </span>
              </div>

              {/* Features */}
              <div className="divide-y divide-slate-800/30">
                {group.features.map((feature) => (
                  <FeatureRow
                    key={feature.id}
                    feature={feature}
                    selectedVariantId={selections[feature.id] || ""}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 p-6"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Tổng chi phí ước tính</p>
              <motion.p
                key={totalPrice}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold text-green-400 font-mono"
              >
                {formatPrice(totalPrice)}
              </motion.p>
              {selectedItems.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {selectedItems.length} tính năng được chọn
                </p>
              )}
            </div>
            <button
              onClick={() => setShowQuoteForm(true)}
              disabled={selectedItems.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send size={16} />
              Nhận báo giá chi tiết qua Email
            </button>
          </div>
        </motion.div>
      </div>

      {/* Quote Form Modal */}
      <AnimatePresence>
        {showQuoteForm && (
          <QuoteFormModal
            selectedItems={selectedItems}
            totalAmount={totalPrice}
            onClose={() => setShowQuoteForm(false)}
            onSubmitted={() => {
              setShowQuoteForm(false);
              setSubmitted(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Feature Row ────────────────────────────────────────────────

function FeatureRow({
  feature,
  selectedVariantId,
  onSelect,
}: {
  feature: Feature;
  selectedVariantId: string;
  onSelect: (featureId: string, variantId: string) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const selectedVariant = feature.variants.find((v) => v.id === selectedVariantId);

  return (
    <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center">
      {/* Feature Name */}
      <div className="flex items-center gap-2 md:w-1/3">
        <span className="text-sm font-medium text-slate-200">{feature.featureName}</span>
        {feature.isRequired && (
          <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-400">
            Bắt buộc
          </span>
        )}
        {feature.description && (
          <button
            className="relative text-slate-500 hover:text-slate-300 transition-colors"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info size={14} />
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-800 p-3 text-xs text-slate-300 shadow-xl">
                {feature.description}
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-slate-700 bg-slate-800" />
              </div>
            )}
          </button>
        )}
      </div>

      {/* Select */}
      <div className="relative flex-1">
        <select
          value={selectedVariantId}
          onChange={(e) => onSelect(feature.id, e.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 pr-10 text-sm text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-slate-600 cursor-pointer"
          id={`select-feature-${feature.id}`}
        >
          {!feature.isRequired && (
            <option value="">-- Không chọn --</option>
          )}
          {feature.variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.variantName} — {formatPrice(variant.price)}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {/* Price */}
      <div className="text-right md:w-32">
        <AnimatePresence mode="wait">
          <motion.span
            key={selectedVariant?.price || 0}
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 5, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`text-sm font-mono font-medium ${
              selectedVariant ? "text-green-400" : "text-slate-600"
            }`}
          >
            {selectedVariant ? formatPrice(selectedVariant.price) : "0 ₫"}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Variant tooltip */}
      {selectedVariant?.description && (
        <p className="text-xs text-slate-500 md:hidden">{selectedVariant.description}</p>
      )}
    </div>
  );
}

// ─── Quote Form Modal ───────────────────────────────────────────

function QuoteFormModal({
  selectedItems,
  totalAmount,
  onClose,
  onSubmitted,
}: {
  selectedItems: Array<{
    featureId: string;
    featureName: string;
    variantId: string;
    variantName: string;
    price: number;
  }>;
  totalAmount: number;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const payload = {
      customerName: fd.get("name") as string,
      customerEmail: fd.get("email") as string,
      customerPhone: (fd.get("phone") as string) || undefined,
      companyName: (fd.get("company") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
      selectedItems,
      totalAmount,
    };

    try {
      const res = await fetch("/api/pricing/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Đã có lỗi xảy ra");
      }

      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm pt-12 pb-12 px-4"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 className="mb-1 text-xl font-bold text-white">Nhận báo giá chi tiết</h2>
        <p className="mb-6 text-sm text-slate-400">
          Điền thông tin và chúng tôi sẽ gửi báo giá chi tiết qua email cho bạn.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Họ tên <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="email@company.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Số điện thoại</label>
              <input
                name="phone"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="0912 345 678"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Công ty</label>
              <input
                name="company"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Tên công ty"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Ghi chú</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Yêu cầu đặc biệt, timeline, ngân sách..."
            />
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Tính năng đã chọn</span>
              <span className="text-xs text-slate-500">{selectedItems.length} mục</span>
            </div>
            <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
              {selectedItems.map((item) => (
                <div
                  key={item.featureId}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-slate-400 truncate max-w-[60%]">
                    {item.featureName}: {item.variantName}
                  </span>
                  <span className="text-green-400 font-mono">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-700 pt-2">
              <span className="text-sm font-semibold text-white">Tổng cộng</span>
              <span className="text-lg font-bold text-green-400 font-mono">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Gửi yêu cầu báo giá
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
