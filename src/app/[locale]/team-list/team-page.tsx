"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import {
  ArrowRight,
  Linkedin,
  Twitter,
  Github,
  Mail,
  Quote,
  Sparkles,
  Users,
  Crown,
  Star,
} from "lucide-react";

interface TeamMemberData {
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

interface TeamPageProps {
  team: TeamMemberData[];
  settings?: {
    title?: string;
    subtitle?: string;
  };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SocialLink({ href, icon: Icon }: { href: string; icon: typeof Linkedin }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        border: "1px solid rgba(99,102,241,0.3)",
        background: "rgba(99,102,241,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94A3B8",
        transition: "all 0.3s",
        textDecoration: "none",
      }}
    >
      <Icon size={18} />
    </a>
  );
}

/* ── CEO / Founder Card ── */
function LeaderCard({ member }: { member: TeamMemberData }) {
  return (
    <FadeIn>
      <Link href={`/team-member/${member.slug}`} style={{ textDecoration: "none" }}>
        <motion.div
          whileHover={{ y: -4 }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 24,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Glow effect */}
          <div style={{
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            bottom: -1,
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(236,72,153,0.2), rgba(99,102,241,0.1))",
            zIndex: 0,
            opacity: 0.5,
            filter: "blur(1px)",
          }} />
          <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {/* Image side */}
            <div style={{ position: "relative", minHeight: 400 }}>
              <img
                src={member.coverImage || member.image}
                alt={member.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                }}
              />
              <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, transparent 60%, #0F172A)",
              }} />
              {/* Badge */}
              <div style={{
                position: "absolute",
                top: 20,
                left: 20,
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "linear-gradient(135deg, #F59E0B, #EF4444)",
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                boxShadow: "0 4px 15px rgba(245,158,11,0.4)",
              }}>
                <Crown size={14} /> {member.role}
              </div>
            </div>

            {/* Info side */}
            <div style={{ padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <motion.h3
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: -1,
                  background: "linear-gradient(135deg, #FFFFFF, #C7D2FE)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 8,
                }}
              >
                {member.name}
              </motion.h3>
              <p style={{ color: "#818CF8", fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
                {member.shortBio}
              </p>

              {member.quote && (
                <div style={{
                  display: "flex",
                  gap: 12,
                  padding: "16px 20px",
                  background: "rgba(99,102,241,0.08)",
                  borderLeft: "3px solid #6366F1",
                  borderRadius: "0 12px 12px 0",
                  marginBottom: 20,
                }}>
                  <Quote size={18} color="#6366F1" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.7, fontStyle: "italic" }}>
                    {member.quote}
                  </p>
                </div>
              )}

              <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                {member.bio}
              </p>

              {/* Expertise tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {member.expertise.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#C7D2FE",
                      background: "rgba(99,102,241,0.15)",
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Social */}
              <div style={{ display: "flex", gap: 10 }}>
                {member.linkedin && <SocialLink href={member.linkedin} icon={Linkedin} />}
                {member.twitter && <SocialLink href={member.twitter} icon={Twitter} />}
                {member.github && <SocialLink href={member.github} icon={Github} />}
                {member.email && <SocialLink href={`mailto:${member.email}`} icon={Mail} />}
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </FadeIn>
  );
}

