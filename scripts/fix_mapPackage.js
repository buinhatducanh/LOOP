const fs = require('fs');
let content = fs.readFileSync('src/app/api/pricing/config/route.ts', 'utf-8');
const idx1 = content.indexOf('function mapPackage(');
const idx2 = content.indexOf('function mapFeature(');
const before = content.substring(0, idx1);
const after = content.substring(idx2);
const clean = `function mapPackage(
 p: {
 id: string;
 slug: string;
 title: string;
 titleEn?: string | null;
 titleJa?: string | null;
 titleKo?: string | null;
 titleZh?: string | null;
 shortDesc: string;
 shortDescEn?: string | null;
 shortDescJa?: string | null;
 shortDescKo?: string | null;
 shortDescZh?: string | null;
 price: number | null;
 priceText?: string | null;
 features: string[];
 type: string;
 isSubscription: boolean;
 billingPeriod?: string | null;
 sortOrder: number;
 videoUrl?: string | null;
 videoThumbnail?: string | null;
 showFeatureAcknowledge?: boolean;
 acknowledgmentItems?: unknown;
 },
 locale: Locale,
 marketPrices: Record<string, number>,
 allPackages: typeof arguments[0][],
) {
 const pkgPrice = p.price ?? 0;
 const marketPrice = marketPrices[p.slug] ?? pkgPrice;
 const saving = marketPrice - pkgPrice;

 // Compute allFeatures: union of features up to and including this package
 const allFeatures = [...new Set(
 allPackages
 .filter(other => other.sortOrder <= p.sortOrder)
 .flatMap(other => other.features ?? [])
 )];

 // Parse acknowledgment items from JSON
 const ackItems = (p.acknowledgmentItems ?? []) as {
 key: string;
 ackLabel: string;
 ackLabelEn?: string;
 icon?: string;
 sortOrder?: number;
 }[];

 // Build featureAcknowledgments map keyed by feature label
 const featureAcknowledgments: Record<string, (typeof ackItems)[0]> = {};
 for (const item of ackItems) {
 featureAcknowledgments[item.key] = item;
 }

 return {
 id: p.id,
 slug: p.slug,
 name: getLocalizedName(locale, p.title, p.title, p.titleEn, p.titleJa, p.titleKo, p.titleZh),
 desc: getLocalizedName(locale, p.shortDesc, p.shortDesc, p.shortDescEn, p.shortDescJa, p.shortDescKo, p.shortDescZh),
 priceText: p.priceText ?? (pkgPrice > 0 ? \`\${(pkgPrice / 1_000_000).toFixed(0)} triệu\` : "Liên hệ báo giá"),
 price: pkgPrice,
 multiplier: 1,
 features: p.features ?? [],
 /** All features up to this tier (inclusive) */
 allFeatures,
 type: p.type,
 isSubscription: p.isSubscription,
 billingPeriod: p.billingPeriod,
 marketPrice,
 savingPct: saving > 0 ? Math.round((saving / marketPrice) * 100) : 0,
 /** Video & acknowledgment fields */
 videoUrl: p.videoUrl ?? null,
 videoThumbnail: p.videoThumbnail ?? null,
 showFeatureAcknowledge: p.showFeatureAcknowledge ?? true,
 acknowledgmentItems: ackItems,
 featureAcknowledgments,
 };
}

`;
content = before + clean + after;
fs.writeFileSync('src/app/api/pricing/config/route.ts', content);
console.log('OK');
