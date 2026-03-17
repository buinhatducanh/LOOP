"use client";

import { useState } from "react";
import { Briefcase } from "lucide-react";
import { projects as mockProjects } from "@/data/mockData";
import { ProjectCard } from "@/components/cards/ProjectCard";

type ProjectData = (typeof mockProjects)[number];

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

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return <div className="animate-fade-in" style={{ animationDelay: `${delay}s` }}>{children}</div>;
}

export function PortfolioPage({ projects = mockProjects }: { projects?: ProjectData[] }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const categories = ["All", ...Array.from(new Set(projects.map((p) => p.category)))];

  const filtered = activeFilter === "All"
    ? projects
    : projects.filter((p) => p.category === activeFilter);

  return (
    <div style={{ color: "#FFFFFF", minHeight: "100vh" }}>
      {/* Header */}
      <section
        style={{
          padding: "80px 24px 60px",
          background: "linear-gradient(to bottom, rgba(59,130,246,0.05), transparent)",
          borderBottom: "1px solid #1F2937",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="animate-pulse-slow"
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
        <div style={{ maxWidth: "1280px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div
            className="animate-scale-in"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "40px",
              padding: "6px 16px 6px 10px",
              marginBottom: "24px",
            }}
          >
            <Briefcase size={14} color="#6366F1" />
            <span style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 500 }}>
              Our Work
            </span>
          </div>
          <h1
            className="animate-slide-up"
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-2px",
              marginBottom: "20px",
            }}
          >
            Our <GradientText>Portfolio</GradientText>
          </h1>
          <p
            className="animate-slide-up"
            style={{
              color: "#94A3B8",
              fontSize: "18px",
              lineHeight: 1.7,
              maxWidth: "580px",
              margin: "0 auto",
              animationDelay: "0.1s",
            }}
          >
            Explore our latest projects — from e-commerce platforms to enterprise web
            applications. Real results for real businesses.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section style={{ padding: "60px 24px 80px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          {/* Category Filter */}
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              justifyContent: "center",
              marginBottom: "48px",
              animationDelay: "0.2s",
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className="transition-transform hover:scale-104 active:scale-96"
                style={{
                  background: activeFilter === cat
                    ? "linear-gradient(135deg, #3B82F6, #6366F1)"
                    : "rgba(99,102,241,0.1)",
                  color: activeFilter === cat ? "#FFFFFF" : "#94A3B8",
                  border: activeFilter === cat
                    ? "none"
                    : "1px solid rgba(99,102,241,0.3)",
                  padding: "8px 20px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "24px",
            }}
          >
            {filtered.map((project, i) => (
              <FadeIn key={project.id} delay={i * 0.08}>
                <ProjectCard project={project} />
              </FadeIn>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#94A3B8", fontSize: "16px" }}>
                No projects found in this category.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
