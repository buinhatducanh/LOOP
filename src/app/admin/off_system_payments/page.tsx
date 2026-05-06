"use client";

import React from "react";
import { DS } from "@/lib/design-tokens";
import { Wallet, Info } from "lucide-react";

export default function OffSystemPaymentsPage() {
  return (
    <div style={{ padding: "var(--admin-padding, 2rem)", minHeight: "100vh", background: DS.bgCosmic }}>
      <style>{`
        :root { --admin-padding: 2rem; }
        @media (max-width: 640px) { :root { --admin-padding: 1rem; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 24, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Thanh toán ngoài hệ thống
          </h2>
          <p style={{ color: DS.text4, fontSize: 13, fontFamily: DS.mono, margin: 0 }}>
            Quản lý các giao dịch thanh toán thủ công và đối soát ngoài hệ thống
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ padding: "8px 16px", borderRadius: 12, background: DS.bgCard, border: `1px solid ${DS.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet size={16} style={{ color: DS.purple }} />
            <span style={{ color: DS.text, fontWeight: 600, fontSize: 14 }}>0 giao dịch</span>
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <div style={{ 
        background: DS.bgCard, 
        border: `1px solid ${DS.border}`, 
        borderRadius: 16, 
        padding: "4rem 2rem",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem"
      }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: 20, 
          background: "rgba(255,255,255,0.03)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: DS.text4
        }}>
          <Info size={32} />
        </div>
        <div>
          <h3 style={{ color: DS.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Tính năng đang phát triển</h3>
          <p style={{ color: DS.text4, fontSize: 14, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
            Trang quản lý thanh toán ngoài hệ thống hiện đang trong quá trình xây dựng. Vui lòng quay lại sau.
          </p>
        </div>
      </div>
    </div>
  );
}
