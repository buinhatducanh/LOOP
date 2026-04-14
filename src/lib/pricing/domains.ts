/**
 * Domain pricing — static prices for common TLDs.
 * Production-ready: loaded from PricingDomainPrice DB table via API.
 * This module serves as fallback + initial seed reference.
 *
 * Prices are annual registration costs in VND (including VAT).
 * sourced from common Vietnam domain registrars (2026).
 */

export const DOMAIN_PRICES: Record<string, { price: number; renewPrice: number; transferPrice: number }> = {
 "com.vn": { price: 299000, renewPrice: 299000, transferPrice: 349000 },
 "vn": { price: 350000, renewPrice: 350000, transferPrice: 400000 },
 "com": { price: 299000, renewPrice: 299000, transferPrice: 350000 },
 "net": { price: 350000, renewPrice: 350000, transferPrice: 400000 },
 "io": { price: 890000, renewPrice: 890000, transferPrice: 990000 },
 "co": { price: 450000, renewPrice: 450000, transferPrice: 550000 },
 "org": { price: 350000, renewPrice: 350000, transferPrice: 400000 },
 "info":  { price: 290000, renewPrice: 290000, transferPrice: 350000 },
 "biz": { price: 290000, renewPrice: 290000, transferPrice: 350000 },
 "app": { price: 250000, renewPrice: 250000, transferPrice: 300000 },
 "dev": { price: 250000, renewPrice: 250000, transferPrice: 300000 },
 "online": { price: 290000, renewPrice: 290000, transferPrice: 350000 },
 "shop": { price: 450000, renewPrice: 450000, transferPrice: 550000 },
 "vn.com": { price: 250000, renewPrice: 250000, transferPrice: 300000 },
 "cc": { price: 550000, renewPrice: 550000, transferPrice: 650000 },
 "me": { price: 450000, renewPrice: 450000, transferPrice: 550000 },
};

export const POPULAR_TLDS = ["com.vn", "vn", "com", "net", "io", "co"];

export const TLD_LABELS: Record<string, string> = {
 "com.vn": "Miễn phí DNS, Chuyển đổi miễn phí",
 "vn": "Miễn phí DNS, Chuyển đổi miễn phí",
 "com": "Quốc tế phổ biến",
 "net": "Quốc tế mạng",
 "io": "Công nghệ, Startup",
 "co": "Công ty quốc tế",
};

/** Quick lookup: TLD → annual price in VND */
export default Object.fromEntries(
 Object.entries(DOMAIN_PRICES).map(([tld, v]) => [tld, v.price]),
) as Record<string, number>;
