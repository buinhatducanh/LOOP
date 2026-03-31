/**
 * LOOP Solutions — Services API Service
 * Public + Admin services: list, detail, CRUD
 *
 * Public:
 * GET /api/v1/services?lang={locale}  → { data: { services, grouped, categories }, meta }
 * GET /api/v1/services/[slug]?lang=  → { data: service, meta }
 *
 * Admin:
 * GET    /api/admin/services         → { data: Service[], pagination }
 * POST   /api/admin/services         → { data: Service }
 * PUT    /api/admin/services/[id]     → { data: Service }
 * DELETE /api/admin/services/[id]     → {}
 */
import { api } from './client';
import { DS } from '../app/components/layout/ds';
import type { Service } from '../store/loopStore';

// ── Wizard config types (used by QuotationTab) ──────────────────────────────────
export interface WizardService {
  id: string; title: string; desc: string; basePrice: number;
  color: string; icon: string; active: boolean; perMonth?: boolean;
}

// ── BE response types ──────────────────────────────────────────────────────────
interface BeService {
  id: string;
  slug: string;
  icon: string | null;
  title: string;
  shortDescription: string;
  longDescription: string | null;
  features: string[];
  technologies: string[];
  startingPrice: number | null;
  deliveryTime: string | null;
  category: string | null;
  isActive: boolean;
  sortOrder: number | null;
  _localeUsed: string;
  // i18n fields
  titleEn?: string; titleJa?: string; titleKo?: string; titleZh?: string;
  shortDescriptionEn?: string; shortDescriptionJa?: string; shortDescriptionKo?: string; shortDescriptionZh?: string;
  longDescriptionEn?: string; longDescriptionJa?: string; longDescriptionKo?: string; longDescriptionZh?: string;
  featuresEn?: string[]; featuresJa?: string[]; featuresKo?: string[]; featuresZh?: string[];
  technologiesEn?: string[]; technologiesJa?: string[]; technologiesKo?: string[]; technologiesZh?: string[];
}

interface BeServicesResponse {
  data: {
    services: BeService[];
    grouped: Record<string, BeService[]>;
    categories: string[];
  };
  meta: { count: number; locale: string };
}

interface BeServiceDetailResponse {
  data: BeService;
  meta: { locale: string };
}

/** Admin service response — raw Prisma Service including i18n fields */
interface BeAdminService {
  id: string; slug: string; icon: string | null; title: string;
  shortDescription: string; longDescription: string | null;
  features: string[]; technologies: string[];
  startingPrice: number | null; deliveryTime: string | null;
  category: string | null; isActive: boolean; sortOrder: number | null;
  titleEn?: string; titleJa?: string; titleKo?: string; titleZh?: string;
  shortDescriptionEn?: string; shortDescriptionJa?: string; shortDescriptionKo?: string; shortDescriptionZh?: string;
  longDescriptionEn?: string; longDescriptionJa?: string; longDescriptionKo?: string; longDescriptionZh?: string;
  featuresEn?: string[]; featuresJa?: string[]; featuresKo?: string[]; featuresZh?: string[];
  technologiesEn?: string[]; technologiesJa?: string[]; technologiesKo?: string[]; technologiesZh?: string[];
}

/** Map BE admin service → FE Service (admin shape) */
function mapAdminService(be: BeAdminService): Service {
  const colorMap: Record<string, string> = {
    web: '#3B82F6', app: '#8B5CF6', saas: '#10B981', seo: '#F59E0B',
    dashboard: '#818CF8', media: '#EF4444', marketing: '#F59E0B', design: '#EC4899',
  };
  const cat = (be.category ?? '').toLowerCase();
  return {
    id: be.slug as Service['id'],
    title: be.title,
    subtitle: be.shortDescription,
    icon: be.icon ?? '🌐',
    color: colorMap[cat] ?? '#818CF8',
    startPrice: be.startingPrice ?? 0,
    endPrice: be.startingPrice ? Math.round(be.startingPrice * 1.5) : 0,
    perMonth: false,
    active: be.isActive,
    demoUrl: '#',
    maskedUrl: '#',
    ordersCount: 0,
    revenue: 0,
    desc: be.longDescription ?? be.shortDescription,
    features: be.features ?? [],
    tech: be.technologies ?? [],
    // i18n fields
    titleEn: be.titleEn, titleJa: be.titleJa, titleKo: be.titleKo, titleZh: be.titleZh,
    shortDescriptionEn: be.shortDescriptionEn, shortDescriptionJa: be.shortDescriptionJa,
    shortDescriptionKo: be.shortDescriptionKo, shortDescriptionZh: be.shortDescriptionZh,
    longDescriptionEn: be.longDescriptionEn, longDescriptionJa: be.longDescriptionJa,
    longDescriptionKo: be.longDescriptionKo, longDescriptionZh: be.longDescriptionZh,
    featuresEn: be.featuresEn, featuresJa: be.featuresJa, featuresKo: be.featuresKo, featuresZh: be.featuresZh,
    technologiesEn: be.technologiesEn, technologiesJa: be.technologiesJa,
    technologiesKo: be.technologiesKo, technologiesZh: be.technologiesZh,
  };
}

