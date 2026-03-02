import { useState } from "react";
import { Search, Mail, Phone, ExternalLink } from "lucide-react";
import { adminCustomers } from "../../data/mockData";

const statusColors: Record<string, string> = {
  Active: "#22C55E",
  Completed: "#3B82F6",
  Pending: "#F59E0B",
};

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function Customers() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof adminCustomers)[0] | null>(null);

  const statuses = ["All", "Active", "Completed", "Pending"];

  const filtered = adminCustomers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ color: "#FFFFFF" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" }}>
          <GradientText>Customers</GradientText>
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "14px" }}>{adminCustomers.length} total customers</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#4B5563" }} />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", background: "#0F172A", border: "1px solid #1F2937", borderRadius: "8px", padding: "10px 12px 10px 36px", color: "#FFFFFF", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                background: filterStatus === s ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "transparent",
                color: filterStatus === s ? "#fff" : "#94A3B8",
                border: filterStatus === s ? "none" : "1px solid #1F2937",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" }}>
        {filtered.map((c) => (
          <div
            key={c.id}
            style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "14px", padding: "20px", transition: "all 0.3s", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            onClick={() => setSelectedCustomer(c)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontSize: "15px", fontWeight: 700 }}>
                  {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <p style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 700, marginBottom: "2px" }}>{c.name}</p>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: statusColors[c.status] || "#94A3B8", background: `${statusColors[c.status] || "#94A3B8"}20`, padding: "2px 8px", borderRadius: "20px", flexShrink: 0 }}>
                    {c.status}
                  </span>
                </div>
                <p style={{ color: "#94A3B8", fontSize: "12px" }}>{c.company}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", fontSize: "12px" }}>
                <Mail size={12} color="#3B82F6" />
                {c.email}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", fontSize: "12px" }}>
                <Phone size={12} color="#6366F1" />
                {c.phone}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", paddingTop: "12px", borderTop: "1px solid #1F2937" }}>
              <div style={{ flex: 1, background: "#020617", borderRadius: "8px", padding: "8px 12px" }}>
                <p style={{ color: "#94A3B8", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Service</p>
                <p style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: 600 }}>{c.service}</p>
              </div>
              <div style={{ background: "#020617", borderRadius: "8px", padding: "8px 12px", textAlign: "right" }}>
                <p style={{ color: "#94A3B8", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>Total Spent</p>
                <p style={{ color: "#22C55E", fontSize: "14px", fontWeight: 700 }}>${c.spent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "#94A3B8" }}>No customers found.</div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px" }}>
          <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "20px", padding: "36px", width: "100%", maxWidth: "480px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
              <div style={{ width: "60px", height: "60px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: "20px", fontWeight: 700 }}>
                  {selectedCustomer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF" }}>{selectedCustomer.name}</h2>
                <p style={{ color: "#94A3B8", fontSize: "14px" }}>{selectedCustomer.company}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ marginLeft: "auto", background: "#1F2937", border: "none", color: "#94A3B8", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex" }}
              >
                <ExternalLink size={16} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Email", value: selectedCustomer.email },
                { label: "Phone", value: selectedCustomer.phone },
                { label: "Service", value: selectedCustomer.service },
                { label: "Status", value: selectedCustomer.status },
                { label: "Total Spent", value: `$${selectedCustomer.spent.toLocaleString()}` },
                { label: "Join Date", value: selectedCustomer.joinDate },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#020617", borderRadius: "10px" }}>
                  <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600 }}>{label}</span>
                  <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              style={{ width: "100%", background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "13px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", marginTop: "20px" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
