import { Mail, Phone, MapPin, Clock, Twitter, Linkedin, Github, Instagram, MessageSquare } from "lucide-react";
import { ContactForm } from "../components/ContactForm";
import { useSearchParams } from "react-router";

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

export function Contact() {
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get("service") || "";

  const contactInfo = [
    { icon: Mail, label: "Email Us", value: "hello@nexaweb.io", sub: "We reply within 24 hours" },
    { icon: Phone, label: "Call Us", value: "+1 (888) 123-4567", sub: "Mon-Fri, 9am-6pm EST" },
    { icon: MapPin, label: "Visit Us", value: "100 Market St, Suite 300", sub: "San Francisco, CA 94105" },
    { icon: Clock, label: "Business Hours", value: "Monday – Friday", sub: "9:00 AM – 6:00 PM EST" },
  ];

  const socials = [
    { icon: Twitter, label: "Twitter", handle: "@nexaweb", color: "#1DA1F2" },
    { icon: Linkedin, label: "LinkedIn", handle: "NexaWeb Agency", color: "#0A66C2" },
    { icon: Github, label: "GitHub", handle: "nexaweb", color: "#FFFFFF" },
    { icon: Instagram, label: "Instagram", handle: "@nexaweb.io", color: "#E1306C" },
  ];

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Header */}
      <section style={{ padding: "80px 24px 60px", borderBottom: "1px solid #1F2937", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "40px", padding: "6px 16px 6px 10px", marginBottom: "24px" }}>
            <MessageSquare size={14} color="#3B82F6" />
            <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>Let's Talk</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, letterSpacing: "-2px", marginBottom: "20px" }}>
            Start Your <GradientText>Project</GradientText> Today
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "18px", lineHeight: 1.7 }}>
            Tell us about your vision and we'll get back to you within 24 hours with a custom proposal. Free consultation, no obligations.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 380px", gap: "48px", alignItems: "start" }} className="flex flex-col-reverse lg:grid">
          {/* Form */}
          <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "20px", padding: "40px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "8px" }}>Send Us a Message</h2>
            <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "32px" }}>Fill in the form and we'll be in touch within 24 hours.</p>
            <ContactForm preselectedService={preselectedService} />
          </div>

          {/* Sidebar Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Contact Info */}
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "28px" }}>
              <h3 style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Contact Information</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {contactInfo.map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} style={{ display: "flex", gap: "14px" }}>
                    <div style={{ width: "40px", height: "40px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color="#3B82F6" />
                    </div>
                    <div>
                      <p style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
                      <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600, marginTop: "2px" }}>{value}</p>
                      <p style={{ color: "#94A3B8", fontSize: "12px", marginTop: "2px" }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "28px" }}>
              <h3 style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Follow Us</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {socials.map(({ icon: Icon, label, handle, color }) => (
                  <a
                    key={label}
                    href="#"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      background: "#020617",
                      border: "1px solid #1F2937",
                      borderRadius: "10px",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = color;
                      (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#1F2937";
                      (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{ width: "34px", height: "34px", background: `${color}22`, border: `1px solid ${color}44`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={16} color={color} />
                    </div>
                    <div>
                      <p style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600 }}>{label}</p>
                      <p style={{ color: "#94A3B8", fontSize: "12px" }}>{handle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Response Time */}
            <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", fontWeight: 900, background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "8px" }}>24h</div>
              <p style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 700, marginBottom: "6px" }}>Average Response Time</p>
              <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6 }}>We take every inquiry seriously and respond promptly with a tailored proposal.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
