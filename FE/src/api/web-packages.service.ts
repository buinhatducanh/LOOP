/**
 * LOOP Solutions — Web Packages API Service
 *
 * BE endpoints:
 * GET    /api/admin/packages/web-packages        → { data: BeWebPackage[] }
 * POST   /api/admin/packages/web-packages    → { data: BeWebPackage }
 * PUT    /api/admin/packages/web-packages/[id] → { data: BeWebPackage }
 * DELETE /api/admin/packages/web-packages/[id] → {}
 */
import { api } from './client';
import type { WebPackage } from '../app/pages/ServicesPage';

// ── BE response type ────────────────────────────────────────────────────────────
interface BeWebPackage {
  id: string;
  slug: string;
  name: string;
  nameVi: string | null;
  tagline: string | null;
  taglineVi: string | null;
  price: number | null;
  currency: string | null;
  period: string | null;
  periodVi: string | null;
  highlighted: boolean | null;
  cta: string | null;
  ctaVi: string | null;
  color: string | null;
  pages: string | null;
  pagesVi: string | null;
  sortOrder: number | null;
  isActive: boolean;
}

// ── Mapping: BE → FE WebPackage ──────────────────────────────────────────────────
function mapBeToWebPackage(be: BeWebPackage): WebPackage {
  return {
    id: be.slug,
    industry: be.nameVi ?? be.name,
    icon: '🌐',
    color: be.color ?? '#3B82F6',
    gradFrom: be.color ?? '#3B82F6',
    gradTo: '#818CF8',
    tagline: be.taglineVi ?? be.tagline ?? '',
    description: '',
    trialDays: 5,
    trialPrice: 0,
    fullPrice: be.price ?? 0,
    activateTime: be.period ?? '2 giờ',
    badge: be.highlighted ? 'NỔI BẬT' : undefined,
    badgeColor: be.color ?? '#3B82F6',
    features: [],
    demoFeatures: [],
    previewImg: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=600&q=80',
    category: 'ăn uống',
    popular: be.highlighted ?? false,
    lp: 0,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────
export interface WebPackagesResult {
  packages: WebPackage[];
}

export const webPackagesService = {
  /**
   * GET /api/admin/packages/web-packages
   */
  getPackages: async (): Promise<WebPackage[]> => {
    const res = await api.get<{ data: BeWebPackage[] }>('/admin/packages/web-packages');
    return res.data.map(mapBeToWebPackage);
  },

  /**
   * POST /api/admin/packages/web-packages
   */
  createPackage: async (data: {
    slug: string;
    name: string;
    nameVi?: string;
    price?: number;
    period?: string;
    periodVi?: string;
    tagline?: string;
    taglineVi?: string;
    color?: string;
    highlighted?: boolean;
    cta?: string;
    ctaVi?: string;
    pages?: string;
    pagesVi?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<WebPackage> => {
    const res = await api.post<{ data: BeWebPackage }>('/admin/packages/web-packages', {
      slug: data.slug ?? data.name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name,
      nameVi: data.nameVi ?? data.name,
      price: data.price ?? 0,
      period: data.period ?? '2 giờ',
      periodVi: data.periodVi ?? data.period ?? '2 giờ',
      tagline: data.tagline ?? '',
      taglineVi: data.taglineVi ?? data.tagline ?? '',
      color: data.color ?? '#3B82F6',
      highlighted: data.highlightged ?? false,
      cta: data.cta ?? 'Dùng thử miễn phí',
      ctaVi: data.ctaVi ?? data.cta ?? 'Dùng thử miễn phí',
      pages: data.pages ?? '',
      pagesVi: data.pagesVi ?? data.pages ?? '',
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    });
    return mapBeToWebPackage(res.data);
  },

  /**
   * PUT /api/admin/packages/web-packages/[id]
   */
  updatePackage: async (id: string, data: {
    name?: string;
    nameVi?: string;
    price?: number;
    period?: string;
    periodVi?: string;
    tagline?: string;
    taglineVi?: string;
    color?: string;
    highlighted?: boolean;
    cta?: string;
    ctaVi?: string;
    pages?: string;
    pagesVi?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<WebPackage> => {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) { payload.name = data.name; payload.nameVi = data.nameVi ?? data.name; }
    if (data.price !== undefined) payload.price = data.price;
    if (data.period !== undefined) { payload.period = data.period; payload.periodVi = data.periodVi ?? data.period; }
    if (data.tagline !== undefined) { payload.tagline = data.tagline; payload.taglineVi = data.taglineVi ?? data.tagline; }
    if (data.color !== undefined) payload.color = data.color;
    if (data.highlighted !== undefined) payload.highlighted = data.highlighted;
    if (data.cta !== undefined) { payload.cta = data.cta; payload.ctaVi = data.ctaVi ?? data.cta; }
    if (data.pages !== undefined) { payload.pages = data.pages; payload.pagesVi = data.pagesVi ?? data.pages; }
    if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    const res = await api.put<{ data: BeWebPackage }>(`/admin/packages/web-packages/${id}`, payload);
    return mapBeToWebPackage(res.data);
  },

  /**
   * DELETE /api/admin/packages/web-packages/[id]
   */
  deletePackage: async (id: string): Promise<void> => {
    await api.delete(`/admin/packages/web-packages/${id}`);
  },
};
