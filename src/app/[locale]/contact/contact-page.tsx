"use client";

import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useInView } from "motion/react";
import { Mail, Phone, MapPin, Clock, MessageSquare } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";

interface ContactPageProps {
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    workingHours?: string;
  };
}

function buildContactItems(info?: ContactPageProps["contactInfo"]) {
  const email = info?.email || "hello@loop.vn";
  const phone = info?.phone || "+84 888 123 456";
  const address = info?.address || "Ho Chi Minh City, Vietnam";
  const hours = info?.workingHours || "Mon - Fri, 9:00 AM - 6:00 PM (GMT+7)";
  return [
    { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    { icon: Phone, label: "Phone", value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    { icon: MapPin, label: "Address", value: address, href: null },
    { icon: Clock, label: "Working Hours", value: hours, href: null },
  ];
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

export function ContactPage({ contactInfo: contactInfoProp }: ContactPageProps) {
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get("service") || "";
  const contactInfo = buildContactItems(contactInfoProp);

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
            <MessageSquare size={14} color="#6366F1" />
            <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>
              Get in Touch
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
            Contact <GradientText>Us</GradientText>
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
              margin: "0 auto",
            }}
          >
            Have a project in mind? We&apos;d love to hear from you. Fill out the form
            below and our team will get back to you within 24 hours.
          </motion.p>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section style={{ padding: "80px 24px" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "48px",
          }}
        >
          {/* Contact Info Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            {contactInfo.map((info, i) => (
              <FadeIn key={info.label} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4, borderColor: "#3B82F6" }}
                  style={{
                    background: "#0F172A",
                    border: "1px solid #1F2937",
                    borderRadius: "16px",
                    padding: "24px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "border-color 0.3s",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))",
                      border: "1px solid rgba(99,102,241,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <info.icon size={22} color="#6366F1" />
                  </div>
                  <div>
                    <p style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                      {info.label}
                    </p>
                    {info.href ? (
                      <a href={info.href} style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>
                        {info.value}
                      </a>
                    ) : (
                      <p style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 600 }}>{info.value}</p>
                    )}
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>

          {/* Form */}
          <FadeIn delay={0.2}>
            <div
              style={{
                background: "#0F172A",
                border: "1px solid #1F2937",
                borderRadius: "20px",
                padding: "40px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  marginBottom: "8px",
                }}
              >
                Send us a <GradientText>Message</GradientText>
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "32px" }}>
                Tell us about your project and we&apos;ll provide a free consultation.
              </p>
              <ContactForm preselectedService={preselectedService} />
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
