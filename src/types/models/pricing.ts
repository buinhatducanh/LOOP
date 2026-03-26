// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { Order } from "./commerce";
import type { Quote } from "./referral";

export type FeatureGroup = {
  id: string;
  groupName: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  features: Feature[];
};

export type Feature = {
  id: string;
  groupId: string;
  group: FeatureGroup;
  featureName: string;
  description: string | null;
  logicLevel: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  variants: FeatureVariant[];
};

export type FeatureVariant = {
  id: string;
  featureId: string;
  feature: Feature;
  variantName: string;
  description: string | null;
  price: number;
  resourceUsage: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type QuoteRequest = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  selectedItems: Record<string, unknown>;
  totalAmount: number;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InfrastructureTier = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  monthlyCost: number;
  setupCost: number;
  description: string | null;
  descriptionVi: string | null;
  icon: string | null;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  orders: Order[];
  quotes: Quote[];
};

export type PricingWebPackage = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  tagline: string;
  taglineVi: string;
  price: number;
  currency: string;
  period: string;
  periodVi: string;
  highlighted: boolean;
  cta: string;
  ctaVi: string;
  color: string;
  pages: string;
  pagesVi: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PricingFeatureCategory = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  sortOrder: number;
  isActive: boolean;
  features: PricingComparisonFeature[];
};

export type PricingComparisonFeature = {
  id: string;
  categoryId: string;
  category: PricingFeatureCategory;
  name: string;
  nameVi: string;
  tooltip: string | null;
  tooltipVi: string | null;
  values: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
};

export type PricingHostingPlan = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  price: number;
  period: string;
  periodVi: string;
  features: string[];
  featuresVi: string[];
  highlighted: boolean;
  color: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PricingDomainPrice = {
  id: string;
  extension: string;
  registrationPrice: number;
  renewalPrice: number;
  period: string;
  periodVi: string;
  note: string | null;
  noteVi: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type PricingDeploymentItem = {
  id: string;
  slug: string;
  title: string;
  titleVi: string;
  description: string;
  descriptionVi: string;
  handedToClient: boolean;
  icon: string;
  note: string | null;
  noteVi: string | null;
  sortOrder: number;
  isActive: boolean;
};
