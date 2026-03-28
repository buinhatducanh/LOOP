/**
 * LOOP Solutions — Services API Service
 * Public services: list + detail
 *
 * BE contract:
 * GET /api/v1/services?lang={locale}  → { data: { services, grouped, categories }, meta }
 * GET /api/v1/services/[slug]?lang=  → { data: service, meta }
 */
import { api } from './client';
import type { Service } from '../store/loopStore';

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

// ── Mapping: BE → FE Service ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
};
