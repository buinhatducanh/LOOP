"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import { ArrowRight, Layers } from "lucide-react";
import { services } from "@/data/mockData";
import { ServiceCard } from "@/components/cards/ServiceCard";

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

export function ServicesPage() {
  const router = useRouter();

  const steps = [
    {
      step: "01",
      title: "Discovery Call",
      desc: "We learn about your business, goals, and project requirements in detail.",
    },
    {
      step: "02",
      title: "Strategy & Proposal",
      desc: "We create a custom proposal with timeline, tech stack, and transparent pricing.",
    },
    {
      step: "03",
      title: "Design & Build",
      desc: "Our team designs and develops your solution with regular progress updates.",
    },
    {
      step: "04",
      title: "Launch & Support",
      desc: "We deploy your project and provide ongoing support and maintenance.",
    },
  ];

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Header */}
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
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
          }}
        >
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
            <Layers size={14} color="#6366F1" />
            <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>
              Everything You Need
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
            Our <GradientText>Services</GradientText>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              color: "#94A3B8",
              fontSize: "18px",
              lineHeight: 1.7,
              maxWidth: "580px",
              margin: "0 auto 40px",
            }}
          >
            From simple landing pages to enterprise-grade web applications — we deliver
            solutions that drive real business growth.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
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
              Get a Free Quote <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {services.map((service, i) => (
              <FadeIn key={service.id} delay={i * 0.08}>
                <ServiceCard service={service} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section
        style={{
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          padding: "80px 24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: "60px" }}>
              <h2
                style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px" }}
              >
                Our <GradientText>Process</GradientText>
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "16px", marginTop: "12px" }}>
                Simple, transparent, and results-focused
              </p>
            </div>
          </FadeIn>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
            }}
          >
            {steps.map(({ step, title, desc }, i) => (
              <FadeIn key={step} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, borderColor: "#3B82F6" }}
                  style={{
                    background: "#020617",
                    border: "1px solid #1F2937",
                    borderRadius: "16px",
                    padding: "28px",
                    position: "relative",
                    transition: "border-color 0.3s",
                    cursor: "default",
                  }}
                >
                  <div
                    style={{
                      fontSize: "48px",
                      fontWeight: 900,
                      background:
                        "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      lineHeight: 1,
                      marginBottom: "16px",
                    }}
                  >
                    {step}
                  </div>
                  <h3
                    style={{
                      color: "#FFFFFF",
                      fontSize: "18px",
                      fontWeight: 700,
                      marginBottom: "10px",
                    }}
                  >
                    {title}
                  </h3>
                  <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6 }}>
                    {desc}
                  </p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
