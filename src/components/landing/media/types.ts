/**
 * Media Page Shared Types
 */

export type MediaProject = {
  id: string;
  bookingNumber: string;
  title: string;
  customerName: string;
  bookingType: string;
  deliveredAssets: unknown;
  deliveredAt: string | null;
  teamMember: { name: string } | null;
  package: { title: string } | null;
  packageId: string | null;
  isFeatured: boolean;
};

export type MediaStoryItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  author: { name: string; image: string | null };
};

export type MediaTestimonialItem = {
  id: string;
  customerName: string;
  customerCompany: string | null;
  customerAvatar: string | null;
  rating: number;
  text: string;
  projectType: string | null;
};

export type MediaPackage = {
  id: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  shortDesc: string;
  shortDescEn?: string | null;
  price: number | null;
  priceText: string | null;
  features: string[];
  featuresEn?: string[];
  tagline: string | null;
  color: string | null;
  isPopular: boolean;
  type: string; // 'product' | 'content' | 'livestream' | 'bundle'
};
