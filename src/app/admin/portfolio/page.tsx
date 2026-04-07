"use client";

import { useState } from "react";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";

import { DS, GRD } from "@/lib/design-tokens";
import {
 Edit2, Trash2, RefreshCw, Star,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

type Project = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  category?: string;
  client?: string;
  year?: string;
  image?: string;
  isPublished: boolean;
  isFeatured: boolean;
};

function ProjectRow({ project, onEdit }: { project: Project; onEdit: (p: Project) => void }) {
   useQueryClient();

  const togglePublish = useMutation({
    mutationFn: async () => {
      await adminApi.put(`/api/admin/projects/${project.id}`, { isPublished: !project.isPublished });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminProjects() }),
  });

  const toggleFeature = useMutation({
    mutationFn: async () => {
      await adminApi.put(`/api/admin/projects/${project.id}`, { isFeatured: !project.isFeatured });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminProjects() }),
  });

  const delete_ = useMutation({
    mutationFn: async () => {
      await adminApi.delete(`/api/admin/projects/${project.id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminProjects() }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}
    >
      {/* Thumbnail */}
      <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "#111827", flexShrink: 0 }}>
        {project.image ? (
          <img src={project.image} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: "1.25rem", fontWeight: 700 }}>
            {project.title.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <p style={{ color: DS.text, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.title}
          </p>
          {project.isFeatured && <Star size={12} style={{ color: DS.amber, flexShrink: 0 }} fill={DS.amber} />}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {project.category && <span style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono }}>{project.category}</span>}
          {project.client && <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{project.client}</span>}
          {project.year && <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{project.year}</span>}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => togglePublish.mutate()}
          style={{
            padding: "3px 10px", borderRadius: 9999,
            border: `1px solid ${project.isPublished ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
            background: project.isPublished ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            color: project.isPublished ? DS.green : DS.red,
            fontSize: 10, fontFamily: DS.mono, cursor: "pointer", fontWeight: 600,
          }}
        >
          {project.isPublished ? "Published" : "Draft"}
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button onClick={() => toggleFeature.mutate()} title="Toggle featured" style={{ background: project.isFeatured ? "rgba(251,191,36,0.1)" : "transparent", border: `1px solid ${project.isFeatured ? "rgba(251,191,36,0.4)" : DS.border}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: project.isFeatured ? DS.amber : DS.text4, display: "flex", alignItems: "center" }}>
          <Star size={13} fill={project.isFeatured ? DS.amber : "none"} />
        </button>
        <button onClick={() => onEdit(project)} style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}>
          <Edit2 size={13} />
        </button>
        <button onClick={() => { if (confirm(`Xóa "${project.title}"?`)) delete_.mutate(); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}>
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

export default function PortfolioTabPage() {
  const { t } = useAdminTranslations();
   useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.adminProjects({ page, limit: 20, search }),
    queryFn: async () => {
      const res = await adminApi.get<{ data: Project[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        "/api/admin/projects",
        { params: { page, limit: 20, ...(search ? { search } : {}) } }
      );
      return res;
    },
  });

  const projects = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>{t("portfolio.title")}</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {pagination?.total ?? 0} {t("portfolio.projectCount")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: qk.adminProjects({ page }) })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> {t("common.refresh")}
          </button>
          <button
            onClick={() => setIsCreating(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            <Plus size={14} /> {t("portfolio.addNew")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
        <input
          type="text"
          placeholder="Tìm theo tên, khách hàng..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body }}
        />
      </div>

      {/* Create form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 16 }}>
            <CreateProjectForm
              onClose={() => setIsCreating(false)}
              onCreated={() => { setIsCreating(false); qc.invalidateQueries({ queryKey: qk.adminProjects() }); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form */}
      {editProject && (
        <EditProjectForm
          project={editProject}
          onClose={() => setEditProject(null)}
          onUpdated={() => { setEditProject(null); qc.invalidateQueries({ queryKey: qk.adminProjects() }); }}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {projects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>{t("portfolio.empty")}</div>
          ) : (
            projects.map((p) => <ProjectRow key={p.id} project={p} onEdit={setEditProject} />)
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${page === p ? DS.blue : DS.border}`, background: page === p ? "rgba(59,130,246,0.1)" : "transparent", color: page === p ? DS.blue : DS.text4, cursor: "pointer", fontSize: 13, fontFamily: DS.mono }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditProjectForm({ project, onClose, onUpdated }: { project: Project; onClose: () => void; onUpdated: () => void }) {
  const { t } = useAdminTranslations();
   useQueryClient();
  const [title, setTitle] = useState(project.title || "");
  const [slug, setSlug] = useState(project.slug || "");
  const [category, setCategory] = useState(project.category || "");
  const [client, setClient] = useState(project.client || "");
  const [image, setImage] = useState(project.image || "");

  const update = useMutation({
    mutationFn: async () => {
      await adminApi.put(`/api/admin/projects/${project.id}`, { title, slug, category, client, image: image || undefined });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.adminProjects() }); onUpdated(); },
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
        <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>{t("portfolio.editTitle")}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>TÊN DỰ ÁN *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Dự án A" />
        </div>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>SLUG *</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} style={inputStyle} placeholder="du-an-a" />
        </div>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>DANH MỤC</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} placeholder="Web Design" />
        </div>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>KHÁCH HÀNG</label>
          <input value={client} onChange={(e) => setClient(e.target.value)} style={inputStyle} placeholder="Công ty ABC" />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>HÌNH ẢNH DỰ ÁN</label>
        <ImageUpload value={image} onChange={url => setImage(url)} folder="loop-portfolio" aspectRatio="video" />
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

function CreateProjectForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useAdminTranslations();
   useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      await adminApi.post("/api/admin/projects", { title, slug, category, image: image || undefined, isPublished: false, isFeatured: false });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.adminProjects() }); onCreated(); },
  });

  const inputStyle: React.CSSProperties = { width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body };

  return (
    <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 15 }}>{t("portfolio.createTitle")}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={16} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>TÊN DỰ ÁN *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="VNRetail Platform" />
        </div>
        <div>
          <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>SLUG *</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} style={inputStyle} placeholder="vnretail-platform" />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>DANH MỤC</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Chọn danh mục</option>
          {["SaaS", "App", "E-commerce", "Dashboard", "Landing Page", "Branding", "Marketing"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>HÌNH ẢNH DỰ ÁN</label>
        <ImageUpload value={image} onChange={url => setImage(url)} folder="loop-portfolio" aspectRatio="video" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => create.mutate()} disabled={!title || !slug || create.isPending} style={{ flex: 1, padding: "9px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, opacity: (!title || !slug || create.isPending) ? 0.6 : 1 }}>
          {create.isPending ? t("common.saving") : t("portfolio.create")}
        </button>
        <button onClick={onClose} style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${DS.border}`, color: DS.text3, borderRadius: 10, cursor: "pointer", fontSize: 13 }}>{t("common.cancel")}</button>
      </div>
    </div>
  );
}

// Inline create form (simplified)
