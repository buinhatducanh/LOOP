/**
 * LOOP Solutions — Addon Services API Service
 *
 * BE endpoints:
 * GET  /api/admin/addon-services        → { data: AddonService[], pagination }
 * POST /api/admin/addon-services      → { data: AddonService }
 * PUT  /api/admin/addon-services/[id] → { data: AddonService }
 * DELETE /api/admin/addon-services/[id] → {}
 */
import { api } from './client';

// ── BE response type ────────────────────────────────────────────────────────────
interface BeAddonService {
  id: string;
  slug: string;
  name: string;
  nameVi: string | null;
  description: string | null;
  descriptionVi: string | null;
  icon: string | null;
  type: string | null;
  price: number;
  billingPeriod: string | null;
  lpCost: number | null;
  metadata: unknown | null;
  sortOrder: number | null;
  isActive: boolean;
}

// ── FE domain type ──────────────────────────────────────────────────────────────
export interface WizardExtra {
  id: string;
  label: string;   // nameVi || name
  price: number;
  color: string;   // derived from type
  type: string | null;
  active: boolean;
}

// ── Mapping ────────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  hosting: '#3B82F6',
  maintenance: '#10B981',
  analytics: '#06B6D4',
  training: '#8B5CF6',
  support: '#F59E0B',
  seo: '#EF4444',
};

function mapAddon(be: BeAddonService): WizardExtra {
  return {
    id: be.id,
    label: be.nameVi ?? be.name,
    price: be.price,
    color: TYPE_COLORS[be.type ?? ''] ?? '#818CF8',
    type: be.type,
    active: be.isActive,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────
export const addonService = {
  getAddons: async (): Promise<WizardExtra[]> => {
    const res = await api.get<{ data: BeAddonService[] }>('/admin/addon-services');
    return res.data.map(mapAddon);
  },

  createAddon: async (data: {
    name: string;
    nameVi?: string;
    type?: string;
    price: number;
    icon?: string;
  }): Promise<WizardExtra> => {
    const res = await api.post<{ data: BeAddonService }>('/admin/addon-services', {
      slug: (data.nameVi ?? data.name).toLowerCase().replace(/\s+/g, '-'),
      ...data,
      isActive: true,
    });
    return mapAddon(res.data);
  },

  updateAddon: async (id: string, data: Partial<WizardExtra>): Promise<WizardExtra> => {
    const payload: Record<string, unknown> = { ...data };
    delete payload.id;
    delete payload.label;
    delete payload.color;
    delete payload.active;
    const res = await api.put<{ data: BeAddonService }>(`/admin/addon-services/${id}`, payload);
    return mapAddon(res.data);
  },

  deleteAddon: async (id: string): Promise<void> => {
    await api.delete(`/admin/addon-services/${id}`);
  },
};
