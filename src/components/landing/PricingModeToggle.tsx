"use client";

import { useState, useEffect } from "react";
import { WebPurchaseWizard } from "@/components/landing/WebPurchaseWizard";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PricingPlan {
 id: string;
 slug: string;
 name: string;
 price: number | null;
 period: string;
 tagline: string;
 features: string[];
 notIncluded: string[];
 highlighted: boolean;
 cta: string;
 color: string;
}

interface Props {
 locale: string;
 isAuthenticated: boolean;
 t: {
 // Web wizard
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
 // Static service cards
 badge: string;
 heroHighlight: string;
 comparisonTitle: string;
 comparisonHighlight: string;
 comparisonDesc: string;
 mostPopular: string;
 planStarter: string;
 planStarterPrice: string;
 planStarterPeriod: string;
 planStarterFeatures: string;
 planProfessional: string;
 planProfessionalPrice: string;
 planProfessionalPeriod: string;
 planProfessionalFeatures: string;
 planEnterprise: string;
 planEnterprisePrice: string;
 planEnterprisePeriod: string;
 planEnterpriseFeatures: string;
 planCustom: string;
 deploymentDesc: string;
 hostingTitle: string;
 hostingHighlight: string;
 hostingDesc: string;
 ctaEnterprise: string;
 btnContact: string;
 feat1: string;
 feat2: string;
 feat3: string;
 feat4: string;
 feat5: string;
 feat6: string;
 feat7: string;
 feat8: string;
 };
}

