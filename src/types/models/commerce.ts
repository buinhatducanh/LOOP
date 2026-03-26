// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { CustomerWebsite } from "./customer";
import type { LpAward } from "./gamification";
import type { InfrastructureTier } from "./pricing";
import type { Backlog, BlogPost, DailyStandup, Deployment, EnvFile, Epic, FigmaDemo, GitCommit, GscMetric, HandoverPackage, MaintenanceContract, ProjectMember, ProjectPortalToken, SlaRule, SocialPost } from "./project";
import type { Quote, ReferralCode, SalesLead } from "./referral";
import type { OrderAttribute, OrderReward, WebTemplate } from "./services";

export type Order = {
  id: string;
  orderNumber: string;
  orderType: string;
  packageId: string | null;
  package: ServicePackage | null;
  templateId: string | null;
  template: WebTemplate | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  requirements: string | null;
  brandGuidelines: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
  basePrice: number | null;
  systemCalculatedPrice: number | null;
  adminOverridePrice: number | null;
  adminPriceNote: string | null;
  finalPrice: number | null;
  totalXp: number;
  rewardLevel: number;
  paymentMethod: string | null;
  paidAmount: number;
  domainName: string | null;
  selectedAttributes: OrderAttribute[];
  orderRewards: OrderReward[];
  payments: Payment[];
  statusHistory: OrderStatusHistory[];
  customerWebsites: CustomerWebsite[];
  projectStatus: string | null;
  gitRepoUrl: string | null;
  gitWebhookSecret: string | null;
  totalProjectLp: number;
  seoMaxLp: number;
  isActiveProject: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  salesLeadId: string | null;
  salesLead: SalesLead | null;
  quotes: Quote[];
  projectMembers: ProjectMember[];
  epics: Epic[];
  backlogs: Backlog[];
  figmaDemos: FigmaDemo[];
  envFiles: EnvFile[];
  socialPosts: SocialPost[];
  deployments: Deployment[];
  handoverPackages: HandoverPackage[];
  dailyStandups: DailyStandup[];
  blogPosts: BlogPost[];
  gitCommits: GitCommit[];
  lpAwards: LpAward[];
  slaRules: SlaRule[];
  maintenanceContracts: MaintenanceContract[];
  gscMetrics: GscMetric[];
  portalTokens: ProjectPortalToken[];
  referralCodeId: string | null;
  referralCode: ReferralCode | null;
  infrastructureTierId: string | null;
  infrastructureTier: InfrastructureTier | null;
  lpAllocation: Record<string, unknown> | null;
};

export type ServicePackage = {
  id: string;
  slug: string;
  title: string;
  type: string;
  price: number | null;
  priceText: string | null;
  shortDesc: string;
  features: string[];
  isSubscription: boolean;
  billingPeriod: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  orders: Order[];
};

export type Payment = {
  id: string;
  orderId: string;
  order: Order;
  amount: number;
  method: string | null;
  note: string | null;
  confirmedBy: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
};

export type OrderStatusHistory = {
  id: string;
  orderId: string;
  order: Order;
  fromStatus: string;
  toStatus: string;
  changedBy: string | null;
  note: string | null;
  createdAt: Date;
};
