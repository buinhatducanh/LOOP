// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

import type { Order } from "./commerce";

export type CustomerWebsite = {
  id: string;
  orderId: string | null;
  order: Order | null;
  domain: string;
  subdomain: string | null;
  name: string;
  description: string | null;
  hostingProvider: string | null;
  hostingUrl: string | null;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  isMonitored: boolean;
  deployedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  websiteStats: WebsiteStats[];
  pageViews: WebsitePageView[];
};

export type WebsiteStats = {
  id: string;
  websiteId: string;
  website: CustomerWebsite;
  date: Date;
  visitors: number;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number | null;
  avgSessionDuration: number | null;
  uptime: number;
  responseTime: number | null;
  errorRate: number;
  organicSearch: number;
  directTraffic: number;
  socialTraffic: number;
  referralTraffic: number;
  createdAt: Date;
};

export type WebsitePageView = {
  id: string;
  websiteId: string;
  website: CustomerWebsite;
  pageUrl: string;
  pageTitle: string | null;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number | null;
  exitRate: number | null;
  date: Date;
  createdAt: Date;
};

export type CustomerPoint = {
  id: string;
  userId: string | null;
  userEmail: string;
  userName: string | null;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  level: number;
  currentXp: number;
  loginStreak: number;
  lastLoginDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  transactions: PointTransaction[];
  adWatchHistory: AdWatchHistory[];
};

export type PointTransaction = {
  id: string;
  customerPointId: string;
  customerPoint: CustomerPoint;
  type: string;
  amount: number;
  source: string;
  description: string;
  referenceId: string | null;
  referenceType: string | null;
  status: string;
  expiresAt: Date | null;
  expiredAt: Date | null;
  createdAt: Date;
};

export type PointActivity = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  description: string | null;
  descriptionVi: string | null;
  points: number;
  xpBonus: number;
  dailyLimit: number | null;
  totalLimit: number | null;
  minLevel: number;
  requiresPurchase: boolean;
  isActive: boolean;
  sortOrder: number;
  adVideoUrl: string | null;
  adDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Advertisement = {
  id: string;
  slug: string;
  title: string;
  titleVi: string;
  description: string | null;
  descriptionVi: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  points: number;
  xpBonus: number;
  dailyLimit: number;
  watchCooldown: number;
  isActive: boolean;
  sortOrder: number;
  minLevel: number;
  requiresPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AdWatchHistory = {
  id: string;
  customerPointId: string;
  customerPoint: CustomerPoint;
  advertisementId: string;
  adSlug: string;
  watchedAt: Date;
  pointsEarned: number;
  xpEarned: number;
  completed: boolean;
  watchDuration: number;
  ipAddress: string | null;
  createdAt: Date;
};

export type DailyReward = {
  id: string;
  day: number;
  points: number;
  xpBonus: number;
  isActive: boolean;
  createdAt: Date;
};
