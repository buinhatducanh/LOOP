/**
 * LOOP Solutions — Features API Service
 *
 * BE endpoints:
 * GET  /api/admin/features              → { data: Feature[], pagination }
 * POST /api/admin/features             → { data: Feature }
 * PUT  /api/admin/features/[id]        → { data: Feature }
 * DELETE /api/admin/features/[id]     → {}
 */
import { api } from './client';

// ── BE response types ──────────────────────────────────────────────────────────
interface BeFeatureVariant {
  id: string;
  variantName: string;
  description: string | null;
  price: number;
  resourceUsage: unknown | null;
  sortOrder: number;
}

interface BeFeature {
  id: string;
  groupId: string | null;
  featureName: string;
  description: string | null;
  logicLevel: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  variants: BeFeatureVariant[];
  group: { groupName: string } | null;
}

// ── FE domain type ─────────────────────────────────────────────────────────────
export interface WizardFeature {
  id: string;
  serviceId: string; // mapped from groupId
  label: string;     // mapped from featureName
  description: string;
  price: number;    // from first/default variant
  icon: string;
  variants: BeFeatureVariant[];
  active: boolean;
}

// ── Mapping ────────────────────────────────────────────────────────────────────
function mapFeature(be: BeFeature): WizardFeature {
  const defaultVariant = be.variants?.[0];
  return {
    id: be.id,
    serviceId: be.groupId ?? '',
    label: be.featureName,
    description: be.description ?? '',
    price: defaultVariant?.price ?? 0,
    icon: '⚡',
    variants: be.variants ?? [],
    active: be.isActive,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────
export const featuresService = {
  getFeatures: async (params?: { page?: number; limit?: number }): Promise<WizardFeature[]> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params?.page));
    if (params?.limit) q.set('limit', String(params?.limit ?? 100));
    const qs = q.toString();
    const path = `/admin/features${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeFeature[] }>(path);
    return res.data.map(mapFeature);
  },

  createFeature: async (data: {
    groupId: string;
    featureName: string;
    description?: string;
    variants?: Array<{ variantName: string; description?: string; price: number }>;
  }): Promise<WizardFeature> => {
    const payload = {
      ...data,
      logicLevel: 'Medium',
      isRequired: false,
      sortOrder: 0,
      isActive: true,
    };
    const res = await api.post<{ data: BeFeature }>('/admin/features', payload);
    return mapFeature(res.data);
  },

  updateFeature: async (id: string, data: Partial<WizardFeature>): Promise<WizardFeature> => {
    const payload: Record<string, unknown> = { ...data };
    delete payload.id;
    delete payload.icon;
    delete payload.serviceId;
    delete payload.label;
    delete payload.price;
    delete payload.active;
    delete payload.description;
    const res = await api.put<{ data: BeFeature }>(`/admin/features/${id}`, payload);
    return mapFeature(res.data);
  },

  deleteFeature: async (id: string): Promise<void> => {
    await api.delete(`/admin/features/${id}`);
  },
};
