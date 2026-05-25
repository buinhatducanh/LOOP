"use client";

import { useState, useEffect } from "react";
import { DS, GRD } from "@/lib/design-tokens";
import { Layers, Plus, Trash2, Edit, AlertCircle, CheckCircle2 } from "lucide-react";

type Service = {
  id: string;
  title: string;
  slug: string;
  icon: string;
  shortDescription: string;
  category: string;
  startingPrice: number;
  deliveryTime: string;
  isActive: boolean;
};

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    icon: "Monitor",
    shortDescription: "",
    longDescription: "",
    category: "Development",
    startingPrice: 5000000,
    deliveryTime: "7 - 14 ngày",
    features: "Responsive, SEO Optimization, Custom UI", // comma separated
    technologies: "React, Next.js, Node.js", // comma separated
    isActive: true,
    sortOrder: 1,
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const json = await res.json();
      if (json.data) {
        setServices(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Parse comma separated strings into arrays
    const payload = {
      ...formData,
      features: formData.features.split(",").map(i => i.trim()).filter(Boolean),
      technologies: formData.technologies.split(",").map(i => i.trim()).filter(Boolean),
    };

    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        setShowAddForm(false);
        fetchServices();
        setFormData({
          title: "", slug: "", icon: "Monitor", shortDescription: "", longDescription: "",
          category: "Development", startingPrice: 5000000, deliveryTime: "7 - 14 ngày",
          features: "", technologies: "", isActive: true, sortOrder: 1
        });
      } else {
        alert("Có lỗi xảy ra khi tạo dịch vụ.");
      }
    } catch (err) {
      console.error("Failed to create service:", err);
      alert("Lỗi kết nối.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa dịch vụ này không?")) return;
    
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchServices();
      } else {
        alert("Lỗi khi xóa dịch vụ.");
      }
    } catch (err) {
      alert("Lỗi kết nối.");
    }
  };

  return (
    <div style={{ padding: "var(--admin-padding, 2rem)", fontFamily: DS.body }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ color: DS.text, fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Quản lý Dịch vụ
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 4 }}>
            Thêm, sửa, xóa các dịch vụ hiển thị trên Landing Page.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 18px", borderRadius: 10,
            background: GRD.primary, color: "#fff",
            border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(107, 61, 245, 0.2)",
          }}
        >
          <Plus size={16} />
          {showAddForm ? "Hủy Thêm" : "Thêm Dịch vụ Mới"}
        </button>
      </div>

      {showAddForm && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <h3 style={{ color: DS.text, fontSize: 16, fontWeight: 700, margin: "0 0 16px 0" }}>Tạo Dịch vụ Mới</h3>
          <form onSubmit={handleAddSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>TÊN DỊCH VỤ</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>SLUG (URL Friendly)</label>
              <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} style={inputStyle} placeholder="thiet-ke-website" />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>ICON (Lucide Icon Name)</label>
              <input required type="text" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>DANH MỤC</label>
              <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>MÔ TẢ NGẮN</label>
              <input required type="text" value={formData.shortDescription} onChange={e => setFormData({...formData, shortDescription: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>MÔ TẢ CHI TIẾT</label>
              <textarea required value={formData.longDescription} onChange={e => setFormData({...formData, longDescription: e.target.value})} style={{ ...inputStyle, minHeight: 80 }} />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>THỜI GIAN HOÀN THÀNH</label>
              <input required type="text" value={formData.deliveryTime} onChange={e => setFormData({...formData, deliveryTime: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>GIÁ KHỞI ĐIỂM (VNĐ)</label>
              <input required type="number" value={formData.startingPrice} onChange={e => setFormData({...formData, startingPrice: Number(e.target.value)})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>FEATURES (Phân cách bởi dấu phẩy)</label>
              <input type="text" value={formData.features} onChange={e => setFormData({...formData, features: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: DS.text4, fontSize: 11, display: "block", marginBottom: 6, fontFamily: DS.mono }}>TECHNOLOGIES (Phân cách bởi dấu phẩy)</label>
              <input type="text" value={formData.technologies} onChange={e => setFormData({...formData, technologies: e.target.value})} style={inputStyle} />
            </div>
            <button type="submit" disabled={isSaving} style={{ gridColumn: "1 / -1", padding: "12px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer" }}>
              {isSaving ? "Đang lưu..." : "Lưu Dịch Vụ"}
            </button>
          </form>
        </div>
      )}

      {/* Services List */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: DS.text4 }}>Đang tải dữ liệu...</div>
        ) : services.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: DS.text4 }}>Chưa có dịch vụ nào trong hệ thống.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${DS.border}` }}>
                <th style={thStyle}>TÊN DỊCH VỤ</th>
                <th style={thStyle}>DANH MỤC</th>
                <th style={thStyle}>GIÁ TỪ</th>
                <th style={thStyle}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600, color: DS.text }}>{svc.title}</div>
                    <div style={{ fontSize: 11, color: DS.text4 }}>{svc.slug}</div>
                  </td>
                  <td style={tdStyle}>{svc.category}</td>
                  <td style={tdStyle}>{svc.startingPrice.toLocaleString()} đ</td>
                  <td style={tdStyle}>
                    <button onClick={() => handleDelete(svc.id)} style={{ padding: "6px 10px", background: "rgba(255,50,50,0.1)", color: "#FF5F56", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      <Trash2 size={12} /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.2)",
  border: `1px solid ${DS.border}`, borderRadius: 8,
  fontSize: 13, color: DS.text, outline: "none", boxSizing: "border-box" as const,
};

const thStyle = {
  padding: "12px 20px", textAlign: "left" as const,
  color: DS.text4, fontSize: 11, fontWeight: 600, fontFamily: DS.mono, letterSpacing: "0.05em",
};

const tdStyle = {
  padding: "16px 20px", color: DS.text2, fontSize: 13,
};
