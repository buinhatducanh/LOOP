import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X, Check } from "lucide-react";
import { adminProjects as initialProjects } from "../../data/mockData";

type Project = typeof initialProjects[0];

const statusColors: Record<string, string> = {
  Active: "#22C55E",
  Completed: "#3B82F6",
  "In Review": "#F59E0B",
  Pending: "#94A3B8",
  Archived: "#6B7280",
};

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [newProject, setNewProject] = useState({ name: "", client: "", type: "Business Website", status: "Pending", budget: 0, progress: 0 });

  const statuses = ["All", "Active", "Completed", "In Review", "Pending", "Archived"];

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "All" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
  };

  const handleEdit = (id: number, field: string, value: string | number) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleAdd = () => {
    if (!newProject.name || !newProject.client) return;
    const project: Project = {
      id: Date.now(),
      ...newProject,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      team: ["TBD"],
    };
    setProjects((prev) => [project, ...prev]);
    setNewProject({ name: "", client: "", type: "Business Website", status: "Pending", budget: 0, progress: 0 });
    setShowAddModal(false);
  };

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

  return (
    <div style={{ color: "#FFFFFF" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" }}>
            <GradientText>Projects</GradientText>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "14px" }}>{projects.length} total projects · {projects.filter((p) => p.status === "Active").length} active</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "11px 22px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        >
          <Plus size={16} /> Add Project
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#4B5563" }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "36px" }}
          />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                background: filterStatus === s ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "transparent",
                color: filterStatus === s ? "#fff" : "#94A3B8",
                border: filterStatus === s ? "none" : "1px solid #1F2937",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1F2937", background: "rgba(255,255,255,0.02)" }}>
                {["Project", "Client", "Type", "Progress", "Budget", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", color: "#94A3B8", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", padding: "14px 16px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: "1px solid #1F2937", transition: "background 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    {editingId === p.id ? (
                      <input
                        value={p.name}
                        onChange={(e) => handleEdit(p.id, "name", e.target.value)}
                        style={{ ...inputStyle, width: "150px" }}
                      />
                    ) : (
                      <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600 }}>{p.name}</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#94A3B8", fontSize: "13px", whiteSpace: "nowrap" }}>{p.client}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ background: "rgba(99,102,241,0.1)", color: "#A5B4FC", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>{p.type}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "80px", height: "4px", background: "#1F2937", borderRadius: "4px" }}>
                        <div style={{ width: `${p.progress}%`, height: "100%", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "4px" }} />
                      </div>
                      <span style={{ color: "#94A3B8", fontSize: "11px", minWidth: "30px" }}>{p.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#FFFFFF", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>${p.budget.toLocaleString("en-US")}</td>
                  <td style={{ padding: "14px 16px" }}>
                    {editingId === p.id ? (
                      <select
                        value={p.status}
                        onChange={(e) => handleEdit(p.id, "status", e.target.value)}
                        style={{ ...inputStyle, width: "110px" }}
                      >
                        {["Active", "In Review", "Completed", "Pending", "Archived"].map((s) => (
                          <option key={s} value={s} style={{ background: "#0F172A" }}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: statusColors[p.status] || "#94A3B8", background: `${statusColors[p.status] || "#94A3B8"}20`, padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                        {p.status}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {editingId === p.id ? (
                        <button
                          onClick={() => setEditingId(null)}
                          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22C55E", padding: "6px 10px", borderRadius: "7px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600 }}
                        >
                          <Check size={13} /> Save
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingId(p.id)}
                          style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#3B82F6", padding: "6px 10px", borderRadius: "7px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, transition: "all 0.2s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#3B82F6"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.1)"; (e.currentTarget as HTMLElement).style.color = "#3B82F6"; }}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                      )}
                      {deleteConfirmId === p.id ? (
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button onClick={() => handleDelete(p.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "6px 10px", borderRadius: "7px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Confirm</button>
                          <button onClick={() => setDeleteConfirmId(null)} style={{ background: "#1F2937", border: "none", color: "#94A3B8", padding: "6px 8px", borderRadius: "7px", cursor: "pointer" }}><X size={13} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "6px 10px", borderRadius: "7px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, transition: "all 0.2s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EF4444"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "#94A3B8" }}>No projects found.</div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px" }}>
          <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "20px", padding: "36px", width: "100%", maxWidth: "520px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF" }}>Add New Project</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "#1F2937", border: "none", color: "#94A3B8", padding: "6px", borderRadius: "8px", cursor: "pointer", display: "flex" }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "Project Name", field: "name", placeholder: "e.g. XYZ Corporate Website", type: "text" },
                { label: "Client Name", field: "client", placeholder: "e.g. ABC Company", type: "text" },
                { label: "Budget ($)", field: "budget", placeholder: "e.g. 2500", type: "number" },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(newProject as Record<string, string | number>)[field]}
                    onChange={(e) => setNewProject((prev) => ({ ...prev, [field]: type === "number" ? Number(e.target.value) : e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Type</label>
                <select value={newProject.type} onChange={(e) => setNewProject((prev) => ({ ...prev, type: e.target.value }))} style={{ ...inputStyle, cursor: "pointer" }}>
                  {["Business Website", "Branch Website", "E-Commerce", "Landing Page", "Web Application"].map((t) => <option key={t} value={t} style={{ background: "#0F172A" }}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
              <button onClick={handleAdd} style={{ flex: 1, background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "13px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                Add Project
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