// ── Mapping: BE → FE Service ──────────────────────────────────────────────────
 
function mapService(be: BeService, fallbackPrice = 0): Service {
  return {
    id: be.slug as Service['id'],
    title: be.title,
    subtitle: be.shortDescription,
    icon: be.icon ?? '🌐',
    color: getColorByCategory(be.category),
    startPrice: be.startingPrice ?? fallbackPrice,
    endPrice: be.startingPrice ? be.startingPrice * 1.5 : fallbackPrice * 1.5,
    perMonth: false,
    active: be.isActive,
    demoUrl: '#',
    maskedUrl: '#',
    ordersCount: 0,
    revenue: 0,
    // Detail fields — sourced from longDescription and features
    desc: be.longDescription ?? be.shortDescription,
    features: be.features ?? [],
    process: [
      { title: 'Discovery & Wireframe', desc: 'Phan tich brand, UX research va tao wireframe chi tiet.' },
      { title: 'UI Design & Prototype', desc: 'Thiet ke Figma hoan chinh, interactive prototype de review.' },
      { title: 'Development Sprint', desc: 'Code voi CI/CD, code review tung PR.' },
      { title: 'QA & Performance', desc: 'Test da thiet bi, lighthouse audit va toi uu toc do.' },
      { title: 'Launch & Handover', desc: 'Deploy, training, ban giao source va nhan LP diem thuong.' },
    ],
    tech: be.technologies ?? [],
    // i18n fields
    titleEn: be.titleEn, titleJa: be.titleJa, titleKo: be.titleKo, titleZh: be.titleZh,
    shortDescriptionEn: be.shortDescriptionEn, shortDescriptionJa: be.shortDescriptionJa,
    shortDescriptionKo: be.shortDescriptionKo, shortDescriptionZh: be.shortDescriptionZh,
    longDescriptionEn: be.longDescriptionEn, longDescriptionJa: be.longDescriptionJa,
    longDescriptionKo: be.longDescriptionKo, longDescriptionZh: be.longDescriptionZh,
    featuresEn: be.featuresEn, featuresJa: be.featuresJa, featuresKo: be.featuresKo, featuresZh: be.featuresZh,
    technologiesEn: be.technologiesEn, technologiesJa: be.technologiesJa,
    technologiesKo: be.technologiesKo, technologiesZh: be.technologiesZh,
  };
}

function getColorByCategory(cat: string | null): string {
  switch (cat?.toLowerCase()) {
    case 'web': return '#3B82F6';
    case 'app': return '#8B5CF6';
    case 'saas': return '#10B981';
    case 'seo': return '#F59E0B';
    default: return '#818CF8';
  }
}

// ── Service ───────────────────────────────────────────────────────────────────
export interface ServicesResult {
  services: Service[];
  grouped: Record<string, Service[]>;
  categories: string[];
  locale: string;
}

