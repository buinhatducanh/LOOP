import { Link, useNavigate } from "react-router";
import { Zap, Mail, Phone, MapPin, Twitter, Linkedin, Github, Instagram, ArrowRight } from "lucide-react";

export function Footer() {
  const navigate = useNavigate();

  const services = [
    { label: "Business Website", path: "/services/business-website" },
    { label: "Branch Website System", path: "/services/branch-website-system" },
    { label: "E-Commerce Website", path: "/services/ecommerce-website" },
    { label: "Landing Page", path: "/services/landing-page" },
    { label: "Custom Web Application", path: "/services/custom-web-application" },
  ];

  const company = [
    { label: "About Us", path: "/about" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "Pricing", path: "/pricing" },
    { label: "Contact", path: "/contact" },
    { label: "Admin Panel", path: "/admin" },
  ];

  const socials = [
    { icon: Twitter, label: "Twitter", url: "#" },
    { icon: Linkedin, label: "LinkedIn", url: "#" },
    { icon: Github, label: "GitHub", url: "#" },
    { icon: Instagram, label: "Instagram", url: "#" },
  ];

  return (
    <footer style={{ background: "#0F172A", borderTop: "1px solid #1F2937" }}>
      {/* CTA Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))",
          borderBottom: "1px solid #1F2937",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h3 style={{ color: "#FFFFFF", fontSize: "28px", fontWeight: 700, marginBottom: "12px" }}>
            Ready to Build Something Amazing?
          </h3>
          <p style={{ color: "#94A3B8", marginBottom: "28px" }}>
            Let's discuss your project and create a digital experience your customers will love.
          </p>
          <button
            onClick={() => navigate("/contact")}
            style={{
              background: "linear-gradient(135deg, #3B82F6, #6366F1)",
              color: "#FFFFFF",
              border: "none",
              padding: "14px 32px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            Start Your Project <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Footer */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 24px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "48px", marginBottom: "48px" }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "16px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={16} color="#fff" />
              </div>
              <span style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700 }}>
                Nexa<span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Web</span>
              </span>
            </Link>
            <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: "1.7", marginBottom: "24px" }}>
              We craft premium digital experiences for businesses worldwide. Your vision, our expertise.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              {socials.map(({ icon: Icon, label, url }) => (
                <a
                  key={label}
                  href={url}
                  aria-label={label}
                  style={{
                    width: "36px",
                    height: "36px",
                    background: "#1F2937",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94A3B8",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #3B82F6, #6366F1)";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#1F2937";
                    (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: "20px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Services</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {services.map((s) => (
                <li key={s.path}>
                  <Link
                    to={s.path}
                    style={{ color: "#94A3B8", textDecoration: "none", fontSize: "14px", transition: "color 0.2s", display: "flex", alignItems: "center", gap: "6px" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#3B82F6"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
                  >
                    <ArrowRight size={12} />
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: "20px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Company</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {company.map((c) => (
                <li key={c.path}>
                  <Link
                    to={c.path}
                    style={{ color: "#94A3B8", textDecoration: "none", fontSize: "14px", transition: "color 0.2s", display: "flex", alignItems: "center", gap: "6px" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#3B82F6"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
                  >
                    <ArrowRight size={12} />
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: "#FFFFFF", fontWeight: 600, marginBottom: "20px", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { icon: Mail, text: "hello@nexaweb.io" },
                { icon: Phone, text: "+1 (888) 123-4567" },
                { icon: MapPin, text: "San Francisco, CA 94105" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "12px", color: "#94A3B8", fontSize: "14px" }}>
                  <div style={{ width: "32px", height: "32px", background: "#1F2937", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color="#3B82F6" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ borderTop: "1px solid #1F2937", paddingTop: "32px", display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ color: "#94A3B8", fontSize: "13px" }}>
            © 2024 NexaWeb. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a
                key={item}
                href="#"
                style={{ color: "#94A3B8", fontSize: "13px", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#3B82F6"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
