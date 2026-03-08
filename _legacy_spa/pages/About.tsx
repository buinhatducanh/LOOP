import { motion, useInView } from "motion/react";
import { useNavigate } from "react-router";
import { Target, Eye, Award, Users, TrendingUp, Globe, Shield, Zap, ArrowRight, Star } from "lucide-react";

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

const teamMembers = [
  { name: "Alex Morgan", role: "CEO & Co-Founder", initials: "AM", color: "#3B82F6" },
  { name: "Sophia Chen", role: "CTO & Co-Founder", initials: "SC", color: "#6366F1" },
  { name: "Marcus Williams", role: "Lead Designer", initials: "MW", color: "#8B5CF6" },
  { name: "Layla Hassan", role: "Head of Development", initials: "LH", color: "#3B82F6" },
  { name: "James Park", role: "Project Manager", initials: "JP", color: "#6366F1" },
  { name: "Emma Rodriguez", role: "UI/UX Lead", initials: "ER", color: "#8B5CF6" },
];

const values = [
  { icon: Award, title: "Excellence", desc: "We never settle for good enough. Every line of code, every pixel, every interaction is crafted to exceed expectations." },
  { icon: Users, title: "Partnership", desc: "We're not just a vendor �� we're a long-term digital partner invested in your success and growth." },
  { icon: Shield, title: "Transparency", desc: "Clear communication, honest timelines, and no hidden costs. You always know exactly where your project stands." },
  { icon: Zap, title: "Innovation", desc: "We stay at the cutting edge of web technology so your digital products are built for today and tomorrow." },
];

const stats = [
  { value: "150+", label: "Projects Delivered", icon: TrendingUp },
  { value: "98%", label: "Client Satisfaction", icon: Star },
  { value: "50+", label: "Team Members", icon: Users },
  { value: "30+", label: "Countries Served", icon: Globe },
  { value: "8+", label: "Years in Business", icon: Award },
  { value: "$50M+", label: "Revenue Generated for Clients", icon: TrendingUp },
];

