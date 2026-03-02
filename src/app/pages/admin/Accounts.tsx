import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, Shield, Trash2, Crown, UserCheck, Search, Plus } from "lucide-react";
import { useAuth, StoredUser } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function Accounts() {
  const { user, getAllUsers, deleteUser, updateUserRole, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    setUsers(getAllUsers());
  }, [isAdmin, navigate]);

  const refresh = () => setUsers(getAllUsers());

  const handleDelete = (id: string) => {
    if (id === user?.id) return;
    deleteUser(id);
    refresh();
    setDeleteConfirm(null);
  };

  const handleRoleToggle = (u: StoredUser) => {
    if (u.id === user?.id) return;
    updateUserRole(u.id, u.role === "admin" ? "user" : "admin");
    refresh();
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "#3B82F6" },
    { label: "Admins", value: users.filter((u) => u.role === "admin").length, icon: Crown, color: "#6366F1" },
    { label: "Regular Users", value: users.filter((u) => u.role === "user").length, icon: UserCheck, color: "#22C55E" },
  ];

  return (
    <div style={{ color: "#FFFFFF" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "8px" }}>
          Account <GradientText>Management</GradientText>
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "14px" }}>Manage all user accounts and roles for NexaWeb admin panel.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "14px", padding: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", background: `${color}20`, border: `1px solid ${color}40`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 800 }}>{value}</div>
                <div style={{ color: "#94A3B8", fontSize: "12px" }}>{label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "24px" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700 }}>All Users</h2>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#4B5563" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                style={{ background: "#020617", border: "1px solid #1F2937", borderRadius: "8px", padding: "8px 12px 8px 34px", color: "#94A3B8", fontSize: "13px", outline: "none", width: "200px" }}
              />
            </div>
            <button
              onClick={() => navigate("/register")}
              style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={14} /> Add User
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1F2937" }}>
                {["User", "Email", "Role", "Joined", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", color: "#94A3B8", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", padding: "8px 12px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: "1px solid #1F2937", transition: "background 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700 }}>{u.avatar}</span>
                      </div>
                      <div>
                        <p style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>{u.name}</p>
                        {u.id === user?.id && <p style={{ color: "#3B82F6", fontSize: "11px" }}>You</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 12px", color: "#94A3B8", fontSize: "13px" }}>{u.email}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: u.role === "admin" ? "#6366F1" : "#22C55E",
                      background: u.role === "admin" ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.15)",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      {u.role === "admin" ? <Crown size={10} /> : <UserCheck size={10} />}
                      {u.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 12px", color: "#94A3B8", fontSize: "13px", whiteSpace: "nowrap" }}>{u.createdAt}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        onClick={() => handleRoleToggle(u)}
                        disabled={u.id === user?.id}
                        title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                        style={{
                          background: "rgba(99,102,241,0.1)",
                          border: "1px solid rgba(99,102,241,0.3)",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          cursor: u.id === user?.id ? "not-allowed" : "pointer",
                          color: "#6366F1",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          opacity: u.id === user?.id ? 0.4 : 1,
                        }}
                      >
                        <Shield size={12} />
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      {deleteConfirm === u.id ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleDelete(u.id)} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: "#EF4444", fontSize: "12px", fontWeight: 600 }}>Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} style={{ background: "#1F2937", border: "1px solid #374151", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", color: "#94A3B8", fontSize: "12px" }}>Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(u.id)}
                          disabled={u.id === user?.id}
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: "8px",
                            padding: "6px 10px",
                            cursor: u.id === user?.id ? "not-allowed" : "pointer",
                            color: "#EF4444",
                            display: "flex",
                            alignItems: "center",
                            opacity: u.id === user?.id ? 0.4 : 1,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#4B5563" }}>
              No users found.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
