"use client";

import { useRef, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Users,
  Award,
  Zap,
  Globe,
  ShieldCheck,
  Play,
} from "lucide-react";
import {
  services as mockServices,
  projects as mockProjects,
  testimonials as mockTestimonials,
} from "@/data/mockData";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { HeroCanvas } from "@/components/shared/HeroCanvas";

interface StatsData {
  projects?: string;
  satisfaction?: string;
  teamSize?: string;
  years?: string;
}

interface HomePageProps {
  services?: typeof mockServices;
  projects?: typeof mockProjects;
  testimonials?: typeof mockTestimonials;
  stats?: StatsData;
}

const getStats = (t: any, data?: StatsData) => [
  { value: data?.projects || "150+", label: t('projects_label'), icon: TrendingUp },
  { value: data?.satisfaction || "98%", label: t('satisfaction_label'), icon: Star },
  { value: data?.teamSize || "50+", label: t('team_label'), icon: Users },
  { value: data?.years || "8+", label: t('years_label'), icon: Award },
];

const getWhyUs = (t: any) => [
  { icon: Zap, title: t('fastTitle'), desc: t('fastDesc') },
  { icon: Globe, title: t('globalTitle'), desc: t('globalDesc') },
  { icon: ShieldCheck, title: t('qualityTitle'), desc: t('qualityDesc') },
  { icon: Award, title: t('awardTitle'), desc: t('awardDesc') },
];

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: "linear-gradient(135deg, #3B82F6, #6366F1)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}

