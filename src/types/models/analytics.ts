// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

export type ServerAnalyticsEvent = {
  id: string;
  event: string;
  properties: Record<string, unknown>;
  sessionId: string | null;
  visitorId: string | null;
  userId: string | null;
  locale: string | null;
  page: string | null;
  referrer: string | null;
  userAgent: string | null;
  ip: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  createdAt: Date;
};