/* ── CTO / VP Card ── */
function VPCard({ member, index }: { member: TeamMemberData; index: number }) {
  return (
    <FadeIn delay={index * 0.15}>
      <Link href={`/team-member/${member.slug}`} style={{ textDecoration: "none" }}>
        <motion.div
          whileHover={{ y: -6, borderColor: "rgba(99,102,241,0.5)" }}
          style={{
            background: "linear-gradient(180deg, #0F172A, #1E1B4B 120%)",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: 20,
            overflow: "hidden",
            transition: "border-color 0.3s",
            height: "100%",
          }}
        >
          <div style={{ position: "relative", height: 200 }}>
            <img
              src={member.coverImage || member.image}
              alt={member.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 40%, #0F172A)",
            }} />
            <div style={{
              position: "absolute",
              bottom: -30,
              left: 24,
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "3px solid #1E1B4B",
              overflow: "hidden",
            }}>
              <img src={member.image} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>

          <div style={{ padding: "28px 24px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>{member.name}</h3>
              {member.isFeatured && <Star size={16} style={{ color: "#F59E0B", fill: "#F59E0B" }} />}
            </div>
            <p style={{ color: "#818CF8", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{member.role}</p>
            <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>{member.shortBio}</p>

            {member.quote && (
              <p style={{
                color: "#CBD5E1",
                fontSize: 13,
                fontStyle: "italic",
                lineHeight: 1.6,
                marginBottom: 16,
                paddingLeft: 12,
                borderLeft: "2px solid rgba(99,102,241,0.3)",
              }}>
                &ldquo;{member.quote}&rdquo;
              </p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {member.expertise.slice(0, 4).map((skill) => (
                <span key={skill} style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#94A3B8",
                  background: "rgba(51,65,85,0.5)",
                  border: "1px solid rgba(71,85,105,0.3)",
                }}>
                  {skill}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {member.linkedin && <SocialLink href={member.linkedin} icon={Linkedin} />}
              {member.twitter && <SocialLink href={member.twitter} icon={Twitter} />}
              {member.github && <SocialLink href={member.github} icon={Github} />}
            </div>
          </div>
        </motion.div>
      </Link>
    </FadeIn>
  );
}

/* ── Lead / Manager Card (Portfolio Style) ── */
function LeadCard({ member, index }: { member: TeamMemberData; index: number }) {
  return (
    <FadeIn delay={index * 0.1}>
      <Link href={`/team-member/${member.slug}`} style={{ textDecoration: "none" }}>
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          style={{
            background: "#0F172A",
            border: "1px solid #1F2937",
            borderRadius: 20,
            overflow: "hidden",
            transition: "all 0.3s",
            height: "100%",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3), 0 0 60px rgba(59,130,246,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#1F2937";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Large Image */}
          <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
            <img
              src={member.coverImage || member.image}
              alt={member.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, #0F172A 0%, transparent 60%)",
            }} />
            {/* Role Badge */}
            <div style={{
              position: "absolute",
              top: 16,
              left: 16,
              padding: "5px 12px",
              borderRadius: 16,
              fontSize: 11,
              fontWeight: 600,
              background: "rgba(59,130,246,0.8)",
              color: "#fff",
            }}>
              {member.role}
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: 20 }}>
            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{member.name}</h3>
            <p style={{ color: "#60A5FA", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{member.shortBio}</p>
            <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>{member.bio}</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>
              {member.expertise.slice(0, 3).map((skill) => (
                <span key={skill} style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#94A3B8",
                  background: "rgba(51,65,85,0.5)",
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </Link>
    </FadeIn>
  );
}

/* ── Member Card (Portfolio Style) ── */
function MemberCard({ member, index }: { member: TeamMemberData; index: number }) {
  return (
    <FadeIn delay={index * 0.08}>
      <Link href={`/team-member/${member.slug}`} style={{ textDecoration: "none" }}>
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          style={{
            background: "#0F172A",
            border: "1px solid #1F2937",
            borderRadius: 20,
            overflow: "hidden",
            transition: "all 0.3s",
            height: "100%",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3), 0 0 60px rgba(99,102,241,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#1F2937";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {/* Large Image */}
          <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
            <img
              src={member.coverImage || member.image}
              alt={member.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.5s",
              }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, #0F172A 0%, transparent 60%)",
            }} />

            {/* Role Badge */}
            <div style={{
              position: "absolute",
              top: 16,
              left: 16,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: "rgba(99,102,241,0.8)",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}>
              {member.role}
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: 24 }}>
            <h3 style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 4,
            }}>
              {member.name}
            </h3>
            <p style={{
              color: "#818CF8",
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
            }}>
              {member.shortBio}
            </p>
            <p style={{
              color: "#94A3B8",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 16,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {member.bio}
            </p>

            {/* Skills preview */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {member.expertise.slice(0, 3).map((skill) => (
                <span key={skill} style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#94A3B8",
                  background: "rgba(51,65,85,0.5)",
                  border: "1px solid rgba(71,85,105,0.3)",
                }}>
                  {skill}
                </span>
              ))}
              {member.expertise.length > 3 && (
                <span style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#6366F1",
                  fontWeight: 600,
                }}>
                  +{member.expertise.length - 3}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </FadeIn>
  );
}

/* ── Main Team Page ── */
export function TeamPage({ team, settings }: TeamPageProps) {
  const leaders = team.filter((m) => m.roleLevel === 0);
  const vps = team.filter((m) => m.roleLevel === 1);
  const leads = team.filter((m) => m.roleLevel === 2);
  const members = team.filter((m) => m.roleLevel >= 3);

  return (
    <div style={{ color: "#fff", minHeight: "100vh" }}>
      {/* ── Hero Section ── */}
      <section
        style={{
          padding: "100px 24px 80px",
          background: "linear-gradient(180deg, rgba(99,102,241,0.08) 0%, transparent 60%)",
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid #1F2937",
        }}
      >
        {/* Animated background orbs */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{
            position: "absolute",
            top: -100,
            left: "20%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          style={{
            position: "absolute",
            top: -50,
            right: "10%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)",
          }}
        />

        <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: 40,
              padding: "6px 16px 6px 10px",
              marginBottom: 24,
            }}
          >
            <Users size={14} color="#6366F1" />
            <span style={{ color: "#94A3B8", fontSize: 13, fontWeight: 500 }}>
              {settings?.subtitle || "Những con người tạo nên sự khác biệt"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            {settings?.title || "Đội Ngũ"}{" "}
            <span style={{
              background: "linear-gradient(135deg, #6366F1, #EC4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              LOOP
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              color: "#94A3B8",
              fontSize: 18,
              lineHeight: 1.7,
              maxWidth: 600,
              margin: "0 auto",
            }}
          >
            Chúng tôi là tập thể những chuyên gia đam mê công nghệ, sáng tạo không ngừng để mang đến giải pháp số tốt nhất.
          </motion.p>
        </div>
      </section>

      {/* ── Leadership Spotlight (CEO) ── */}
      {leaders.length > 0 && (
        <section style={{ padding: "80px 24px", borderBottom: "1px solid #1F2937" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #F59E0B, #EF4444)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Crown size={22} color="#fff" />
                </div>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Leadership</h2>
                  <p style={{ color: "#94A3B8", fontSize: 14 }}>Người dẫn dắt tầm nhìn LOOP</p>
                </div>
              </div>
            </FadeIn>

            {leaders.map((member) => (
              <LeaderCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}

      {/* ── CTO / VP ── */}
      {vps.length > 0 && (
        <section style={{ padding: "80px 24px", background: "#0B1120", borderBottom: "1px solid #1F2937" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Sparkles size={22} color="#fff" />
                </div>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>Executives</h2>
                  <p style={{ color: "#94A3B8", fontSize: 14 }}>Đội ngũ điều hành cốt lõi</p>
                </div>
              </div>
            </FadeIn>

            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(vps.length, 2)}, 1fr)`,
              gap: 24,
            }}>
              {vps.map((member, i) => (
                <VPCard key={member.id} member={member} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Management & Leads ── */}
      {leads.length > 0 && (
        <section style={{ padding: "80px 24px", borderBottom: "1px solid #1F2937" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
                  Team{" "}
                  <span style={{
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    Leads
                  </span>
                </h2>
                <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 8 }}>Các trưởng nhóm dẫn dắt từng mảng</p>
              </div>
            </FadeIn>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}>
              {leads.map((member, i) => (
                <LeadCard key={member.id} member={member} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Team Members ── */}
      {members.length > 0 && (
        <section style={{ padding: "80px 24px", background: "#0B1120", borderBottom: "1px solid #1F2937" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <FadeIn>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
                  Thành Viên{" "}
                  <span style={{
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    Đội Ngũ
                  </span>
                </h2>
                <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 8 }}>Những chuyên gia tài năng</p>
              </div>
            </FadeIn>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 20,
            }}>
              {members.map((member, i) => (
                <MemberCard key={member.id} member={member} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <FadeIn>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <Users size={40} color="#6366F1" style={{ marginBottom: 20 }} />
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 16 }}>
              Muốn gia nhập đội ngũ?
            </h2>
            <p style={{ color: "#94A3B8", fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              Chúng tôi luôn tìm kiếm những tài năng xuất sắc. Hãy liên hệ nếu bạn muốn tạo ra những sản phẩm tuyệt vời.
            </p>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                color: "#fff",
                padding: "14px 32px",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 0 30px rgba(99,102,241,0.3)",
              }}
            >
              Liên hệ ngay <ArrowRight size={16} />
            </motion.a>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
