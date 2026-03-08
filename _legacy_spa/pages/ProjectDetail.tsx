import { useParams, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, ArrowRight, Calendar, User, Layers, TrendingUp } from "lucide-react";
import { projects } from "../data/mockData";

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#FFFFFF", gap: "20px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 700 }}>Project Not Found</h2>
        <button onClick={() => navigate("/portfolio")} style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: "10px", cursor: "pointer", fontWeight: 600 }}>
          Back to Portfolio
        </button>
      </div>
    );
  }

  const relatedProjects = projects.filter((p) => p.id !== project.id).slice(0, 3);

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Hero Image */}
      <section style={{ position: "relative", height: "480px", overflow: "hidden" }}>
        <img src={project.image} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(2,6,23,0.5) 0%, rgba(2,6,23,0.95) 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 24px" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <button
              onClick={() => navigate("/portfolio")}
              style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", background: "rgba(15,23,42,0.8)", border: "1px solid #1F2937", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "14px", marginBottom: "24px", transition: "color 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#3B82F6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
            >
              <ArrowLeft size={16} /> Back to Portfolio
            </button>
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
              <span style={{ background: "rgba(99,102,241,0.9)", color: "#fff", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 }}>{project.category}</span>
              <span style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #1F2937", color: "#94A3B8", padding: "4px 14px", borderRadius: "20px", fontSize: "12px" }}>{project.year}</span>
            </div>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-1.5px" }}>
              <GradientText>{project.title}</GradientText>
            </h1>
          </div>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 320px", gap: "48px", alignItems: "start" }} className="flex flex-col lg:grid">
          {/* Main Content */}
          <div>
            {/* Description */}
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "16px", letterSpacing: "-0.5px" }}>Project Overview</h2>
              <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.8 }}>{project.description}</p>
            </div>

            {/* Results */}
            <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "16px", padding: "28px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "52px", height: "52px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <TrendingUp size={24} color="#fff" />
              </div>
              <div>
                <p style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Project Result</p>
                <p style={{ color: "#FFFFFF", fontSize: "17px", fontWeight: 600 }}>{project.results}</p>
              </div>
            </div>

            {/* Features */}
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px", marginBottom: "32px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "24px", letterSpacing: "-0.5px" }}>
                Key <GradientText>Features</GradientText>
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                {project.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#020617", borderRadius: "10px", border: "1px solid #1F2937" }}>
                    <div style={{ width: "22px", height: "22px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle size={13} color="#fff" />
                    </div>
                    <span style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 500 }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "20px", letterSpacing: "-0.5px" }}>
                Tech <GradientText>Stack</GradientText>
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      color: "#A5B4FC",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Project Info */}
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Project Details</h3>
              {[
                { icon: User, label: "Client", value: project.client },
                { icon: Layers, label: "Category", value: project.category },
                { icon: Calendar, label: "Year", value: project.year },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: "flex", gap: "12px", paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid #1F2937" }}>
                  <div style={{ width: "36px", height: "36px", background: "#1F2937", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color="#94A3B8" />
                  </div>
                  <div>
                    <p style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
                    <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600, marginTop: "2px" }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
              <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>Like What You See?</h3>
              <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6, marginBottom: "20px" }}>
                Request a similar website for your business today.
              </p>
              <button
                onClick={() => navigate(`/contact?service=${project.serviceId}`)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  color: "#fff",
                  border: "none",
                  padding: "13px",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                Request Similar Website <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      <section style={{ background: "#0F172A", borderTop: "1px solid #1F2937", padding: "64px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "32px", letterSpacing: "-0.5px" }}>
            More <GradientText>Projects</GradientText>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {relatedProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/portfolio/${p.id}`)}
                style={{ background: "#020617", border: "1px solid #1F2937", borderRadius: "14px", overflow: "hidden", cursor: "pointer", transition: "all 0.3s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#6366F1"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                <img src={p.image} alt={p.title} style={{ width: "100%", height: "160px", objectFit: "cover" }} />
                <div style={{ padding: "16px" }}>
                  <span style={{ background: "rgba(99,102,241,0.1)", color: "#A5B4FC", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>{p.category}</span>
                  <h4 style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 700, marginTop: "10px" }}>{p.title}</h4>
                  <p style={{ color: "#94A3B8", fontSize: "12px", marginTop: "4px" }}>{p.client}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
