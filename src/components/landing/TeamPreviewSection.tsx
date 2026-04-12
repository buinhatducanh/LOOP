"use client";

/**
 * TeamPreviewSection — Featured team members preview for landing page
 * Fetches from /api/v1/team, shows top 4 members by level
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Zap } from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";

type TeamMemberRecord = {
 id: string;
 name: string;
 slug?: string;
 role?: string | null;
 shortBio?: string | null;
 bio?: string | null;
 image?: string | null;
 avatar?: string | null;
 isFeatured?: boolean;
 expertise?: Array<{ name: string }>;
 level?: number;
 rank?: string;
};

const RANK_COLORS: Record<string, string> = {
 iron: "#9CA3AF",
 bronze: "#CD7F32",
 silver: "#CBD5E1",
 gold: "#FFD700",
 platinum: "#14B8A6",
 ruby: "#EF4444",
 diamond: "#818CF8",
};

const RANK_SYMBOLS: Record<string, string> = {
 iron: "⬡",
 bronze: "◈",
 silver: "◇",
 gold: "★",
 platinum: "❋",
 ruby: "♦",
 diamond: "✦",
};

const FALLBACK_MEMBERS: TeamMemberRecord[] = [
 {
 id: "1",
 name: "Akira Tanaka",
 role: "CEO & Founder",
 isFeatured: true,
 level: 120,
 rank: "diamond",
 image: null,
 expertise: [{ name: "Strategy" }, { name: "Leadership" }],
 },
 {
 id: "2",
 name: "Minh Đặng",
 role: "Lead Developer",
 isFeatured: true,
 level: 85,
 rank: "ruby",
 image: null,
 expertise: [{ name: "React" }, { name: "Node.js" }],
 },
 {
 id: "3",
 name: "Huy Phạm",
 role: "Creative Director",
 isFeatured: true,
 level: 78,
 rank: "platinum",
 image: null,
 expertise: [{ name: "UI/UX" }, { name: "Figma" }],
 },
 {
 id: "4",
 name: "Linh Nguyễn",
 role: "Marketing Lead",
 isFeatured: true,
 level: 62,
 rank: "gold",
 image: null,
 expertise: [{ name: "SEO" }, { name: "Content" }],
 },
];

function MemberCard({ member, locale }: { member: TeamMemberRecord; locale: string }) {
 const rank = (member.rank ?? "iron").toLowerCase();
 const rankColor = RANK_COLORS[rank] ?? RANK_COLORS.iron;
 const rankSymbol = RANK_SYMBOLS[rank] ?? RANK_SYMBOLS.iron;
 const imgUrl = member.avatar ?? member.image ?? "";
 const memberSlug = member.slug ?? member.id;
 const href = `/${locale}/member/${memberSlug}`;

 return (
 <Link href={href} style={{ textDecoration: "none" }}>
 <motion.div
 whileHover={{ y: -6, scale: 1.02 }}
 transition={{ duration: 0.25 }}
 style={{
 borderRadius: "1rem",
 padding: "1.5rem",
 background: "rgba(15,23,42,0.7)",
 border: `1px solid rgba(255,255,255,0.06)`,
 backdropFilter: "blur(12px)",
 cursor: "pointer",
 textAlign: "center",
 position: "relative",
 overflow: "hidden",
 }}
 onMouseEnter={(e) => {
 const el = e.currentTarget as HTMLDivElement;
 el.style.borderColor = `${rankColor}40`;
 el.style.boxShadow = `0 8px 40px ${rankColor}10`;
 }}
 onMouseLeave={(e) => {
 const el = e.currentTarget as HTMLDivElement;
 el.style.borderColor = "rgba(255,255,255,0.06)";
 el.style.boxShadow = "none";
 }}
 >
 {/* Rank badge */}
 <div
 style={{
 position: "absolute",
 top: "0.75rem",
 right: "0.75rem",
 width: 28,
 height: 28,
 borderRadius: "50%",
 background: `${rankColor}18`,
 border: `1px solid ${rankColor}35`,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 fontSize: "0.875rem",
 color: rankColor,
 textShadow: `0 0 8px ${rankColor}60`,
 }}
 >
 {rankSymbol}
 </div>

 {/* Avatar */}
 <div
 style={{
 width: 80,
 height: 80,
 borderRadius: "50%",
 margin: "0 auto 1rem",
 overflow: "hidden",
 border: `2px solid ${rankColor}40`,
 boxShadow: `0 0 20px ${rankColor}20`,
 background: `${rankColor}15`,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 }}
 >
 {imgUrl ? (
 <img
 src={imgUrl}
 alt={member.name}
 style={{ width: "100%", height: "100%", objectFit: "cover" }}
 />
 ) : (
 <span
 style={{
 fontFamily: DS.heading,
 fontSize: "1.75rem",
 fontWeight: 900,
 color: rankColor,
 }}
 >
 {member.name.charAt(0)}
 </span>
 )}
 </div>

 {/* Name */}
 <div
 style={{
 fontFamily: DS.heading,
 fontSize: "0.9375rem",
 fontWeight: 900,
 color: DS.text,
 marginBottom: "0.25rem",
 letterSpacing: "0.03em",
 }}
 >
 {member.name}
 </div>

 {/* Role */}
 <div
 style={{
 color: DS.pink,
 fontSize: "0.6875rem",
 fontFamily: DS.mono,
 letterSpacing: "0.08em",
 fontWeight: 700,
 marginBottom: "0.625rem",
 }}
 >
 {member.role}
 </div>

 {/* Level */}
 {member.level && (
 <div
 style={{
 color: rankColor,
 fontSize: "0.6875rem",
 fontFamily: DS.mono,
 marginBottom: "0.5rem",
 opacity: 0.8,
 }}
 >
 LVL {member.level}
 </div>
 )}

 {/* Expertise tags */}
 {member.expertise && member.expertise.length > 0 && (
 <div style={{ display: "flex", gap: "0.375rem", justifyContent: "center", flexWrap: "wrap" }}>
 {member.expertise.slice(0, 2).map((ex) => (
 <span
 key={ex.name}
 style={{
 padding: "0.1875rem 0.5rem",
 borderRadius: 4,
 background: `${rankColor}10`,
 border: `1px solid ${rankColor}25`,
 color: DS.text3,
 fontSize: "0.625rem",
 fontFamily: DS.mono,
 }}
 >
 {ex.name}
 </span>
 ))}
 </div>
 )}
 </motion.div>
 </Link>
 );
}

