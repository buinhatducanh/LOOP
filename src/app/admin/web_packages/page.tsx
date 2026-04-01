"use client";

/**
 * Web Packages Admin Page — LOOP Solutions
 * Route: /admin/web_packages
 * Wire: /api/admin/packages/web-packages
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Package, RefreshCw, Plus, Star, Edit2, Check } from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

type WebPackage = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  tagline: string;
  taglineVi: string;
  price: number;
  currency: string;
  period: string;
  periodVi: string;
  highlighted: boolean;
  cta: string;
  ctaVi: string;
  color: string;
  pages: number;
  pagesVi: number;
  sortOrder: number;
  isActive: boolean;
};

export default function WebPackagesPage() {
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "web-packages"],
    queryFn: () => adminApi.get<{ data: WebPackage[] }>("/api/admin/packages/web-packages", { params: {} }),
  });

  const packages = data?.data ?? [];
  const totalRevenue = packages.filter(p => p.highlighted).length;
  const activePackages = packages.filter(p => p.isActive).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Gói Web
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {packages.length} gói · {activePackages} đang hoạt động
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: DS.blue, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
            <Plus size={13} /> Thêm gói
          </button>
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : packages.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: DS.text4, background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12 }}>
          <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>Chưa có gói web nào</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Tạo gói đầu tiên để hiển thị trên trang pricing</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: DS.bgCard,
                border: `1px solid ${pkg.highlighted ? pkg.color ?? DS.purple : DS.border}`,
                borderRadius: 14,
                padding: "1.25rem",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Highlighted overlay */}
              {pkg.highlighted && (
                <div style={{
                  position: "absolute", top: 0, right: 0,
                  background: pkg.color ?? DS.purple,
                  color: "#fff",
                  fontSize: 9, fontFamily: DS.mono, fontWeight: 700,
                  padding: "2px 10px", borderRadius: "0 12px 0 8px",
                  letterSpacing: "0.1em",
                }}>
                  POPULAR
                </div>
              )}

              {/* Color bar */}
              <div style={{ height: 3, background: pkg.color ?? DS.blue, borderRadius: 2, marginBottom: "1rem", boxShadow: `0 0 8px ${pkg.color ?? DS.blue}60` }} />

              <div style={{ marginBottom: "0.5rem" }}>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontWeight: 700, fontSize: 16 }}>{pkg.name}</div>
                <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{pkg.nameVi}</div>
              </div>

              <div style={{ color: DS.text3, fontSize: 12, marginBottom: "1rem", lineHeight: 1.5 }}>
                {pkg.tagline || pkg.taglineVi || "—"}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: "0.75rem" }}>
                <span style={{ color: pkg.color ?? DS.blue, fontFamily: DS.heading, fontWeight: 800, fontSize: "1.5rem" }}>
                  {fmtVND(pkg.price)}
                </span>
                <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>/{pkg.period || pkg.periodVi || "tháng"}</span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <span style={{ background: `${DS.blue}10`, color: DS.blue, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600 }}>
                  {pkg.pages ?? pkg.pagesVi ?? 0} trang
                </span>
                {pkg.highlighted && <Star size={11} style={{ color: DS.amber }} />}
              </div>

              {/* CTA */}
              <button
                style={{
                  width: "100%",
                  padding: "8px",
                  background: pkg.highlighted ? (pkg.color ?? DS.purple) : DS.bg,
                  border: `1px solid ${pkg.highlighted ? (pkg.color ?? DS.purple) : DS.border}`,
                  borderRadius: 10,
                  color: pkg.highlighted ? "#fff" : DS.text3,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: DS.mono,
                  cursor: "pointer",
                  marginBottom: "0.75rem",
                }}
              >
                {pkg.cta || pkg.ctaVi || "Chọn gói"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                  Sort: {pkg.sortOrder}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={{ padding: "4px 8px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6, color: DS.blue, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}>
                    <Edit2 size={11} />
                  </button>
                  <span style={{ padding: "4px 8px", background: pkg.isActive ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)", border: `1px solid ${pkg.isActive ? "rgba(34,197,94,0.3)" : "rgba(107,114,128,0.3)"}`, borderRadius: 6, color: pkg.isActive ? DS.green : DS.text5, fontSize: 11, display: "flex", alignItems: "center" }}>
                    <Check size={11} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
