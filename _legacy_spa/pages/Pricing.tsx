import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Check, ArrowRight, HelpCircle, MessageSquare } from "lucide-react";
import { pricingPlans } from "../data/mockData";
import { PricingCard } from "../components/PricingCard";

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
      {children}
    </span>
  );
}

const faqs = [
  { q: "Do you offer payment plans?", a: "Yes! We offer flexible payment plans — typically 50% upfront and 50% upon delivery. For larger projects, we can arrange milestone-based payments." },
  { q: "What's included in the support period?", a: "Our support includes bug fixes, minor content updates, security patches, and technical assistance via email and chat during business hours." },
  { q: "Can I upgrade my plan later?", a: "Absolutely. Many clients start with a Basic or Standard plan and upgrade as their business grows. We make transitions seamless." },
  { q: "Do you work with existing websites?", a: "Yes, we also offer website redesign, migration, and optimization services. Contact us for a custom quote based on your current setup." },
  { q: "What if I need something custom?", a: "Every business is unique. Our Enterprise plan is fully customizable, and we can create a tailored proposal for any project scope." },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: "#0F172A",
        border: `1px solid ${open ? "#3B82F6" : "#1F2937"}`,
        borderRadius: "14px",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          gap: "16px",
        }}
      >
        <span style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 600, textAlign: "left" }}>{q}</span>
        <div style={{ width: "24px", height: "24px", background: open ? "linear-gradient(135deg, #3B82F6, #6366F1)" : "#1F2937", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
          <span style={{ color: "#fff", fontSize: "16px", fontWeight: 700, lineHeight: 1 }}>{open ? "−" : "+"}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 24px 20px" }}>
          <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.7 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export function Pricing() {
  const navigate = useNavigate();

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Header */}
      <section style={{ padding: "80px 24px 60px", textAlign: "center", borderBottom: "1px solid #1F2937", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
        <div style={{ maxWidth: "700px", margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "40px", padding: "6px 16px", marginBottom: "24px" }}>
            <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>Transparent Pricing</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, letterSpacing: "-2px", marginBottom: "20px" }}>
            Simple, <GradientText>Transparent</GradientText> Pricing
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "18px", lineHeight: 1.7 }}>
            No hidden fees. No surprises. Choose the plan that fits your needs, or contact us for a custom quote.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", alignItems: "start" }}>
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section style={{ background: "#0F172A", borderTop: "1px solid #1F2937", borderBottom: "1px solid #1F2937", padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "48px", textAlign: "center" }}>
            What You <GradientText>Get</GradientText> with Each Plan
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", color: "#94A3B8", fontSize: "13px", fontWeight: 600, padding: "12px 16px", borderBottom: "1px solid #1F2937", minWidth: "200px" }}>Feature</th>
                  {pricingPlans.map((plan) => (
                    <th key={plan.id} style={{ textAlign: "center", color: plan.highlighted ? "#FFFFFF" : "#94A3B8", fontSize: "14px", fontWeight: 700, padding: "12px 16px", borderBottom: "1px solid #1F2937", minWidth: "120px" }}>
                      {plan.highlighted && (
                        <span style={{ display: "block", background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "12px", fontWeight: 700 }}>★ POPULAR</span>
                      )}
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Pages", values: ["5", "15", "Unlimited", "Unlimited"] },
                  { feature: "Custom Design", values: ["✓", "✓", "✓", "✓"] },
                  { feature: "Mobile Responsive", values: ["✓", "✓", "✓", "✓"] },
                  { feature: "CMS Integration", values: ["✗", "✓", "✓", "✓"] },
                  { feature: "E-Commerce", values: ["✗", "✗", "✓", "✓"] },
                  { feature: "Custom Animations", values: ["✗", "✗", "✓", "✓"] },
                  { feature: "Multi-language", values: ["✗", "✗", "✓", "✓"] },
                  { feature: "Priority Support", values: ["✗", "✗", "✓", "✓"] },
                  { feature: "Support Period", values: ["1 month", "3 months", "6 months", "12 months"] },
                  { feature: "Revision Rounds", values: ["2", "5", "Unlimited", "Unlimited"] },
                ].map(({ feature, values }, idx) => (
                  <tr key={feature} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ color: "#FFFFFF", fontSize: "14px", padding: "14px 16px", borderBottom: "1px solid #1F2937" }}>{feature}</td>
                    {values.map((val, i) => (
                      <td key={i} style={{ textAlign: "center", padding: "14px 16px", borderBottom: "1px solid #1F2937", color: val === "✓" ? "#22C55E" : val === "✗" ? "#4B5563" : "#FFFFFF", fontSize: "14px", fontWeight: val === "✓" || val === "✗" ? 700 : 500 }}>
                        {val === "✓" ? <Check size={16} color="#22C55E" style={{ margin: "0 auto" }} /> : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <HelpCircle size={40} color="#3B82F6" style={{ margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-1px" }}>
              Frequently Asked <GradientText>Questions</GradientText>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {faqs.map(({ q, a }) => (
              <FAQ key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#0F172A", borderTop: "1px solid #1F2937", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <MessageSquare size={44} color="#6366F1" style={{ margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px", marginBottom: "16px" }}>
            Not Sure Which Plan? <GradientText>Let's Talk.</GradientText>
          </h2>
          <p style={{ color: "#94A3B8", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
            We'll analyze your needs and recommend the best solution. Free consultation, no obligations.
          </p>
          <button
            onClick={() => navigate("/contact")}
            style={{
              background: "linear-gradient(135deg, #3B82F6, #6366F1)",
              color: "#fff",
              border: "none",
              padding: "15px 36px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 0 30px rgba(99,102,241,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            Get Free Consultation <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}