// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { Order } from "./commerce";
import type { LpRedemption } from "./gamification";

export type AddonService = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  icon: string | null;
  type: string;
  price: number;
  billingPeriod: string | null;
  lpCost: number | null;
  metadata: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  rewardTierItems: RewardTierItem[];
  orderRewards: OrderReward[];
  redemptions: LpRedemption[];
};

export type ServiceAttribute = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  category: string;
  categoryVi: string;
  icon: string | null;
  price: number;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tier: string;
  xpPoints: number;
  parentId: string | null;
  parent: ServiceAttribute | null;
  children: ServiceAttribute[];
  templateAttributes: WebTemplateAttribute[];
  orderAttributes: OrderAttribute[];
};

export type WebTemplate = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  category: string;
  categoryVi: string;
  thumbnail: string;
  screenshots: string[];
  demoUrl: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  technologies: string[];
  deliveryTime: string;
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  level: number;
  levelLabel: string | null;
  levelLabelVi: string | null;
  bundledAttributes: WebTemplateAttribute[];
  orders: Order[];
};

export type WebTemplateAttribute = {
  id: string;
  templateId: string;
  template: WebTemplate;
  attributeId: string;
  attribute: ServiceAttribute;
};

export type OrderAttribute = {
  id: string;
  orderId: string;
  order: Order;
  attributeId: string;
  attribute: ServiceAttribute;
  priceAtOrder: number;
};

export type RewardTier = {
  id: string;
  level: number;
  name: string;
  nameVi: string;
  description: string | null;
  minXp: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: RewardTierItem[];
};

export type RewardTierItem = {
  id: string;
  rewardTierId: string;
  rewardTier: RewardTier;
  addonServiceId: string;
  addonService: AddonService;
  quantity: number;
  durationMonths: number | null;
  description: string | null;
  sortOrder: number;
};

export type OrderReward = {
  id: string;
  orderId: string;
  order: Order;
  addonServiceId: string;
  addonService: AddonService;
  rewardLevel: number;
  quantity: number;
  durationMonths: number | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  createdAt: Date;
};