export function TeamPreviewSection({ locale }: { locale: string }) {
 const t = useTranslations("home");
 const [members, setMembers] = useState<TeamMemberRecord[]>(FALLBACK_MEMBERS);

 useEffect(() => {
 async function fetchTeam() {
 try {
 const baseUrl = typeof window !== "undefined"
 ? window.location.origin
 : process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";
 const res = await fetch(`${baseUrl}/api/v1/team?lang=${locale}&limit=20`, {
 next: { revalidate: 120 },
 });
 if (res.ok) {
 const json = await res.json();
 const data: TeamMemberRecord[] = Array.isArray(json.data) ? json.data : [];
 if (data.length > 0) {
 // Sort: featured first, then by name (exclude CEO/admin from preview)
 const filtered = data.filter(
 (m) => m.role && !["CEO", "ceo", "super_admin"].includes(m.role)
 );
 const sorted = filtered.sort((a, b) => {
 if (a.isFeatured && !b.isFeatured) return -1;
 if (!a.isFeatured && b.isFeatured) return 1;
 return 0;
 });
 setMembers(sorted.slice(0, 4));
 }
 }
 } catch { /* use fallback */ }
 }
 fetchTeam();
 }, [locale]);

 return (
 <section
 style={{
 padding: "5rem 1.5rem",
 background: "linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(15,23,42,0.4) 50%, rgba(2,6,23,0) 100%)",
 borderTop: `1px solid ${DS.border}`,
 borderBottom: `1px solid ${DS.border}`,
 }}
 >
 <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
 {/* Header */}
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.5 }}
 style={{ textAlign: "center", marginBottom: "3rem" }}
 >
 <div
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 marginBottom: "1rem",
 padding: "0.375rem 1rem",
 borderRadius: "9999px",
 background: `${DS.cosmicPurple}12`,
 border: `1px solid ${DS.cosmicPurple}30`,
 }}
 >
 <div
 style={{
 width: 6, height: 6, borderRadius: "50%",
 background: DS.cosmicPurple, boxShadow: `0 0 6px ${DS.cosmicPurple}`,
 }}
 />
 <span
 style={{
 color: DS.cosmicPurple,
 fontSize: "0.625rem",
 fontFamily: DS.mono,
 letterSpacing: "0.22em",
 }}
 >
 {t("teamPreviewBadge")}
 </span>
 </div>
 <h2
 style={{
 fontFamily: DS.heading,
 fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
 fontWeight: 900,
 letterSpacing: "0.04em",
 background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.cosmicPurple} 100%)`,
 WebkitBackgroundClip: "text",
 WebkitTextFillColor: "transparent",
 backgroundClip: "text",
 marginBottom: "0.875rem",
 }}
 >
 {t("teamPreviewTitle")}
 </h2>
 <p style={{ color: DS.text3, fontSize: "0.9375rem", lineHeight: 1.7 }}>
 {t("teamPreviewDesc")}
 </p>
 </motion.div>

 {/* Members grid */}
 <div
 style={{
 display: "grid",
 gridTemplateColumns: "repeat(4, 1fr)",
 gap: "1.25rem",
 }}
 className="team-preview-grid"
 >
 {members.map((member, i) => (
 <motion.div
 key={member.id}
 initial={{ opacity: 0, y: 24 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ delay: i * 0.1, duration: 0.5 }}
 >
 <MemberCard member={member} locale={locale} />
 </motion.div>
 ))}
 </div>

 {/* CTA */}
 <motion.div
 initial={{ opacity: 0 }}
 whileInView={{ opacity: 1 }}
 viewport={{ once: true }}
 transition={{ delay: 0.4 }}
 style={{ textAlign: "center", marginTop: "2.5rem" }}
 >
 <Link
 href={`/${locale}/team`}
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: "0.5rem",
 background: GRD.primary,
 color: "#fff",
 fontSize: "0.9375rem",
 fontWeight: 700,
 padding: "0.875rem 2rem",
 borderRadius: "0.875rem",
 textDecoration: "none",
 boxShadow: "0 0 30px rgba(107,61,245,0.4)",
 transition: "all 0.2s ease",
 }}
 onMouseEnter={(e) => {
 const el = e.currentTarget as HTMLElement;
 el.style.opacity = "0.9";
 el.style.transform = "translateY(-1px)";
 }}
 onMouseLeave={(e) => {
 const el = e.currentTarget as HTMLElement;
 el.style.opacity = "1";
 el.style.transform = "translateY(0)";
 }}
 >
 {t("teamPreviewCta")} <ArrowRight size={16} />
 </Link>
 </motion.div>
 </div>

 <style>{`
 @media (max-width: 768px) {
 .team-preview-grid { grid-template-columns: repeat(2, 1fr) !important; }
 }
 `}</style>
 </section>
 );
}
