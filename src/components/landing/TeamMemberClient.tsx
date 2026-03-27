"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { ArrowLeft, Crown, Zap } from "lucide-react";

type MemberRecord = Record<string, unknown>;
type RelatedRecord = Record<string, unknown>;

const RANK_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  Diamond: { label: "DIAMOND", color: "#60A5FA", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.35)", glow: "0 0 24px rgba(96,165,250,0.25)" },
  Gold:    { label: "GOLD",    color: "#FBBF24", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.35)", glow: "0 0 24px rgba(251,191,36,0.2)" },
  Silver:  { label: "SILVER",  color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.3)", glow: "none" },
  Bronze:  { label: "BRONZE",  color: "#CD7F32", bg: "rgba(205,127,50,0.1)", border: "rgba(205,127,50,0.3)", glow: "none" },
};

export function TeamMemberClient({
  locale,
  member,
  expertises,
  related,
  tLabel,
  tRelated,
  tBack,
  tChallenge,
  tSolution,
  tResult,
}: {
  locale: string;
  member: MemberRecord;
  expertises: string[];
  related: RelatedRecord[];
  tLabel: string;
  tRelated: string;
  tBack: string;
  tChallenge: string;
  tSolution: string;
  tResult: string;
}) {
  const name = (member.name as string) ?? "Unknown";
  const role = (member.role as string) ?? "";
  const bio = (member.bio as string) ?? "";
  const shortBio = (member.shortBio as string) ?? "";
  const image = (member.image as string) ?? "";
  const rank = (member.rank as string) ?? "";
  const level = (member.level as number | undefined);
  const lpBalance = (member.lpBalance as number | undefined);
  const challenge = (member.challenge as string | undefined) ?? "";
  const solution = (member.solution as string | undefined) ?? "";
  const result = (member.result as string | undefined) ?? "";

  const rStyle = RANK_CONFIG[rank] ?? { label: "", color: DS.text3, bg: "transparent", border: DS.border, glow: "none" };

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, rgba(20,184,166,0.04) 0%, transparent 60%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 13, color: DS.text4 }}>
            <Link href={`/${locale}/team`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>
              {tLabel}
            </Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: DS.text2 }}>{name}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 40, alignItems: "start" }}>
            {/* Avatar + rank */}
            <div style={{ position: "relative" }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ width: 280, height: 280, borderRadius: 20, overflow: "hidden", background: "#111827", border: `1px solid ${rStyle.border}`, boxShadow: rStyle.glow }}
              >
                {image ? (
                  <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: "5rem", fontWeight: 900 }}>
                    {name.charAt(0)}
                  </div>
                )}
              </motion.div>
              {rStyle.label && (
                <div style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", background: rStyle.bg, border: `1px solid ${rStyle.border}`, borderRadius: 9999, padding: "5px 16px", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  {rank === "Diamond" ? <Crown size={13} style={{ color: rStyle.color }} /> : <Zap size={13} style={{ color: rStyle.color }} />}
                  <span style={{ color: rStyle.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 800, letterSpacing: "0.12em" }}>
                    {rStyle.label}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ paddingTop: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                <span style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: DS.blue, padding: "4px 12px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                  {tLabel}
                </span>
                {level !== undefined && (
                  <span style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: DS.amber, padding: "4px 12px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                    LEVEL {level}
                  </span>
                )}
                {lpBalance !== undefined && (
                  <span style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)", color: DS.cyan, padding: "4px 12px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                    {lpBalance.toLocaleString()} LP
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: DS.heading, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: DS.text, marginBottom: 6, letterSpacing: "0.04em" }}>
                {name}
              </h1>
              <p style={{ fontSize: 18, color: DS.blue, fontWeight: 600, marginBottom: 20, fontFamily: DS.mono }}>
                {role}
              </p>

              {/* Bio */}
              {(bio || shortBio) && (
                <div style={{ color: DS.text3, lineHeight: 1.8, fontSize: 15, maxWidth: 580 }}>
                  {bio ? bio.split("\n").map((p, i) => p.trim() ? <p key={i} style={{ marginBottom: 12 }}>{p}</p> : null) : shortBio}
                </div>
              )}

              {/* Expertise tags */}
              {expertises.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
                  {expertises.map((exp, i) => (
                    <span key={i} style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)", color: DS.purple, padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontFamily: DS.mono }}>
                      {exp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Challenge / Solution / Result */}
      {(challenge || solution || result) && (
        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {challenge && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ background: DS.bgCard, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 16, padding: 24 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 16, background: "#EF4444", borderRadius: 2 }} />
                    <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.18em" }}>{tChallenge.toUpperCase()}</span>
                  </div>
                  <p style={{ color: DS.text2, fontSize: 14, lineHeight: 1.7 }}>{challenge}</p>
                </motion.div>
              )}
              {solution && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{ background: DS.bgCard, border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 16, padding: 24 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 16, background: DS.blue, borderRadius: 2 }} />
                    <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.18em" }}>{tSolution.toUpperCase()}</span>
                  </div>
                  <p style={{ color: DS.text2, fontSize: 14, lineHeight: 1.7 }}>{solution}</p>
                </motion.div>
              )}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ background: DS.bgCard, border: `1px solid rgba(20,184,166,0.2)`, borderRadius: 16, padding: 24 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 16, background: DS.cyan, borderRadius: 2 }} />
                    <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.18em" }}>{tResult.toUpperCase()}</span>
                  </div>
                  <p style={{ color: DS.text2, fontSize: 14, lineHeight: 1.7 }}>{result}</p>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Related Members */}
      {related.length > 0 && (
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 4, height: 20, background: GRD.primary, borderRadius: 2 }} />
              <span style={{ color: DS.text2, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.18em" }}>{tRelated.toUpperCase()}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {related.map((rel) => (
                <Link key={rel.id as string} href={`/${locale}/team/${rel.slug}`} style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 14, overflow: "hidden" }}
                  >
                    <div style={{ height: 160, background: "#111827", overflow: "hidden" }}>
                      {(rel.image as string) ? (
                        <img src={rel.image as string} alt={rel.name as string} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: "2.5rem", fontWeight: 700 }}>
                          {(rel.name as string).charAt(0)}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ color: DS.text, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{rel.name as string}</p>
                      <p style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>{rel.role as string}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back CTA */}
      <div className="px-6 pb-16 text-center">
        <Link
          href={`/${locale}/team`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 24px", borderRadius: 12,
            background: GRD.primary, color: "#fff",
            textDecoration: "none", fontWeight: 700, fontSize: 14,
          }}
        >
          <ArrowLeft size={16} />
          {tBack}
        </Link>
      </div>
    </main>
  );
}
