"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Tag,
  Building2,
  GitBranch,
  ShoppingCart,
  Rocket,
  Code2,
  MessageSquare,
} from "lucide-react";
import { projects as mockProjects } from "@/data/mockData";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Building2, GitBranch, ShoppingCart, Rocket, Code2,
};

interface Service {
  id: string;
  icon: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  technologies: string[];
  startingPrice: number;
  deliveryTime: string;
  category: string;
}

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

export function ServiceDetailPage({ service, relatedProjects: propProjects }: { service: Service; relatedProjects?: { id: string; title: string; client: string; image: string; results: string }[] }) {
  const router = useRouter();
  const Icon = iconMap[service.icon] || Code2;
  const relatedProjects = propProjects ?? mockProjects.filter((p) => p.serviceId === service.id);

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Hero */}
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
        <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>
          <Link
            href="/services"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#94A3B8",
              fontSize: "14px",
              textDecoration: "none",
              marginBottom: "24px",
            }}
          >
            <ArrowLeft size={14} /> All Services
          </Link>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "24px" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))",
                border: "1px solid rgba(99,102,241,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={32} color="#6366F1" />
            </motion.div>
            <div>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(59,130,246,0.1)",
                  color: "#3B82F6",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                {service.category}
              </div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  fontSize: "clamp(32px, 4vw, 52px)",
                  fontWeight: 800,
                  letterSpacing: "-1.5px",
                }}
              >
                {service.title}
              </motion.h1>
            </div>
          </div>

          {/* Price & Delivery */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <DollarSign size={18} color="#3B82F6" />
              <span style={{ color: "#94A3B8", fontSize: "14px" }}>Starting from</span>
              <span style={{ color: "#3B82F6", fontSize: "20px", fontWeight: 700 }}>
                ${service.startingPrice.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#6366F1" />
              <span style={{ color: "#94A3B8", fontSize: "14px" }}>Delivery</span>
              <span style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 600 }}>
                {service.deliveryTime}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: "60px 24px" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "48px",
          }}
        >
          {/* Left: Description + Features */}
          <div>
            <FadeIn>
              <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "16px" }}>
                About this <GradientText>Service</GradientText>
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.8, marginBottom: "40px" }}>
                {service.longDescription}
              </p>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>
                What&apos;s <GradientText>Included</GradientText>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {service.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "rgba(34,197,94,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CheckCircle size={12} color="#22C55E" />
                    </div>
                    <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{feature}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Right: Sidebar */}
          <div>
            <FadeIn delay={0.15}>
              {/* CTA Card */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: "16px",
                  padding: "32px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>
                  Ready to get started?
                </h3>
                <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
                  Get a free consultation and custom proposal for your project.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push(`/contact?service=${service.id}`)}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    color: "#fff",
                    border: "none",
                    padding: "14px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                  }}
                >
                  <MessageSquare size={16} /> Request a Quote
                </motion.button>
              </div>

              {/* Technologies */}
              <div
                style={{
                  background: "#0F172A",
                  border: "1px solid #1F2937",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <h4
                  style={{
                    color: "#94A3B8",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "16px",
                  }}
                >
                  <Tag size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "6px" }} />
                  Technologies Used
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {service.technologies.map((tech) => (
                    <span
                      key={tech}
                      style={{
                        background: "rgba(99,102,241,0.1)",
                        color: "#6366F1",
                        border: "1px solid rgba(99,102,241,0.3)",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section
          style={{
            padding: "80px 24px",
            background: "#0F172A",
            borderTop: "1px solid #1F2937",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <FadeIn>
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  marginBottom: "32px",
                }}
              >
                Related <GradientText>Projects</GradientText>
              </h2>
            </FadeIn>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "24px",
              }}
            >
              {relatedProjects.map((project) => (
                <FadeIn key={project.id} delay={0.1}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: "#6366F1" }}
                    onClick={() => router.push(`/portfolio/${project.id}`)}
                    style={{
                      background: "#020617",
                      border: "1px solid #1F2937",
                      borderRadius: "16px",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "border-color 0.3s",
                    }}
                  >
                    <div style={{ height: "180px", overflow: "hidden" }}>
                      <img
                        src={project.image}
                        alt={project.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ padding: "20px" }}>
                      <p style={{ color: "#94A3B8", fontSize: "12px", marginBottom: "4px" }}>
                        {project.client}
                      </p>
                      <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
                        {project.title}
                      </h3>
                      <p
                        style={{
                          color: "#22C55E",
                          fontSize: "13px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <TrendingUp size={13} /> {project.results}
                      </p>
                    </div>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
