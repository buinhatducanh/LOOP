"use client";
import { useRef } from "react";
import { MapPin, Phone, Mail, Globe, ExternalLink, Play, Briefcase } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";

const footerLinks = {
  services: [
    { label: "Thiết kế Website", href: "#services" },
    { label: "Sản xuất Media", href: "#services" },
    { label: "Digital Marketing", href: "#services" },
    { label: "Branding Strategy", href: "#services" },
    { label: "Ứng dụng & App", href: "#services" },
    { label: "Tư vấn & Giải pháp", href: "#services" },
  ],
  about: [
    { label: "Giới thiệu", href: "#" },
    { label: "Tin tức", href: "#" },
    { label: "Tuyển dụng", href: "#" },
    { label: "Đối tác", href: "#" },
  ],
  support: [
    { label: "FAQ", href: "#faq" },
    { label: "Điều khoản dịch vụ", href: "#" },
    { label: "Chính sách bảo mật", href: "#" },
    { label: "Liên hệ", href: "#contact" },
  ],
};

const socials = [
  { icon: Globe, href: "#", label: "Facebook" },
  { icon: ExternalLink, href: "#", label: "Instagram" },
  { icon: Play, href: "#", label: "Youtube" },
  { icon: Briefcase, href: "#", label: "LinkedIn" },
];

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p style={{ fontSize: "var(--lp2-fs-xs)", fontWeight: "var(--lp2-fw-semibold)", letterSpacing: "var(--lp2-ls-wider)", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "var(--lp2-sp-5)" }}>{title}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--lp2-sp-3)" }}>
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-inverse-muted)", transition: "color var(--lp2-t-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--lp2-text-inverse)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--lp2-text-inverse-muted)")}>{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LP2Footer({ settings }: { settings: Record<string, string> }) {
  const footerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: footerRef, offset: ["start end", "end end"] });
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 1], [-3, 0, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.35, 1], [0.97, 1, 1]);

  const socials = [
    { icon: Globe, href: settings.contact_facebook, label: "Facebook" },
    { icon: ExternalLink, href: settings.contact_zalo, label: "Zalo" },
    { icon: Play, href: "#", label: "Youtube" },
    { icon: Briefcase, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer ref={footerRef} style={{ backgroundColor: "var(--lp2-bg-dark-2)", paddingTop: "var(--lp2-sp-section)", paddingBottom: "var(--lp2-sp-10)", borderTop: "1px solid var(--lp2-border-dark)", position: "relative" }}>
      <motion.div style={{ rotateX, scale, transformPerspective: 1600, transformOrigin: "center top", willChange: "transform" }}>
        <div className="lp2-container">
          <div className="lp2-grid-footer">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", flexDirection: "column", gap: "var(--lp2-sp-6)" }}>
              <div>
                <span style={{ fontSize: "var(--lp2-fs-2xl)", fontWeight: "var(--lp2-fw-extrabold)", color: "var(--lp2-text-inverse)", letterSpacing: "var(--lp2-ls-tight)", display: "block", marginBottom: "var(--lp2-sp-4)" }}>LOOPS</span>
                <p style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-inverse-muted)", lineHeight: "var(--lp2-lh-relaxed)", maxWidth: "300px" }}>LOOPS cung cấp giải pháp toàn diện về Website, Media, Marketing &amp; Branding giúp doanh nghiệp tăng trưởng bền vững trong kỷ nguyên số.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--lp2-sp-3)" }}>
                {[
                  { icon: MapPin, text: settings.contact_address },
                  { icon: Phone, text: settings.contact_hotline },
                  { icon: Mail, text: settings.contact_email },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "var(--lp2-sp-3)" }}>
                    <Icon size={14} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span style={{ fontSize: "var(--lp2-fs-sm)", color: "var(--lp2-text-inverse-muted)" }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "var(--lp2-sp-3)" }}>
                {socials.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} style={{ width: "36px", height: "36px", borderRadius: "var(--lp2-r-md)", backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all var(--lp2-t-base)" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                    <Icon size={15} color="rgba(255,255,255,0.7)" />
                  </a>
                ))}
              </div>

            </motion.div>
            <FooterCol title="Dịch vụ" links={footerLinks.services} />
            <FooterCol title="Về chúng tôi" links={footerLinks.about} />
            <FooterCol title="Hỗ trợ" links={footerLinks.support} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--lp2-sp-4)", flexWrap: "wrap" }}>
            <p style={{ fontSize: "var(--lp2-fs-xs)", color: "rgba(255,255,255,0.3)" }}>© 2024 LOOPS Studio. All rights reserved.</p>
            <a href="#" style={{ fontSize: "var(--lp2-fs-xs)", color: "rgba(255,255,255,0.3)", transition: "color var(--lp2-t-fast)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>www.loops.studio</a>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
