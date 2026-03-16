"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import {
  ArrowLeft,
  Linkedin,
  Twitter,
  Github,
  Mail,
  Phone,
  Quote,
  Award,
  Briefcase,
  Code2,
  Sparkles,
} from "lucide-react";

interface MemberData {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  shortBio: string;
  image: string;
  expertise: string[];
  achievements: string[];
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  roleLevel: number;
  roleCategory: string | null;
  coverImage: string | null;
  quote: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: string | null;
  isFeatured: boolean;
}

interface MemberPageProps {
  member: MemberData;
  otherMembers: MemberData[];
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
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

function SocialBtn({ href, icon: Icon, label }: { href: string; icon: typeof Linkedin; label: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05, y: -2 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 12,
        border: "1px solid rgba(99,102,241,0.2)",
        background: "rgba(99,102,241,0.08)",
        color: "#94A3B8",
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        transition: "all 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(99,102,241,0.2)";
        e.currentTarget.style.color = "#C7D2FE";
        e.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(99,102,241,0.08)";
        e.currentTarget.style.color = "#94A3B8";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Icon size={18} /> {label}
    </motion.a>
  );
}

export function MemberPage({ member, otherMembers }: MemberPageProps) {
  const roleBadgeColors: Record<number, string> = {
    0: "linear-gradient(135deg, #F59E0B, #EF4444)",
    1: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    2: "linear-gradient(135deg, #3B82F6, #06B6D4)",
    3: "linear-gradient(135deg, #10B981, #059669)",
    4: "linear-gradient(135deg, #64748B, #475569)",
  };

  return (
    <div style={{ color: "#fff", minHeight: "100vh" }}>
      {/* ── Cover Image Section ── */}
      <section style={{ position: "relative", height: 360, overflow: "hidden" }}>
        <img
          src={member.coverImage || member.image}
          alt={member.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            filter: "brightness(0.5)",
          }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(2,6,23,0.3) 0%, #020617 100%)",
        }} />

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ position: "absolute", top: 24, left: 24 }}
        >
          <Link
            href="/team"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: "#94A3B8",
              fontSize: 14,
              textDecoration: "none",
              background: "rgba(15,23,42,0.8)",
              backdropFilter: "blur(8px)",
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid rgba(99,102,241,0.2)",
            }}
          >
            <ArrowLeft size={16} /> Đội ngũ
          </Link>
        </motion.div>

        {/* Avatar floating on cover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            position: "absolute",
            bottom: -50,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <div style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "4px solid #020617",
            overflow: "hidden",
            boxShadow: "0 0 40px rgba(99,102,241,0.3)",
          }}>
            <img
              src={member.image}
              alt={member.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </motion.div>
      </section>

      {/* ── Main Info ── */}
      <section style={{ padding: "70px 24px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Role badge */}
            <span style={{
              display: "inline-block",
              padding: "5px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              background: roleBadgeColors[member.roleLevel] || roleBadgeColors[4],
              marginBottom: 12,
            }}>
              {member.role}
            </span>

            <h1 style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              letterSpacing: -2,
              marginBottom: 8,
              background: "linear-gradient(135deg, #fff, #C7D2FE)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {member.name}
            </h1>

            <p style={{ color: "#94A3B8", fontSize: 16, marginBottom: 24 }}>{member.shortBio}</p>

            {/* Social links */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {member.linkedin && <SocialBtn href={member.linkedin} icon={Linkedin} label="LinkedIn" />}
              {member.twitter && <SocialBtn href={member.twitter} icon={Twitter} label="Twitter" />}
              {member.github && <SocialBtn href={member.github} icon={Github} label="GitHub" />}
              {member.email && <SocialBtn href={`mailto:${member.email}`} icon={Mail} label={member.email} />}
              {member.phone && <SocialBtn href={`tel:${member.phone}`} icon={Phone} label={member.phone} />}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Quote Block ── */}
      {member.quote && (
        <section style={{ padding: "0 24px 60px" }}>
          <FadeIn>
            <div style={{
              maxWidth: 700,
              margin: "0 auto",
              padding: "28px 32px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.05))",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: 20,
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
            }}>
              <Quote size={28} color="#6366F1" style={{ flexShrink: 0, marginTop: 4 }} />
              <p style={{
                color: "#E2E8F0",
                fontSize: 18,
                lineHeight: 1.8,
                fontStyle: "italic",
                fontWeight: 500,
              }}>
                {member.quote}
              </p>
            </div>
          </FadeIn>
        </section>
      )}

      {/* ── Bio ── */}
      <section style={{ padding: "0 24px 60px" }}>
        <FadeIn>
          <div style={{
            maxWidth: 800,
            margin: "0 auto",
            background: "#0F172A",
            border: "1px solid #1F2937",
            borderRadius: 20,
            padding: 36,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Briefcase size={20} color="#6366F1" />
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Giới thiệu</h2>
            </div>
            <p style={{ color: "#94A3B8", fontSize: 15, lineHeight: 1.8 }}>{member.bio}</p>

            {member.experience && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28, marginBottom: 12 }}>
                  <Code2 size={20} color="#6366F1" />
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>Kinh nghiệm</h3>
                </div>
                <p style={{ color: "#94A3B8", fontSize: 15, lineHeight: 1.8 }}>{member.experience}</p>
              </>
            )}
          </div>
        </FadeIn>
      </section>

      {/* ── Expertise & Skills ── */}
      <section style={{ padding: "0 24px 60px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Expertise */}
          <FadeIn>
            <div style={{
              background: "#0F172A",
              border: "1px solid #1F2937",
              borderRadius: 20,
              padding: 28,
              height: "100%",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Sparkles size={20} color="#6366F1" />
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Chuyên môn</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {member.expertise.map((skill) => (
                  <div key={skill} style={{
                    padding: "10px 16px",
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    borderRadius: 10,
                    color: "#C7D2FE",
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Skills */}
          <FadeIn delay={0.1}>
            <div style={{
              background: "#0F172A",
              border: "1px solid #1F2937",
              borderRadius: 20,
              padding: 28,
              height: "100%",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Code2 size={20} color="#3B82F6" />
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Kỹ năng</h3>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(member.skills || []).map((skill) => (
                  <span key={skill} style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#94A3B8",
                    background: "rgba(51,65,85,0.4)",
                    border: "1px solid rgba(71,85,105,0.3)",
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Achievements ── */}
      {member.achievements.length > 0 && (
        <section style={{ padding: "0 24px 60px" }}>
          <FadeIn>
            <div style={{
              maxWidth: 800,
              margin: "0 auto",
              background: "#0F172A",
              border: "1px solid #1F2937",
              borderRadius: 20,
              padding: 28,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <Award size={20} color="#F59E0B" />
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Thành tựu</h3>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {member.achievements.map((achievement) => (
                  <div key={achievement} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.15)",
                    borderRadius: 10,
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #F59E0B, #EF4444)",
                      flexShrink: 0,
                    }} />
                    <span style={{ color: "#E2E8F0", fontSize: 14 }}>{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>
      )}

      {/* ── Other Members ── */}
      {otherMembers.length > 0 && (
        <section style={{
          padding: "60px 24px 80px",
          background: "#0B1120",
          borderTop: "1px solid #1F2937",
        }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>
                  Xem thêm{" "}
                  <span style={{
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    thành viên
                  </span>
                </h2>
              </div>
            </FadeIn>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 20,
            }}>
              {otherMembers.map((m, i) => (
                <FadeIn key={m.id} delay={i * 0.1}>
                  <Link href={`/team/${m.slug}`} style={{ textDecoration: "none" }}>
                    <motion.div
                      whileHover={{ y: -4, borderColor: "rgba(99,102,241,0.4)" }}
                      style={{
                        background: "#020617",
                        border: "1px solid #1F2937",
                        borderRadius: 16,
                        padding: 24,
                        textAlign: "center",
                        transition: "all 0.3s",
                      }}
                    >
                      <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        margin: "0 auto 12px",
                        overflow: "hidden",
                        border: "2px solid rgba(99,102,241,0.3)",
                      }}>
                        <img src={m.image} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{m.name}</h3>
                      <p style={{ color: "#6366F1", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{m.role}</p>
                      <p style={{ color: "#94A3B8", fontSize: 13 }}>{m.shortBio}</p>
                    </motion.div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
