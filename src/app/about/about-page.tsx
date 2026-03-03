"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import {
  ArrowRight,
  Users,
  Award,
  Globe,
  Zap,
  Target,
  Heart,
  TrendingUp,
  Star,
  ShieldCheck,
  Code2,
} from "lucide-react";

const stats = [
  { value: "150+", label: "Projects Delivered", icon: TrendingUp },
  { value: "98%", label: "Client Satisfaction", icon: Star },
  { value: "50+", label: "Team Members", icon: Users },
  { value: "8+", label: "Years Experience", icon: Award },
];

const values = [
  {
    icon: Target,
    title: "Results-Driven",
    desc: "Every design decision and line of code is optimized to deliver measurable business outcomes for our clients.",
  },
  {
    icon: Heart,
    title: "Client-First",
    desc: "We treat your project like our own. Your success is our success, and we go above and beyond to deliver.",
  },
  {
    icon: Zap,
    title: "Innovation",
    desc: "We stay at the cutting edge of web technologies to give your business a competitive advantage.",
  },
  {
    icon: ShieldCheck,
    title: "Quality & Security",
    desc: "95+ Lighthouse scores, WCAG accessibility, and security best practices are non-negotiable in every project.",
  },
];

const team = [
  { name: "Duc Anh Bui", role: "Founder & CEO", avatar: "DA", specialty: "Strategy & Architecture" },
  { name: "Minh Tran", role: "CTO", avatar: "MT", specialty: "Full-Stack Development" },
  { name: "Linh Nguyen", role: "Lead Designer", avatar: "LN", specialty: "UI/UX & Branding" },
  { name: "Khoa Pham", role: "Senior Developer", avatar: "KP", specialty: "React & Next.js" },
];

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: "linear-gradient(135deg, #3B82F6, #6366F1)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
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

export function AboutPage() {
  const router = useRouter();

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "80px 24px 60px",
          background: "linear-gradient(to bottom, rgba(59,130,246,0.05), transparent)",
          borderBottom: "1px solid #1F2937",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
        <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "40px",
              padding: "6px 16px 6px 10px",
              marginBottom: "24px",
            }}
          >
            <Globe size={14} color="#6366F1" />
            <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>
              Since 2016
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-2px",
              marginBottom: "20px",
            }}
          >
            About <GradientText>LOOP</GradientText>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              color: "#94A3B8",
              fontSize: "18px",
              lineHeight: 1.7,
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            We are a team of passionate designers and developers building premium
            digital experiences for businesses worldwide. From Ho Chi Minh City to
            the world.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "60px 24px" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
          }}
        >
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div
                style={{
                  background: "#0F172A",
                  border: "1px solid #1F2937",
                  borderRadius: "16px",
                  padding: "28px",
                  textAlign: "center",
                }}
              >
                <stat.icon size={28} color="#6366F1" style={{ marginBottom: "12px" }} />
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1.2,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: "#94A3B8", fontSize: "14px", marginTop: "4px" }}>
                  {stat.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section
        style={{
          padding: "80px 24px",
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <FadeIn>
            <h2
              style={{
                fontSize: "36px",
                fontWeight: 800,
                letterSpacing: "-1px",
                textAlign: "center",
                marginBottom: "40px",
              }}
            >
              Our <GradientText>Story</GradientText>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.8, marginBottom: "20px" }}>
              LOOP was founded in 2016 with a simple mission: to help businesses thrive
              in the digital world through exceptional web design and development. What
              started as a small freelance operation has grown into a full-service digital
              agency with over 50 team members.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.8, marginBottom: "20px" }}>
              Over the past 8+ years, we have delivered 150+ projects for clients across
              30+ countries — from startups launching their first website to enterprises
              building complex multi-branch systems and custom web applications.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.8 }}>
              Our philosophy is simple: every project deserves world-class quality. We
              combine cutting-edge technology (React, Next.js, TypeScript) with thoughtful
              design to deliver solutions that don&apos;t just look great — they perform,
              convert, and scale.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px" }}>
                Our <GradientText>Values</GradientText>
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "16px", marginTop: "12px" }}>
                The principles that guide everything we do
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {values.map((value, i) => (
              <FadeIn key={value.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, borderColor: "#3B82F6" }}
                  style={{
                    background: "#0F172A",
                    border: "1px solid #1F2937",
                    borderRadius: "16px",
                    padding: "32px",
                    transition: "border-color 0.3s",
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))",
                      border: "1px solid rgba(99,102,241,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <value.icon size={24} color="#6366F1" />
                  </div>
                  <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
                    {value.title}
                  </h3>
                  <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6 }}>
                    {value.desc}
                  </p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section
        style={{
          padding: "80px 24px",
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px" }}>
                Meet the <GradientText>Team</GradientText>
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "16px", marginTop: "12px" }}>
                The talented people behind LOOP
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {team.map((member, i) => (
              <FadeIn key={member.name} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, borderColor: "#6366F1" }}
                  style={{
                    background: "#020617",
                    border: "1px solid #1F2937",
                    borderRadius: "16px",
                    padding: "32px",
                    textAlign: "center",
                    transition: "border-color 0.3s",
                  }}
                >
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#FFFFFF",
                    }}
                  >
                    {member.avatar}
                  </div>
                  <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                    {member.name}
                  </h3>
                  <p style={{ color: "#6366F1", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                    {member.role}
                  </p>
                  <p style={{ color: "#94A3B8", fontSize: "13px" }}>{member.specialty}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px" }}>
                Our <GradientText>Tech Stack</GradientText>
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "16px", marginTop: "12px" }}>
                We use the best tools to build the best products
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              {[
                "React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js",
                "PostgreSQL", "Redis", "Docker", "AWS", "Vercel",
                "Prisma", "Stripe", "Shopify", "Figma", "Framer Motion",
              ].map((tech) => (
                <motion.span
                  key={tech}
                  whileHover={{ background: "#374151", color: "#FFFFFF", scale: 1.05 }}
                  style={{
                    background: "#0F172A",
                    color: "#94A3B8",
                    border: "1px solid #1F2937",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "default",
                  }}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 24px",
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          textAlign: "center",
        }}
      >
        <FadeIn>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <Code2 size={40} color="#6366F1" style={{ marginBottom: "20px" }} />
            <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "16px" }}>
              Ready to work with us?
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
              Let&apos;s discuss your project and find the perfect solution for your business.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/contact")}
              style={{
                background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                color: "#fff",
                border: "none",
                padding: "14px 32px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 0 30px rgba(99,102,241,0.3)",
              }}
            >
              Get in Touch <ArrowRight size={16} />
            </motion.button>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
