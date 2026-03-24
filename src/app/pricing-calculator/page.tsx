"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

type PriceResult = {
  basePrice: number;
  featureTotal: number;
  infraCost: number;
  infraSetupCost: number;
  systemPrice: number;
  finalPrice: number;
  totalXp: number;
  rewardLevel: number;
  rewards: Array<{
    addonServiceId: string;
    addonServiceName: string;
    addonServiceNameVi: string;
    rewardLevel: number;
    quantity: number;
    durationMonths: number | null;
    description: string | null;
  }>;
  validatedFeatureIds: string[];
  infraTier?: {
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const [infraTierSlug, setInfraTierSlug] = useState<string>("");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);

  const [result, setResult] = useState<PriceResult | null>(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [error, setError] = useState<string>("");

  // ── Initialize from URL ─────────────────────────────────────────────────────
  useEffect(() => {
    const slug = searchParams.get("tier") ?? "";
    const featuresParam = searchParams.get("features") ?? "";
    const featureIds = featuresParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setInfraTierSlug(slug);
    setSelectedFeatureIds(featureIds);
  }, [searchParams]);

  // ── Load tiers + feature catalog ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingInit(true);
      try {
        const [tiersRes, featRes] = await Promise.all([
          fetch("/api/pricing/infrastructure-tiers"),
          fetch("/api/pricing/features"),
        ]);

        const tiersJson = await tiersRes.json();
        const featJson = await featRes.json();

        const fetchedTiers: Tier[] = tiersJson.data ?? [];
        const fetchedFeatures: Feature[] = featJson.data ?? [];

        setTiers(fetchedTiers);
        setFeatures(fetchedFeatures);

        // Default tier if none in URL
        if (!infraTierSlug && fetchedTiers.length > 0) {
          setInfraTierSlug(fetchedTiers[0].slug);
        }
      } catch {
        setError("Không tải được dữ liệu calculator.");
      } finally {
        setLoadingInit(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync state → URL (shareable quote link) ────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (infraTierSlug) params.set("tier", infraTierSlug);
    if (selectedFeatureIds.length > 0) params.set("features", selectedFeatureIds.join(","));

    const query = params.toString();
    router.replace(`/pricing-calculator${query ? `?${query}` : ""}`);
  }, [infraTierSlug, selectedFeatureIds, router]);

  // ── Group features by category ──────────────────────────────────────────────
  const groupedFeatures = useMemo(() => {
    const map = new Map<string, Feature[]>();
    for (const f of features) {
      const key = f.category || "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return Array.from(map.entries());
  }, [features]);

  // ── Tier comparison table data ──────────────────────────────────────────────
  const tierComparison = useMemo(() => {
    return [...tiers].sort((a, b) => a.monthlyCost + a.setupCost - (b.monthlyCost + b.setupCost));
  }, [tiers]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function toggleFeature(id: string) {
    setSelectedFeatureIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCalculate() {
    setLoadingCalc(true);
    setError("");
    try {
      const res = await fetch("/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFeatureIds, infraTierSlug }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Tính giá thất bại");
        setResult(null);
      } else {
        setResult(json.data);
      }
    } catch {
      setError("Lỗi mạng khi gọi API.");
      setResult(null);
    } finally {
      setLoadingCalc(false);
    }
  }

  // ── Quick computed preview (before API click) ───────────────────────────────
  const selectedFeatureObjects = useMemo(
    () => features.filter((f) => selectedFeatureIds.includes(f.id)),
    [features, selectedFeatureIds]
  );
  const previewFeatureTotal = selectedFeatureObjects
    .filter((f) => f.tier === "advanced")
    .reduce((s, f) => s + f.price, 0);
  const previewXp = selectedFeatureObjects
    .filter((f) => f.tier === "advanced")
    .reduce((s, f) => s + f.xpPoints, 0);

  const selectedTier = tiers.find((t) => t.slug === infraTierSlug);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-bold">Công cụ tính giá (M13 v2)</h1>
      <p className="mt-2 text-slate-400">
        Công thức: <b>Base Price + Tổng Features + Infrastructure Tier Cost</b>
      </p>

      {error && <p className="mt-4 text-red-400">{error}</p>}

      {/* Tier comparison */}
      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold">1) So sánh gói hạ tầng</h2>
        {loadingInit ? (
          <p className="mt-3 text-slate-400">Đang tải...</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {tierComparison.map((t) => {
              const active = infraTierSlug === t.slug;
              const total = t.monthlyCost + t.setupCost;
              return (
                <button
                  key={t.id}
                  onClick={() => setInfraTierSlug(t.slug)}
                  className={`rounded-lg border p-4 text-left transition ${
                    active
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{t.name}</div>
                    {active && (
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">{t.nameVi}</div>
                  <div className="mt-2 text-sm">Tháng: <b>{vnd(t.monthlyCost)}</b></div>
                  <div className="text-sm">Setup: <b>{vnd(t.setupCost)}</b></div>
                  <div className="mt-1 text-xs text-slate-500">Tổng cộng: {vnd(total)}</div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Feature catalog (checkbox) */}
      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold">2) Chọn tính năng (checkbox)</h2>
        <p className="mt-1 text-sm text-slate-400">
          Hệ thống sẽ tự xử lý mutual exclusion cha-con ở backend.
        </p>

        <div className="mt-4 space-y-4">
          {groupedFeatures.map(([cat, list]) => (
            <div key={cat} className="rounded-lg border border-slate-800 p-3">
              <div className="text-sm font-semibold text-indigo-300 mb-2">
                {toCategoryLabel(cat)}
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {list.map((f) => {
                  const checked = selectedFeatureIds.includes(f.id);
                  const isAdvanced = f.tier === "advanced";
                  return (
                    <label
                      key={f.id}
                      className={`flex items-start gap-2 rounded border p-2 cursor-pointer transition ${
                        checked ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleFeature(f.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{f.name}</div>
                        <div className="text-xs text-slate-400 truncate">{f.nameVi}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Tier: {f.tier} • Giá: {vnd(f.price)} • XP: {f.xpPoints}
                          {f.parentId ? " • Có parent" : ""}
                        </div>
                        {isAdvanced && (
                          <div className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            Tính vào giá
                          </div>
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

      {/* Quick preview */}
      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold">3) Preview nhanh (trước khi tính chính thức)</h2>
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
          <div>Số feature đã chọn: <b>{selectedFeatureIds.length}</b></div>
          <div>Tổng feature advanced: <b>{vnd(previewFeatureTotal)}</b></div>
          <div>XP từ feature advanced: <b>{previewXp}</b></div>
          <div>
            Gói hạ tầng: <b>{selectedTier ? `${selectedTier.name} (${vnd(selectedTier.monthlyCost + selectedTier.setupCost)})` : "Chưa chọn"}</b>
          </div>
        </div>
      </section>

      {/* Action */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleCalculate}
          disabled={loadingCalc || loadingInit}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          {loadingCalc ? "Đang tính..." : "Tính giá chính thức"}
        </button>

        <span className="text-xs text-slate-500">
          Link hiện tại có thể share: lưu tier + features trên query params.
        </span>
      </div>

      {/* Final result */}
      {result && (
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-lg font-semibold">4) Kết quả chính thức</h2>

          <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            <div>Giá base: <b>{vnd(result.basePrice)}</b></div>
            <div>Tổng tính năng: <b>{vnd(result.featureTotal)}</b></div>
            <div>Hạ tầng hàng tháng: <b>{vnd(result.infraCost)}</b></div>
            <div>Hạ tầng setup: <b>{vnd(result.infraSetupCost)}</b></div>

            <div className="md:col-span-2 mt-2 border-t border-slate-700 pt-2">
              Giá hệ thống: <b>{vnd(result.systemPrice)}</b>
            </div>
            <div className="md:col-span-2 text-lg">
              Giá cuối cùng: <b className="text-emerald-400">{vnd(result.finalPrice)}</b>
            </div>
            <div>Tổng XP: <b>{result.totalXp}</b></div>
            <div>Reward Level: <b>{result.rewardLevel}</b></div>
          </div>

          {result.rewards.length > 0 && (
            <div className="mt-5">
              <h3 className="font-medium">Rewards theo level</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-300">
                {result.rewards.map((r) => (
                  <li key={`${r.addonServiceId}-${r.rewardLevel}`}>
                    Lv{r.rewardLevel}: {r.addonServiceName} ×{r.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
