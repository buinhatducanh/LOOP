/**
 * Shared constants for the LP economy and company contact info.
 * Single source of truth — import from here everywhere these values are used.
 */

/**
 * CEO Contact Information — LOOP Solutions
 * Used across: FloatingSocialButtons, SiteHeader, SiteFooter, ContactClient
 */
export const CEO_CONTACT = {
  phone: "0378443602",
  phoneDisplay: "037 844 3602",
  zaloUrl: "https://zalo.me/0378443602",
  facebookUrl: "https://www.facebook.com/tarun.ducanh/",
  email: "ducanhnhatbui@gmail.com",
} as const;

/** 1 LP = 20,000 VND (used for redemption calculation) */
export const LP_VND_RATE = 20_000;

/**
 * Loyalty LP reward rate for customers on service payment.
 * Awards: ceil(VND × 1/20000 × 0.10) LP per payment.
 * (1 VND = 0.00005 LP, then × 10% bonus)
 */
export const CUSTOMER_LP_RATE = 0.00005;

/**
 * Referral LP tier rates (% of service value awarded to referrer).
 * Applied on payment and again on completion (tier-upgrade bonus).
 */
export const REFERRAL_LP_TIERS = {
  TIER_1: { maxAmount: 50_000_000, rate: 0.05 },   // ≤50M: 5%
  TIER_2: { maxAmount: 200_000_000, rate: 0.07 },  // ≤200M: 7%
  TIER_3: { maxAmount: Infinity, rate: 0.10 },    // 200M+: 10%
} as const;

/**
 * Maximum LP an admin can adjust in a single manual transaction.
 */
export const ADMIN_LP_ADJUST_CAP = 100_000;

/**
 * Order LP allocation for team members (percentage of LP distributed per order).
 */
export const ORDER_LP_ALLOCATION_PERCENT = 0.10;
