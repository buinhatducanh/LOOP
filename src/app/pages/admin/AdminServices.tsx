import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Building2, GitBranch, ShoppingCart, Rocket, Code2 } from "lucide-react";
import { adminServicesList as initialServices } from "../../data/mockData";

type Service = typeof initialServices[0];

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  "Business Website": Building2,
  "Branch Website System": GitBranch,
  "E-Commerce Website": ShoppingCart,
  "Landing Page Website": Rocket,
  "Custom Web Application": Code2,
};

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function AdminServices() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({ name: "", category: "Web Development", startingPrice: 999, deliveryTime: "2-4 weeks" });

  const inputStyle: React.CSSProperties = {
    background: "#020617",
    border: "1px solid #1F2937",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#FFFFFF",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const handleDelete = (id: number) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirmId(null);
  };

  const handleEdit = (id: number, field: string, value: string | number) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAdd = () => {
    if (!newService.name) return;
    const service: Service = { id: Date.now(), ...newService, projectsCount: 0, status: "Active" };
    setServices((prev) => [...prev, service]);
    setNewService({ name: "", category: "Web Development", startingPrice: 999, deliveryTime: "2-4 weeks" });
    setShowAddModal(false);
  };

  return (
    <div style={{ color: "#FFFFFF" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" }}>
            <GradientText>Services</GradientText>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "14px" }}>{services.length} services listed</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "11px 22px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Service Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {services.map((s) => {
          const Icon = iconMap[s.name] || Code2;
          return (
            <div
              key={s.id}
              style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "14px", padding: "24px", transition: "all 0.3s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ width: "44px", height: "44px", background: "rgba(59,130,246,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color="#3B82F6" />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.1)", padding: "3px 10px", borderRadius: "20px" }}>
                  {s.status}
                </span>
              </div>

              {editingId === s.id ? (
                <input
                  value={s.name}
                  onChange={(e) => handleEdit(s.id, "name", e.target.value)}
                  style={{ ...inputStyle, marginBottom: "12px", fontSize: "16px", fontWeight: 700 }}
                />
              ) : (
                <h3 style={{ color: "#FFFFFF", fontSize: "17px", fontWeight: 700, marginBottom: "12px" }}>{s.name}</h3>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "20px" }}>
                {[
                  { label: "Category", value: s.category },
                  { label: "Starting Price", value: editingId === s.id ? (
                    <input
                      type="number"
                      value={s.startingPrice}
                      onChange={(e) => handleEdit(s.id, "startingPrice", Number(e.target.value))}
                      style={{ ...inputStyle, padding: "4px 8px", fontSize: "12px" }}
                    />
                  ) : `$${s.startingPrice.toLocaleString()}` },
                  { label: "Projects", value: s.projectsCount },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: "#020617", borderRadius: "8px", padding: "10px 12px" }}>
                    <p style={{ color: "#94A3B8", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</p>
                    {typeof value === "string" || typeof value === "number" ? (
                      <p style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 700 }}>{value}</p>
                    ) : value}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {editingId === s.id ? (
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ flex: 1, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E", padding: "9px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", fontWeight: 600 }}
                  >
                    <Check size={14} /> Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingId(s.id)}
                    style={{ flex: 1, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#3B82F6", padding: "9px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", fontWeight: 600, transition: "all 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#3B82F6"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.1)"; (e.currentTarget as HTMLElement).style.color = "#3B82F6"; }}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                )}
                {deleteConfirmId === s.id ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => handleDelete(s.id)} style={{ background: "#EF4444", border: "none", color: "#fff", padding: "9px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
                      Delete
                    </button>
                    <button onClick={() => setDeleteConfirmId(null)} style={{ background: "#1F2937", border: "none", color: "#94A3B8", padding: "9px 10px", borderRadius: "8px", cursor: "pointer", display: "flex" }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(s.id)}
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "9px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, transition: "all 0.2s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EF4444"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px" }}>
          <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "20px", padding: "36px", width: "100%", maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF" }}>Add New Service</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "#1F2937", border: "none", color: "#94A3B8", padding: "6px", borderRadius: "8px", cursor: "pointer", display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Service Name</label>
                <input type="text" placeholder="e.g. Custom Mobile App" value={newService.name} onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Category</label>
                <select value={newService.category} onChange={(e) => setNewService((p) => ({ ...p, category: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                  {["Web Development", "Enterprise", "E-Commerce", "Marketing", "Application"].map((c) => <option key={c} value={c} style={{ background: "#0F172A" }}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Starting Price ($)</label>
                <input type="number" placeholder="999" value={newService.startingPrice} onChange={(e) => setNewService((p) => ({ ...p, startingPrice: Number(e.target.value) }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Delivery Time</label>
                <input type="text" placeholder="e.g. 3-4 weeks" value={newService.deliveryTime} onChange={(e) => setNewService((p) => ({ ...p, deliveryTime: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              <button onClick={handleAdd} style={{ flex: 1, background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "13px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                Add Service
              </button>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, background: "transparent", color: "#94A3B8", border: "1px solid #1F2937", padding: "13px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
