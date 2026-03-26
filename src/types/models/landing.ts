// Auto-generated from Prisma schema — do not edit
// Regenerate: python gen_types.py

export type LandingPage = {
  id: string;
  slug: string;
  name: string;
  locale: string;
  isPublished: boolean;
  isDefault: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
  seoKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  sections: LandingSection[];
};

export type LandingSection = {
  id: string;
  pageId: string;
  page: LandingPage;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown> | null;
  styles: Record<string, unknown> | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type HomeSlider = {
  id: string;
  image: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type HomeVideo = {
  id: string;
  videoUrl: string;
  thumbnail: string | null;
  title: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SiteSetting = {
  id: string;
  key: string;
  value: string;
  type: string;
  group: string;
};
