import { useNavigate } from "react-router";
import { TrendingUp, Users, MessageSquare, FolderKanban, DollarSign, CheckCircle, Clock, AlertCircle, ArrowRight, ArrowUp } from "lucide-react";
import { adminStats, adminCustomers, adminProjects, adminMessages } from "../../data/mockData";

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

const statusColors: Record<string, string> = {
  Active: "#22C55E",
  Completed: "#3B82F6",
  "In Review": "#F59E0B",
  Pending: "#F59E0B",
  Archived: "#6B7280",
  New: "#EF4444",
  Read: "#F59E0B",
  Replied: "#22C55E",
};

export function Dashboard() {
  const navigate = useNavigate();

  const statCards = [
    { icon: FolderKanban, label: "Total Projects", value: adminStats.totalProjects, sub: `${adminStats.activeProjects} active`, color: "#3B82F6", trend: "+12%" },
    { icon: Users, label: "Total Clients", value: adminStats.totalClients, sub: "2 new this month", color: "#6366F1", trend: "+8%" },
    { icon: DollarSign, label: "Total Revenue", value: `$${(adminStats.totalRevenue / 1000).toFixed(0)}k`, sub: `$${(adminStats.monthlyRevenue / 1000).toFixed(1)}k this month`, color: "#22C55E", trend: "+23%" },
    { icon: MessageSquare, label: "Pending Messages", value: adminStats.pendingMessages, sub: "Awaiting response", color: "#F59E0B", trend: "+3" },
    { icon: CheckCircle, label: "Completed", value: adminStats.completedProjects, sub: "Projects delivered", color: "#22C55E", trend: "+5" },
    { icon: TrendingUp, label: "Satisfaction Rate", value: `${adminStats.satisfactionRate}%`, sub: "Client satisfaction", color: "#3B82F6", trend: "+2%" },
  ];

  return (
    <div style={{ color: "#FFFFFF" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "8px" }}>
          Welcome back, <GradientText>Admin</GradientText> 👋
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "14px" }}>Here's what's happening with NexaWeb today.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {statCards.map(({ icon: Icon, label, value, sub, color, trend }) => (
          <div
            key={label}
            style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "14px", padding: "20px", transition: "all 0.3s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ width: "40px", height: "40px", background: `${color}20`, border: `1px solid ${color}40`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(34,197,94,0.1)", padding: "3px 8px", borderRadius: "20px" }}>
                <ArrowUp size={10} color="#22C55E" />
                <span style={{ color: "#22C55E", fontSize: "11px", fontWeight: 600 }}>{trend}</span>
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>{value}</div>
            <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 600, marginBottom: "2px" }}>{label}</div>
            <div style={{ color: "#4B5563", fontSize: "11px" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Projects & Messages */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }} className="flex flex-col lg:grid">
        {/* Recent Projects */}
        <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Recent Projects</h2>
            <button
              onClick={() => navigate("/admin/projects")}
              style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {adminProjects.slice(0, 5).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#020617", borderRadius: "10px", border: "1px solid #1F2937" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600, marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: "11px" }}>{p.client}</p>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <div style={{ flex: 1, width: "80px", height: "4px", background: "#1F2937", borderRadius: "4px" }}>
                      <div style={{ width: `${p.progress}%`, height: "100%", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "4px" }} />
                    </div>
                    <span style={{ color: "#94A3B8", fontSize: "11px", minWidth: "30px" }}>{p.progress}%</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: statusColors[p.status] || "#94A3B8", background: `${statusColors[p.status] || "#94A3B8"}20`, padding: "2px 8px", borderRadius: "20px" }}>
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Messages */}
        <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Recent Messages</h2>
            <button
              onClick={() => navigate("/admin/messages")}
              style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {adminMessages.slice(0, 5).map((m) => (
              <div key={m.id} style={{ padding: "12px", background: "#020617", borderRadius: "10px", border: "1px solid #1F2937", cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; }}
                onClick={() => navigate("/admin/messages")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                  <div>
                    <span style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600 }}>{m.name}</span>
                    <span style={{ color: "#94A3B8", fontSize: "12px", marginLeft: "8px" }}>— {m.service}</span>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: statusColors[m.status] || "#94A3B8", background: `${statusColors[m.status] || "#94A3B8"}20`, padding: "2px 8px", borderRadius: "20px", flexShrink: 0 }}>
                    {m.status}
                  </span>
                </div>
                <p style={{ color: "#94A3B8", fontSize: "12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Customers */}
      <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Recent Customers</h2>
          <button
            onClick={() => navigate("/admin/customers")}
            style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1F2937" }}>
                {["Customer", "Company", "Service", "Status", "Spent"].map((h) => (
                  <th key={h} style={{ textAlign: "left", color: "#94A3B8", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 12px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminCustomers.slice(0, 5).map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #1F2937", transition: "background 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>{c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div>
                        <p style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>{c.name}</p>
                        <p style={{ color: "#94A3B8", fontSize: "11px" }}>{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px", color: "#94A3B8", fontSize: "13px", whiteSpace: "nowrap" }}>{c.company}</td>
                  <td style={{ padding: "12px", color: "#94A3B8", fontSize: "13px", whiteSpace: "nowrap" }}>{c.service}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: statusColors[c.status] || "#94A3B8", background: `${statusColors[c.status] || "#94A3B8"}20`, padding: "3px 10px", borderRadius: "20px" }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: "#FFFFFF", fontSize: "13px", fontWeight: 600 }}>${c.spent.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
