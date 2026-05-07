"use client";

/**
 * Quotation Admin Page — LOOP Solutions
 * Route: /admin/quotation
 * Wire: /api/admin/quotes, /api/admin/quote-requests
 */

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { FileText, RefreshCw, Plus, Check, Clock, XCircle, X, AlertTriangle, ChevronRight, CheckCircle, Eye, Trash2, Zap, User, ShieldCheck, Layout } from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

const fmtB = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Mới", color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
  quoted: { label: "Đã báo giá", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  draft: { label: "Nháp", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  pending: { label: "Chờ duyệt", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  approved: { label: "Đã duyệt", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  sent: { label: "Đã gửi", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  viewed: { label: "Đã xem", color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
  signed: { label: "Đã ký", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  rejected: { label: "Từ chối", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  cancelled: { label: "Hủy", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

type Quote = {
  id: string;
  quoteNumber: string;
  title: string;
  totalAmount: number;
  status: string;
  salesLead?: { customerName: string; companyName: string };
  validUntil?: string;
  createdAt: string;
};

type QuoteRequest = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  selectedItems?: unknown[];
  totalAmount?: number;
  lpUsed?: number;
  notes?: string;
  status: string;
  createdAt: string;
  /** "fixed" = standard wizard, "custom" = custom-code/custom-api selected */
  source?: string;
  /** Full pricing breakdown sent by wizard */
  pricingBreakdown?: Record<string, unknown>;
  /** Optional: pre-selected hosting plan slug */
  hostingPlanSlug?: string | null;
  /** Optional: pre-selected domain name */
  domainName?: string | null;
  /** Optional: payment plan (e.g. "100", "50") */
  paymentPlan?: string | null;
  updatedAt?: string;
  domainPurchaseTime?: string | null;
};

const WORKFLOW_ACTIONS: Record<string, { next: string; label: string; action: string }[]> = {
  draft: [{ next: "sent", label: "Gửi khách", action: "send" }],
  sent: [{ next: "viewed", label: "Khách đã xem", action: "viewed" }, { next: "cancelled", label: "Hủy bỏ", action: "cancel" }],
  viewed: [{ next: "approved", label: "Duyệt báo giá", action: "approve" }, { next: "cancelled", label: "Hủy bỏ", action: "cancel" }],
  approved: [{ next: "signed", label: "Ký hợp đồng", action: "sign" }],
  signed: [],
  cancelled: [],
};

const STATUS_STEPS = ["draft", "sent", "viewed", "approved", "signed"];

function QuoteCreateModal({
  onClose, onSuccess,
  salesLeadId,
  quoteRequest,
}: {
  onClose: () => void; onSuccess: () => void;
  salesLeadId?: string;
  /** Pre-fill from a QuoteRequest row so admin doesn't have to re-enter customer data */
  quoteRequest?: QuoteRequest | null;
}) {
  const { t } = useAdminTranslations();

  // Fetch pricing config to populate comboboxes
  const { data: configData } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: () => fetch("/api/pricing/config?lang=vi").then(res => res.json()),
  });

  const config = configData?.data;
  const packages = config?.packages || [];
  const hostingPlans = config?.hostingPlans || [];
  const domainPrices = config?.domainPrices || [];
  const seoTiers = config?.seoTiers || [];

  // Derive title from quoteRequest if available
  const derivedTitle = quoteRequest
    ? `Báo giá cho ${quoteRequest.customerName}${quoteRequest.companyName ? ` — ${quoteRequest.companyName}` : ""}`
    : "";

  const hasPrefilled = React.useRef(false);

  const [form, setForm] = useState({
    title: derivedTitle || "",
    customerName: quoteRequest?.customerName ?? "",
    customerEmail: quoteRequest?.customerEmail ?? "",
    companyName: quoteRequest?.companyName ?? "",
    phone: quoteRequest?.customerPhone ?? "",
    totalAmount: quoteRequest?.totalAmount ? String(quoteRequest.totalAmount) : "",
    validUntil: "",
  });

  const [selectedPkg, setSelectedPkg] = useState("");
  const [selectedHostingLevel, setSelectedHostingLevel] = useState("");
  const [selectedHostingMonths, setSelectedHostingMonths] = useState<number | string>("");
  const [selectedSeo, setSelectedSeo] = useState<number | string>("");

  // Domain states
  const [domainQuery, setDomainQuery] = useState("");
  const [selectedTLDId, setSelectedTLDId] = useState("");
  const [addedDomains, setAddedDomains] = useState<{ id: string, name: string, extension: string, price: number, years: number, available?: boolean }[]>([]);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [checkResult, setCheckResult] = useState<{ domain: string, available: boolean, extension: string, price: number }[]>([]);

  // Unique hosting levels (Khởi Đầu, Tiêu Chuẩn, etc.)
  const hostingLevels = Array.from(new Set(hostingPlans.map((h: any) => h.name.split(" (")[0].trim())));
  
  // Available durations for selected level
  const availableDurations = hostingPlans.filter((h: any) => 
    selectedHostingLevel && h.name.includes(selectedHostingLevel)
  );

  // Auto-select first duration when level changes
  useEffect(() => {
    if (selectedHostingLevel && !selectedHostingMonths && availableDurations.length > 0) {
      const first = [...availableDurations].sort((a: any, b: any) => a.months - b.months)[0];
      if (first) setSelectedHostingMonths(String(first.months));
    }
  }, [selectedHostingLevel, availableDurations, selectedHostingMonths]);

  // Pre-fill from quoteRequest when config is ready
  useEffect(() => {
    if (!quoteRequest || !config || hasPrefilled.current) return;
    hasPrefilled.current = true;

    // Safely parse pricingBreakdown
    const rawBreakdown = (quoteRequest as any).pricingBreakdown;
    const bd = typeof rawBreakdown === 'string' ? JSON.parse(rawBreakdown) : (rawBreakdown || {});

    // 1. Package
    const pkgSlug = bd.package?.slug || (quoteRequest.selectedItems as any)?.[0]?.featureId;
    if (pkgSlug) {
      const foundPkg = packages.find((p: any) => p.slug === pkgSlug || p.id === pkgSlug);
      if (foundPkg) setSelectedPkg(foundPkg.id);
    }

    // 2. Hosting
    const hSlug = bd.hosting?.slug || quoteRequest.hostingPlanSlug;
    const hName = bd.hosting?.name;
    let foundHost = null;
    
    if (hSlug) {
      foundHost = hostingPlans.find((h: any) => h.slug === hSlug);
    }
    if (!foundHost && hName) {
      foundHost = hostingPlans.find((h: any) => 
        h.name.toLowerCase() === hName.toLowerCase() || 
        h.name.toLowerCase().includes(hName.toLowerCase())
      );
    }

    if (foundHost) {
      const level = foundHost.name.split(" (")[0].trim();
      setSelectedHostingLevel(level);
      setSelectedHostingMonths(String(foundHost.months));
    }

    // 3. SEO
    const seoLevel = bd.seo?.level;
    const seoName = bd.seo?.name;
    let foundSeo = null;

    if (seoLevel !== undefined) {
      foundSeo = seoTiers.find((s: any) => String(s.level) === String(seoLevel));
    }
    if (!foundSeo && seoName) {
      foundSeo = seoTiers.find((s: any) => s.name.toLowerCase() === seoName.toLowerCase());
    }

    if (foundSeo) {
      setSelectedSeo(String(foundSeo.level));
    }

    // 4. Domains
    const reqDomains = bd.domains || [];
    if (reqDomains.length > 0) {
      const mapped = reqDomains.map((d: any) => ({
        id: Math.random().toString(36).substring(7),
        name: d.name.split(".")[0],
        extension: d.extension || ("." + d.name.split(".").slice(1).join(".")),
        price: d.price || 0,
        years: 1,
        available: true
      }));
      setAddedDomains(mapped);
    } else if (quoteRequest.domainName) {
        // Fallback to legacy field
        const ext = "." + quoteRequest.domainName.split(".").slice(1).join(".");
        const name = quoteRequest.domainName.split(".")[0];
        const tldPrice = domainPrices.find((p: any) => p.extension === ext)?.registrationPrice || 0;
        setAddedDomains([{
            id: "legacy-1",
            name,
            extension: ext,
            price: tldPrice,
            years: 1,
            available: true
        }]);
    }
  }, [quoteRequest, config, packages, hostingPlans, domainPrices]);

  // Handle checking domain
  const handleCheckDomain = async () => {
    if (!domainQuery || !selectedTLDId) return;
    const tld = domainPrices.find((d: any) => d.id === selectedTLDId);
    if (!tld) return;

    setCheckingDomain(true);
    try {
      const res = await fetch(`/api/pricing/domain-search?q=${domainQuery}&tld=${tld.extension}`).then(r => r.json());
      setCheckResult(res.data?.domains || []);
    } catch (err) {
      console.error(err);
      setCheckResult([]);
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleAddDomainFromList = (domainObj: any) => {
    // Prevent duplicates
    const fullName = domainObj.domain.toLowerCase().trim();
    const isDuplicate = addedDomains.some(d => 
      `${d.name}${d.extension}`.toLowerCase().trim() === fullName
    );
    
    if (isDuplicate) {
      alert("Tên miền này đã có trong danh sách!");
      return;
    }
    
    const newDomain = {
      id: Math.random().toString(36).substring(7),
      name: domainObj.domain.split(".")[0],
      extension: domainObj.extension,
      price: domainObj.price,
      years: 1,
      available: true
    };
    setAddedDomains(prev => [...prev, newDomain]);
    setDomainQuery("");
    setCheckResult([]);
  };

  const handleAddDomain = () => {
    if (!checkResult || checkResult.length === 0) return;
    const main = checkResult[0];
    if (!main.available) return;
    handleAddDomainFromList(main);
  };

  const removeDomain = (id: string) => setAddedDomains(prev => prev.filter(d => d.id !== id));
  const updateDomainYears = (id: string, years: number) => {
    setAddedDomains(prev => prev.map(d => d.id === id ? { ...d, years } : d));
  };

  // Auto-calculate total amount based on selections
  useEffect(() => {
    let total = 0;
    const pkg = packages.find((p: any) => p.id === selectedPkg);
    if (pkg) total += pkg.price;

    const host = hostingPlans.find((h: any) => 
      h.name.startsWith(selectedHostingLevel) && h.months === Number(selectedHostingMonths)
    );
    if (host) total += host.discountedPrice;

    const seo = seoTiers.find((s: any) => s.level === Number(selectedSeo));
    if (seo) total += seo.basePrice;

    // Add all domains
    addedDomains.forEach(d => {
      total += (d.price * d.years);
    });

    if (total > 0) {
      setForm(prev => {
        const next = { ...prev, totalAmount: String(total) };
        const isPlaceholder = !prev.title || prev.title.startsWith("Báo giá mới") || prev.title.startsWith("Báo giá ");
        if (isPlaceholder) {
          const parts = [];
          if (pkg) parts.push(pkg.name);
          if (host) parts.push("Hosting");
          if (addedDomains.length > 0) parts.push(`${addedDomains.length} tên miền`);
          if (seo && seo.level > 0) parts.push("SEO");
          if (parts.length > 0) {
            next.title = `Báo giá ${parts.join(" + ")}${prev.customerName ? ` — ${prev.customerName}` : ""}`;
          }
        }
        return next;
      });
    }
  }, [selectedPkg, selectedHostingLevel, selectedHostingMonths, selectedSeo, addedDomains, packages, hostingPlans, seoTiers]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const inp = { width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError(t("quotation.errTitleRequired"));
    if (!salesLeadId && !quoteRequest && !form.customerName.trim()) {
      return setError("Vui lòng chọn khách hàng hoặc điền thông tin khách hàng");
    }
    setSaving(true); setError("");
    try {
      // Find descriptive details for storage using EXACT same logic as total calculation
      const pkg = packages.find((p: any) => p.id === selectedPkg);
      
      const seo = seoTiers.find((s: any) => Number(s.level) === Number(selectedSeo));
      
      const hosting = hostingPlans.find((h: any) => 
        h.name.startsWith(selectedHostingLevel) && Number(h.months) === Number(selectedHostingMonths)
      );

      // Build a rich configuration object that the Detail Modal can understand
      const configuration = {
        package: pkg ? { name: pkg.name, price: pkg.price } : (selectedPkg ? { name: "Gói Website", price: 0 } : null),
        hosting: hosting ? { name: hosting.name, price: hosting.discountedPrice, months: hosting.months } : (selectedHostingLevel ? { name: `${selectedHostingLevel} (${selectedHostingMonths} tháng)`, price: 0 } : null),
        seo: seo ? { name: seo.name, price: seo.basePrice } : (selectedSeo ? { name: "Dịch vụ SEO", price: 0 } : null),
        domains: addedDomains.map(d => ({
          name: `${d.name}${d.extension}`,
          price: d.price,
          years: d.years
        })),
        total: Number(form.totalAmount)
      };

      // Prepare selectedItems list (required for backend display)
      const selectedItems = [];
      if (pkg) {
        selectedItems.push({
          featureId: pkg.id,
          featureName: pkg.name,
          variantId: "default",
          variantName: "Mặc định",
          price: pkg.price
        });
      }

      await adminApi.post("/api/admin/quotes", {
        quoteNumber: `QT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        title: form.title.trim(),
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.phone.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        totalAmount: Number(form.totalAmount),
        quoteRequestId: quoteRequest?.id,
        salesLeadId: salesLeadId || (quoteRequest as any)?.salesLeadId,
        // Send as 'configuration' string so the API parses it into pricingBreakdown
        configuration: JSON.stringify(configuration),
        source: "admin",
        hostingPlanSlug: selectedHostingLevel || undefined,
        domainName: addedDomains.length > 0 ? `${addedDomains[0].name}${addedDomains[0].extension}` : undefined,
      });
      
      onSuccess(); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : t("quotation.errCreateFailed")); }
    finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 520, maxHeight: "95vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>{t("quotation.formTitle")}</h3>
              {quoteRequest && (
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: "rgba(59,130,246,0.15)", color: DS.blue, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600, letterSpacing: "0.05em" }}>
                    Từ yêu cầu báo giá
                  </span>
                  <span style={{ color: DS.text4, fontSize: 11 }}>{quoteRequest.customerEmail}</span>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formQuoteTitle")}</label>
              <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Báo giá website công ty ABC" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formCustomerName")}</label>
                <input style={inp} value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formEmail")}</label>
                <input style={inp} value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="khach@company.vn" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formCompany")}</label>
                <input style={inp} value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Công ty ABC" />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formPhone")}</label>
                <input style={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0901..." />
              </div>
            </div>

            {/* Service Selectors */}
            <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12, border: `1px solid ${DS.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.05em", borderBottom: `1px solid ${DS.border}`, paddingBottom: 6 }}>CẤU HÌNH GÓI DỊCH VỤ</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Gói Website</label>
                  <select style={inp} value={selectedPkg} onChange={e => setSelectedPkg(e.target.value)}>
                    <option value="">-- Chọn gói --</option>
                    {packages.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({fmtVND(p.price)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Gói SEO</label>
                  <select style={inp} value={selectedSeo} onChange={e => setSelectedSeo(e.target.value)}>
                    <option value="">-- Chọn mức --</option>
                    {seoTiers.map((s: any) => (
                      <option key={s.level} value={s.level}>{s.name} ({fmtVND(s.basePrice)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Hosting</label>
                  <select style={inp} value={selectedHostingLevel} onChange={e => { setSelectedHostingLevel(e.target.value); setSelectedHostingMonths(""); }}>
                    <option value="">-- Chọn gói hosting --</option>
                    {hostingLevels.map((lvl: any) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>Thời hạn</label>
                  <select style={inp} value={selectedHostingMonths} onChange={e => setSelectedHostingMonths(e.target.value)}>
                    {!selectedHostingLevel ? (
                      <option value="">-- Chọn gói trước --</option>
                    ) : (
                      <>
                        <option value="">-- Thời gian --</option>
                        {availableDurations
                          .sort((a: any, b: any) => a.months - b.months)
                          .map((h: any) => (
                            <option key={h.id} value={h.months}>{h.periodVi} ({fmtVND(h.discountedPrice)})</option>
                          ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block" }}>Tên miền</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...inp, flex: 1 }} value={domainQuery} onChange={e => { setDomainQuery(e.target.value); setCheckResult([]); }} placeholder="Nhập tên miền (VD: loop)" />
                  <select style={{ ...inp, width: 110 }} value={selectedTLDId} onChange={e => { setSelectedTLDId(e.target.value); setCheckResult([]); }}>
                    <option value="">-- Đuôi --</option>
                    {domainPrices.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.extension}</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleCheckDomain} disabled={checkingDomain || !domainQuery || !selectedTLDId}
                    style={{ padding: "0 16px", background: DS.blue, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: (checkingDomain || !domainQuery || !selectedTLDId) ? 0.5 : 1 }}>
                    {checkingDomain ? "..." : "Kiểm tra"}
                  </button>
                </div>

                {checkResult && checkResult.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: `1px solid ${checkResult[0].available ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 999, background: checkResult[0].available ? "#10B981" : "#EF4444" }} />
                        <span style={{ fontSize: 12, color: checkResult[0].available ? "#10B981" : "#EF4444", fontWeight: 500 }}>
                          {checkResult[0].domain} {checkResult[0].available ? "còn trống" : "đã có người đăng ký"}
                        </span>
                      </div>
                      {checkResult[0].available && (
                        <button type="button" onClick={handleAddDomain} style={{ padding: "4px 12px", background: GRD.primary, border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Thêm</button>
                      )}
                    </motion.div>

                    {/* Suggestions */}
                    {!checkResult[0].available && (
                      <div style={{ padding: "2px 4px" }}>
                        <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 6, letterSpacing: "0.05em" }}>GỢI Ý TÊN MIỀN KHẢ DỤNG:</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {checkResult.slice(1).filter(d => d.available).slice(0, 4).map(d => (
                            <button key={d.domain} type="button" onClick={() => handleAddDomainFromList(d)}
                              style={{ padding: "4px 10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 20, color: "#10B981", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                              + {d.extension} ({fmtVND(d.price)})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {addedDomains.length > 0 && (
                  <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6, maxHeight: 120, overflowY: "auto", paddingRight: 4 }}>
                    <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.05em", marginBottom: 2 }}>DANH SÁCH ĐÃ CHỌN ({addedDomains.length})</div>
                    {addedDomains.map(d => (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", padding: "6px 10px", borderRadius: 8, border: `1px solid ${DS.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: DS.text, fontSize: 12, fontWeight: 500 }}>{d.name}{d.extension}</span>
                          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: d.available ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: d.available ? "#10B981" : "#EF4444" }}>
                            {d.available ? "Có sẵn" : "Đã mua"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <select style={{ ...inp, width: 80, padding: "2px 6px", fontSize: 11 }} value={d.years} onChange={e => updateDomainYears(d.id, Number(e.target.value))}>
                            <option value="1">1 năm</option>
                            <option value="2">2 năm</option>
                            <option value="3">3 năm</option>
                          </select>
                          <button type="button" onClick={() => removeDomain(d.id)} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer", padding: 2 }}><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formValue")}</label>
                <input style={inp} type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="15000000" />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>{t("quotation.formDeadline")}</label>
                <input 
                  style={inp} 
                  type="date" 
                  min={new Date().toLocaleDateString('en-CA')} 
                  value={form.validUntil} 
                  onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} 
                />
              </div>
            </div>

            {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}><AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}</div>}
            
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{t("quotation.formBtnCancel")}</button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "12px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>{saving ? t("quotation.formBtnCreating") : t("quotation.formBtnCreate")}</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function QuotationPage() {
  const { t } = useAdminTranslations();
  const [tab, setTab] = useState<"quotes" | "requests">("quotes");
  const [showCreate, setShowCreate] = useState(false);
  /** Pre-filled data when opening modal from a QuoteRequest row */
  const [quoteRequestForModal, setQuoteRequestForModal] = useState<QuoteRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [transitionQuote, setTransitionQuote] = useState<Quote | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const qc = useQueryClient();

  // Fetch pricing config for detail modal fallbacks
  const { data: configData } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: () => fetch("/api/pricing/config?lang=vi").then(res => res.json()),
  });

  const { data: quotesData, isLoading: quotesLoading, isFetching: quotesFetching } = useQuery({
    queryKey: ["admin", "quotation", "quotes"],
    queryFn: () => adminApi.get<{ data: Quote[]; total: number; page: number; totalPages: number }>("/api/admin/quotes", { params: { limit: 50 } }),
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["admin", "quotation", "requests"],
    queryFn: () => adminApi.get<{ data: QuoteRequest[] }>("/api/admin/quote-requests", { params: { limit: 50 } }),
  });

  const quotes = quotesData?.data ?? [];
  const requests = requestsData?.data ?? [];

  const totalQuoteValue = quotes.reduce((s, q) => s + (q.totalAmount ?? 0), 0);
  const approvedQuotes = quotes.filter(q => q.status === "approved" || q.status === "signed");
  const approvedValue = approvedQuotes.reduce((s, q) => s + (q.totalAmount ?? 0), 0);
  const pendingQuotes = quotes.filter(q => q.status === "pending" || q.status === "sent");
  const pendingValue = pendingQuotes.reduce((s, q) => s + (q.totalAmount ?? 0), 0);

  const transitionMutation = useMutation({
    mutationFn: async ({ id, status, note, action }: { id: string; status: string; note?: string; action: string }) => {
      if (action === "approve") {
        return await adminApi.post(`/api/admin/quotes/${id}/approve`, { action: "approve", note });
      }
      if (action === "sign") {
        return await adminApi.post(`/api/admin/quotes/${id}/sign`, { note });
      }
      if (action === "send") {
        return await adminApi.post(`/api/admin/quotes/${id}/approve`, { action: "send", note });
      }
      // Fallback: generic patch for statuses like "viewed", "cancelled"
      return await adminApi.patch(`/api/admin/quotes/${id}`, { status, note });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quotation", "quotes"] });
      setTransitionQuote(null);
      setToast({ message: "Cập nhật giai đoạn thành công", type: "success" });
    },
    onError: (err: unknown) => {
      setToast({ message: err instanceof Error ? err.message : "Lỗi khi chuyển giai đoạn", type: "error" });
    }
  });
  const deleteRequestMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/quote-requests/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quotation", "requests"] });
      setToast({ message: "Đã xóa yêu cầu báo giá", type: "success" });
    },
    onError: (err: unknown) => {
      setToast({ message: err instanceof Error ? err.message : "Không thể xóa yêu cầu", type: "error" });
    }
  });

  return (<>
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            {t("quotation.title")}
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {quotes.length} {t("quotation.tabQuotes")} · {requests.length} {t("quotation.tabRequests")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["admin", "quotation", "quotes"] });
              qc.invalidateQueries({ queryKey: ["admin", "quotation", "requests"] });
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={quotesFetching ? "animate-spin" : ""} /> {t("quotation.refreshBtn")}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: DS.blue, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}
          >
            <Plus size={13} /> {t("quotation.createBtn")}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quotation.kpiTotal")}</span>
            <FileText size={14} style={{ color: DS.blue }} />
          </div>
          <div style={{ color: DS.text, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(totalQuoteValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmtVND(totalQuoteValue)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quotation.kpiSigned")}</span>
            <Check size={14} style={{ color: DS.green }} />
          </div>
          <div style={{ color: DS.green, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(approvedValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{approvedQuotes.length} {t("quotation.tabQuotes")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quotation.kpiPending")}</span>
            <Clock size={14} style={{ color: DS.amber }} />
          </div>
          <div style={{ color: DS.amber, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(pendingValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{pendingQuotes.length} {t("quotation.tabQuotes")}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("quotation.kpiNewRequests")}</span>
            <XCircle size={14} style={{ color: DS.purple }} />
          </div>
          <div style={{ color: DS.purple, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{requests.length}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{t("quotation.kpiFrom")}</div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: `1px solid ${DS.border}` }}>
        {([["quotes", "quotes"], ["requests", "requests"]] as const).map(([tabKey, labelKey]) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey as "quotes" | "requests")}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === tabKey ? DS.blue : "transparent"}`,
              color: tab === tabKey ? DS.blue : DS.text4,
              fontSize: 13,
              fontFamily: DS.mono,
              cursor: "pointer",
              marginBottom: -1,
              fontWeight: tab === tabKey ? 600 : 400,
            }}
          >
            {t(`quotation.tab${labelKey.charAt(0).toUpperCase() + labelKey.slice(1) as "Quotes" | "Requests"}`)}
          </button>
        ))}
      </div>

      {/* Quotes table */}
      {tab === "quotes" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {quotesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : quotes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>{t("quotation.emptyStateQuotes")}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {[t("quotation.colId"), t("quotation.colTitle"), t("quotation.colCustomer"), t("quotation.colValue"), t("quotation.colDeadline"), t("quotation.colStatus")].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q, idx) => {
                    const cfg = STATUS_CFG[q.status] ?? { label: q.status, color: DS.text4, bg: "transparent" };
                    return (
                      <tr key={q.id || `quote-${idx}`} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px", color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>{q.quoteNumber}</td>
                        <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13 }}>{q.title}</td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>
                          <div>{q.salesLead?.customerName ?? "—"}</div>
                          {q.salesLead?.companyName && <div style={{ color: DS.text5, fontSize: 11 }}>{q.salesLead.companyName}</div>}
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(q.totalAmount)}</td>
                        <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(q.validUntil)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                              {cfg.label}
                            </span>
                            <button
                              onClick={() => setTransitionQuote(q)}
                              style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: 24, height: 24, borderRadius: 6, cursor: "pointer",
                                background: "rgba(59,130,246,0.1)", border: `1px solid ${DS.blue}30`,
                                color: DS.blue, transition: "all 0.2s"
                              }}
                              onMouseOver={e => e.currentTarget.style.background = "rgba(59,130,246,0.2)"}
                              onMouseOut={e => e.currentTarget.style.background = "rgba(59,130,246,0.1)"}
                              title="Chuyển trạng thái"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Quote requests */}
      {tab === "requests" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {requestsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>{t("quotation.emptyStateRequests")}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {[t("quotation.colCustomer"), t("quotation.colEmail"), t("quotation.colCompany"), "Nguồn", t("quotation.colDate"), t("quotation.colStatus"), t("quotation.colActions")].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, idx) => (
                    <React.Fragment key={r.id || `req-${idx}`}>
                      <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 600 }}>{r.customerName}</td>
                        <td style={{ padding: "12px 16px", color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>{r.customerEmail}</td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{r.companyName ?? "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {r.source === "custom" ? (
                            <span style={{ background: "rgba(236,72,153,0.12)", color: DS.pink, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>Custom</span>
                          ) : (
                            <span style={{ background: "rgba(59,130,246,0.1)", color: DS.blue, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>Fixed</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(r.createdAt)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: STATUS_CFG[r.status]?.bg ?? "transparent", color: STATUS_CFG[r.status]?.color ?? DS.text4, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                            {STATUS_CFG[r.status]?.label || r.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", display: "flex", gap: 8, alignItems: "center" }}>
                          <button
                            onClick={() => setSelectedRequest(r)}
                            title="Xem chi tiết"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(59,130,246,0.1)", border: `1px solid ${DS.blue}30`, borderRadius: 8, color: DS.blue, cursor: "pointer", transition: "all 0.2s" }}
                          >
                            <Eye size={14} />
                          </button>
                          {r.status !== "quoted" && (
                            <button
                              onClick={() => {
                                setQuoteRequestForModal(r);
                                setShowCreate(true);
                              }}
                              title={t("quotation.createBtn")}
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, color: "#10B981", cursor: "pointer" }}
                            >
                              <Plus size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm("Bạn có chắc chắn muốn xóa yêu cầu báo giá này?")) {
                                deleteRequestMutation.mutate(r.id);
                              }
                            }}
                            title="Xóa yêu cầu"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#EF4444", cursor: "pointer" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          configData={configData}
        />
      )}

      {showCreate && (
        <QuoteCreateModal
          onClose={() => { setShowCreate(false); setQuoteRequestForModal(null); }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["admin", "quotation", "quotes"] });
            qc.invalidateQueries({ queryKey: ["admin", "quotation", "requests"] });
            setTab("quotes");
            setQuoteRequestForModal(null);
          }}
          quoteRequest={quoteRequestForModal}
        />
      )}
      {transitionQuote && (
        <TransitionModal
          quote={transitionQuote}
          onClose={() => setTransitionQuote(null)}
          onSuccess={(status, note, action) => transitionMutation.mutate({ id: transitionQuote.id, status, note, action })}
          loading={transitionMutation.isPending}
        />
      )}
    </div>
    {toast && (
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "#0F172A", border: `1px solid ${toast.type === "success" ? "#22C55E" : "#CC3344"}50`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 320 }}>
        <span style={{ color: toast.type === "success" ? "#22C55E" : "#CC3344", fontSize: 16 }}>{toast.type === "success" ? "✓" : "✗"}</span>
        <span style={{ color: "#fff", fontSize: 13 }}>{toast.message}</span>
        <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8" }}><X size={14} /></button>
      </div>
    )}
  </>
  );
}

function RequestDetailModal({ request, onClose, configData }: { request: QuoteRequest; onClose: () => void; configData?: any }) {
  const rawBreakdown = (request as any).pricingBreakdown;
  const breakdown = (typeof rawBreakdown === 'string' ? JSON.parse(rawBreakdown) : (rawBreakdown || {
    hosting: request.hostingPlanSlug ? { name: request.hostingPlanSlug, slug: request.hostingPlanSlug } : null,
    domains: request.domainName ? [{ name: request.domainName }] : [],
    package: { name: (request.selectedItems as any)?.[0]?.featureName || "Website Tùy chỉnh" },
  })) as any;

  // Fallback lookup from configData if prices are missing
  const hPlans = configData?.data?.hostingPlans || [];
  const sTiers = configData?.data?.seoTiers || [];

  if (breakdown.hosting && (!breakdown.hosting.price || breakdown.hosting.price === 0)) {
    const found = hPlans.find((h: any) => h.name === breakdown.hosting.name || h.name.toLowerCase().includes(breakdown.hosting.name?.toLowerCase()));
    if (found) breakdown.hosting.price = found.discountedPrice || found.price;
  }
  if (breakdown.seo && (!breakdown.seo.price || breakdown.seo.price === 0)) {
    const found = sTiers.find((s: any) => s.name === breakdown.seo.name || String(s.level) === String(breakdown.seo.level));
    if (found) breakdown.seo.price = found.basePrice || found.price;
  }

  const items = (request.selectedItems || []) as any[];

  // Helper for currency
  const fmtVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  const SectionTitle = ({ title, icon: Icon, color = DS.blue }: { title: string; icon: any; color?: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
        <Icon size={16} />
      </div>
      <h4 style={{ color: DS.text, fontSize: 15, fontWeight: 800, margin: 0, letterSpacing: "0.02em" }}>{title}</h4>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 28, padding: 0, width: "100%", maxWidth: 1000, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* Header Bar */}
          <div style={{ padding: "24px 32px", borderBottom: `1px solid ${DS.border}`, background: DS.bgCard, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: GRD.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <Zap size={24} />
              </div>
              <div>
                <h3 style={{ color: DS.text, fontWeight: 900, fontSize: 20, margin: 0 }}>Chi tiết yêu cầu báo giá</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>#{request.id.slice(-8).toUpperCase()}</span>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: DS.text5 }} />
                  <span style={{ color: DS.text4, fontSize: 12 }}>{fmtDate(request.createdAt)}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "none", color: DS.text4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ padding: 32, overflowY: "auto", flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 32 }}>

              {/* LEFT COLUMN: Customer & Finance */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Customer Info Card */}
                <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 20, padding: 24 }}>
                  <SectionTitle title="Khách hàng" icon={User} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>HỌ & TÊN</div>
                      <div style={{ color: DS.text, fontSize: 16, fontWeight: 700 }}>{request.customerName}</div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>EMAIL</div>
                        <div style={{ color: DS.blue, fontSize: 13, fontWeight: 600 }}>{request.customerEmail}</div>
                      </div>
                      <div>
                        <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>SỐ ĐIỆN THOẠI</div>
                        <div style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{request.customerPhone || "—"}</div>
                      </div>
                    </div>
                    {request.companyName && (
                      <div>
                        <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>CÔNG TY / TỔ CHỨC</div>
                        <div style={{ color: DS.text2, fontSize: 14 }}>{request.companyName}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 20, padding: 24 }}>
                  <SectionTitle title="Tài chính" icon={ShieldCheck} color={DS.green} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: DS.text4, fontSize: 13 }}>Giá trị gốc:</span>
                      <span style={{ color: DS.text, fontSize: 14, fontWeight: 600 }}>{fmtVND(breakdown.subtotal || request.totalAmount)}</span>
                    </div>
                    {breakdown.lpDiscount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: DS.text4, fontSize: 13 }}>Giảm giá LP ({breakdown.lpUsed} LP):</span>
                        <span style={{ color: DS.pink, fontSize: 14, fontWeight: 600 }}>-{fmtVND(breakdown.lpDiscount)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: DS.text4, fontSize: 13 }}>Thuế VAT (10%):</span>
                      <span style={{ color: DS.text3, fontSize: 14 }}>{fmtVND(breakdown.vatAmount || 0)}</span>
                    </div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: DS.text, fontSize: 15, fontWeight: 800 }}>TỔNG CỘNG:</span>
                      <span style={{ color: DS.green, fontSize: 24, fontWeight: 900, fontFamily: DS.heading }}>{fmtVND(request.totalAmount || 0)}</span>
                    </div>
                    <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(59,130,246,0.1)", border: `1px solid ${DS.blue}20`, textAlign: "center" }}>
                      <span style={{ color: DS.blue, fontSize: 11, fontWeight: 700, fontFamily: DS.mono }}>
                        HÌNH THỨC: {request.paymentPlan === '100' ? 'THANH TOÁN 100%' : 'CỌC 50%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Service Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Configuration List */}
                <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 20, padding: 24 }}>
                  <SectionTitle title="Cấu hình dịch vụ" icon={Layout} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ padding: 16, borderRadius: 16, background: "rgba(59,130,246,0.05)", border: `1px solid ${DS.blue}15` }}>
                      <div style={{ color: DS.blue, fontSize: 10, fontWeight: 800, marginBottom: 4 }}>GÓI WEBSITE</div>
                      <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{breakdown.package?.name || "Website Tùy chỉnh"}</div>
                      <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{fmtVND(breakdown.package?.price || 0)}</div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 16, background: "rgba(168,85,247,0.05)", border: `1px solid ${DS.purple}15` }}>
                      <div style={{ color: DS.purple, fontSize: 10, fontWeight: 800, marginBottom: 4 }}>HOSTING</div>
                      <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{breakdown.hosting?.name || "Chưa chọn"}</div>
                      <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{(breakdown.hosting?.price || breakdown.hosting?.price === 0) ? fmtVND(breakdown.hosting.price) : "—"}</div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 16, background: "rgba(6,182,212,0.05)", border: `1px solid ${DS.cyan}15`, ...((breakdown.domains?.length ?? 0) > 1 ? { gridColumn: "1 / -1" } : {}) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ color: DS.cyan, fontSize: 10, fontWeight: 800 }}>TÊN MIỀN</div>
                        {(breakdown.domains?.length ?? 0) > 1 && (
                          <span style={{ background: "rgba(6,182,212,0.15)", color: DS.cyan, padding: "1px 7px", borderRadius: 9999, fontSize: 10, fontWeight: 700, fontFamily: DS.mono }}>{breakdown.domains.length} tên miền</span>
                        )}
                      </div>
                      {(!breakdown.domains || breakdown.domains.length === 0) ? (
                        <>
                          <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>Chưa đăng ký</div>
                          <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>—</div>
                        </>
                      ) : breakdown.domains.length === 1 ? (
                        <>
                          <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{breakdown.domains[0].name}</div>
                          <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{fmtVND(breakdown.domains[0].price || 0)}</div>
                        </>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                          {breakdown.domains.map((d: any, i: number) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ color: DS.text2, fontSize: 12, fontWeight: 600 }}>{d.name}</span>
                              <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{fmtVND(d.price || 0)}</span>
                            </div>
                          ))}
                          <div style={{ borderTop: `1px solid ${DS.border}`, paddingTop: 6, marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: DS.cyan, fontSize: 11, fontWeight: 700 }}>Tổng tên miền</span>
                            <span style={{ color: DS.text, fontSize: 12, fontWeight: 700, fontFamily: DS.mono }}>{fmtVND(breakdown.domains.reduce((s: number, d: any) => s + (d.price || 0), 0))}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: 16, borderRadius: 16, background: "rgba(236,72,153,0.05)", border: `1px solid ${DS.pink}15` }}>
                      <div style={{ color: DS.pink, fontSize: 10, fontWeight: 800, marginBottom: 4 }}>DỊCH VỤ SEO</div>
                      <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{breakdown.seo?.name || "Không yêu cầu"}</div>
                      <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{(breakdown.seo?.price || breakdown.seo?.price === 0) ? fmtVND(breakdown.seo.price) : "—"}</div>
                    </div>
                  </div>

                  {/* Feature List */}
                  {breakdown.features?.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ color: DS.text4, fontSize: 11, fontWeight: 700, marginBottom: 12, letterSpacing: "0.05em" }}>CÁC TÍNH NĂNG BỔ SUNG</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {breakdown.features.map((f: any, i: number) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: DS.blue }} />
                              <span style={{ color: DS.text2, fontSize: 13 }}>{f.featureName || f.label}</span>
                            </div>
                            <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>{fmtVND(f.price || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* System Notes & Debug */}
                <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 20, padding: 24 }}>
                  <SectionTitle title="Ghi chú hệ thống" icon={FileText} color={DS.text4} />
                  <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 14, padding: 16, color: DS.text3, fontSize: 13, lineHeight: 1.6 }}>
                    {request.notes || "Không có ghi chú bổ sung từ khách hàng."}
                  </div>

                  <details style={{ marginTop: 16 }}>
                    <summary style={{ color: DS.text5, fontSize: 11, cursor: "pointer", fontFamily: DS.mono, userSelect: "none" }}>XEM DỮ LIỆU KỸ THUẬT (JSON)</summary>
                    <div style={{ marginTop: 12, background: "#0F172A", border: `1px solid ${DS.border}`, borderRadius: 12, padding: 16, maxHeight: 150, overflow: "auto" }}>
                      <pre style={{ margin: 0, fontFamily: DS.mono, fontSize: 11, color: "#94A3B8", whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(request.pricingBreakdown || request.selectedItems, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ padding: "20px 32px", borderTop: `1px solid ${DS.border}`, background: DS.bgCard, display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 12, border: `1px solid ${DS.border}`, background: "none", color: DS.text3, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Đóng</button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TransitionModal({ quote, onClose, onSuccess, loading }: { quote: Quote; onClose: () => void; onSuccess: (status: string, note: string, action: string) => void; loading: boolean }) {
  const nextActions = WORKFLOW_ACTIONS[quote.status] ?? [];
  const [selectedAction, setSelectedAction] = useState(nextActions[0] || null);
  const [note, setNote] = useState("");

  const inputStyle = {
    width: "100%",
    background: DS.bg,
    border: `1px solid ${DS.border}`,
    borderRadius: 10,
    padding: "10px 12px",
    color: DS.text,
    fontSize: 13,
    outline: "none",
    fontFamily: DS.body
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59,130,246,0.1)", border: `1px solid ${DS.blue}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={20} style={{ color: DS.blue }} />
              </div>
              <div>
                <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, margin: 0 }}>Cập nhật giai đoạn</h3>
                <p style={{ color: DS.text4, fontSize: 11, margin: 0 }}>{quote.quoteNumber} · {quote.title}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={20} /></button>
          </div>

          {/* Timeline Visualization */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, padding: "0 10px", position: "relative" }}>
            <div style={{ position: "absolute", top: 12, left: 30, right: 30, height: 2, background: DS.border, zIndex: 0 }} />
            {STATUS_STEPS.map((s, i) => {
              const isActive = s === quote.status;
              const isPast = STATUS_STEPS.indexOf(quote.status) > i;
              const cfg = STATUS_CFG[s] || { color: DS.text4 };
              return (
                <div key={s} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: isActive ? DS.blue : isPast ? DS.green : DS.bg,
                    border: `2px solid ${isActive ? DS.blue : isPast ? DS.green : DS.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.3s"
                  }}>
                    {isPast && <Check size={12} style={{ color: "#fff" }} />}
                    {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? DS.text : DS.text5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {STATUS_CFG[s]?.label ?? s}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>BƯỚC TIẾP THEO KHẢ DỤNG</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {nextActions.length > 0 ? (
                  nextActions.map(act => (
                    <button
                      key={act.next}
                      onClick={() => setSelectedAction(act)}
                      style={{
                        padding: "10px 16px", borderRadius: 12, cursor: "pointer",
                        background: selectedAction?.next === act.next ? "rgba(59,130,246,0.15)" : DS.bg,
                        border: `1px solid ${selectedAction?.next === act.next ? DS.blue : DS.border}`,
                        color: selectedAction?.next === act.next ? DS.blue : DS.text,
                        fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                        display: "flex", alignItems: "center", gap: 8
                      }}>
                      {selectedAction?.next === act.next ? <CheckCircle size={14} /> : <div style={{ width: 14 }} />}
                      {act.label}
                    </button>
                  ))
                ) : (
                  <div style={{ width: "100%", padding: 16, textAlign: "center", color: DS.text4, fontSize: 13, background: DS.bg, borderRadius: 12, border: `1px dashed ${DS.border}` }}>
                    Báo giá này đã hoàn tất quy trình
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>GHI CHÚ (NHẬT KÝ)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập nội dung trao đổi hoặc lý do chuyển giai đoạn..."
                style={{ ...inputStyle, minHeight: 100, resize: "none" }}
              />
            </div>

            <button
              onClick={() => selectedAction && onSuccess(selectedAction.next, note, selectedAction.action)}
              disabled={!selectedAction || loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: !selectedAction ? DS.text4 : DS.blue,
                color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: !selectedAction ? "not-allowed" : "pointer",
                marginTop: 8, transition: "all 0.2s",
                boxShadow: selectedAction ? "0 8px 16px rgba(59,130,246,0.25)" : "none"
              }}>
              {loading ? "Đang xử lý..." : "Xác nhận cập nhật"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
