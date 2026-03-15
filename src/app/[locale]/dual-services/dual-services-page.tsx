"use client";

import { useRef, useState, useMemo } from "react";
import { motion, useInView } from "motion/react";
import {
  Package,
  Paintbrush,
  ExternalLink,
  Check,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

interface BundledAttribute {
  id: string;
  attribute: {
    id: string;
    slug: string;
    name: string;
    nameVi: string;
    icon: string | null;
    category: string;
    categoryVi: string;
  };
}

interface WebTemplate {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  category: string;
  categoryVi: string;
  thumbnail: string;
  screenshots: string[];
  demoUrl: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  technologies: string[];
  deliveryTime: string;
  highlighted: boolean;
  bundledAttributes: BundledAttribute[];
}

interface ServiceAttribute {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  category: string;
  categoryVi: string;
  icon: string | null;
  price: number;
  isRequired: boolean;
}

// ─── Helpers ────────────────────────────────────────────────

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function DualServicesPage({
  locale,
  templates,
  attributes,
}: {
  locale: string;
  templates: WebTemplate[];
  attributes: ServiceAttribute[];
}) {
  const isVi = locale === "vi";
  const [activeTab, setActiveTab] = useState<"template" | "custom">("template");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  // Group attributes by category for the custom flow
  const groupedAttributes = useMemo(() => {
    const groups: Record<string, { categoryVi: string; category: string; items: ServiceAttribute[] }> = {};
    for (const attr of attributes) {
      if (!groups[attr.category]) {
        groups[attr.category] = { categoryVi: attr.categoryVi, category: attr.category, items: [] };
      }
      groups[attr.category].items.push(attr);
    }
    return groups;
  }, [attributes]);

  // Auto-select required attributes
  const requiredIds = useMemo(
    () => attributes.filter((a) => a.isRequired).map((a) => a.id),
    [attributes]
  );

  const toggleAttribute = (id: string) => {
    if (requiredIds.includes(id)) return; // Can't deselect required
    setSelectedAttributes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Calculate custom price
  const customBasePrice = 0; // Base design fee could be added
  const customTotal = useMemo(() => {
    return attributes
      .filter((a) => selectedAttributes.includes(a.id) || a.isRequired)
      .reduce((sum, a) => sum + a.price, customBasePrice);
  }, [attributes, selectedAttributes, customBasePrice]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-12 pt-24 md:pt-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <FadeIn>
            <div className="text-center">
              <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl">
                {isVi ? (
                  <>
                    Giải Pháp <GradientText>Website</GradientText> Phù Hợp Với Bạn
                  </>
                ) : (
                  <>
                    The Right <GradientText>Website</GradientText> Solution For You
                  </>
                )}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
                {isVi
                  ? "Hai lựa chọn — một giải pháp hoàn hảo. Chọn mẫu sẵn có để khởi chạy nhanh, hoặc thiết kế riêng để tạo dấu ấn thương hiệu độc bản."
                  : "Two choices — one perfect solution. Pick a ready-made template for quick launch, or go custom for a one-of-a-kind brand experience."}
              </p>
            </div>
          </FadeIn>

          {/* Tab Switcher */}
          <FadeIn delay={0.15}>
            <div className="mx-auto mt-10 flex max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-1">
              <button
                onClick={() => setActiveTab("template")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === "template"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Package size={18} />
                {isVi ? "Web Gói" : "Template"}
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                  activeTab === "custom"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Paintbrush size={18} />
                {isVi ? "Thiết Kế Riêng" : "Custom Design"}
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-4">
          {activeTab === "template" ? (
            /* ─── LUỒNG 1: WEB GÓI ──────────────────────── */
            <div>
              <FadeIn>
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold md:text-3xl">
                    {isVi ? "Kho Giao Diện Sẵn Có" : "Template Gallery"}
                  </h2>
                  <p className="mt-2 text-slate-400">
                    {isVi
                      ? "Xem trực tiếp demo, chọn mẫu ưng ý, nhận trọn gói giao diện & tính năng đi kèm."
                      : "Browse live demos, pick your favorite, and get the full package with bundled features."}
                  </p>
                </div>
              </FadeIn>

              {templates.length === 0 ? (
                <FadeIn>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-20 text-center">
                    <Package size={48} className="mx-auto text-slate-600" />
                    <p className="mt-4 text-slate-400">
                      {isVi ? "Kho giao diện đang được cập nhật..." : "Templates coming soon..."}
                    </p>
                  </div>
                </FadeIn>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((tpl, i) => (
                    <FadeIn key={tpl.id} delay={i * 0.08}>
                      <div
                        className={`group relative overflow-hidden rounded-2xl border bg-slate-900/50 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 ${
                          tpl.highlighted
                            ? "border-blue-500/30 ring-1 ring-blue-500/20"
                            : "border-slate-800"
                        }`}
                      >
                        {tpl.highlighted && (
                          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                            <Star size={12} />
                            {isVi ? "Nổi bật" : "Featured"}
                          </div>
                        )}

                        {/* Thumbnail */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
                          {tpl.thumbnail ? (
                            <img
                              src={tpl.thumbnail}
                              alt={isVi ? tpl.nameVi : tpl.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package size={40} className="text-slate-600" />
                            </div>
                          )}
                          {/* Demo overlay */}
                          <a
                            href={tpl.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <span className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                              <ExternalLink size={16} />
                              {isVi ? "Xem Demo" : "View Demo"}
                            </span>
                          </a>
                        </div>

                        {/* Info */}
                        <div className="p-5">
                          <div className="mb-2 flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {isVi ? tpl.nameVi : tpl.name}
                              </h3>
                              <span className="text-xs text-slate-500">
                                {isVi ? tpl.categoryVi : tpl.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-400">
                                {tpl.price.toLocaleString("vi-VN")}đ
                              </p>
                              {tpl.originalPrice && (
                                <p className="text-xs text-slate-500 line-through">
                                  {tpl.originalPrice.toLocaleString("vi-VN")}đ
                                </p>
                              )}
                            </div>
                          </div>

                          {(isVi ? tpl.descriptionVi : tpl.description) && (
                            <p className="mb-3 text-sm text-slate-400">
                              {isVi ? tpl.descriptionVi : tpl.description}
                            </p>
                          )}

                          {/* Technologies */}
                          {tpl.technologies.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1">
                              {tpl.technologies.map((tech) => (
                                <span
                                  key={tech}
                                  className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Bundled Features (expandable) */}
                          <div className="border-t border-slate-800 pt-3">
                            <button
                              onClick={() =>
                                setExpandedTemplate(
                                  expandedTemplate === tpl.id ? null : tpl.id
                                )
                              }
                              className="flex w-full items-center justify-between text-sm text-slate-300"
                            >
                              <span>
                                {isVi
                                  ? `${tpl.bundledAttributes.length} tính năng đi kèm`
                                  : `${tpl.bundledAttributes.length} bundled features`}
                              </span>
                              {expandedTemplate === tpl.id ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>

                            {expandedTemplate === tpl.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="mt-2 space-y-1"
                              >
                                {tpl.bundledAttributes.map((ba) => (
                                  <div
                                    key={ba.id}
                                    className="flex items-center gap-2 text-sm text-slate-400"
                                  >
                                    <Check size={14} className="shrink-0 text-green-400" />
                                    {isVi ? ba.attribute.nameVi : ba.attribute.name}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </div>

                          {/* CTA */}
                          <div className="mt-4 flex items-center gap-2">
                            <a
                              href={tpl.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-blue-500 hover:text-white"
                            >
                              <ExternalLink size={14} />
                              Demo
                            </a>
                            <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                              <ShoppingCart size={14} />
                              {isVi ? "Chọn gói" : "Select"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ─── LUỒNG 2: THIẾT KẾ THEO YÊU CẦU ──────── */
            <div>
              <FadeIn>
                <div className="mb-8 text-center">
                  <h2 className="text-2xl font-bold md:text-3xl">
                    {isVi ? "Thiết Kế Web Theo Yêu Cầu" : "Custom Web Design & Build"}
                  </h2>
                  <p className="mt-2 text-slate-400">
                    {isVi
                      ? "Tự lắp ráp website với các tính năng bạn cần. Giao diện UI/UX thiết kế riêng theo thương hiệu."
                      : "Build your website with the features you need. UI/UX designed exclusively for your brand."}
                  </p>
                </div>
              </FadeIn>

              <div className="grid gap-8 lg:grid-cols-3">
                {/* Feature selector (2 cols) */}
                <div className="lg:col-span-2">
                  <FadeIn>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                      <h3 className="mb-4 text-lg font-bold">
                        {isVi ? "Chọn tính năng cho website" : "Select Features"}
                      </h3>

                      {attributes.length === 0 ? (
                        <div className="py-12 text-center">
                          <Paintbrush size={40} className="mx-auto text-slate-600" />
                          <p className="mt-4 text-slate-400">
                            {isVi
                              ? "Danh sách tính năng đang được cập nhật..."
                              : "Feature list coming soon..."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(groupedAttributes).map(([category, group]) => (
                            <div key={category}>
                              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                                {isVi ? group.categoryVi : group.category}
                              </h4>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {group.items.map((attr) => {
                                  const isSelected =
                                    selectedAttributes.includes(attr.id) || attr.isRequired;
                                  return (
                                    <button
                                      key={attr.id}
                                      onClick={() => toggleAttribute(attr.id)}
                                      disabled={attr.isRequired}
                                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                                        isSelected
                                          ? "border-indigo-500/50 bg-indigo-500/10"
                                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                                      } ${attr.isRequired ? "cursor-default" : "cursor-pointer"}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                                            isSelected
                                              ? "border-indigo-500 bg-indigo-500"
                                              : "border-slate-600"
                                          }`}
                                        >
                                          {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-white">
                                            {isVi ? attr.nameVi : attr.name}
                                            {attr.isRequired && (
                                              <span className="ml-1 text-[10px] text-amber-400">
                                                ({isVi ? "bắt buộc" : "required"})
                                              </span>
                                            )}
                                          </p>
                                          {(isVi ? attr.descriptionVi : attr.description) && (
                                            <p className="text-xs text-slate-500">
                                              {isVi ? attr.descriptionVi : attr.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <span className="ml-2 shrink-0 text-sm font-medium text-green-400">
                                        {attr.price > 0
                                          ? `${attr.price.toLocaleString("vi-VN")}đ`
                                          : isVi
                                            ? "Miễn phí"
                                            : "Free"}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FadeIn>
                </div>

                {/* Price summary (1 col, sticky) */}
                <div className="lg:col-span-1">
                  <FadeIn delay={0.1}>
                    <div className="sticky top-24 rounded-2xl border border-indigo-500/20 bg-slate-900/80 p-6">
                      <h3 className="mb-4 text-lg font-bold">
                        {isVi ? "Tổng Giá Trị Dự Án" : "Project Estimate"}
                      </h3>

                      {/* Selected features summary */}
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-sm text-slate-400">
                            {isVi ? "Thiết kế UI/UX riêng" : "Custom UI/UX Design"}
                          </span>
                          <span className="text-sm text-slate-400">
                            {isVi ? "Báo giá riêng" : "Custom quote"}
                          </span>
                        </div>

                        {attributes
                          .filter((a) => selectedAttributes.includes(a.id) || a.isRequired)
                          .map((attr) => (
                            <div
                              key={attr.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-slate-300">
                                {isVi ? attr.nameVi : attr.name}
                              </span>
                              <span className="text-green-400">
                                {attr.price > 0
                                  ? `${attr.price.toLocaleString("vi-VN")}đ`
                                  : isVi
                                    ? "Miễn phí"
                                    : "Free"}
                              </span>
                            </div>
                          ))}
                      </div>

                      <div className="border-t border-slate-700 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            {isVi ? "Tổng tính năng:" : "Features total:"}
                          </span>
                          <span className="text-xl font-bold text-green-400">
                            {customTotal.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {isVi
                            ? "* Giá thiết kế UI/UX sẽ được báo riêng sau khi tư vấn"
                            : "* UI/UX design cost quoted separately after consultation"}
                        </p>
                      </div>

                      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
                        <ArrowRight size={16} />
                        {isVi ? "Gửi yêu cầu tư vấn" : "Request Consultation"}
                      </button>
                    </div>
                  </FadeIn>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Value proposition */}
      <section className="border-t border-slate-800 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <FadeIn>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20">
                  <Package size={24} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {isVi ? "Web Gói — Nhanh & Tiết Kiệm" : "Template — Fast & Affordable"}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-blue-400" />
                    {isVi
                      ? "Xem demo thực tế trước khi quyết định"
                      : "View live demos before deciding"}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-blue-400" />
                    {isVi
                      ? "Trọn gói giao diện + tính năng, giá cố định"
                      : "Full package with fixed pricing"}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-blue-400" />
                    {isVi ? "Triển khai nhanh trong vài ngày" : "Deploy in just a few days"}
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20">
                  <Paintbrush size={24} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {isVi ? "Thiết Kế Riêng — Độc Bản & Chuyên Nghiệp" : "Custom — Unique & Professional"}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-indigo-400" />
                    {isVi
                      ? "UI/UX thiết kế hoàn toàn theo thương hiệu"
                      : "UI/UX designed to match your brand"}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-indigo-400" />
                    {isVi
                      ? "Tự chọn tính năng, chỉ trả cho thứ bạn cần"
                      : "Pick features, pay only for what you need"}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-indigo-400" />
                    {isVi
                      ? "Tối đa hóa giá trị thương hiệu & chuyển đổi"
                      : "Maximize brand value & conversion rates"}
                  </li>
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
