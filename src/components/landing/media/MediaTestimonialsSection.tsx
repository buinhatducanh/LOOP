"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import type { MediaTestimonialItem } from "./types";

export function MediaTestimonialsSection({
  testimonials,
}: {
  testimonials: MediaTestimonialItem[];
}) {
  const t = useTranslations("MediaPage");
  const [current, setCurrent] = useState(0);

  if (testimonials.length === 0) return null;

  const testimonial = testimonials[current];
  const hasPrev = current > 0;
  const hasNext = current < testimonials.length - 1;

  return (
    <section
      style={{
        padding: "4rem 1.5rem",
        borderTop: `1px solid ${DS.border}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(107,61,245,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
        {/* Section title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: DS.heading,
              fontSize: 22,
              fontWeight: 800,
              color: DS.text,
              marginBottom: 6,
            }}
          >
            {t("testimonialTitle")}
          </h2>
          <p style={{ color: DS.text4, fontSize: 13 }}>{t("testimonialDesc")}</p>
        </div>

        {/* Testimonial card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            style={{
              background: DS.bgCard,
              border: `1px solid ${DS.border}`,
              borderRadius: 20,
              padding: "2rem",
              position: "relative",
              boxShadow: GLOW.cardShadow,
            }}
          >
            {/* Quote icon */}
            <Quote
              size={28}
              style={{
                color: DS.pink,
                opacity: 0.25,
                position: "absolute",
                top: 20,
                right: 24,
              }}
            />

            {/* Stars */}
            <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < testimonial.rating ? DS.gold : "transparent"}
                  style={{
                    color: i < testimonial.rating ? DS.gold : DS.text5,
                  }}
                />
              ))}
            </div>

            {/* Text */}
            <p
              style={{
                color: DS.text2,
                fontSize: 15,
                lineHeight: 1.8,
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              "{testimonial.text}"
            </p>

            {/* Author */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {testimonial.customerAvatar ? (
                <img
                  src={testimonial.customerAvatar}
                  alt={testimonial.customerName}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `2px solid ${DS.pink}40`,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: GRD.primary,
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  {testimonial.customerName.charAt(0)}
                </div>
              )}
              <div>
                <p style={{ color: DS.text, fontWeight: 700, fontSize: 14 }}>
                  {testimonial.customerName}
                </p>
                {testimonial.customerCompany && (
                  <p style={{ color: DS.text4, fontSize: 12 }}>
                    {testimonial.customerCompany}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {testimonials.length > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 16,
              marginTop: 24,
            }}
          >
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={!hasPrev}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: hasPrev ? DS.bgCard : "transparent",
                border: `1px solid ${hasPrev ? DS.border : DS.border}`,
                color: hasPrev ? DS.text : DS.text5,
                cursor: hasPrev ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: hasPrev ? 1 : 0.4,
                transition: "all 0.2s",
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Dots */}
            <div style={{ display: "flex", gap: 6 }}>
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: i === current ? 20 : 8,
                    height: 8,
                    borderRadius: 99,
                    background: i === current ? GRD.primary : DS.text5,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    padding: 0,
                    opacity: i === current ? 1 : 0.4,
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrent((c) => Math.min(testimonials.length - 1, c + 1))}
              disabled={!hasNext}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: hasNext ? DS.bgCard : "transparent",
                border: `1px solid ${hasNext ? DS.border : DS.border}`,
                color: hasNext ? DS.text : DS.text5,
                cursor: hasNext ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: hasNext ? 1 : 0.4,
                transition: "all 0.2s",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
