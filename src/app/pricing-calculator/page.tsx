"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tier = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  monthlyCost: number;
  setupCost: number;
  description: string | null;
  descriptionVi: string | null;
  color: string | null;
};

type Feature = {
  id: string;
  name: string;
  nameVi: string;
  category: string;
  tier: string;
  price: number;
  xpPoints: number;
  parentId: string | null;
};

type Reward = {
  addonServiceId: string;
  addonServiceName: string;
  addonServiceNameVi: string;
  rewardLevel: number;
  quantity: number;
  durationMonths: number | null;
  description: string | null;
};

type PriceResult = {
  basePrice: number;
  featureTotal: number;
  infraCost: number;
  infraSetupCost: number;
  systemPrice: number;
  finalPrice: number;
  totalXp: number;
  rewardLevel: number;
  rewards: Reward[];
  validatedFeatureIds: string[];
  infraTier: { id: string; slug: string; name: string; nameVi: string; monthlyCost: number; setupCost: number } | null;
};

function vnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

function toCategoryLabel(cat: string) {
  const map: Record<string, string> = {
    feature: "Tính năng", design: "Thiết kế", seo: "SEO",
    marketing: "Marketing", integration: "Tích hợp", security: "Bảo mật", performance: "Hiệu năng",
  };
  return map[cat] ?? cat;
}

