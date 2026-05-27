"use client";
// Refreshed components - 22:28:40

import "./landing2.css";
import { LP2Navbar } from "./sections/LP2Navbar";
import { LP2TrustedLogos } from "./sections/LP2TrustedLogos";
import { LP2Services } from "./sections/LP2Services";
import { LP2ImageStrip } from "./sections/LP2ImageStrip";
import { LP2FeaturedProjects } from "./sections/LP2FeaturedProjects";
import { LP2Pricing } from "./sections/LP2Pricing";
import { LP2Testimonials } from "./sections/LP2Testimonials";
import { LP2FAQ } from "./sections/LP2FAQ";
import { LP2CTABanner } from "./sections/LP2CTABanner";
import { LP2Footer } from "./sections/LP2Footer";
import { LP2ScrollReveal } from "./sections/LP2ScrollReveal";
import { LP2VideoHero } from "./sections/LP2VideoHero";
import dynamic from "next/dynamic";

const LP2FloatingContact = dynamic(
  () => import("./sections/LP2FloatingContact").then((mod) => mod.LP2FloatingContact),
  { ssr: false }
);

export default function Landing2Client({ locale = "vi", settings, dbServices, dbFaqs, dbProjects, dbPortfolioImages }: { locale?: string; settings: Record<string, string>; dbServices: any[]; dbFaqs: any[]; dbProjects: any[]; dbPortfolioImages: any[] }) {
  return (
    <div className="lp2-root">
      <LP2Navbar locale={locale} settings={settings} />
      <main style={{ position: "relative", overflowX: "hidden" }}>
        <LP2VideoHero />
        <LP2ScrollReveal intensity="gentle"><LP2TrustedLogos /></LP2ScrollReveal>
        <LP2ScrollReveal intensity="medium"><LP2Services dbServices={dbServices} /></LP2ScrollReveal>
        <LP2ScrollReveal intensity="gentle"><LP2ImageStrip dbPortfolioImages={dbPortfolioImages} /></LP2ScrollReveal>
        <LP2ScrollReveal intensity="medium"><LP2FeaturedProjects dbProjects={dbProjects} /></LP2ScrollReveal>
        <LP2ScrollReveal intensity="medium"><LP2Pricing /></LP2ScrollReveal>
        <LP2ScrollReveal intensity="medium"><LP2Testimonials /></LP2ScrollReveal>
        <LP2ScrollReveal intensity="gentle"><LP2FAQ dbFaqs={dbFaqs} /></LP2ScrollReveal>
        <LP2ScrollReveal intensity="strong"><LP2CTABanner settings={settings} /></LP2ScrollReveal>
      </main>
      <LP2Footer settings={settings} />
      <LP2FloatingContact settings={settings} />
    </div>
  );
}

