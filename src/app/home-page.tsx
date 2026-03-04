"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import {
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Users,
  Award,
  Zap,
  Globe,
  ShieldCheck,
  Play,
} from "lucide-react";
import {
  services as mockServices,
  projects as mockProjects,
  testimonials as mockTestimonials,
} from "@/data/mockData";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { HeroCanvas } from "@/components/shared/HeroCanvas";

interface HomePageProps {
  services?: typeof mockServices;
  projects?: typeof mockProjects;
  testimonials?: typeof mockTestimonials;
}

const stats = [
  { value: "150+", label: "Projects Delivered", icon: TrendingUp },
  { value: "98%", label: "Client Satisfaction", icon: Star },
  { value: "50+", label: "Expert Team Members", icon: Users },
  { value: "8+", label: "Years Experience", icon: Award },
];

const whyUs = [
  { icon: Zap, title: "Lightning Fast Delivery", desc: "We ship on time, every time. No excuses, no delays." },
  { icon: Globe, title: "Global Experience", desc: "We've built for clients across 30+ countries worldwide." },
  { icon: ShieldCheck, title: "Quality Guaranteed", desc: "95+ Lighthouse scores and 12-month post-launch support." },
  { icon: Award, title: "Award-Winning Design", desc: "Recognized design excellence in UI/UX and development." },
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

function FadeInSection({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HomePage({
  services = mockServices,
  projects = mockProjects,
  testimonials = mockTestimonials,
}: HomePageProps) {
  const router = useRouter();

  return (
    <div style={{ color: "#FFFFFF" }}>
      {/* --- HERO (Animated Canvas Video) --- */}
      <section
        style={{
          position: "relative",
          minHeight: "calc(100vh - 68px)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "#020617",
        }}
      >
        {/* Animated canvas background */}
        <HeroCanvas />

        {/* Gradient overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 20% 40%, rgba(59,130,246,0.08) 0%, transparent 60%)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 80% 60%, rgba(99,102,241,0.08) 0%, transparent 60%)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "200px",
            background: "linear-gradient(to bottom, transparent, #020617)",
            zIndex: 2,
          }}
        />

        {/* Floating animated orbs */}
        <motion.div
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "15%",
            right: "8%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            zIndex: 1,
          }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{
            position: "absolute",
            top: "30%",
            left: "5%",
            width: "250px",
            height: "250px",
            background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 3,
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "80px 24px",
            width: "100%",
          }}
        >
          <div style={{ maxWidth: "820px" }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: "40px",
                padding: "6px 16px 6px 10px",
                marginBottom: "32px",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: "20px",
                  height: "20px",
                  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={11} color="#fff" />
              </motion.div>
              <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>
                Premium Web Development Agency
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: "clamp(38px, 6vw, 76px)",
                fontWeight: 800,
                lineHeight: 1.08,
                marginBottom: "24px",
                letterSpacing: "-2px",
              }}
            >
              Custom Website Development
              <br />
              for <GradientText>Businesses</GradientText> &{" "}
              <GradientText>Branches</GradientText>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              style={{
                color: "#94A3B8",
                fontSize: "clamp(16px, 2vw, 20px)",
                lineHeight: 1.7,
                marginBottom: "40px",
                maxWidth: "600px",
              }}
            >
              We engineer premium digital experiences — from corporate websites and branch
              systems to e-commerce platforms and custom web applications that scale with your
              business.
            </motion.p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "48px" }}
            >
              {["150+ Projects Delivered", "98% Client Satisfaction", "24h Response Time"].map(
                (text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <CheckCircle size={16} color="#3B82F6" />
                    <span style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 500 }}>
                      {text}
                    </span>
                  </motion.div>
                )
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}
            >
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 60px rgba(99,102,241,0.6)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/services")}
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 0 40px rgba(99,102,241,0.4)",
                }}
              >
                View Services <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{
                  scale: 1.04,
                  borderColor: "#3B82F6",
                  background: "rgba(59,130,246,0.05)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/portfolio")}
                style={{
                  background: "transparent",
                  color: "#FFFFFF",
                  border: "1px solid #1F2937",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Play size={16} /> View Portfolio
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              color: "#4B5563",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Scroll
          </span>
          <div
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(to bottom, #4B5563, transparent)",
            }}
          />
        </motion.div>
      </section>

      {/* --- STATS --- */}
      <section
        style={{
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
          padding: "60px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "32px",
          }}
        >
          {stats.map(({ value, label, icon: Icon }, i) => (
            <FadeInSection key={label} delay={i * 0.1}>
              <div style={{ textAlign: "center" }}>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "rgba(59,130,246,0.1)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={22} color="#3B82F6" />
                  </div>
                </motion.div>
                <div
                  style={{
                    fontSize: "38px",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 500, marginTop: "4px" }}
                >
                  {label}
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* --- SERVICES PREVIEW --- */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeInSection>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <span
                style={{
                  color: "#3B82F6",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                What We Build
              </span>
              <h2
                style={{
                  fontSize: "clamp(30px, 4vw, 48px)",
                  fontWeight: 800,
                  marginTop: "12px",
                  marginBottom: "16px",
                  letterSpacing: "-1px",
                }}
              >
                Our <GradientText>Services</GradientText>
              </h2>
              <p
                style={{
                  color: "#94A3B8",
                  fontSize: "16px",
                  maxWidth: "500px",
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                From simple landing pages to complex enterprise systems — we build it all with
                precision.
              </p>
            </div>
          </FadeInSection>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: "24px",
              marginBottom: "48px",
            }}
          >
            {services.slice(0, 3).map((service, i) => (
              <FadeInSection key={service.id} delay={i * 0.1}>
                <ServiceCard service={service} />
              </FadeInSection>
            ))}
          </div>

          <FadeInSection>
            <div style={{ textAlign: "center" }}>
              <motion.button
                whileHover={{ scale: 1.04, background: "#3B82F6", color: "#fff" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/services")}
                style={{
                  background: "transparent",
                  color: "#3B82F6",
                  border: "1px solid #3B82F6",
                  padding: "13px 32px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                View All Services <ArrowRight size={16} />
              </motion.button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- PORTFOLIO PREVIEW --- */}
      <section
        style={{
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
          padding: "100px 24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeInSection>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <span
                style={{
                  color: "#6366F1",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Our Work
              </span>
              <h2
                style={{
                  fontSize: "clamp(30px, 4vw, 48px)",
                  fontWeight: 800,
                  marginTop: "12px",
                  marginBottom: "16px",
                  letterSpacing: "-1px",
                }}
              >
                Featured <GradientText>Projects</GradientText>
              </h2>
              <p
                style={{
                  color: "#94A3B8",
                  fontSize: "16px",
                  maxWidth: "500px",
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                Real projects. Real results. See how we've transformed businesses with
                exceptional digital solutions.
              </p>
            </div>
          </FadeInSection>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
              marginBottom: "48px",
            }}
          >
            {projects.slice(0, 3).map((project, i) => (
              <FadeInSection key={project.id} delay={i * 0.12}>
                <ProjectCard project={project} />
              </FadeInSection>
            ))}
          </div>

          <FadeInSection>
            <div style={{ textAlign: "center" }}>
              <motion.button
                whileHover={{ scale: 1.04, background: "#6366F1", color: "#fff" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/portfolio")}
                style={{
                  background: "transparent",
                  color: "#6366F1",
                  border: "1px solid #6366F1",
                  padding: "13px 32px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                View All Projects <ArrowRight size={16} />
              </motion.button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- WHY US --- */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{ display: "grid", gap: "64px", alignItems: "center" }}
            className="grid-cols-1 lg:grid-cols-2"
          >
            <FadeInSection>
              <div>
                <span
                  style={{
                    color: "#3B82F6",
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                  }}
                >
                  Why LOOP
                </span>
                <h2
                  style={{
                    fontSize: "clamp(28px, 3vw, 44px)",
                    fontWeight: 800,
                    marginTop: "12px",
                    marginBottom: "20px",
                    letterSpacing: "-1px",
                    lineHeight: 1.15,
                  }}
                >
                  We Don't Just Build Websites.
                  <br />
                  We Build <GradientText>Growth Engines.</GradientText>
                </h2>
                <p
                  style={{
                    color: "#94A3B8",
                    fontSize: "16px",
                    lineHeight: 1.7,
                    marginBottom: "32px",
                  }}
                >
                  Every project we deliver is engineered to perform — with clean code, stunning
                  design, and measurable ROI. Our team of 50+ specialists combines technical
                  excellence with strategic thinking.
                </p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/about")}
                  style={{
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    color: "#fff",
                    border: "none",
                    padding: "13px 28px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                  }}
                >
                  Learn About Us <ArrowRight size={16} />
                </motion.button>
              </div>
            </FadeInSection>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {whyUs.map(({ icon: Icon, title, desc }, i) => (
                <FadeInSection key={title} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: "#3B82F6" }}
                    style={{
                      background: "#0F172A",
                      border: "1px solid #1F2937",
                      borderRadius: "14px",
                      padding: "24px",
                      cursor: "default",
                      transition: "border-color 0.3s",
                    }}
                  >
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "rgba(59,130,246,0.1)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <Icon size={20} color="#3B82F6" />
                    </motion.div>
                    <h4
                      style={{
                        color: "#FFFFFF",
                        fontSize: "14px",
                        fontWeight: 700,
                        marginBottom: "8px",
                      }}
                    >
                      {title}
                    </h4>
                    <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6 }}>{desc}</p>
                  </motion.div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section
        style={{
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
          padding: "100px 24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeInSection>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <span
                style={{
                  color: "#6366F1",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Testimonials
              </span>
              <h2
                style={{
                  fontSize: "clamp(30px, 4vw, 48px)",
                  fontWeight: 800,
                  marginTop: "12px",
                  letterSpacing: "-1px",
                }}
              >
                What Our <GradientText>Clients Say</GradientText>
              </h2>
            </div>
          </FadeInSection>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {testimonials.map((t, i) => (
              <FadeInSection key={t.id} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, borderColor: "#6366F1" }}
                  style={{
                    background: "#020617",
                    border: "1px solid #1F2937",
                    borderRadius: "16px",
                    padding: "28px",
                    height: "100%",
                    transition: "border-color 0.3s",
                    cursor: "default",
                  }}
                >
                  <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                      >
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      </motion.div>
                    ))}
                  </div>
                  <p
                    style={{
                      color: "#94A3B8",
                      fontSize: "14px",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                      fontStyle: "italic",
                    }}
                  >
                    &quot;{t.text}&quot;
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      paddingTop: "16px",
                      borderTop: "1px solid #1F2937",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>
                        {t.avatar}
                      </span>
                    </div>
                    <div>
                      <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600 }}>
                        {t.name}
                      </p>
                      <p style={{ color: "#94A3B8", fontSize: "12px" }}>
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
          }}
        >
          <FadeInSection>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "40px",
                padding: "6px 20px",
                marginBottom: "24px",
              }}
            >
              <span style={{ color: "#6366F1", fontSize: "13px", fontWeight: 600 }}>
                Ready to Launch?
              </span>
            </motion.div>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 58px)",
                fontWeight: 800,
                letterSpacing: "-2px",
                marginBottom: "20px",
                lineHeight: 1.1,
              }}
            >
              Ready to <GradientText>Transform</GradientText> Your
              <br />
              Digital Presence?
            </h2>
            <p
              style={{
                color: "#94A3B8",
                fontSize: "18px",
                lineHeight: 1.7,
                marginBottom: "48px",
              }}
            >
              Join 150+ businesses who've already chosen LOOP to build their digital future.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 80px rgba(99,102,241,0.6)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/contact")}
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  color: "#fff",
                  border: "none",
                  padding: "18px 44px",
                  borderRadius: "12px",
                  fontSize: "17px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 0 60px rgba(99,102,241,0.4)",
                }}
              >
                Get Started Today <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, borderColor: "#94A3B8", color: "#fff" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/pricing")}
                style={{
                  background: "transparent",
                  color: "#94A3B8",
                  border: "1px solid #1F2937",
                  padding: "18px 44px",
                  borderRadius: "12px",
                  fontSize: "17px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                View Pricing
              </motion.button>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
