import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Briefcase } from "lucide-react";
import { projects } from "../data/mockData";
import { ProjectCard } from "../components/ProjectCard";

const categories = ["All", "Business Website", "E-Commerce", "Web Application", "Branch Website"];

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function Portfolio() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? projects
    : projects.filter((p) => p.category === activeCategory);

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Header */}
      <section style={{ padding: "80px 24px 60px", background: "linear-gradient(to bottom, rgba(99,102,241,0.06), transparent)", borderBottom: "1px solid #1F2937", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
        <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "40px", padding: "6px 16px 6px 10px", marginBottom: "24px" }}>
            <Briefcase size={14} color="#6366F1" />
            <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>Our Portfolio</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, letterSpacing: "-2px", marginBottom: "20px" }}>
            Work That <GradientText>Speaks</GradientText> for Itself
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "18px", lineHeight: 1.7, maxWidth: "580px", margin: "0 auto" }}>
            Real projects. Real results. Explore our portfolio of websites and web applications built for clients worldwide.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section style={{ padding: "32px 24px 0", position: "sticky", top: "72px", background: "#020617", zIndex: 10, borderBottom: "1px solid #1F2937" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "24px" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "transparent",
                color: activeCategory === cat ? "#FFFFFF" : "#94A3B8",
                border: activeCategory === cat ? "none" : "1px solid #1F2937",
                padding: "9px 20px",
                borderRadius: "30px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeCategory !== cat) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6";
                  (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#1F2937";
                  (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Projects Grid */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px", color: "#94A3B8" }}>
              <p style={{ fontSize: "18px" }}>No projects in this category yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0F172A", borderTop: "1px solid #1F2937", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "16px" }}>
            Your Project Could Be <GradientText>Next</GradientText>
          </h2>
          <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
            Ready to create something extraordinary? Let's build your digital presence together.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/contact")}
              style={{
                background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                color: "#fff",
                border: "none",
                padding: "14px 32px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: "0 0 30px rgba(99,102,241,0.3)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              Start Your Project <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/pricing")}
              style={{ background: "transparent", color: "#94A3B8", border: "1px solid #1F2937", padding: "14px 32px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#94A3B8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; }}
            >
              See Pricing
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