export default function PricingCalculatorPage() {
  const router = useRouter();

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [infraTierSlug, setInfraTierSlug] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [error, setError] = useState("");

  // Load tiers + features on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/pricing/infrastructure-tiers"),
      fetch("/api/pricing/features"),
    ])
      .then(([tRes, fRes]) => Promise.all([tRes.json(), fRes.json()]))
      .then(([tiersJson, featJson]) => {
        const tiersData: Tier[] = tiersJson.data ?? [];
        const featData: Feature[] = featJson.data ?? [];
        setTiers(tiersData);
        setFeatures(featData);
        if (tiersData.length > 0) setInfraTierSlug(tiersData[0].slug);
        setLoadingInit(false);
      })
      .catch(() => { setError("Không tải được dữ liệu."); setLoadingInit(false); });
  }, []);

  // Sync state → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (infraTierSlug) params.set("tier", infraTierSlug);
    if (selectedIds.length) params.set("features", selectedIds.join(","));
    const qs = params.toString();
    router.replace(`/pricing-calculator${qs ? `?${qs}` : ""}`);
  }, [infraTierSlug, selectedIds, router]);

  // Init from URL
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const tier = sp.get("tier") ?? "";
    const feats = (sp.get("features") ?? "").split(",").filter(Boolean);
    if (tier) setInfraTierSlug(tier);
    if (feats.length) setSelectedIds(feats);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleCalculate() {
    setLoadingCalc(true);
    setError("");
    try {
      const res = await fetch("/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFeatureIds: selectedIds, infraTierSlug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Tính giá thất bại.");
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tính giá.");
    } finally {
      setLoadingCalc(false);
    }
  }

  // Group features by category
  const grouped = features.reduce<[string, Feature[]][]>((acc, f) => {
    const key = f.category || "other";
    const g = acc.find(([k]) => k === key);
    if (g) g[1].push(f);
    else acc.push([key, [f]]);
    return acc;
  }, []);

  const selectedTier = tiers.find(t => t.slug === infraTierSlug);
  const selectedAdvanced = selectedIds
    .map(id => features.find(f => f.id === id))
    .filter(Boolean) as Feature[];
  const previewXp = selectedAdvanced.reduce((s, f) => s + (f.xpPoints ?? 0), 0);
  const previewAdvanced = selectedAdvanced
    .filter(f => f.tier === "advanced")
    .reduce((s, f) => s + f.price, 0);

  if (loadingInit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">⚙️</div>
          <p className="text-slate-400">Đang tải công cụ tính giá...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/pricing" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <span>←</span> Quay về Bảng giá
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Giá preview:</span>
            <span className="text-lg font-bold text-green-400 font-mono">
              {vnd(previewAdvanced + (selectedTier ? selectedTier.monthlyCost + selectedTier.setupCost : 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">💰</div>
          <h1 className="text-3xl font-bold mb-2">Công cụ tính giá tuỳ chỉnh</h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Chọn hạ tầng + tính năng — giá tự động cập nhật. Hệ thống xử lý mutual exclusion ở backend.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400 text-sm">{error}</div>
        )}

        {/* Tier comparison */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-300">1. Chọn gói hạ tầng</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map(t => {
              const active = infraTierSlug === t.slug;
              const total = t.monthlyCost + t.setupCost;
              return (
                <button
                  key={t.id}
                  onClick={() => setInfraTierSlug(t.slug)}
                  className={`rounded-xl p-5 text-left transition-all ${active
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-700 bg-slate-800/30 hover:border-slate-600"}`}
                  style={{ borderWidth: "2px" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{t.name}</span>
                    {active && <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">đang chọn</span>}
                  </div>
                  <div className="text-sm text-slate-400 mb-1">{t.nameVi}</div>
                  <div className="text-xs text-slate-500">Hàng tháng: <span className="text-white font-medium">{vnd(t.monthlyCost)}</span></div>
                  <div className="text-xs text-slate-500">Setup: <span className="text-white font-medium">{vnd(t.setupCost)}</span></div>
                  <div className="mt-2 pt-2 border-t border-slate-700/50 text-sm font-bold text-green-400">
                    Tổng: {vnd(total)}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Feature catalog */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold mb-1 text-slate-300">2. Chọn tính năng nâng cao</h2>
          <p className="text-xs text-slate-500 mb-5">Hệ thống tự động xử lý mutual exclusion. Checkbox = thêm vào giá.</p>
          <div className="space-y-6">
            {grouped.map(([cat, feats]) => (
              <div key={cat}>
                <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">
                  {toCategoryLabel(cat)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {feats.map(f => {
                    const checked = selectedIds.includes(f.id);
                    const isAdvanced = f.tier === "advanced";
                    return (
                      <label
                        key={f.id}
                        className={`flex items-center gap-3 rounded-xl p-4 cursor-pointer transition-all border text-sm
                          ${checked ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 bg-slate-800/30 hover:border-slate-600"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(f.id)}
                          className="accent-indigo-500 w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{f.nameVi}</div>
                          <div className="text-xs text-slate-400 truncate">{f.name}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-green-400 font-mono font-bold text-sm">{vnd(f.price)}</div>
                          {f.xpPoints > 0 && (
                            <div className="text-xs text-purple-400">+⬡{f.xpPoints} XP</div>
                          )}
                          {isAdvanced && (
                            <div className="text-[10px] text-emerald-400 mt-0.5">tính vào giá</div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-slate-400 mb-1">Tính năng đã chọn</div>
            <div className="font-bold text-white">{selectedIds.length}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Giá feature advanced</div>
            <div className="font-bold text-green-400 font-mono">{vnd(previewAdvanced)}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">XP bonus</div>
            <div className="font-bold text-purple-400">⬡{previewXp}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Giá ước tính</div>
            <div className="font-bold text-green-400 font-mono text-base">
              {vnd(previewAdvanced + (selectedTier ? selectedTier.monthlyCost + selectedTier.setupCost : 0))}
            </div>
          </div>
        </section>

        {/* Calculate */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleCalculate}
            disabled={loadingCalc}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3.5 font-semibold transition-colors"
          >
            {loadingCalc ? "Đang tính..." : "Tính giá chính thức →"}
          </button>
          {selectedIds.length > 0 && (
            <span className="text-sm text-slate-500">
              Link hiện tại có thể share: tier + features trên query params.
            </span>
          )}
        </div>

        {/* Result */}
        {result && (
          <section className="rounded-2xl border-2 border-green-500/30 bg-green-500/5 p-8 text-white space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">✅</span>
              <h2 className="text-xl font-bold">Kết quả tính giá</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-sm">
              <div>Giá base: <b className="text-white font-mono ml-1">{vnd(result.basePrice)}</b></div>
              <div>Tính năng: <b className="text-white font-mono ml-1">{vnd(result.featureTotal)}</b></div>
              <div>Hạ tầng tháng: <b className="text-white font-mono ml-1">{vnd(result.infraCost)}</b></div>
              <div>Setup: <b className="text-white font-mono ml-1">{vnd(result.infraSetupCost)}</b></div>
              <div>XP: <b className="text-purple-400 ml-1">⬡{result.totalXp}</b></div>
              <div>Reward Level: <b className="text-yellow-400 ml-1">Lv{result.rewardLevel}</b></div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">Giá hệ thống: <b className="text-white font-mono ml-1">{vnd(result.systemPrice)}</b></div>
            </div>
            <div className="text-3xl font-black text-green-400 font-mono pt-2">
              Giá cuối cùng: {vnd(result.finalPrice)}
            </div>
            {result.rewards.length > 0 && (
              <div className="pt-3 border-t border-slate-700 text-sm text-slate-300">
                <div className="font-semibold mb-2">Rewards tuổi đạt được:</div>
                {result.rewards.map(r => (
                  <div key={r.addonServiceId} className="text-green-300">
                    Lv{r.rewardLevel}: {r.addonServiceNameVi} ×{r.quantity}
                    {r.durationMonths ? ` (${r.durationMonths} tháng)` : ""}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