export const servicesService = {
  /**
   * GET /api/v1/services?lang={locale}
   * Returns all active services grouped by category.
   */
  getServices: async (locale = 'vi'): Promise<ServicesResult> => {
    const res = await api.get<BeServicesResponse>(`/v1/services?lang=${locale}`);
    const { services, grouped, categories } = res.data;

    const mapped = services.map((s) => mapService(s, services[0]?.startingPrice ?? 0));
    const mappedGrouped: Record<string, Service[]> = {};
    for (const [key, items] of Object.entries(grouped)) {
      mappedGrouped[key] = items.map(s => mapService(s, services[0]?.startingPrice ?? 0));
    }

    return {
      services: mapped,
      grouped: mappedGrouped,
      categories,
      locale: res.meta.locale,
    };
  },

  /**
   * GET /api/v1/services/[slug]?lang={locale}
   * Returns a single service by slug.
   */
  getServiceBySlug: async (slug: string, locale = 'vi'): Promise<Service | null> => {
    try {
      const res = await api.get<BeServiceDetailResponse>(`/v1/services/${slug}?lang=${locale}`);
      return mapService(res.data);
    } catch {
      return null;
    }
  },

  // ── Admin CRUD ─────────────────────────────────────────────────────────────

  /**
   * GET /api/admin/services
   * Admin list of all services (all statuses, no locale grouping).
   * Returns full Service shape including i18n fields.
   */
  getAdminServices: async (): Promise<Service[]> => {
    const res = await api.get<{ data: BeAdminService[] }>('/admin/services');
    return (res.data ?? []).map(mapAdminService);
  },

  /**
   * POST /api/admin/services
   * Create a new service.
   */
  createService: async (data: Partial<Service>): Promise<Service> => {
    const res = await api.post<{ data: BeAdminService }>('/admin/services', data);
    return mapAdminService(res.data);
  },

  /**
   * PUT /api/admin/services/[id]
   * Update an existing service. Sends i18n fields to BE as flat Prisma fields.
   */
  updateService: async (id: string, data: Partial<Service>): Promise<Service> => {
    // Flatten Service → BE payload (i18n fields go as separate columns)
    const payload: Record<string, unknown> = {
      title: data.title,
      shortDescription: data.subtitle,
      longDescription: data.desc,
      features: data.features,
      technologies: data.tech,
      isActive: data.active,
      startingPrice: data.startPrice,
      deliveryTime: null,
      category: null,
      // i18n flat fields
      titleEn: data.titleEn, titleJa: data.titleJa, titleKo: data.titleKo, titleZh: data.titleZh,
      shortDescriptionEn: data.shortDescriptionEn, shortDescriptionJa: data.shortDescriptionJa,
      shortDescriptionKo: data.shortDescriptionKo, shortDescriptionZh: data.shortDescriptionZh,
      longDescriptionEn: data.longDescriptionEn, longDescriptionJa: data.longDescriptionJa,
      longDescriptionKo: data.longDescriptionKo, longDescriptionZh: data.longDescriptionZh,
      featuresEn: data.featuresEn, featuresJa: data.featuresJa,
      featuresKo: data.featuresKo, featuresZh: data.featuresZh,
      technologiesEn: data.technologiesEn, technologiesJa: data.technologiesJa,
      technologiesKo: data.technologiesKo, technologiesZh: data.technologiesZh,
    };
    // Remove undefined values to avoid sending nulls for unset optional fields
    const cleanPayload: Record<string, unknown> = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    );
    const res = await api.put<{ data: BeAdminService }>(`/admin/services/${id}`, cleanPayload);
    return mapAdminService(res.data);
  },

  /**
   * DELETE /api/admin/services/[id]
   */
  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/admin/services/${id}`);
  },

  // ── Wizard Quotation Config ────────────────────────────────────────────────

  /**
   * Map a Service (BE admin shape) → WizardService (tab shape).
   */
  mapToWizardService(be: Service): WizardService {
    const colorMap: Record<string, string> = {
      web: DS.blue,
      app: DS.purple,
      saas: DS.green,
      seo: DS.amber,
      dashboard: DS.cyan,
      media: DS.red,
      marketing: '#F59E0B',
      design: '#EC4899',
    };
    const cat = (be.category ?? '').toLowerCase();
    return {
      id: be.id,
      title: be.title,
      desc: be.desc ?? be.subtitle ?? '',
      basePrice: be.startPrice,
      color: colorMap[cat] ?? DS.blue,
      icon: be.icon ?? '🌐',
      active: be.active,
      perMonth: be.perMonth,
    };
  },

  /**
   * GET /api/admin/services → WizardService[]
   * Fetches all admin services and maps to wizard shape.
   */
  getWizardServices: async (): Promise<WizardService[]> => {
    const services = await servicesService.getAdminServices();
    return services.map(s => servicesService.mapToWizardService(s));
  },
};
