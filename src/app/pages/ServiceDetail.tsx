import { useParams, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, Clock, DollarSign, ArrowRight, Building2, GitBranch, ShoppingCart, Rocket, Code2 } from "lucide-react";
import { services } from "../data/mockData";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Building2, GitBranch, ShoppingCart, Rocket, Code2,
};

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const service = services.find((s) => s.id === id);

  if (!service) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#FFFFFF", gap: "20px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 700 }}>Service Not Found</h2>
        <button onClick={() => navigate("/services")} style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "12px 28px", borderRadius: "10px", cursor: "pointer", fontWeight: 600 }}>
          Back to Services
        </button>
      </div>
    );
  }

  const Icon = iconMap[service.icon] || Code2;
  const relatedServices = services.filter((s) => s.id !== service.id).slice(0, 3);

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "60px 24px 80px", background: "linear-gradient(to bottom, rgba(59,130,246,0.06), transparent)", borderBottom: "1px solid #1F2937", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: "10%", width: "500px", height: "500px", background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
        <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>
          <button
            onClick={() => navigate("/services")}
            style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontSize: "14px", marginBottom: "32px", padding: 0, transition: "color 0.2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#3B82F6"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
          >
            <ArrowLeft size={16} /> Back to Services
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "40px", alignItems: "start" }} className="flex flex-col lg:grid">
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "40px", padding: "5px 14px", marginBottom: "20px" }}>
                <span style={{ color: "#3B82F6", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{service.category}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={30} color="#6366F1" />
                </div>
                <h1 style={{ fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.1 }}>
                  <GradientText>{service.title}</GradientText>
                </h1>
              </div>

              <p style={{ color: "#94A3B8", fontSize: "18px", lineHeight: 1.7, maxWidth: "680px" }}>{service.longDescription}</p>
            </div>

            {/* Pricing Card */}
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "20px", padding: "32px", minWidth: "260px", textAlign: "center", boxShadow: "0 0 40px rgba(59,130,246,0.08)" }}>
              <p style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Starting From</p>
              <div style={{ fontSize: "52px", fontWeight: 800, background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: "4px" }}>
                ${service.startingPrice.toLocaleString()}
              </div>
              <p style={{ color: "#4B5563", fontSize: "13px", marginBottom: "20px" }}>one-time payment</p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px", background: "#1F2937", padding: "10px 16px", borderRadius: "8px" }}>
                <Clock size={14} color="#94A3B8" />
                <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>Delivery: {service.deliveryTime}</span>
              </div>

              <button
                onClick={() => navigate(`/contact?service=${service.id}`)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  color: "#fff",
                  border: "none",
                  padding: "14px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  marginBottom: "12px",
                  transition: "all 0.2s",
                  boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                Request Quote
              </button>
              <button
                onClick={() => navigate("/pricing")}
                style={{ width: "100%", background: "transparent", color: "#94A3B8", border: "1px solid #1F2937", padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: 500, cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FFFFFF"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
              >
                View All Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features + Technologies */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px" }} className="flex flex-col lg:grid">
          {/* Features */}
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "32px" }}>
              What's <GradientText>Included</GradientText>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {service.features.map((feature) => (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    background: "#0F172A",
                    border: "1px solid #1F2937",
                    borderRadius: "12px",
                    padding: "16px 20px",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; }}
                >
                  <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CheckCircle size={14} color="#fff" />
                  </div>
                  <span style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 500 }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technologies + Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <h2 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "24px" }}>
                Technologies <GradientText>Used</GradientText>
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {service.technologies.map((tech) => (
                  <span
                    key={tech}
                    style={{
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      color: "#A5B4FC",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Info Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                { icon: DollarSign, label: "Starting Price", value: `$${service.startingPrice.toLocaleString()}` },
                { icon: Clock, label: "Delivery Time", value: service.deliveryTime },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ width: "36px", height: "36px", background: "rgba(59,130,246,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                    <Icon size={18} color="#3B82F6" />
                  </div>
                  <p style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</p>
                  <p style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* CTA Card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "16px",
              padding: "28px",
              textAlign: "center",
            }}>
              <h3 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>Ready to Get Started?</h3>
              <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
                Let's discuss your project and create something exceptional together.
              </p>
              <button
                onClick={() => navigate(`/contact?service=${service.id}`)}
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  color: "#fff",
                  border: "none",
                  padding: "13px 28px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                Start Your Project <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section style={{ background: "#0F172A", borderTop: "1px solid #1F2937", padding: "64px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "32px", letterSpacing: "-0.5px" }}>
            Other <GradientText>Services</GradientText>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {relatedServices.map((s) => {
              const RIcon = iconMap[s.icon] || Code2;
              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/services/${s.id}`)}
                  style={{ background: "#020617", border: "1px solid #1F2937", borderRadius: "14px", padding: "24px", cursor: "pointer", transition: "all 0.3s", display: "flex", gap: "16px", alignItems: "flex-start" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  <div style={{ width: "44px", height: "44px", background: "rgba(59,130,246,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <RIcon size={20} color="#3B82F6" />
                  </div>
                  <div>
                    <h4 style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>{s.title}</h4>
                    <p style={{ color: "#94A3B8", fontSize: "13px" }}>From ${s.startingPrice.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
