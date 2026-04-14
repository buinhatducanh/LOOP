"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WebPackage {
 id: string;
 slug: string;
 name: string;
 nameVi: string;
 tagline: string;
 taglineVi: string;
 price: number;
 period: string;
 periodVi: string;
 highlighted: boolean;
 color: string;
 pages: string;
 pagesVi: string;
}

interface DomainResult {
 domain: string;
 available: boolean;
 reason?: string;
 price: number;
}

interface HostingPlan {
 id: string;
 slug: string;
 name: string;
 nameVi: string;
 monthlyPrice: number;
 months: number;
 discountPct: number;
 features: string[];
 featuresVi: string[];
 highlighted: boolean;
 color: string;
}

interface OrderResult {
 data: {
 orderId: string;
 orderNumber: string;
 totalAmount: number;
 status: string;
 };
}

// ─── Step enum ───────────────────────────────────────────────────────────────

type Step = "type" | "package" | "domain" | "hosting" | "summary";

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
 locale: string;
 isAuthenticated: boolean;
 t: {
 heroTitle: string;
 heroSubtitle: string;
 stepType: string;
 stepPackage: string;
 stepDomain: string;
 stepHosting: string;
 stepSummary: string;
 typeTitle: string;
 typeTemplate: string;
 typeTemplateDesc: string;
 typeCustom: string;
 typeCustomDesc: string;
 selectPackage: string;
 searchDomain: string;
 searchPlaceholder: string;
 selectHosting: string;
 termMonths: string;
 term6mo: string;
 term12mo: string;
 term24mo: string;
 monthly: string;
 yearly: string;
 summaryTitle: string;
 orderNow: string;
 total: string;
 template: string;
 domain: string;
 hosting: string;
 years: string;
 months12: string;
 months24: string;
 checking: string;
 available: string;
 unavailable: string;
 noPackage: string;
 noHosting: string;
 back: string;
 next: string;
 required: string;
 invalidEmail: string;
 successTitle: string;
 successDesc: string;
 successOrderNum: string;
 successTotal: string;
 viewOrders: string;
 confirm: string;
 };
}

