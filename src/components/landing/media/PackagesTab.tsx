"use client";

import { motion } from "framer-motion";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { useTranslations } from "next-intl";
import { Camera, Film, Mic2, Layers, Check, ArrowRight } from "lucide-react";
import type { MediaPackage } from "./types";
import Link from "next/link";

interface PackagesTabProps {
  packages: MediaPackage[];
  locale: string;
}

export function PackagesTab({ packages, locale }: PackagesTabProps) {
  const t = useTranslations("MediaPage");

  // Fallback mock packages if none provided from DB
  const displayPackages = packages.length > 0 ? packages : [
    {
      id: "pkg-product",
      slug: "goi-quay-chup-san-pham",
      title: t("pkgProduct"),
      shortDesc: t("pkgProductDesc"),
      price: null,
      priceText: "Từ 5.000.000₫",
      features: ["Chụp ảnh 360 độ", "Quay video 4K", "Retouch chuyên nghiệp", "Bàn giao trong 3 ngày"],
      tagline: "E-commerce Ready",
      color: DS.pink,
      isPopular: true,
      type: "product",
    },
    {
      id: "pkg-content",
      slug: "goi-content-marketing",
      title: t("pkgContent"),
      shortDesc: t("pkgContentDesc"),
      price: null,
      priceText: "Từ 8.000.000₫",
      features: ["Content Creator đi kèm", "5 Video Reels/TikTok", "10 Ảnh Social Media", "Lên kịch bản chi tiết"],
      tagline: "Viral Content",
      color: DS.purple,
      isPopular: false,
      type: "content",
    },
    {
      id: "pkg-livestream",
      slug: "thue-doi-ngu-livestream",
      title: t("pkgLivestream"),
      shortDesc: t("pkgLivestreamDesc"),
      price: null,
      priceText: "Từ 12.000.000₫",
      features: ["2 Kỹ thuật viên", "Thiết kế âm thanh/ánh sáng", "Hỗ trợ chốt đơn", "Thiết bị chuyên nghiệp"],
      tagline: "Sales Booster",
      color: DS.blue,
      isPopular: false,
      type: "livestream",
    },
    {
      id: "pkg-bundle",
      slug: "goi-media-tong-hop",
      title: t("pkgBundle"),
      shortDesc: t("pkgBundleDesc"),
      price: null,
      priceText: "Liên hệ báo giá",
      features: ["Tất cả dịch vụ Media", "Ưu tiên Diamond support", "Chi phí tối ưu nhất", "Kế hoạch năm"],
      tagline: "All-in-One",
      color: DS.amber,
      isPopular: false,
      type: "bundle",
    },
  ];

  const isEn = locale === "en";

  const mappedPackages = displayPackages.map((pkg) => ({
    ...pkg,
    title: isEn && pkg.titleEn ? pkg.titleEn : pkg.title,
    shortDesc: isEn && pkg.shortDescEn ? pkg.shortDescEn : pkg.shortDesc,
    features: isEn && pkg.featuresEn ? pkg.featuresEn : pkg.features,
  }));

  const getIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Camera size={20} />;
      case "content":
        return <Film size={20} />;
      case "livestream":
        return <Mic2 size={20} />;
      default:
        return <Layers size={20} />;
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        {mappedPackages.map((pkg, i) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            style={{
              position: "relative",
              background: DS.bgCard,
              borderRadius: 24,
              border: `1px solid ${pkg.isPopular ? `${pkg.color}40` : DS.border}`,
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              boxShadow: pkg.isPopular ? `0 20px 40px -12px ${pkg.color}20` : "none",
            }}
          >
            {/* Popular Badge */}
            {pkg.isPopular && (
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: -30,
                  background: pkg.color || DS.pink,
                  color: "#fff",
                  padding: "4px 40px",
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: DS.mono,
                  transform: "rotate(45deg)",
                  zIndex: 2,
                }}
              >
                POPULAR
              </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: `${pkg.color || DS.pink}15`,
                  color: pkg.color || DS.pink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                {getIcon(pkg.type)}
              </div>

              {pkg.tagline && (
                <div
                  style={{
                    color: pkg.color || DS.pink,
                    fontSize: 11,
                    fontFamily: DS.mono,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  {pkg.tagline.toUpperCase()}
                </div>
              )}

              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: DS.text,
                  marginBottom: 12,
                  lineHeight: 1.2,
                }}
              >
                {pkg.title}
              </h3>

              <p
                style={{
                  color: DS.text4,
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 0,
                }}
              >
                {pkg.shortDesc}
              </p>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  color: DS.text,
                  fontSize: 24,
                  fontWeight: 900,
                  fontFamily: DS.mono,
                }}
              >
                {pkg.priceText}
              </div>
            </div>

            {/* Features */}
            <div style={{ flex: 1, marginBottom: 32 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: DS.text3,
                  marginBottom: 16,
                  fontFamily: DS.mono,
                  letterSpacing: "0.05em",
                }}
              >
                {isEn ? "FEATURES INCLUDED" : "TÍNH NĂNG BAO GỒM"}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {pkg.features.map((feat, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      fontSize: 14,
                      color: DS.text4,
                    }}
                  >
                    <Check
                      size={16}
                      style={{
                        color: pkg.color || DS.pink,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Link
              href={`/${locale}/media/booking?package=${pkg.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "16px",
                borderRadius: 16,
                background: pkg.isPopular ? pkg.color || DS.pink : "transparent",
                border: `1px solid ${pkg.isPopular ? "transparent" : DS.border}`,
                color: pkg.isPopular ? "#fff" : DS.text,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                transition: "all 0.2s",
                boxShadow: pkg.isPopular
                  ? `0 8px 20px -6px ${pkg.color}40`
                  : "none",
              }}
            >
              {t("bookingCta")} <ArrowRight size={16} />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Trust Badge / Info */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        style={{
          marginTop: 48,
          padding: "24px",
          borderRadius: 20,
          background: `${DS.blue}08`,
          border: `1px dashed ${DS.blue}30`,
          textAlign: "center",
        }}
      >
        <p style={{ color: DS.text3, fontSize: 13, margin: 0 }}>
          <Sparkles size={14} style={{ color: DS.blue, display: "inline", marginRight: 8, verticalAlign: "middle" }} />
          Nhận ngay <strong>500 LP</strong> điểm thưởng khi hoàn thành bất kỳ gói dịch vụ media nào.
        </p>
      </motion.div>
    </div>
  );
}

const Sparkles = ({ size, style, className }: { size?: number, style?: any, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
