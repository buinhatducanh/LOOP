"use client";

import { useState, useEffect } from "react";

interface HeroBannerProps {
  banners?: string[];
  enabled?: boolean;
}

export function HeroBanner({ banners = [], enabled = true }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    if (!enabled || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, enabled]);

  // Don't render if disabled or no banners
  if (!enabled || banners.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}
    >
      {/* Banner Images */}
      {banners.map((banner, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            inset: 0,
            opacity: index === currentSlide ? 1 : 0,
            transition: "opacity 1s ease-in-out",
          }}
        >
          <img
            src={banner}
            alt={`Banner ${index + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Dark overlay for readability */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(2, 6, 23, 0.6)",
            }}
          />
        </div>
      ))}

      {/* Slide Indicators */}
      {banners.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
            zIndex: 10,
          }}
        >
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: index === currentSlide ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                background: index === currentSlide ? "#3B82F6" : "rgba(255,255,255,0.3)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
