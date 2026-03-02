import { useState } from "react";
import { Save, Bell, Shield, Globe, Palette, User, Check } from "lucide-react";

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function Settings() {
  const [saved, setSaved] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    name: "Admin User",
    email: "admin@nexaweb.io",
    phone: "+1 (888) 123-4567",
    company: "NexaWeb Agency",
    website: "https://nexaweb.io",
    bio: "Managing web development projects and client relationships for NexaWeb Agency.",
  });

  const [notifications, setNotifications] = useState({
    newMessages: true,
    projectUpdates: true,
    clientActivity: false,
    weeklyReport: true,
    marketingEmails: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    sessionTimeout: "30",
    loginAlerts: true,
  });

  const handleSave = (section: string) => {
    setSaved(section);
    setTimeout(() => setSaved(null), 2500);
  };

  const inputStyle: React.CSSProperties = {
    background: "#020617",
    border: "1px solid #1F2937",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#FFFFFF",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "general", label: "General", icon: Globe },
  ];

  return (
    <div style={{ color: "#FFFFFF" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "6px" }}>
          <GradientText>Settings</GradientText>
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "14px" }}>Manage your account and application preferences</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "24px", alignItems: "start" }} className="flex flex-col lg:grid">
        {/* Tab Nav */}
        <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "14px", padding: "12px" }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: activeTab === id ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))" : "transparent",
                border: activeTab === id ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                color: activeTab === id ? "#FFFFFF" : "#94A3B8",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s",
                marginBottom: "4px",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== id) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== id) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                }
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Profile Information</h2>

              {/* Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px", padding: "20px", background: "#020617", borderRadius: "12px" }}>
                <div style={{ width: "64px", height: "64px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: "22px", fontWeight: 700 }}>AD</span>
                </div>
                <div>
                  <p style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>Admin User</p>
                  <p style={{ color: "#94A3B8", fontSize: "13px" }}>admin@nexaweb.io</p>
                </div>
                <button
                  style={{ marginLeft: "auto", background: "#1F2937", border: "1px solid #1F2937", color: "#94A3B8", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FFFFFF"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
                >
                  Change Photo
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {[
                  { label: "Full Name", key: "name", type: "text" },
                  { label: "Email Address", key: "email", type: "email" },
                  { label: "Phone Number", key: "phone", type: "tel" },
                  { label: "Company", key: "company", type: "text" },
                  { label: "Website", key: "website", type: "url" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{label}</label>
                    <input
                      type={type}
                      value={(profileData as Record<string, string>)[key]}
                      onChange={(e) => setProfileData((p) => ({ ...p, [key]: e.target.value }))}
                      style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                      onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "16px" }}>
                <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData((p) => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
                />
              </div>

              <SaveButton onSave={() => handleSave("profile")} saved={saved === "profile"} />
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Notification Preferences</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {[
                  { key: "newMessages", label: "New Messages", desc: "Get notified when a new contact form message arrives" },
                  { key: "projectUpdates", label: "Project Updates", desc: "Notifications for project milestone updates" },
                  { key: "clientActivity", label: "Client Activity", desc: "Alerts when clients log in or make changes" },
                  { key: "weeklyReport", label: "Weekly Report", desc: "Receive weekly analytics and performance summaries" },
                  { key: "marketingEmails", label: "Marketing Emails", desc: "Promotional content and agency news" },
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", borderBottom: "1px solid #1F2937" }}>
                    <div>
                      <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>{label}</p>
                      <p style={{ color: "#94A3B8", fontSize: "12px" }}>{desc}</p>
                    </div>
                    <div
                      onClick={() => setNotifications((p) => ({ ...p, [key]: !(p as Record<string, boolean>)[key] }))}
                      style={{
                        width: "44px",
                        height: "24px",
                        background: (notifications as Record<string, boolean>)[key] ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "#1F2937",
                        borderRadius: "12px",
                        cursor: "pointer",
                        position: "relative",
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ width: "18px", height: "18px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: (notifications as Record<string, boolean>)[key] ? "23px" : "3px", transition: "left 0.2s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <SaveButton onSave={() => handleSave("notifications")} saved={saved === "notifications"} />
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Security Settings</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* 2FA Toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", background: "#020617", borderRadius: "12px" }}>
                  <div>
                    <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>Two-Factor Authentication</p>
                    <p style={{ color: "#94A3B8", fontSize: "12px" }}>Add an extra layer of security to your account</p>
                  </div>
                  <div
                    onClick={() => setSecurity((p) => ({ ...p, twoFactor: !p.twoFactor }))}
                    style={{ width: "44px", height: "24px", background: security.twoFactor ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "#1F2937", borderRadius: "12px", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
                  >
                    <div style={{ width: "18px", height: "18px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: security.twoFactor ? "23px" : "3px", transition: "left 0.2s" }} />
                  </div>
                </div>

                {/* Login Alerts */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", background: "#020617", borderRadius: "12px" }}>
                  <div>
                    <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>Login Alerts</p>
                    <p style={{ color: "#94A3B8", fontSize: "12px" }}>Email me when a new device logs in</p>
                  </div>
                  <div
                    onClick={() => setSecurity((p) => ({ ...p, loginAlerts: !p.loginAlerts }))}
                    style={{ width: "44px", height: "24px", background: security.loginAlerts ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "#1F2937", borderRadius: "12px", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
                  >
                    <div style={{ width: "18px", height: "18px", background: "#fff", borderRadius: "50%", position: "absolute", top: "3px", left: security.loginAlerts ? "23px" : "3px", transition: "left 0.2s" }} />
                  </div>
                </div>

                {/* Change Password */}
                <div style={{ padding: "20px", background: "#020617", borderRadius: "12px" }}>
                  <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600, marginBottom: "16px" }}>Change Password</p>
                  {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                    <div key={label} style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>{label}</label>
                      <input type="password" placeholder="••••••••" style={inputStyle}
                        onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                        onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <SaveButton onSave={() => handleSave("security")} saved={saved === "security"} />
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Appearance</h2>
              <p style={{ color: "#94A3B8", marginBottom: "24px" }}>Customize how the admin panel looks.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "28px" }}>
                {[
                  { label: "Dark (Default)", active: true, bg: "#020617", border: "#1F2937" },
                  { label: "Darker", active: false, bg: "#000000", border: "#111827" },
                  { label: "Dark Blue", active: false, bg: "#0a1628", border: "#1e3a5f" },
                ].map(({ label, active, bg, border }) => (
                  <div
                    key={label}
                    style={{
                      background: bg,
                      border: `2px solid ${active ? "#3B82F6" : border}`,
                      borderRadius: "12px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                      {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
                        <div key={c} style={{ width: "8px", height: "8px", background: c, borderRadius: "50%" }} />
                      ))}
                    </div>
                    <div style={{ height: "4px", background: "rgba(59,130,246,0.4)", borderRadius: "4px", marginBottom: "6px" }} />
                    <div style={{ height: "4px", background: border, borderRadius: "4px", width: "70%" }} />
                    <p style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: 600, marginTop: "14px" }}>{label}</p>
                    {active && (
                      <div style={{ position: "absolute", top: "10px", right: "10px", width: "18px", height: "18px", background: "#3B82F6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={11} color="#fff" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <SaveButton onSave={() => handleSave("appearance")} saved={saved === "appearance"} />
            </div>
          )}

          {/* General Tab */}
          {activeTab === "general" && (
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>General Settings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Site Name", val: "NexaWeb Agency" },
                  { label: "Contact Email", val: "hello@nexaweb.io" },
                  { label: "Support Phone", val: "+1 (888) 123-4567" },
                  { label: "Default Currency", val: "USD ($)" },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{label}</label>
                    <input defaultValue={val} style={inputStyle}
                      onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                      onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: "block", color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Timezone</label>
                  <select defaultValue="America/New_York" style={{ ...inputStyle, cursor: "pointer" }}>
                    {["America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Dubai", "Asia/Tokyo"].map((tz) => (
                      <option key={tz} value={tz} style={{ background: "#0F172A" }}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
              <SaveButton onSave={() => handleSave("general")} saved={saved === "general"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SaveButton({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <button
      onClick={onSave}
      style={{
        marginTop: "28px",
        background: saved ? "rgba(34,197,94,0.1)" : "linear-gradient(135deg, #3B82F6, #6366F1)",
        border: saved ? "1px solid rgba(34,197,94,0.3)" : "none",
        color: saved ? "#22C55E" : "#fff",
        padding: "13px 28px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.3s",
      }}
    >
      {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
    </button>
  );
}