export function PricingModeToggle({ locale, isAuthenticated, t }: Props) {
 const [mode, setMode] = useState<"service" | "webpackage">("service");
 const [plans, setPlans] = useState<PricingPlan[]>([]);
 const [plansLoading, setPlansLoading] = useState(true);

 const isVi = locale === "vi";

 useEffect(() => {
 async function loadPlans() {
 try {
 const res = await fetch("/api/v1/pricing");
 if (res.ok) {
 const json = await res.json();
 setPlans(json.data ?? []);
 }
 } catch { /* non-critical */ }
 setPlansLoading(false);
 }
 loadPlans();
 }, []);

 const allFeatures = [t.feat1, t.feat2, t.feat3, t.feat4, t.feat5, t.feat6, t.feat7, t.feat8];

 // Static fallback plans
 const staticPlans = [
 {
 name: t.planStarter,
 price: t.planStarterPrice,
 period: t.planStarterPeriod,
 tagline: "",
 features: t.planStarterFeatures.split(",").map((s) => s.trim()),
 highlighted: false,
 },
 {
 name: t.planProfessional,
 price: t.planProfessionalPrice,
 period: t.planProfessionalPeriod,
 features: t.planProfessionalFeatures.split(",").map((s) => s.trim()),
 highlighted: true,
 },
 {
 name: t.planEnterprise,
 price: t.planEnterprisePrice,
 period: t.planEnterprisePeriod,
 features: t.planEnterpriseFeatures.split(",").map((s) => s.trim()),
 highlighted: false,
 },
 ];

 const hasDbPlans = plans.length > 0;
 const displayPlans = hasDbPlans
 ? plans.map((p) => ({
 name: p.name,
 price: p.price != null ? `${p.price.toLocaleString()}đ` : t.planCustom,
 period: p.period,
 tagline: p.tagline,
 features: p.features,
 highlighted: p.highlighted,
 }))
 : staticPlans;

 return (
 <div>
 {/* Mode toggle */}
 <div className="mx-auto mb-16 flex max-w-sm items-center justify-center gap-1 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-1.5 backdrop-blur">
 <button
 onClick={() => setMode("service")}
 className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
 mode === "service"
 ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
 : "text-slate-400 hover:text-white"
 }`}
 >
 Dịch vụ
 </button>
 <button
 onClick={() => setMode("webpackage")}
 className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
 mode === "webpackage"
 ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
 : "text-slate-400 hover:text-white"
 }`}
 >
 Gói Web
 </button>
 </div>

 {/* Service mode */}
 {mode === "service" && (
 <div>
 {/* Hero badge */}
 <div className="mb-8 text-center">
 <Badge variant="outline" className="border-indigo-500/40 bg-indigo-500/10 text-indigo-300">
 {t.badge}
 </Badge>
 <h1 className="mt-4 font-heading text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
 {t.heroHighlight}
 </h1>
 </div>

 {/* Pricing cards */}
 {plansLoading ? (
 <div className="flex justify-center py-16">
 <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
 </div>
 ) : (
 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
 {displayPlans.map((plan, i) => (
 <Card
 key={i}
 className={`relative flex flex-col border-slate-800 bg-slate-900/80 backdrop-blur transition-all duration-300 hover:-translate-y-1 ${
 plan.highlighted
 ? "border-indigo-500/60 shadow-[0_0_60px_-12px_rgba(99,102,241,0.4)] ring-1 ring-indigo-500/30"
 : "hover:border-slate-700"
 }`}
 >
 {plan.highlighted && (
 <div className="absolute -top-3 left-1/2 -translate-x-1/2">
 <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
 {t.mostPopular}
 </Badge>
 </div>
 )}

 <CardHeader className="pb-4 text-center">
 <CardTitle className="text-xl font-bold text-white">{plan.name}</CardTitle>
 {plan.tagline && (
 <CardDescription className="pt-2 text-slate-400">{plan.tagline}</CardDescription>
 )}
 <div className="pt-4">
 <span className="font-heading text-4xl font-black text-white">{plan.price}</span>
 {plan.period && (
 <span className="ml-1 text-sm text-slate-400">{plan.period}</span>
 )}
 </div>
 </CardHeader>

 <CardContent className="flex-1">
 <ul className="space-y-3">
 {plan.features.map((feat, fi) => (
 <li key={fi} className="flex items-start gap-3 text-sm text-slate-300">
 <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 {feat}
 </li>
 ))}
 </ul>
 </CardContent>

 <CardFooter className="pt-4">
 <Button
 asChild
 className={`w-full font-bold transition-all duration-200 ${
 plan.highlighted
 ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500"
 : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
 }`}
 >
 <Link href={`/${locale}/contact`}>{t.btnContact}</Link>
 </Button>
 </CardFooter>
 </Card>
 ))}
 </div>
 )}

 {/* Feature comparison */}
 <section className="mt-24 border-t border-slate-800 bg-slate-900/50 py-20">
 <div className="mx-auto max-w-3xl px-6">
 <div className="mb-12 text-center">
 <h2 className="mb-3 font-heading text-3xl font-black text-white sm:text-4xl">
 {t.comparisonTitle}{" "}
 <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
 {t.comparisonHighlight}
 </span>
 </h2>
 <p className="text-slate-400">{t.comparisonDesc}</p>
 </div>
 <div className="space-y-3">
 {allFeatures.map((feat, i) => (
 <div
 key={i}
 className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur transition-colors hover:border-slate-700"
 >
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
 <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 </div>
 <span className="text-slate-200">{feat}</span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Hosting CTA */}
 <section className="border-t border-slate-800 py-20">
 <div className="mx-auto max-w-3xl px-6 text-center">
 <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
 <div className="h-[300px] w-[600px] rounded-full bg-purple-600/10 blur-[100px]" />
 </div>
 <div className="relative">
 <h2 className="mb-4 font-heading text-3xl font-black text-white sm:text-4xl">
 {t.hostingTitle}{" "}
 <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
 {t.hostingHighlight}
 </span>
 </h2>
 <p className="mx-auto mb-8 max-w-xl text-slate-400">{t.hostingDesc}</p>
 <Button
 asChild
 size="lg"
 className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:from-purple-500 hover:to-pink-500"
 >
 <Link href={`/${locale}/contact`}>{t.ctaEnterprise}</Link>
 </Button>
 </div>
 </div>
 </section>
 </div>
 )}

 {/* Web package mode */}
 {mode === "webpackage" && (
 <WebPurchaseWizard locale={locale} isAuthenticated={isAuthenticated} t={t} />
 )}
 </div>
 );
}
