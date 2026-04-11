"use client";

import { useState } from "react";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit2, Search, RefreshCw,
  X, Globe, DollarSign,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PricingTab } from "./components/PricingTab";

type Service = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  icon?: string;
  category?: string;
  startingPrice?: string;
  deliveryTime?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { projects: number };
};

function ServiceRow({
  service,
  onEdit,
}: {
  service: Service;
  onEdit: (s: Service) => void;
}) {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: async () => {
      const res = await adminApi.put<{ data: Service }>(`/api/admin/services/${service.id}`, {
        isActive: !service.isActive,
      });
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminServices() }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${DS.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Globe size={16} style={{ color: DS.blue }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: DS.text, fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {service.title}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {service.category && (
            <span style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono }}>{service.category}</span>
          )}
          {service.startingPrice && (
            <span style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono }}>{service.startingPrice}</span>
          )}
          {service.deliveryTime && (
            <span style={{ color: DS.cyan, fontSize: 11, fontFamily: DS.mono }}>{service.deliveryTime}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "4px 10px", textAlign: "center" }}>
          <p style={{ color: DS.blue, fontSize: 13, fontWeight: 700 }}>{service._count?.projects ?? 0}</p>
          <p style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono }}>{t("portfolio.projectCount")}</p>
        </div>
      </div>

      {/* Active toggle */}
      <button
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
        style={{
          padding: "4px 12px", borderRadius: 9999, border: `1px solid ${service.isActive ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
          background: service.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          color: service.isActive ? DS.green : DS.red,
          fontSize: 11, fontFamily: DS.mono, cursor: "pointer", fontWeight: 600,
        }}
      >
        {service.isActive ? "Active" : "Inactive"}
      </button>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(service)}
          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}
        >
          <Edit2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

export default function ServicesTabPage() {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "pricing">("services");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.adminServices({ page, limit: 20, search }),
    queryFn: async () => {
      const res = await adminApi.get<{ data: Service[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        "/api/admin/services",
        { params: { page, limit: 20, ...(search ? { search } : {}) } }
      );
      return res;
    },
  });

  const services = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${DS.border}`, paddingBottom: 0 }}>
        <button
          onClick={() => setActiveTab("services")}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
            borderBottom: activeTab === "services" ? `2px solid ${DS.blue}` : "2px solid transparent",
            background: "none", border: "none", borderRadius: 0,
            color: activeTab === "services" ? DS.text : DS.text4,
            cursor: "pointer", fontSize: 13, fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          <Globe size={14} /> {t("services.title")}
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
            borderBottom: activeTab === "pricing" ? `2px solid ${DS.pink}` : "2px solid transparent",
            background: "none", border: "none", borderRadius: 0,
            color: activeTab === "pricing" ? DS.text : DS.text4,
            cursor: "pointer", fontSize: 13, fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          <DollarSign size={14} /> Bảng Giá
          <span style={{
            background: DS.pink + "20", color: DS.pink,
            fontSize: 10, fontFamily: DS.mono,
            padding: "1px 6px", borderRadius: 9999,
          }}>
            NEW
          </span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "pricing" ? (
        <PricingTab />
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>{t("services.title")}</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {pagination?.total ?? 0} {t("services.serviceCount")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: qk.adminServices({ page }) })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> {t("common.refresh")}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            <Plus size={14} /> {t("services.addNew")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
        <input
          type="text"
          placeholder="Tìm kiếm dịch vụ..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body }}
        />
      </div>

      {/* Create form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 16 }}
          >
            <CreateServiceForm
              onClose={() => setIsCreating(false)}
              onCreated={() => { setIsCreating(false); qc.invalidateQueries({ queryKey: qk.adminServices() }); }}
            />
          </motion.div>
        )}
        {editService && (
          <EditServiceForm
            service={editService}
            onClose={() => setEditService(null)}
            onUpdated={() => { setEditService(null); qc.invalidateQueries({ queryKey: qk.adminServices() }); }}
          />
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {services.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>
              {t("services.empty")}
            </div>
          ) : (
            services.map((s) => (
              <ServiceRow key={s.id} service={s} onEdit={setEditService} />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${page === p ? DS.blue : DS.border}`,
                background: page === p ? "rgba(59,130,246,0.1)" : "transparent",
                color: page === p ? DS.blue : DS.text4,
                cursor: "pointer", fontSize: 13, fontFamily: DS.mono,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}

// Inline edit form
function EditServiceForm({ service, onClose, onUpdated }: { service: Service; onClose: () => void; onUpdated: () => void }) {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();
  const [title, setTitle] = useState(service.title || "");
  const [slug, setSlug] = useState(service.slug || "");
  const [category, setCategory] = useState(service.category || "");
  const [icon, setIcon] = useState(service.icon || "");
  const [startingPrice, setStartingPrice] = useState(service.startingPrice || "");
  const [deliveryTime, setDeliveryTime] = useState(service.deliveryTime || "");

  const update = useMutation({
    mutationFn: async () => {
      await adminApi.put<{ data: Service }>(`/api/admin/services/${service.id}`, {
        title, slug, category, icon: icon || undefined, startingPrice: startingPrice || undefined, deliveryTime: deliveryTime || undefined,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.adminServices() }); onUpdated(); },
    onError: (err) => { alert(err instanceof Error ? err.message : "Cập nhật thất bại"); },
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>{t("services.formEditTitle")}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>TÊN DỊCH VỤ *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Thiết kế Website" />
        </div>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>SLUG *</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} style={inputStyle} placeholder="thiet-ke-website" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>GIÁ BẮT ĐẦU</label>
          <input value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} style={inputStyle} placeholder="Từ 5,000,000 VNĐ" />
        </div>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>THỜI GIAN GIAO</label>
          <input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} style={inputStyle} placeholder="2-4 tuần" />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>DANH MỤC</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Chọn danh mục</option>
          {["Web Design", "App Development", "Dashboard / Analytics", "SEO / Marketing", "E-commerce", "Branding"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>ICON / HÌNH ẢNH</label>
        <ImageUpload value={icon} onChange={url => setIcon(url)} folder="loop-services" aspectRatio="square" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => update.mutate()}
          disabled={!title || !slug || update.isPending}
          style={{ flex: 1, padding: "9px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, opacity: (!title || !slug || update.isPending) ? 0.6 : 1 }}
        >
          {update.isPending ? t("common.saving") : t("common.save")}
        </button>
        <button onClick={onClose} style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${DS.border}`, color: DS.text3, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>
          {t("common.cancel")}
        </button>
      </div>
    </motion.div>
  );
}

// Inline create form (simplified)
function CreateServiceForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [icon, setIcon] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const res = await adminApi.post<{ data: Service }>("/api/admin/services", {
        title, slug, category,
        shortDescription: "",
        isActive: true,
        icon: icon || undefined,
        startingPrice: startingPrice || undefined,
        deliveryTime: deliveryTime || undefined,
      });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.adminServices() });
      onCreated();
    },
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>{t("services.formCreateTitle")}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>TÊN DỊCH VỤ *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Thiết kế Website" />
        </div>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>SLUG *</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} style={inputStyle} placeholder="thiet-ke-website" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>GIÁ BẮT ĐẦU</label>
          <input value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} style={inputStyle} placeholder="Từ 5,000,000 VNĐ" />
        </div>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>THỜI GIAN GIAO</label>
          <input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} style={inputStyle} placeholder="2-4 tuần" />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>DANH MỤC</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Chọn danh mục</option>
          {["Web Design", "App Development", "Dashboard / Analytics", "SEO / Marketing", "E-commerce", "Branding"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>ICON / HÌNH ẢNH</label>
        <ImageUpload value={icon} onChange={url => setIcon(url)} folder="loop-services" aspectRatio="square" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => create.mutate()}
          disabled={!title || !slug || create.isPending}
          style={{ flex: 1, padding: "9px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, opacity: (!title || !slug || create.isPending) ? 0.6 : 1 }}
        >
          {create.isPending ? t("common.saving") : t("services.create")}
        </button>
        <button onClick={onClose} style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${DS.border}`, color: DS.text3, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>
          {t("common.cancel")}
        </button>
      </div>
    </motion.div>
  );
}

// Inline create form (simplified)
