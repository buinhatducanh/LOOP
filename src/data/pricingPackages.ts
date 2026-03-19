// ─── PRICING PACKAGES — TYPES ONLY ─────────────────────────────────────────
// Actual data lives in the database. Use Admin → "Seed" button to populate.
// Import types from here for type safety across the codebase.

export interface WebPackage {
  id: string;
  name: string;
  nameVi: string;
  tagline: string;
  taglineVi: string;
  price: number;
  currency: "VND";
  period: string;
  periodVi: string;
  highlighted: boolean;
  cta: string;
  ctaVi: string;
  color: string;
  pages: string;
  pagesVi: string;
}

export interface ComparisonFeature {
  id: string;
  name: string;
  nameVi: string;
  tooltip?: string;
  tooltipVi?: string;
  values: Record<string, boolean | string>;
}

export interface FeatureCategory {
  id: string;
  name: string;
  nameVi: string;
  features: ComparisonFeature[];
}

export interface HostingPlan {
  id: string;
  name: string;
  nameVi: string;
  price: number;
  period: string;
  periodVi: string;
  features: string[];
  featuresVi: string[];
  highlighted: boolean;
  color: string;
}

export interface DomainPrice {
  extension: string;
  registrationPrice: number;
  renewalPrice: number;
  period: string;
  periodVi: string;
  note?: string;
  noteVi?: string;
}

export interface DeploymentHandoff {
  id: string;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  handedToClient: boolean;
  icon: string;
  note?: string;
  noteVi?: string;
}

export const formatVND = (price: number): string =>
  new Intl.NumberFormat("vi-VN").format(price) + "₫";
