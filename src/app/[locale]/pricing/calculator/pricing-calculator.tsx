"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  infraTier: {
    id: string;
    slug: string;
    name: string;
    nameVi: string;
    monthlyCost: number;
    setupCost: number;
  } | null;
};

function vnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

function toCategoryLabel(cat: string) {
  const map: Record<string, string> = {
    feature: "Tính năng",
    design: "Thiết kế",
    seo: "SEO",
    marketing: "Marketing",
    integration: "Tích hợp",
    security: "Bảo mật",
    performance: "Hiệu năng",
  };
  return map[cat] ?? cat;
}

export default function PricingCalculatorPage() {
  const searchParams = useSearchParams();

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [infraTierSlug, setInfraTierSlug] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [error, setError] = useState("");

  // Load tiers + features
  useEffect(() => {
    Promise.all([
      fetch("/api/pricing/infrastructure-tiers"),
      fetch("/api/pricing/features"),
    ])
      .then(([tRes, fRes]) => Promise.all([tRes.json(), fRes.json()]))
      .then(([tiersJson, featJson]) => {
        const fetchedTiers: Tier[] = tiersJson.data ?? [];
        const fetchedFeatures: Feature[] = featJson.data ?? [];
        setTiers(fetchedTiers);
        setFeatures(fetchedFeatures);
        // Init from URL params
        const params = Object.fromEntries(searchParams);
        if (params.tier) setInfraTierSlug(params.tier);
        if (params.features) {
          const ids = params.features.split(",").filter(Boolean);
          setSelectedIds(ids);
        }
      })
      .catch(() => setError("Không tải được dữ liệu."))
      .finally(() => setLoadingInit(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
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
      if (!res.ok) throw new Error(json.error ?? "Tính giá thất bại");
      setResult(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tính giá");
    } finally {
      setLoadingCalc(false);
    }
  }

  const selectedTier = tiers.find(t => t.slug === infraTierSlug);
  const grouped = features.reduce<[string, Feature[]][]>((acc, f) => {
    const key = f.category || "other";
    const g = acc.find(([k]) => k === key);
    if (g) g[1].push(f);
    else acc.push([key, [f]]);
    return acc;
  }, []);
  const previewAdvanced = selectedIds
    .map(id => features.find(f => f.id === id))
    .filter(f => f?.tier === "advanced")
    .reduce((s, f) => s + (f?.price ?? 0), 0);

  if (loadingInit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">⚙️</div>
          <p className="text-slate-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2">
            ← Bảng giá
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Preview:</span>
            <span className="text-lg font-black text-green-400 font-mono">
              {vnd(previewAdvanced + (selectedTier ? selectedTier.monthlyCost + selectedTier.setupCost : 0))}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">💰</div>
          <h1 className="text-3xl font-black mb-2">Tùy chỉnh Báo giá Website</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
            Chọn gói hạ tầng + tính năng nâng cao — giá tự động cập nhật ngay.
            Hệ thống xử lý mutual exclusion ở backend.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-400 text-sm">{error}</div>
        )}

        {/* Tier selector */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">1. Chọn gói hạ tầng</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map(t => {
              const active = infraTierSlug === t.slug;
              const total = t.monthlyCost + t.setupCost;
              return (
                <button
                  key={t.id}
                  onClick={() => setInfraTierSlug(t.slug)}
                  className={`rounded-xl p-5 text-left transition-all border-2 ${
                    active
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{t.name}</span>
                    {active && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                        đang chọn
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 mb-1">{t.nameVi}</div>
                  <div className="text-xs text-slate-500">
                    Hàng tháng: <span className="text-white font-medium">{vnd(t.monthlyCost)}</span>
                    {" · "}
                    Setup: <span className="text-white font-medium">{vnd(t.setupCost)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-700/50 text-green-400 font-bold text-sm">
                    Tổng: {vnd(total)}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Feature selector */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-300">2. Tính năng nâng cao (+giá)</h2>
            <p className="text-xs text-slate-500 mt-1">
              Checkbox = thêm vào giá. Hệ thống tự loại bỏ tính năng trùng lặp ở backend.
            </p>
          </div>

          {grouped.map(([cat, feats]) => (
            <div key={cat}>
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">
                {toCategoryLabel(cat)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {feats.map(f => {
                  const checked = selectedIds.includes(f.id);
                  return (
                    <label
                      key={f.id}
                      className={`flex items-center gap-3 rounded-xl p-4 cursor-pointer border-2 transition-all ${
                        checked
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                      }`}
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
                          <div className="text-purple-400 text-[10px]">+⬡{f.xpPoints} XP</div>
                        )}
                        {f.tier === "advanced" && (
                          <div className="text-emerald-400 text-[10px]">tính vào giá</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Quick preview */}
        <section className="rounded-2xl border border-slate-700 bg-slate-800/30 p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-400 mb-1">Tính năng đã chọn</div>
            <div className="font-bold text-white">{selectedIds.length}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Giá features nâng cao</div>
            <div className="font-bold text-green-400 font-mono">{vnd(previewAdvanced)}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Tổng ước tính</div>
            <div className="font-black text-green-400 font-mono text-lg">
              {vnd(previewAdvanced + (selectedTier ? selectedTier.monthlyCost + selectedTier.setupCost : 0))}
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCalculate}
              disabled={loadingCalc}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-6 transition-colors"
            >
              {loadingCalc ? "Đang tính..." : "→ Tính giá chính thức"}
            </button>
          </div>
        </section>

        {/* Official result */}
        {result && (
          <section className="rounded-2xl border-2 border-green-500/30 bg-green-500/5 p-8 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <h2 className="text-xl font-black">Kết quả chính thức</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-sm text-slate-300">
              <div>Giá base: <b className="text-white font-mono ml-1">{vnd(result.basePrice)}</b></div>
              <div>Tính năng: <b className="text-white font-mono">{vnd(result.featureTotal)}</b></div>
              <div>Hạ tầng hàng tháng: <b className="text-white font-mono">{vnd(result.infraCost)}</b></div>
              <div>Setup: <b className="text-white font-mono">{vnd(result.infraSetupCost)}</b></div>
              <div>XP bonus: <b className="text-purple-400 ml-1">⬡{result.totalXp}</b></div>
              <div>Reward Level: <b className="text-yellow-400 ml-1">Lv{result.rewardLevel}</b></div>
            </div>

            <div className="border-t border-green-500/20 pt-4 mt-2">
              <div className="text-sm text-slate-400">Hệ thống: <b className="text-white font-mono ml-1">{vnd(result.systemPrice)}</b></div>
              <div className="text-3xl font-black text-green-400 font-mono pt-2">
                Giá cuối cùng: {vnd(result.finalPrice)}
              </div>
            </div>

            {result.rewards.length > 0 && (
              <div className="border-t border-green-500/20 pt-4 mt-4 text-sm text-green-300 space-y-1">
                <div className="font-semibold text-green-400 mb-2">Quà tặng Level:</div>
                {result.rewards.map(r => (
                  <div key={r.addonServiceId}>
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
