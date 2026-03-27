"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Search, RefreshCw, Users, TrendingUp, Mail, Phone } from "lucide-react";

type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string;
  status: string;
};

export default function ClientsTabPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "clients", search],
    queryFn: async () => {
      const res = await adminApi.get<{ data: Client[] }>(
        "/api/admin/sales-leads",
        { params: search ? { search } : {} }
      );
      return res;
    },
  });

  const clients = data?.data ?? [];

  const filtered = clients.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

  const totalRevenue = clients.reduce((s, c) => s + (c.totalSpent ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>Khách hàng & Sales</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{clients.length} khách hàng</p>
        </div>
        <button
          onClick={() => refetch()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Tổng khách hàng", value: clients.length.toString(), icon: <Users size={16} />, color: DS.blue },
          { label: "Doanh thu tổng", value: fmt(totalRevenue).replace("₫", "").trim(), icon: <TrendingUp size={16} />, color: DS.green },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}15`, border: `1px solid ${kpi.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color, flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 2 }}>{kpi.label.toUpperCase()}</p>
              <p style={{ color: DS.text, fontWeight: 800, fontSize: 18 }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
        <input
          type="text"
          placeholder="Tìm theo tên, email, công ty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body }}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>Không tìm thấy khách hàng</div>
          ) : (
            filtered.map((client) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}
              >
                {/* Avatar */}
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: DS.blue, fontWeight: 800, fontSize: 16 }}>
                    {client.name.charAt(0)}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: DS.text, fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{client.name}</p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ color: DS.text4, fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                      <Mail size={10} /> {client.email}
                    </span>
                    {client.phone && (
                      <span style={{ color: DS.text4, fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                        <Phone size={10} /> {client.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                    <p style={{ color: DS.blue, fontWeight: 700, fontSize: 14 }}>{client.totalOrders}</p>
                    <p style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono }}>đơn hàng</p>
                  </div>
                  <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 12px", textAlign: "right" }}>
                    <p style={{ color: DS.green, fontWeight: 700, fontSize: 14 }}>{fmt(client.totalSpent)}</p>
                    <p style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono }}>tổng chi</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