export function About() {
  const navigate = useNavigate();

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ padding: "80px 24px 80px", borderBottom: "1px solid #1F2937", position: "relative", overflow: "hidden" }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "500px", background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)" }}
        />
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gap: "64px", alignItems: "center", position: "relative" }} className="grid-cols-1 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "40px", padding: "6px 16px 6px 10px", marginBottom: "24px" }}>
              <Zap size={14} color="#6366F1" />
              <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>Who We Are</span>
            </div>
            <h1 style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 800, letterSpacing: "-1.5px", marginBottom: "24px", lineHeight: 1.1 }}>
              We Are <GradientText>NexaWeb</GradientText> —<br />
              Your Digital Growth Partners
            </h1>
            <p style={{ color: "#94A3B8", fontSize: "17px", lineHeight: 1.8, marginBottom: "20px" }}>
              Founded in 2016, NexaWeb is a premium web development agency serving businesses worldwide. We've built over 150 digital products for startups, SMEs, and global enterprises.
            </p>
            <p style={{ color: "#94A3B8", fontSize: "17px", lineHeight: 1.8, marginBottom: "36px" }}>
              Our team of 50+ developers, designers, and strategists combines deep technical expertise with a passion for beautiful, functional digital experiences.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/contact")}
                style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#fff", border: "none", padding: "13px 28px", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                Work With Us <ArrowRight size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, borderColor: "#94A3B8", color: "#fff" }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/portfolio")}
                style={{ background: "transparent", color: "#94A3B8", border: "1px solid #1F2937", padding: "13px 28px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
              >
                View Our Work
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}
          >
            {stats.map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                whileHover={{ y: -4, borderColor: "#3B82F6" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "14px", padding: "20px", textAlign: "center", cursor: "default" }}
              >
                <Icon size={18} color="#3B82F6" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "24px", fontWeight: 800, background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{value}</div>
                <div style={{ color: "#94A3B8", fontSize: "11px", fontWeight: 500, marginTop: "4px", lineHeight: 1.4 }}>{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }} className="flex flex-col lg:grid">
          {[
            {
              icon: Target,
              color: "#3B82F6",
              label: "Our Mission",
              title: "Empowering Business Growth Through Digital Excellence",
              text: "Our mission is to deliver world-class digital solutions that drive measurable growth for our clients. We believe every business deserves a powerful online presence built with precision, creativity, and strategic thinking. We don't just build websites — we build digital growth engines.",
            },
            {
              icon: Eye,
              color: "#6366F1",
              label: "Our Vision",
              title: "The World's Most Trusted Web Development Partner",
              text: "We envision a world where every business, regardless of size or industry, has access to premium-quality digital solutions that compete at the highest level. By 2030, we aim to have empowered 500+ businesses worldwide with transformative digital experiences.",
            },
          ].map(({ icon: Icon, color, label, title, text }) => (
            <div
              key={label}
              style={{
                background: "#0F172A",
                border: "1px solid #1F2937",
                borderRadius: "20px",
                padding: "40px",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ width: "56px", height: "56px", background: `rgba(${color === "#3B82F6" ? "59,130,246" : "99,102,241"},0.15)`, border: `1px solid rgba(${color === "#3B82F6" ? "59,130,246" : "99,102,241"},0.3)`, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <Icon size={26} color={color} />
              </div>
              <span style={{ color, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px" }}>{label}</span>
              <h2 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 800, marginTop: "10px", marginBottom: "16px", letterSpacing: "-0.5px", lineHeight: 1.3 }}>{title}</h2>
              <p style={{ color: "#94A3B8", fontSize: "15px", lineHeight: 1.8 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Values */}
      <section style={{ background: "#0F172A", borderTop: "1px solid #1F2937", borderBottom: "1px solid #1F2937", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span style={{ color: "#3B82F6", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>What Drives Us</span>
            <h2 style={{ fontSize: "40px", fontWeight: 800, marginTop: "12px", letterSpacing: "-1px" }}>
              Our Core <GradientText>Values</GradientText>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            {values.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                style={{ background: "#020617", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px", transition: "all 0.3s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#3B82F6"; (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(59,130,246,0.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{ width: "52px", height: "52px", background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  <Icon size={24} color="#6366F1" />
                </div>
                <h3 style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>{title}</h3>
                <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span style={{ color: "#6366F1", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>The People Behind The Magic</span>
            <h2 style={{ fontSize: "40px", fontWeight: 800, marginTop: "12px", letterSpacing: "-1px" }}>
              Meet Our <GradientText>Team</GradientText>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
            {teamMembers.map(({ name, role, initials, color }) => (
              <div
                key={name}
                style={{ background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", padding: "28px", textAlign: "center", transition: "all 0.3s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1F2937"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${color}88)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `2px solid ${color}44` }}>
                  <span style={{ color: "#fff", fontSize: "20px", fontWeight: 700 }}>{initials}</span>
                </div>
                <h4 style={{ color: "#FFFFFF", fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>{name}</h4>
                <p style={{ color: "#94A3B8", fontSize: "13px" }}>{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us CTA */}
      <section style={{ background: "#0F172A", borderTop: "1px solid #1F2937", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "16px" }}>
            Ready to Build Something <GradientText>Extraordinary?</GradientText>
          </h2>
          <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
            Join 150+ businesses who trust NexaWeb to power their digital presence. Let's create something amazing together.
          </p>
          <button
            onClick={() => navigate("/contact")}
            style={{
              background: "linear-gradient(135deg, #3B82F6, #6366F1)",
              color: "#fff",
              border: "none",
              padding: "16px 40px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 40px rgba(99,102,241,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(99,102,241,0.6)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(99,102,241,0.4)"; }}
          >
            Start Your Project <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}