"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ReferralInfo {
  code: string;
  name: string;
  campaign: string | null;
  memberName: string | null;
  memberImage: string | null;
  totalReferred: number;
  lpRate: number;
  tier: number;
}

interface TierInfo {
  label: string;
  lpPercent: number;
  color: string;
}

function getTierInfo(tier: number): TierInfo {
  const tiers: Record<number, TierInfo> = {
    1: { label: "Bronze Partner", lpPercent: 5, color: "#CD7F32" },
    2: { label: "Silver Partner", lpPercent: 7, color: "#CBD5E1" },
    3: { label: "Gold Partner", lpPercent: 10, color: "#FFD700" },
  };
  return tiers[tier] ?? tiers[1];
}

export default function ReferralLandingPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string ?? "").toUpperCase();

  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    // Track click
    fetch(`/api/ref/${encodeURIComponent(code)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "lead" }),
    }).catch(() => {/* silent — don't block UI */});

    // Fetch referral info
    fetch(`/api/ref/${encodeURIComponent(code)}/info`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); }
        else { setInfo(d.data); }
      })
      .catch(() => setError("Không thể tải thông tin giới thiệu"))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#090b14" }}>
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent mx-auto mb-4"
            style={{ borderColor: "rgba(139,92,246,0.5)", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }}
          />
          <p style={{ color: "#64748B", fontFamily: "JetBrains Mono, monospace", fontSize: 12, letterSpacing: "0.1em" }}>
            LOADING...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#090b14" }}>
        <div className="text-center p-8 rounded-2xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
          <h1 className="text-xl font-bold text-white mb-2">Link giới thiệu không hợp lệ</h1>
          <p style={{ color: "#64748B", marginBottom: 24 }}>{error ?? "Mã giới thiệu không tồn tại hoặc đã hết hạn."}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 rounded-lg text-white font-semibold text-sm"
            style={{ background: "rgba(139,92,246,0.3)", border: "1px solid rgba(139,92,246,0.4)" }}
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const tier = getTierInfo(info.tier);
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://loop.vn";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #090b14 0%, #0f172a 50%, #090b14 100%)" }}>
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.15), transparent)",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 pt-16 pb-24">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: `${tier.color}15`,
              border: `1px solid ${tier.color}40`,
              color: tier.color,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.12em",
            }}
          >
            <span style={{ opacity: 0.7 }}>✦</span>
            {tier.label.toUpperCase()}
            <span style={{ opacity: 0.7 }}>✦</span>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 overflow-hidden" style={{ border: `2px solid ${tier.color}40`, boxShadow: `0 0 30px ${tier.color}30` }}>
            {info.memberImage ? (
              <img src={info.memberImage} alt={info.memberName ?? ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)", fontSize: 28 }}>
                ★
              </div>
            )}
          </div>

          <h1
            className="text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "Cinzel, serif", letterSpacing: "0.03em" }}
          >
            {info.memberName
              ? `${info.memberName} muốn giới thiệu bạn đến LOOP`
              : "Bạn được mời đến LOOP Solutions"}
          </h1>

          <p className="text-base" style={{ color: "#64748B", lineHeight: 1.7 }}>
            Đăng ký dịch vụ qua link giới thiệu này và nhận ngay{" "}
            <span className="font-bold" style={{ color: tier.color }}>{tier.lpPercent}% LP</span>{" "}
            giá trị đơn hàng — có thể đổi thành ưu đãi cho lần tiếp theo.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: "Người giới thiệu", value: info.totalReferred.toString(), unit: "khách" },
            { label: "LP nhận được", value: `${tier.lpPercent}%`, unit: "đơn hàng" },
            { label: "Hạng", value: tier.label, unit: "hiện tại" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="text-lg font-bold text-white mb-0.5" style={{ fontFamily: "Cinzel, serif" }}>
                {stat.value}
              </div>
              <div style={{ color: "#475569", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em" }}>
                {stat.unit.toUpperCase()}
              </div>
              <div style={{ color: "#64748B", fontSize: 11 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mb-10">
          <h2 className="text-center text-xs font-bold mb-4" style={{ color: "#475569", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.15em" }}>
            ── CÁCH THỨC HOẠT ĐỘNG ──
          </h2>
          <div className="space-y-3">
            {[
              { n: "01", title: "Đăng ký dịch vụ", desc: "Chọn dịch vụ phù hợp: Web, Hosting, SEO, hoặc Marketing" },
              { n: "02", title: "Thanh toán", desc: "Thanh toán đơn hàng thành công" },
              { n: "03", title: "Nhận LP", desc: `Bạn nhận ${tier.lpPercent}% giá trị đơn hàng bằng LP` },
              { n: "04", title: "Đổi ưu đãi", desc: "Dùng LP để giảm giá hoặc nhận dịch vụ miễn phí" },
            ].map((step) => (
              <div
                key={step.n}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background: `${tier.color}15`,
                    border: `1px solid ${tier.color}30`,
                    color: tier.color,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {step.n}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm mb-0.5">{step.title}</div>
                  <div style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href={`/?ref=${code}`}
            className="block w-full py-4 rounded-xl text-center font-bold text-white text-base transition-all"
            style={{
              background: `linear-gradient(135deg, ${tier.color}30, ${tier.color}15)`,
              border: `1.5px solid ${tier.color}50`,
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.05em",
              boxShadow: `0 0 30px ${tier.color}20`,
            }}
          >
            KHÁM PHÁ DỊCH VỤ →
          </Link>

          <Link
            href="/contact"
            className="block w-full py-3 rounded-xl text-center font-medium text-sm"
            style={{ color: "#64748B", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            Liên hệ tư vấn miễn phí
          </Link>
        </div>

        {/* Referral code chip */}
        <div className="mt-8 text-center">
          <p style={{ color: "#475569", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", marginBottom: 8 }}>
            MÃ GIỚI THIỆU CỦA BẠN
          </p>
          <div
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl"
            style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}
          >
            <span
              className="text-xl font-bold tracking-widest"
              style={{ color: "#a78bfa", fontFamily: "JetBrains Mono, monospace" }}
            >
              {code}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(`${siteUrl}/ref/${code}`)}
              className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}
            >
              Copy
            </button>
          </div>
          <p style={{ color: "#334155", fontSize: 11, marginTop: 8 }}>
            Chia sẻ link này để nhận {tier.lpPercent}% LP khi người khác đăng ký
          </p>
        </div>
      </div>
    </div>
  );
}
