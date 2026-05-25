"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { AnimatePresence, motion } from "motion/react";
import {
  Plus, Edit2, Trash2, X, Eye, EyeOff, ChevronUp, ChevronDown,
  GripVertical, Image as ImageIcon, Save, RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type GalleryImage = {
  id: string;
  image: string;
  imagePublicId?: string | null;
  alt?: string | null;
  altEn?: string | null;
  altJa?: string | null;
  altKo?: string | null;
  altZh?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

type ImageFormData = {
  image: string;
  imagePublicId?: string;
  alt: string;
  altEn: string;
  altJa: string;
  altKo: string;
  altZh: string;
  sortOrder: number;
  isActive: boolean;
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function HomeGalleryPage() {
  const { t, locale } = useAdminTranslations();
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ImageFormData>({
    image: "",
    imagePublicId: "",
    alt: "",
    altEn: "",
    altJa: "",
    altKo: "",
    altZh: "",
    sortOrder: 0,
    isActive: true,
  });

  // Fetch images
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "home-gallery"],
    queryFn: async () => {
      const res = await adminApi.get<{ data: GalleryImage[] }>(
        "/api/admin/home-gallery-images",
        { params: { limit: 100 } }
      );
      return res;
    },
  });

  const images = data?.data ?? [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: ImageFormData) => {
      const res = await adminApi.post<GalleryImage>(
        "/api/admin/home-gallery-images",
        payload
      );
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "home-gallery"] });
      closeForm();
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ImageFormData> }) => {
      const res = await adminApi.put<GalleryImage>(
        `/api/admin/home-gallery-images/${id}`,
        payload
      );
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "home-gallery"] });
      setEditId(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/home-gallery-images/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "home-gallery"] });
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await adminApi.put(`/api/admin/home-gallery-images/${id}`, { isActive });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "home-gallery"] });
    },
  });

  // Reorder mutation (move image up/down)
  const reorderMutation = useMutation({
    mutationFn: async ({
      id,
      direction,
    }: {
      id: string;
      direction: "up" | "down";
    }) => {
      const idx = images.findIndex((img) => img.id === id);
      if (idx < 0) return;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= images.length) return;

      const current = images[idx];
      const target = images[targetIdx];

      await Promise.all([
        adminApi.put(`/api/admin/home-gallery-images/${current.id}`, {
          sortOrder: target.sortOrder,
        }),
        adminApi.put(`/api/admin/home-gallery-images/${target.id}`, {
          sortOrder: current.sortOrder,
        }),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "home-gallery"] });
    },
  });

  function openCreate() {
    setFormData({
      image: "",
      imagePublicId: "",
      alt: "",
      altEn: "",
      altJa: "",
      altKo: "",
      altZh: "",
      sortOrder: images.length,
      isActive: true,
    });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(img: GalleryImage) {
    setFormData({
      image: img.image,
      imagePublicId: img.imagePublicId ?? "",
      alt: img.alt ?? "",
      altEn: img.altEn ?? "",
      altJa: img.altJa ?? "",
      altKo: img.altKo ?? "",
      altZh: img.altZh ?? "",
      sortOrder: img.sortOrder,
      isActive: img.isActive,
    });
    setEditId(img.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setFormData({
      image: "",
      imagePublicId: "",
      alt: "",
      altEn: "",
      altJa: "",
      altKo: "",
      altZh: "",
      sortOrder: 0,
      isActive: true,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.image) return;

    if (editId) {
      updateMutation.mutate({ id: editId, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: DS.bgCosmic }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: DS.heading,
              fontSize: 20,
              fontWeight: 800,
              color: DS.text,
              marginBottom: 2,
            }}
          >
            Gallery Ảnh Trang Chủ
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {images.length} ảnh
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => refetch()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
              background: DS.bgCard,
              color: DS.text3,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} style={{ opacity: isFetching ? 0.5 : 1 }} />
          </button>
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: DS.pink,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Thêm ảnh
          </button>
        </div>
      </div>

      {/* Image Grid */}
      {isLoading ? (
        <div style={{ color: DS.text3, fontSize: 13, padding: 40, textAlign: "center" }}>
          Đang tải...
        </div>
      ) : images.length === 0 ? (
        <div
          style={{
            padding: 60,
            textAlign: "center",
            borderRadius: 16,
            border: `1px dashed ${DS.border}`,
            color: DS.text4,
          }}
        >
          <ImageIcon size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
          <p style={{ marginBottom: 16, fontSize: 14 }}>
            Chưa có ảnh nào. Nhấn "Thêm ảnh" để bắt đầu.
          </p>
          <button
            onClick={openCreate}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: DS.pink,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Thêm ảnh đầu tiên
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {images.map((img, idx) => (
            <ImageCard
              key={img.id}
              img={img}
              index={idx}
              total={images.length}
              onEdit={openEdit}
              onDelete={() => {
                if (confirm("Xóa ảnh này?")) {
                  deleteMutation.mutate(img.id);
                }
              }}
              onToggleActive={() =>
                toggleMutation.mutate({ id: img.id, isActive: !img.isActive })
              }
              onMoveUp={() => reorderMutation.mutate({ id: img.id, direction: "up" })}
              onMoveDown={() => reorderMutation.mutate({ id: img.id, direction: "down" })}
              isReordering={reorderMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                background: DS.bgCard,
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 560,
                maxHeight: "90vh",
                overflowY: "auto",
                border: `1px solid ${DS.border}`,
              }}
            >
              {/* Modal header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h3 style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 700, color: DS.text, margin: 0 }}>
                  {editId ? "Sửa ảnh" : "Thêm ảnh mới"}
                </h3>
                <button
                  onClick={closeForm}
                  style={{
                    background: "none",
                    border: "none",
                    color: DS.text3,
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Image Upload */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", color: DS.text3, fontSize: 12, marginBottom: 6 }}>
                    Ảnh *
                  </label>
                  <ImageUpload
                    value={formData.image}
                    onChange={(url, publicId) =>
                      setFormData((p) => ({
                        ...p,
                        image: url,
                        imagePublicId: publicId ?? p.imagePublicId,
                      }))
                    }
                    publicId={formData.imagePublicId}
                    aspectRatio="video"
                    folder="loop-gallery"
                  />
                </div>

                {/* Preview */}
                {formData.image && (
                  <div style={{ marginBottom: 20 }}>
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                        objectFit: "cover",
                        borderRadius: 8,
                        border: `1px solid ${DS.border}`,
                      }}
                    />
                  </div>
                )}

                {/* Alt texts — per locale */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: DS.text3, fontSize: 12, marginBottom: 6 }}>
                    Alt text (VI)
                  </label>
                  <input
                    type="text"
                    value={formData.alt}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, alt: e.target.value }))
                    }
                    placeholder="Mô tả ảnh cho SEO"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${DS.border}`,
                      background: DS.bg,
                      color: DS.text,
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Alt EN */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: DS.text3, fontSize: 12, marginBottom: 6 }}>
                    Alt text (EN)
                  </label>
                  <input
                    type="text"
                    value={formData.altEn}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, altEn: e.target.value }))
                    }
                    placeholder="English alt text"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${DS.border}`,
                      background: DS.bg,
                      color: DS.text,
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Other alt fields (collapsed by default) */}
                <details style={{ marginBottom: 16 }}>
                  <summary
                    style={{
                      color: DS.text4,
                      fontSize: 12,
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                  >
                    Alt text cho các ngôn ngữ khác (JA / KO / ZH)
                  </summary>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { key: "altJa" as const, label: "Alt JA" },
                      { key: "altKo" as const, label: "Alt KO" },
                      { key: "altZh" as const, label: "Alt ZH" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label
                          style={{
                            display: "block",
                            color: DS.text3,
                            fontSize: 12,
                            marginBottom: 4,
                          }}
                        >
                          {label}
                        </label>
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) =>
                            setFormData((p) => ({ ...p, [key]: e.target.value }))
                          }
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: `1px solid ${DS.border}`,
                            background: DS.bg,
                            color: DS.text,
                            fontSize: 12,
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </details>

                {/* Sort Order */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", color: DS.text3, fontSize: 12, marginBottom: 6 }}>
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        sortOrder: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    style={{
                      width: 100,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${DS.border}`,
                      background: DS.bg,
                      color: DS.text,
                      fontSize: 13,
                    }}
                  />
                </div>

                {/* Active toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 24,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, isActive: !p.isActive }))
                    }
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      border: "none",
                      background: formData.isActive ? DS.green : DS.text4,
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#fff",
                        position: "absolute",
                        top: 3,
                        left: formData.isActive ? 23 : 3,
                        transition: "left 0.2s",
                      }}
                    />
                  </button>
                  <span style={{ color: DS.text3, fontSize: 13 }}>
                    {formData.isActive ? "Hiển thị" : "Ẩn"}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={closeForm}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: `1px solid ${DS.border}`,
                      background: "transparent",
                      color: DS.text3,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.image || isPending}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: formData.image && !isPending ? DS.pink : DS.text4,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: formData.image && !isPending ? "pointer" : "not-allowed",
                      opacity: isPending ? 0.7 : 1,
                    }}
                  >
                    <Save size={13} style={{ display: "inline", marginRight: 4 }} />
                    {editId ? "Lưu" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Image Card ───────────────────────────────────────────────────────────────

function ImageCard({
  img,
  index,
  total,
  onEdit,
  onDelete,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  isReordering,
}: {
  img: GalleryImage;
  index: number;
  total: number;
  onEdit: (img: GalleryImage) => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isReordering: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${DS.border}`,
        background: DS.bgCard,
        opacity: img.isActive ? 1 : 0.5,
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          aspectRatio: "16/9",
          position: "relative",
          overflow: "hidden",
          background: DS.bgDeep,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img.image}
          alt={img.alt ?? ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            const t = e.currentTarget;
            t.style.display = "none";
            t.parentElement!.style.background =
              "linear-gradient(135deg, #7C3AED 0%, #F43F5E 100%)";
          }}
        />

        {/* Sort badge */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontSize: 11,
            fontFamily: DS.mono,
            padding: "2px 8px",
            borderRadius: 20,
          }}
        >
          #{index + 1}
        </div>

        {/* Inactive badge */}
        {!img.isActive && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(0,0,0,0.6)",
              color: DS.text4,
              fontSize: 10,
              fontFamily: DS.mono,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            Ẩn
          </div>
        )}
      </div>

      {/* Alt text */}
      <div style={{ padding: "10px 12px 6px" }}>
        <p
          style={{
            color: DS.text3,
            fontSize: 11,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {img.alt || "—"}
        </p>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 12px 12px",
          flexWrap: "wrap",
        }}
      >
        {/* Toggle active */}
        <button
          onClick={onToggleActive}
          title={img.isActive ? "Ẩn ảnh" : "Hiển thị ảnh"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 6,
            border: `1px solid ${DS.border}`,
            background: DS.bg,
            color: img.isActive ? DS.green : DS.text4,
            cursor: "pointer",
          }}
        >
          {img.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>

        {/* Move up */}
        <button
          onClick={onMoveUp}
          disabled={index === 0 || isReordering}
          title="Di chuyển lên"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 6,
            border: `1px solid ${DS.border}`,
            background: DS.bg,
            color: DS.text3,
            cursor: index === 0 ? "not-allowed" : "pointer",
            opacity: index === 0 ? 0.3 : 1,
          }}
        >
          <ChevronUp size={13} />
        </button>

        {/* Move down */}
        <button
          onClick={onMoveDown}
          disabled={index === total - 1 || isReordering}
          title="Di chuyển xuống"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 6,
            border: `1px solid ${DS.border}`,
            background: DS.bg,
            color: DS.text3,
            cursor: index === total - 1 ? "not-allowed" : "pointer",
            opacity: index === total - 1 ? 0.3 : 1,
          }}
        >
          <ChevronDown size={13} />
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(img)}
          title="Sửa"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 6,
            border: `1px solid ${DS.border}`,
            background: DS.bg,
            color: DS.text3,
            cursor: "pointer",
          }}
        >
          <Edit2 size={13} />
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          title="Xóa"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 6,
            border: `1px solid ${DS.border}`,
            background: DS.bg,
            color: DS.red,
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