export function WebPurchaseWizard({ locale, isAuthenticated, t }: Props) {
 const router = useRouter();

 // ── Step ────────────────────────────────────────────────────────────────────
 const [step, setStep] = useState<Step>("type");

 // ── Step 1: Type ────────────────────────────────────────────────────────────
 const [purchaseType, setPurchaseType] = useState<"template" | "custom" | null>(null);

 // ── Step 2: Package ──────────────────────────────────────────────────────────
 const [packages, setPackages] = useState<WebPackage[]>([]);
 const [packagesLoading, setPackagesLoading] = useState(false);
 const [selectedPackage, setSelectedPackage] = useState<WebPackage | null>(null);

 // ── Step 3: Domain ──────────────────────────────────────────────────────────
 const [domainQuery, setDomainQuery] = useState("");
 const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
 const [domainSearching, setDomainSearching] = useState(false);
 const [selectedDomain, setSelectedDomain] = useState<DomainResult | null>(null);
 const [domainError, setDomainError] = useState("");

 // ── Step 4: Hosting ─────────────────────────────────────────────────────────
 const [hostingPlans, setHostingPlans] = useState<HostingPlan[]>([]);
 const [hostingLoading, setHostingLoading] = useState(false);
 const [selectedHosting, setSelectedHosting] = useState<HostingPlan | null>(null);
 const [hostingTerm, setHostingTerm] = useState<6 | 12 | 24>(12);

 // ── Customer info ───────────────────────────────────────────────────────────
 const [customerName, setCustomerName] = useState("");
 const [customerEmail, setCustomerEmail] = useState("");
 const [customerPhone, setCustomerPhone] = useState("");
 const [emailError, setEmailError] = useState("");

 // ── Submit ──────────────────────────────────────────────────────────────────
 const [submitting, setSubmitting] = useState(false);
 const [orderResult, setOrderResult] = useState<OrderResult["data"] | null>(null);
 const [submitError, setSubmitError] = useState("");

 // ─── Load web packages ───────────────────────────────────────────────────────
 const loadPackages = useCallback(async () => {
 setPackagesLoading(true);
 try {
 const res = await fetch("/api/v1/web-packages");
 if (res.ok) {
 const json = await res.json();
 setPackages(json.data ?? []);
 }
 } catch { /* non-critical */ }
 setPackagesLoading(false);
 }, []);

 // ─── Load hosting plans ─────────────────────────────────────────────────────
 const loadHostingPlans = useCallback(async () => {
 setHostingLoading(true);
 try {
 const res = await fetch("/api/pricing/hosting-plans");
 if (res.ok) {
 const json = await res.json();
 setHostingPlans(json.data?.hostingPlans ?? []);
 }
 } catch { /* non-critical */ }
 setHostingLoading(false);
 }, []);

 // ─── Search domain ───────────────────────────────────────────────────────────
 const searchDomain = useCallback(async (keyword: string) => {
 if (keyword.trim().length < 2) {
 setDomainResults([]);
 return;
 }
 setDomainSearching(true);
 setDomainError("");
 try {
 const res = await fetch(`/api/pricing/domain-search?q=${encodeURIComponent(keyword)}`);
 if (res.ok) {
 const json = await res.json();
 setDomainResults(json.data?.domains ?? []);
 } else {
 setDomainError("Search failed");
 }
 } catch {
 setDomainError("Network error");
 }
 setDomainSearching(false);
 }, []);

 // ─── Domain search on input (debounced) ──────────────────────────────────────
 useEffect(() => {
 if (!domainQuery) {
 setDomainResults([]);
 setSelectedDomain(null);
 return;
 }
 const timer = setTimeout(() => searchDomain(domainQuery), 600);
 return () => clearTimeout(timer);
 }, [domainQuery, searchDomain]);

 // ─── Calculate hosting total ────────────────────────────────────────────────
 const calcHostingTotal = (plan: HostingPlan, term: number) => {
 if (term >= plan.months && plan.discountPct > 0) {
 return Math.round(plan.monthlyPrice * term * (1 - plan.discountPct / 100));
 }
 return plan.monthlyPrice * term;
 };

 const selectedHostingTotal = selectedHosting
 ? calcHostingTotal(selectedHosting, hostingTerm)
 : 0;

 const totalEstimate =
 (selectedPackage?.price ?? 0) +
 (selectedDomain?.price ?? 0) +
 selectedHostingTotal;

 // ─── Steps config ────────────────────────────────────────────────────────────
 const STEPS: { key: Step; label: string }[] = [
 { key: "type", label: t.stepType },
 { key: "package", label: t.stepPackage },
 { key: "domain", label: t.stepDomain },
 { key: "hosting", label: t.stepHosting },
 { key: "summary", label: t.stepSummary },
 ];

 const stepIndex = STEPS.findIndex((s) => s.key === step);

 // ─── Validate email ───────────────────────────────────────────────────────────
 const validateEmail = (email: string) =>
 /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

 // ─── Navigation ──────────────────────────────────────────────────────────────
 const goNext = () => {
 // Validate before moving to summary
 if (step === "hosting") {
 if (!selectedPackage) {
 setSubmitError(t.noPackage);
 return;
 }
 if (!selectedDomain) {
 setSubmitError(t.required);
 return;
 }
 if (!validateEmail(customerEmail)) {
 setEmailError(t.invalidEmail);
 return;
 }
 }
 setSubmitError("");
 setStep((prev) => {
 const steps: Step[] = ["type", "package", "domain", "hosting", "summary"];
 const idx = steps.indexOf(prev);
 if (idx < steps.length - 1) return steps[idx + 1];
 return prev;
 });
 };

 const goBack = () => {
 setSubmitError("");
 setEmailError("");
 setStep((prev) => {
 const steps: Step[] = ["type", "package", "domain", "hosting", "summary"];
 const idx = steps.indexOf(prev);
 if (idx > 0) return steps[idx - 1];
 return prev;
 });
 };

 // ─── Submit order ────────────────────────────────────────────────────────────
 const handleSubmit = async () => {
 if (!isAuthenticated) {
 router.push(`/${locale}/dang-nhap`);
 return;
 }
 if (!selectedPackage || !selectedDomain) return;
 setSubmitting(true);
 setSubmitError("");

 try {
 const res = await fetch("/api/portal/web-purchase", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 credentials: "include",
 body: JSON.stringify({
 name: `${selectedPackage.nameVi ?? selectedPackage.name} - ${selectedDomain.domain}`,
 packageId: selectedPackage.id,
 domain: selectedDomain.domain,
 domainTld: selectedDomain.domain.split(".").pop(),
 domainTermMonths: 12,
 domainCost: selectedDomain.price,
 hostingPlanId: selectedHosting?.id ?? null,
 hostingTermMonths: hostingTerm,
 hostingCost: selectedHostingTotal,
 customerName,
 customerEmail,
 customerPhone,
 }),
 });

 const json = await res.json();

 if (!res.ok) {
 setSubmitError(json.error ?? "Order creation failed");
 setSubmitting(false);
 return;
 }

 setOrderResult(json.data);
 } catch {
 setSubmitError("Network error");
 setSubmitting(false);
 }
 };

 // ─── Format price ────────────────────────────────────────────────────────────
 const fmt = (n: number) =>
 n.toLocaleString("vi-VN") + "đ";

 const isVi = locale === "vi";

 // ─── Package card click ───────────────────────────────────────────────────────
 const handlePackageSelect = (pkg: WebPackage) => {
 setSelectedPackage(pkg);
 setPurchaseType("template");
 goNext();
 };

 // ─── Custom type ─────────────────────────────────────────────────────────────
 const handleCustomSelect = () => {
 setPurchaseType("custom");
 router.push(`/${locale}/dat-lich`);
 };

 // ─── Success view ────────────────────────────────────────────────────────────
 if (orderResult) {
 return (
 <div className="mx-auto max-w-lg py-16 text-center">
 <div className="mb-6 flex justify-center">
 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
 <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </div>
 </div>
 <h2 className="mb-3 font-heading text-2xl font-bold text-white">{t.successTitle}</h2>
 <p className="mb-2 text-slate-400">{t.successDesc}</p>
 <div className="mb-6 inline-block rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-4 text-left">
 <div className="mb-2 text-sm text-slate-400">{t.successOrderNum}</div>
 <div className="font-mono text-lg font-bold text-white">{orderResult.orderNumber}</div>
 <div className="mt-3 text-sm text-slate-400">{t.successTotal}</div>
 <div className="font-mono text-xl font-bold text-emerald-400">{fmt(orderResult.totalAmount)}</div>
 </div>
 <button
 onClick={() => router.push(`/${locale}/khach-hang?tab=orders`)}
 className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-bold text-white transition-all hover:from-indigo-500 hover:to-purple-500"
 >
 {t.viewOrders}
 </button>
 </div>
 );
 }

 // ─── Main render ─────────────────────────────────────────────────────────────
 return (
 <div>
 {/* Step indicator */}
 <div className="mb-10 flex items-center justify-center gap-2">
 {STEPS.map((s, i) => (
 <div key={s.key} className="flex items-center gap-2">
 <button
 onClick={() => {
 // Only allow going back
 if (i < stepIndex) {
 setStep(s.key);
 }
 }}
 disabled={i > stepIndex}
 className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
 i < stepIndex
 ? "bg-indigo-600 text-white cursor-pointer"
 : i === stepIndex
 ? "border-2 border-indigo-500 text-indigo-400 bg-indigo-500/10"
 : "border border-slate-700 text-slate-600 cursor-not-allowed"
 }`}
 >
 {i + 1}
 </button>
 {i < STEPS.length - 1 && (
 <div className={`h-px w-8 ${i < stepIndex ? "bg-indigo-600" : "bg-slate-700"}`} />
 )}
 </div>
 ))}
 </div>

 {/* Step: Type selection */}
 {step === "type" && (
 <div>
 <h3 className="mb-2 text-center font-heading text-2xl font-bold text-white">{t.typeTitle}</h3>
 <div className="mt-8 grid gap-6 sm:grid-cols-2">
 {/* Template */}
 <button
 onClick={() => {
 loadPackages();
 goNext();
 }}
 className="group relative flex flex-col items-start rounded-2xl border border-slate-700 bg-slate-900/80 p-8 text-left transition-all hover:border-indigo-500/60 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-indigo-500/10"
 >
 {packagesLoading && (
 <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/80">
 <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
 </div>
 )}
 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl">
 <span>🎨</span>
 </div>
 <h4 className="mb-2 font-heading text-lg font-bold text-white">{t.typeTemplate}</h4>
 <p className="text-sm text-slate-400">{t.typeTemplateDesc}</p>
 <div className="mt-4 text-xs text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
 {t.next} →
 </div>
 </button>

 {/* Custom Design */}
 <button
 onClick={handleCustomSelect}
 className="group relative flex flex-col items-start rounded-2xl border border-slate-700 bg-slate-900/80 p-8 text-left transition-all hover:border-pink-500/60 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-pink-500/10"
 >
 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 text-2xl">
 <span>✨</span>
 </div>
 <h4 className="mb-2 font-heading text-lg font-bold text-white">{t.typeCustom}</h4>
 <p className="text-sm text-slate-400">{t.typeCustomDesc}</p>
 <div className="mt-4 text-xs text-pink-400 opacity-0 transition-opacity group-hover:opacity-100">
 {t.next} →
 </div>
 </button>
 </div>
 </div>
 )}

 {/* Step: Package selection */}
 {step === "package" && (
 <div>
 <h3 className="mb-2 text-center font-heading text-2xl font-bold text-white">{t.selectPackage}</h3>
 {packagesLoading ? (
 <div className="flex justify-center py-12">
 <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
 </div>
 ) : packages.length === 0 ? (
 <p className="py-12 text-center text-slate-500">{t.noPackage}</p>
 ) : (
 <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
 {packages.map((pkg) => (
 <button
 key={pkg.id}
 onClick={() => handlePackageSelect(pkg)}
 className={`group relative flex flex-col rounded-2xl border p-6 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
 selectedPackage?.id === pkg.id
 ? "border-indigo-500 bg-indigo-500/10 shadow-indigo-500/20"
 : "border-slate-700 bg-slate-900/80 hover:border-slate-600"
 }`}
 style={{
 borderColor: selectedPackage?.id === pkg.id ? pkg.color : undefined,
 boxShadow: selectedPackage?.id === pkg.id ? `0 0 20px ${pkg.color}33` : undefined,
 }}
 >
 {pkg.highlighted && (
 <div className="absolute -top-3 left-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-0.5 text-xs font-bold text-white">
 {t.confirm}
 </div>
 )}
 <div className="mb-3 font-heading text-lg font-bold text-white">
 {isVi ? pkg.nameVi : pkg.name}
 </div>
 <div className="mb-3 text-xs text-slate-400">
 {isVi ? pkg.taglineVi : pkg.tagline}
 </div>
 <div className="mb-4 flex items-baseline gap-1">
 <span className="font-heading text-2xl font-black text-white">{fmt(pkg.price)}</span>
 <span className="text-xs text-slate-500">/ {isVi ? pkg.periodVi : pkg.period}</span>
 </div>
 <div className="text-xs text-slate-500">
 {pkg.pages} {isVi ? "trang" : "pages"}
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Step: Domain search */}
 {step === "domain" && (
 <div>
 <h3 className="mb-2 text-center font-heading text-2xl font-bold text-white">{t.searchDomain}</h3>
 <div className="mx-auto mt-8 max-w-xl">
 <div className="relative">
 <input
 type="text"
 value={domainQuery}
 onChange={(e) => setDomainQuery(e.target.value)}
 placeholder={t.searchPlaceholder}
 className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-4 pr-12 font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">.vn</span>
 </div>

 {domainSearching && (
 <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
 <div className="h-4 w-4 animate-spin rounded-full border border-indigo-500 border-t-transparent" />
 {t.checking}
 </div>
 )}

 {domainError && (
 <p className="mt-3 text-sm text-red-400">{domainError}</p>
 )}

 {domainResults.length > 0 && (
 <div className="mt-4 space-y-2">
 {domainResults.map((d) => (
 <button
 key={d.domain}
 disabled={!d.available}
 onClick={() => {
 if (d.available) {
 setSelectedDomain(d);
 setDomainQuery(d.domain);
 }
 }}
 className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
 selectedDomain?.domain === d.domain
 ? "border-emerald-500 bg-emerald-500/10"
 : d.available
 ? "border-slate-700 bg-slate-900/60 hover:border-slate-600 cursor-pointer"
 : "border-slate-800 bg-slate-900/30 opacity-50 cursor-not-allowed"
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
 d.available ? "border-emerald-500 bg-emerald-500/20" : "border-slate-600"
 }`}>
 {d.available && (
 <div className="h-2 w-2 rounded-full bg-emerald-500" />
 )}
 </div>
 <span className="font-mono text-sm text-white">{d.domain}</span>
 {d.available ? (
 <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">{t.available}</span>
 ) : (
 <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">{t.unavailable}</span>
 )}
 </div>
 {d.price > 0 && (
 <span className="font-mono text-sm text-slate-400">{fmt(d.price)}/năm</span>
 )}
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {/* Step: Hosting selection */}
 {step === "hosting" && (
 <div>
 <h3 className="mb-2 text-center font-heading text-2xl font-bold text-white">{t.selectHosting}</h3>

 {/* Term selector */}
 <div className="mt-6 flex justify-center gap-3">
 {([6, 12, 24] as const).map((term) => (
 <button
 key={term}
 onClick={() => setHostingTerm(term)}
 className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
 hostingTerm === term
 ? "border-indigo-500 bg-indigo-500/20 text-indigo-400"
 : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600"
 }`}
 >
 {term === 6 ? t.term6mo : term === 12 ? t.term12mo : t.term24mo}
 </button>
 ))}
 </div>

 {hostingLoading ? (
 <div className="flex justify-center py-12">
 <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
 </div>
 ) : hostingPlans.length === 0 ? (
 <p className="py-12 text-center text-slate-500">{t.noHosting}</p>
 ) : (
 <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {hostingPlans.map((plan) => {
 const total = calcHostingTotal(plan, hostingTerm);
 const isSelected = selectedHosting?.id === plan.id;
 return (
 <button
 key={plan.id}
 onClick={() => setSelectedHosting(isSelected ? null : plan)}
 className={`flex flex-col rounded-xl border p-5 text-left transition-all ${
 isSelected
 ? "border-indigo-500 bg-indigo-500/10"
 : "border-slate-700 bg-slate-900/60 hover:border-slate-600"
 }`}
 >
 <div className="mb-2 font-bold text-white">
 {isVi ? plan.nameVi : plan.name}
 </div>
 <div className="mb-3 text-xs text-slate-400">
 {t.monthly}: {fmt(plan.monthlyPrice)}
 {plan.discountPct > 0 && hostingTerm >= plan.months && (
 <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400">
 -{plan.discountPct}%
 </span>
 )}
 </div>
 <div className="font-mono text-lg font-bold text-white">
 {fmt(total)}
 <span className="ml-1 text-xs font-normal text-slate-400">
 / {hostingTerm} {t.years}
 </span>
 </div>
 </button>
 );
 })}
 </div>
 )}

 {/* Customer info */}
 <div className="mx-auto mt-8 max-w-xl space-y-4">
 <input
 type="text"
 value={customerName}
 onChange={(e) => setCustomerName(e.target.value)}
 placeholder="Họ và tên"
 className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
 />
 <input
 type="email"
 value={customerEmail}
 onChange={(e) => {
 setCustomerEmail(e.target.value);
 setEmailError("");
 }}
 placeholder="Email"
 className={`w-full rounded-xl border bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:outline-none ${
 emailError ? "border-red-500" : "border-slate-700 focus:border-indigo-500"
 }`}
 />
 {emailError && <p className="-mt-2 text-xs text-red-400">{emailError}</p>}
 <input
 type="tel"
 value={customerPhone}
 onChange={(e) => setCustomerPhone(e.target.value)}
 placeholder="Số điện thoại (tùy chọn)"
 className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
 />
 </div>
 </div>
 )}

 {/* Step: Summary */}
 {step === "summary" && (
 <div>
 <h3 className="mb-2 text-center font-heading text-2xl font-bold text-white">{t.summaryTitle}</h3>
 <div className="mx-auto mt-8 max-w-md space-y-4">
 {/* Template */}
 <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 p-4">
 <div>
 <div className="text-xs text-slate-400">{t.template}</div>
 <div className="font-medium text-white">
 {isVi
 ? selectedPackage?.nameVi
 : selectedPackage?.name}
 </div>
 </div>
 <div className="font-mono font-bold text-white">{fmt(selectedPackage?.price ?? 0)}</div>
 </div>

 {/* Domain */}
 <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 p-4">
 <div>
 <div className="text-xs text-slate-400">{t.domain}</div>
 <div className="font-mono font-medium text-white">{selectedDomain?.domain}</div>
 </div>
 <div className="font-mono font-bold text-white">{fmt(selectedDomain?.price ?? 0)}</div>
 </div>

 {/* Hosting */}
 <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 p-4">
 <div>
 <div className="text-xs text-slate-400">{t.hosting}</div>
 <div className="font-medium text-white">
 {selectedHosting
 ? `${isVi ? selectedHosting.nameVi : selectedHosting.name} (${hostingTerm} tháng)`
 : "Không đăng ký hosting"}
 </div>
 </div>
 <div className="font-mono font-bold text-white">{fmt(selectedHostingTotal)}</div>
 </div>

 {/* Total */}
 <div className="flex items-center justify-between rounded-xl border-2 border-indigo-500/60 bg-indigo-500/10 p-5">
 <div>
 <div className="text-sm text-slate-400">{t.total}</div>
 <div className="font-heading text-xl font-black text-white">{fmt(totalEstimate)}</div>
 </div>
 <div className="text-right text-xs text-slate-500">
 incl. 10% VAT
 </div>
 </div>
 </div>

 {submitError && (
 <p className="mx-auto mt-4 max-w-md text-center text-sm text-red-400">{submitError}</p>
 )}
 </div>
 )}

 {/* Navigation */}
 <div className="mt-10 flex items-center justify-center gap-4">
 {stepIndex > 0 && step !== "type" && (
 <button
 onClick={goBack}
 className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:border-slate-600"
 >
 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
 </svg>
 {t.back}
 </button>
 )}

 {step !== "summary" && stepIndex < STEPS.length - 1 && (
 <button
 onClick={goNext}
 disabled={
 (step === "package" && !selectedPackage) ||
 (step === "domain" && !selectedDomain) ||
 (step === "type" && !purchaseType)
 }
 className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
 >
 {t.next}
 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
 </svg>
 </button>
 )}

 {step === "summary" && (
 <button
 onClick={handleSubmit}
 disabled={submitting}
 className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {submitting ? (
 <>
 <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
 {t.checking}
 </>
 ) : (
 <>
 {t.orderNow}
 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </>
 )}
 </button>
 )}
 </div>
 </div>
 );
}