function FadeInSection({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-in ${className || ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export function HomePage({
  services = mockServices,
  projects = mockProjects,
  testimonials = mockTestimonials,
  stats: statsData,
}: HomePageProps) {
  const router = useRouter();
  const t = useTranslations('HomePage');
  const tStats = useTranslations('Stats');
  const tWhy = useTranslations('WhyUs');

  const stats = useMemo(() => getStats(tStats, statsData), [tStats, statsData]);
  const whyUs = useMemo(() => getWhyUs(tWhy), [tWhy]);

  return (
    <div style={{ color: "#FFFFFF" }}>
      {/* --- HERO (Animated Canvas Video) --- */}
      <section
        style={{
          position: "relative",
          minHeight: "calc(100vh - 68px)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "#020617",
        }}
      >
        {/* Animated canvas background */}
        <HeroCanvas />

        {/* Gradient overlays */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 20% 40%, rgba(59,130,246,0.08) 0%, transparent 60%)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 80% 60%, rgba(99,102,241,0.08) 0%, transparent 60%)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "200px",
            background: "linear-gradient(to bottom, transparent, #020617)",
            zIndex: 2,
          }}
        />

        {/* Floating animated orbs */}
        <div
          className="animate-float-1"
          style={{
            position: "absolute",
            top: "15%",
            right: "8%",
            width: "300px",
            height: "300px",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            zIndex: 1,
          }}
        />
        <div
          className="animate-float-2"
          style={{
            position: "absolute",
            top: "30%",
            left: "5%",
            width: "250px",
            height: "250px",
            background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 3,
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "80px 24px",
            width: "100%",
          }}
        >
          <div style={{ maxWidth: "820px" }}>
            {/* Badge */}
            <div
              className="animate-fade-in"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: "40px",
                padding: "6px 16px 6px 10px",
                marginBottom: "32px",
              }}
            >
              <div
                className="animate-pulse"
                style={{
                  width: "20px",
                  height: "20px",
                  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={11} color="#fff" />
              </div>
              <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>
                {t('badge')}
              </span>
            </div>

            <h1
              className="animate-fade-in"
              style={{
                fontSize: "clamp(38px, 6vw, 76px)",
                fontWeight: 800,
                lineHeight: 1.08,
                marginBottom: "24px",
                letterSpacing: "-2px",
                animationDelay: "0.1s",
              }}
            >
              {t('heroTitle1')}
              <br />
              {t('heroTitle2')} <GradientText>{t('heroHighlight1')}</GradientText> &{" "}
              <GradientText>{t('heroHighlight2')}</GradientText>
            </h1>

            <p
              className="animate-fade-in"
              style={{
                color: "#94A3B8",
                fontSize: "clamp(16px, 2vw, 20px)",
                lineHeight: 1.7,
                marginBottom: "40px",
                maxWidth: "600px",
                animationDelay: "0.2s",
              }}
            >
              {t('heroDesc')}
            </p>

            {/* Trust badges */}
            <div
              className="animate-fade-in"
              style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "48px", animationDelay: "0.3s" }}
            >
              {[t('trustProjects'), t('trustSatisfaction'), t('trustResponse')].map(
                (text, i) => (
                  <div
                    key={text}
                    className="animate-fade-in"
                    style={{ display: "flex", alignItems: "center", gap: "8px", animationDelay: `${0.4 + i * 0.1}s` }}
                  >
                    <CheckCircle size={16} color="#3B82F6" />
                    <span style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 500 }}>
                      {text}
                    </span>
                  </div>
                )
              )}
            </div>

            <div
              className="animate-fade-in"
              style={{ display: "flex", flexWrap: "wrap", gap: "16px", animationDelay: "0.5s" }}
            >
              <button
                className="btn-hover-scale"
                onClick={() => router.push("/services")}
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 0 40px rgba(99,102,241,0.4)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                {t('btnServices')} <ArrowRight size={18} />
              </button>
              <button
                className="btn-hover-scale"
                onClick={() => router.push("/portfolio")}
                style={{
                  background: "rgba(0,0,0,0)",
                  color: "#FFFFFF",
                  border: "1px solid #1F2937",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "transform 0.2s, border-color 0.2s, background 0.2s",
                }}
              >
                <Play size={16} /> {t('btnPortfolio')}
              </button>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="animate-bounce-slow"
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              color: "#4B5563",
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            {t('scroll')}
          </span>
          <div
            style={{
              width: "1px",
              height: "40px",
              background: "linear-gradient(to bottom, #4B5563, transparent)",
            }}
          />
        </div>
      </section>

      {/* --- STATS --- */}
      <section
        style={{
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
          padding: "60px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "32px",
          }}
        >
          {stats.map(({ value, label, icon: Icon }, i) => (
            <FadeInSection key={label} delay={i * 0.1}>
              <div style={{ textAlign: "center" }}>
                <div
                  className="icon-hover-scale"
                  style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "rgba(59,130,246,0.1)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.2s",
                    }}
                  >
                    <Icon size={22} color="#3B82F6" />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "38px",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 500, marginTop: "4px" }}
                >
                  {label}
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* --- SERVICES PREVIEW --- */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeInSection>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <span
                style={{
                  color: "#3B82F6",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {t('servicesSub')}
              </span>
              <h2
                style={{
                  fontSize: "clamp(30px, 4vw, 48px)",
                  fontWeight: 800,
                  marginTop: "12px",
                  marginBottom: "16px",
                  letterSpacing: "-1px",
                }}
              >
                {t('servicesTitle')} <GradientText>{t('servicesHighlight')}</GradientText>
              </h2>
              <p
                style={{
                  color: "#94A3B8",
                  fontSize: "16px",
                  maxWidth: "500px",
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                {t('servicesDesc')}
              </p>
            </div>
          </FadeInSection>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: "24px",
              marginBottom: "48px",
            }}
          >
            {services.slice(0, 3).map((service, i) => (
              <FadeInSection key={service.id} delay={i * 0.1}>
                <ServiceCard service={service} />
              </FadeInSection>
            ))}
          </div>

          <FadeInSection>
            <div style={{ textAlign: "center" }}>
              <button
                className="btn-hover-scale"
                onClick={() => router.push("/services")}
                style={{
                  background: "rgba(0,0,0,0)",
                  color: "#3B82F6",
                  border: "1px solid #3B82F6",
                  padding: "13px 32px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                {t('btnAllServices')} <ArrowRight size={16} />
              </button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- PORTFOLIO PREVIEW --- */}
      <section
        style={{
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
          padding: "100px 24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeInSection>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <span
                style={{
                  color: "#6366F1",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {t('portfolioSub')}
              </span>
              <h2
                style={{
                  fontSize: "clamp(30px, 4vw, 48px)",
                  fontWeight: 800,
                  marginTop: "12px",
                  marginBottom: "16px",
                  letterSpacing: "-1px",
                }}
              >
                {t('portfolioTitle')} <GradientText>{t('portfolioHighlight')}</GradientText>
              </h2>
              <p
                style={{
                  color: "#94A3B8",
                  fontSize: "16px",
                  maxWidth: "500px",
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                {t('portfolioDesc')}
              </p>
            </div>
          </FadeInSection>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px",
              marginBottom: "48px",
            }}
          >
            {projects.slice(0, 3).map((project, i) => (
              <FadeInSection key={project.id} delay={i * 0.12}>
                <ProjectCard project={project} />
              </FadeInSection>
            ))}
          </div>

          <FadeInSection>
            <div style={{ textAlign: "center" }}>
              <button
                className="btn-hover-scale"
                onClick={() => router.push("/portfolio")}
                style={{
                  background: "rgba(0,0,0,0)",
                  color: "#6366F1",
                  border: "1px solid #6366F1",
                  padding: "13px 32px",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                {t('btnAllProjects')} <ArrowRight size={16} />
              </button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* --- WHY US --- */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{ display: "grid", gap: "64px", alignItems: "center" }}
            className="grid-cols-1 lg:grid-cols-2"
          >
            <FadeInSection>
              <div>
                <span
                  style={{
                    color: "#3B82F6",
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                  }}
                >
                  {t('whySub')}
                </span>
                <h2
                  style={{
                    fontSize: "clamp(28px, 3vw, 44px)",
                    fontWeight: 800,
                    marginTop: "12px",
                    marginBottom: "20px",
                    letterSpacing: "-1px",
                    lineHeight: 1.15,
                  }}
                >
                  {t('whyTitle1')}
                  <br />
                  {t('whyTitle2')} <GradientText>{t('whyHighlight')}</GradientText>
                </h2>
                <p
                  style={{
                    color: "#94A3B8",
                    fontSize: "16px",
                    lineHeight: 1.7,
                    marginBottom: "32px",
                  }}
                >
                  {t('whyDesc')}
                </p>
                <button
                  className="btn-hover-scale"
                  onClick={() => router.push("/about")}
                  style={{
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    color: "#fff",
                    border: "none",
                    padding: "13px 28px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                    transition: "transform 0.2s",
                  }}
                >
                  {t('btnAbout')} <ArrowRight size={16} />
                </button>
              </div>
            </FadeInSection>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {whyUs.map(({ icon: Icon, title, desc }, i) => (
                <FadeInSection key={title} delay={i * 0.1}>
                  <div
                    className="card-hover"
                    style={{
                      background: "#0F172A",
                      border: "1px solid #1F2937",
                      borderRadius: "14px",
                      padding: "24px",
                      cursor: "default",
                      transition: "border-color 0.3s, transform 0.3s",
                    }}
                  >
                    <div
                      className="icon-hover-rotate"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "rgba(59,130,246,0.1)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "14px",
                        transition: "transform 0.2s",
                      }}
                    >
                      <Icon size={20} color="#3B82F6" />
                    </div>
                    <h4
                      style={{
                        color: "#FFFFFF",
                        fontSize: "14px",
                        fontWeight: 700,
                        marginBottom: "8px",
                      }}
                    >
                      {title}
                    </h4>
                    <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section
        style={{
          background: "#0F172A",
          borderTop: "1px solid #1F2937",
          borderBottom: "1px solid #1F2937",
          padding: "100px 24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <FadeInSection>
            <div style={{ textAlign: "center", marginBottom: "64px" }}>
              <span
                style={{
                  color: "#6366F1",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                {t('testimonialSub')}
              </span>
              <h2
                style={{
                  fontSize: "clamp(30px, 4vw, 48px)",
                  fontWeight: 800,
                  marginTop: "12px",
                  letterSpacing: "-1px",
                }}
              >
                {t('testimonialTitle')} <GradientText>{t('testimonialHighlight')}</GradientText>
              </h2>
            </div>
          </FadeInSection>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {testimonials.map((t, i) => (
              <FadeInSection key={t.id} delay={i * 0.1}>
                <div
                  className="card-hover"
                  style={{
                    background: "#020617",
                    border: "1px solid #1F2937",
                    borderRadius: "16px",
                    padding: "28px",
                    height: "100%",
                    transition: "border-color 0.3s, transform 0.3s",
                    cursor: "default",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {Array.from({ length: t.rating }).map((_, idx) => (
                        <div
                          key={idx}
                          className="animate-scale-in"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "12px" }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600 }}>Verified</span>
                    </div>
                  </div>
                  <p
                    style={{
                      color: "#94A3B8",
                      fontSize: "14px",
                      lineHeight: 1.7,
                      marginBottom: "20px",
                      fontStyle: "italic",
                    }}
                  >
                    &quot;{t.text}&quot;
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      paddingTop: "16px",
                      borderTop: "1px solid #1F2937",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>
                        {t.avatar}
                      </span>
                    </div>
                    <div>
                      <p style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 600 }}>
                        {t.name}
                      </p>
                      <p style={{ color: "#94A3B8", fontSize: "12px" }}>
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
        <div
          className="animate-pulse-slow"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
          }}
        >
          <FadeInSection>
            <div
              className="animate-scale-in"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "40px",
                padding: "6px 20px",
                marginBottom: "24px",
              }}
            >
              <span style={{ color: "#6366F1", fontSize: "13px", fontWeight: 600 }}>
                {t('ctaSub')}
              </span>
            </div>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 58px)",
                fontWeight: 800,
                letterSpacing: "-2px",
                marginBottom: "20px",
                lineHeight: 1.1,
              }}
            >
              {t('ctaTitle1')} <GradientText>{t('ctaHighlight')}</GradientText> {t('ctaTitle2')}
              <br />
              {t('ctaTitle3')}
            </h2>
            <p
              style={{
                color: "#94A3B8",
                fontSize: "18px",
                lineHeight: 1.7,
                marginBottom: "48px",
              }}
            >
              {t('ctaDesc')}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <button
                className="btn-hover-scale"
                onClick={() => router.push("/contact")}
                style={{
                  background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                  color: "#fff",
                  border: "none",
                  padding: "18px 44px",
                  borderRadius: "12px",
                  fontSize: "17px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 0 60px rgba(99,102,241,0.4)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                {t('btnStart')} <ArrowRight size={18} />
              </button>
              <button
                className="btn-hover-scale"
                onClick={() => router.push("/pricing")}
                style={{
                  background: "rgba(0,0,0,0)",
                  color: "#94A3B8",
                  border: "1px solid #1F2937",
                  padding: "18px 44px",
                  borderRadius: "12px",
                  fontSize: "17px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {t('btnPricing')}
              </button>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
