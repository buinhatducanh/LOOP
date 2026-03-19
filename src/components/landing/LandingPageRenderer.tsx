"use client";

import { SectionRenderer } from "./SectionRenderer";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SpeedDial } from "@/components/shared/SpeedDial";
import { TawktoChat } from "@/components/shared/TawktoChat";

interface LandingSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  styles: any;
  sortOrder: number;
  isActive: boolean;
}

interface LandingPage {
  id: string;
  slug: string;
  name: string;
  locale: string;
  isPublished: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  sections: LandingSection[];
}

interface Props {
  page: LandingPage;
  locale: string;
}

export function LandingPageRenderer({ page, locale }: Props) {
  const activeSections = page.sections.filter((s) => s.isActive);

  return (
    <div
      style={{
        background: "#020617",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      <main style={{ flex: 1 }}>
        {activeSections.map((section) => (
          <SectionRenderer
            key={section.id}
            type={section.type}
            content={section.content}
            styles={section.styles}
          />
        ))}
      </main>

      <Footer />
      <SpeedDial />
      <TawktoChat />
    </div>
  );
}
