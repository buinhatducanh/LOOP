import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | LOOP Admin",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#fff", padding: "40px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 800 }}>Admin Dashboard</h1>
      <p style={{ color: "#94A3B8", marginTop: "12px" }}>Admin panel is being migrated to Next.js. Full functionality coming soon.</p>
    </div>
  );
}
