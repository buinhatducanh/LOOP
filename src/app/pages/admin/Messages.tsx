import { useState } from "react";
import { Mail, Phone, Calendar, Tag, X, Check, Trash2, Reply } from "lucide-react";
import { adminMessages as initialMessages } from "../../data/mockData";

type Message = typeof initialMessages[0];

const statusColors: Record<string, string> = {
  New: "#EF4444",
  Read: "#F59E0B",
  Replied: "#22C55E",
  Archived: "#6B7280",
};

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function Messages() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [selected, setSelected] = useState<Message | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [replyText, setReplyText] = useState("");
  const [replySent, setReplySent] = useState(false);

  const statuses = ["All", "New", "Read", "Replied", "Archived"];

  const filtered = messages.filter((m) => filterStatus === "All" || m.status === filterStatus);

  const updateStatus = (id: number, status: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
  };

  const deleteMessage = (id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setSelected(null);
  };

  const openMessage = (m: Message) => {
    setSelected(m);
    setReplySent(false);
    setReplyText("");
    if (m.status === "New") updateStatus(m.id, "Read");
  };

  const sendReply = () => {
    if (!replyText.trim()) return;
    setReplySent(true);
    updateStatus(selected!.id, "Replied");
    setReplyText("");
  };

  const newCount = messages.filter((m) => m.status === "New").length;

  return (
    <div style={{ color: "#FFFFFF", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" }}>
            <GradientText>Messages</GradientText>
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "14px" }}>{messages.length} total · <span style={{ color: "#EF4444", fontWeight: 600 }}>{newCount} new</span></p>
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
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {s} {s === "New" && newCount > 0 && `(${newCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "320px 1fr" : "1fr", gap: "20px", alignItems: "start" }} className={selected ? "lg:grid flex flex-col" : ""}>
        {/* Message List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => openMessage(m)}
              style={{
                background: selected?.id === m.id ? "rgba(59,130,246,0.1)" : "#0F172A",
                border: `1px solid ${selected?.id === m.id ? "#3B82F6" : "#1F2937"}`,
                borderRadius: "12px",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (selected?.id !== m.id) (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6";
              }}
              onMouseLeave={(e) => {
                if (selected?.id !== m.id) (e.currentTarget as HTMLElement).style.borderColor = "#1F2937";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 700 }}>{m.name}</p>
                <span style={{ fontSize: "10px", fontWeight: 700, color: statusColors[m.status] || "#94A3B8", background: `${statusColors[m.status] || "#94A3B8"}20`, padding: "2px 8px", borderRadius: "20px", flexShrink: 0 }}>
                  {m.status}
                </span>
              </div>
              <p style={{ color: "#3B82F6", fontSize: "11px", fontWeight: 600, marginBottom: "6px" }}>{m.service}</p>
              <p style={{ color: "#94A3B8", fontSize: "12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.message}</p>
              <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "8px" }}>{m.date}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "#94A3B8" }}>No messages found.</div>
          )}
        </div>

        {/* Message Detail */}
        {selected && (
          <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "28px" }}>
            {/* Message Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", marginBottom: "4px" }}>{selected.name}</h2>
                <p style={{ color: "#94A3B8", fontSize: "13px" }}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "#1F2937", border: "none", color: "#94A3B8", padding: "6px", borderRadius: "8px", cursor: "pointer", display: "flex" }}>
                <X size={16} />
              </button>
            </div>

            {/* Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {[
                { icon: Mail, label: "Email", value: selected.email },
                { icon: Phone, label: "Phone", value: selected.phone },
                { icon: Tag, label: "Service", value: selected.service },
                { icon: Calendar, label: "Date", value: selected.date },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ background: "#020617", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <Icon size={14} color="#3B82F6" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <p style={{ color: "#94A3B8", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>{label}</p>
                    <p style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: 600 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Body */}
            <div style={{ background: "#020617", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <p style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Message</p>
              <p style={{ color: "#FFFFFF", fontSize: "15px", lineHeight: 1.8 }}>{selected.message}</p>
            </div>

            {/* Status Actions */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {["Read", "Replied", "Archived"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(selected.id, s)}
                  style={{
                    background: selected.status === s ? "rgba(59,130,246,0.2)" : "#1F2937",
                    color: selected.status === s ? "#3B82F6" : "#94A3B8",
                    border: `1px solid ${selected.status === s ? "#3B82F6" : "#1F2937"}`,
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s",
                  }}
                >
                  {selected.status === s && <Check size={12} />}
                  Mark as {s}
                </button>
              ))}
              <button
                onClick={() => deleteMessage(selected.id)}
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto", transition: "all 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#EF4444"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>

            {/* Reply */}
            {replySent ? (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                <Check size={24} color="#22C55E" style={{ margin: "0 auto 8px" }} />
                <p style={{ color: "#22C55E", fontWeight: 700, fontSize: "15px" }}>Reply sent successfully!</p>
              </div>
            ) : (
              <div>
                <p style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Quick Reply</p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${selected.name}...`}
                  rows={4}
                  style={{ width: "100%", background: "#020617", border: "1px solid #1F2937", borderRadius: "10px", padding: "14px", color: "#FFFFFF", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", marginBottom: "12px" }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
                />
                <button
                  onClick={sendReply}
                  style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  <Reply size={15} /> Send Reply
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
