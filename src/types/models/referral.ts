// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { Order } from "./commerce";
import type { InfrastructureTier } from "./pricing";
import type { TeamMember } from "./team";

export type ReferralCode = {
  id: string;
  code: string;
  name: string;
  memberId: string;
  campaign: string | null;
  minRevenue: number;
  maxRevenue: number | null;
  lpRate: number;
  useCount: number;
  maxUses: number | null;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  member: TeamMember;
  leads: SalesLead[];
  orders: Order[];
  tracking: ReferralTracking[];
};

export type ReferralTracking = {
  id: string;
  referralCodeId: string;
  event: string;
  landingUrl: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  ipHash: string | null;
  userAgent: string | null;
  salesLeadId: string | null;
  orderId: string | null;
  revenue: number;
  lpAwarded: number;
  createdAt: Date;
  referralCode: ReferralCode;
};

export type SalesLead = {
  id: string;
  source: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  companyName: string | null;
  area: string;
  tier: string;
  status: string;
  note: string | null;
  estimatedBudget: number | null;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
  quotes: Quote[];
  orders: Order[];
  referralCodeId: string | null;
  referralCode: ReferralCode | null;
};

export type Quote = {
  id: string;
  salesLeadId: string;
  salesLead: SalesLead;
  orderId: string | null;
  order: Order | null;
  quoteNumber: string;
  title: string;
  totalAmount: number;
  lpAllocation: Record<string, unknown>;
  selectedFeatureIds: Record<string, unknown> | null;
  infrastructureTierSlug: string | null;
  infrastructureTierId: string | null;
  infrastructureTier: InfrastructureTier | null;
  status: string;
  validUntil: Date | null;
  sentAt: Date | null;
  approvedAt: Date | null;
  signedAt: Date | null;
  milestones: Record<string, unknown> | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};
