/**
 * LOOP Solutions — Effects API Service
 *
 * BE endpoints:
 * GET    /api/admin/rank-effects           → effect list with pagination
 * POST   /api/admin/rank-effects          → create effect
 * GET    /api/admin/rank-effects/[id]      → single effect
 * PUT    /api/admin/rank-effects/[id]      → update effect
 * DELETE /api/admin/rank-effects/[id]      → delete effect
 * PUT    /api/admin/rank-effects/global-toggle → enable/disable all globally
 */
import { api } from './client';

export interface BeRankEffect {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  icon: string;
  color: string;
  minRank: string;
  minLevel: number;
  maxLevel: number | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── FE domain types (matches EffectsTab RankEffect interface) ───────────────────
export interface RankEffect {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  color: string;
  minRank: string;
  minLevel: number;
  maxLevel: number | null;
  enabled: boolean;
  rarityColor: string;
  rarityBg: string;
  rarityBorder: string;
}

function getRarityStyle(rarity: string): { rarityColor: string; rarityBg: string; rarityBorder: string } {
  switch (rarity) {
    case 'legendary': return { rarityColor: '#FFD700', rarityBg: 'rgba(255,215,0,0.1)', rarityBorder: 'rgba(255,215,0,0.3)' };
    case 'epic':     return { rarityColor: '#A855F7', rarityBg: 'rgba(168,85,247,0.1)', rarityBorder: 'rgba(168,85,247,0.3)' };
    case 'rare':     return { rarityColor: '#3B82F6', rarityBg: 'rgba(59,130,246,0.1)', rarityBorder: 'rgba(59,130,246,0.3)' };
    default:         return { rarityColor: '#9CA3AF', rarityBg: 'rgba(156,163,175,0.1)', rarityBorder: 'rgba(156,163,175,0.3)' };
  }
}

function mapEffect(be: BeRankEffect): RankEffect {
  const rarityStyle = getRarityStyle(be.rarity);
  return {
    id: be.id,
    name: be.name,
    description: be.description,
    type: be.type,
    rarity: be.rarity as RankEffect['rarity'],
    icon: be.icon,
    color: be.color,
    minRank: be.minRank,
    minLevel: be.minLevel,
    maxLevel: be.maxLevel,
    enabled: be.isEnabled,
    // Map BE fields → store fields
    unlockRank: be.minRank as RankEffect['unlockRank'],
    unlockLevel: be.minLevel,
    cssConfig: '',
    preview: be.icon,
    ...rarityStyle,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────
export interface EffectsResult {
  effects: RankEffect[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const effectsService = {
  /**
   * GET /api/admin/rank-effects?page=1&limit=50
   */
  getEffects: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<EffectsResult> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 50));
    const qs = q.toString();
    const path = `/admin/rank-effects${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeRankEffect[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(path);
    return { effects: res.data.map(mapEffect), pagination: res.pagination };
  },

  /**
   * POST /api/admin/rank-effects
   */
  createEffect: async (data: {
    name: string;
    description?: string;
    type: string;
    rarity?: string;
    icon?: string;
    color?: string;
    minRank: string;
    minLevel?: number;
    maxLevel?: number | null;
    preview?: string;
    cssConfig?: string;
  }): Promise<RankEffect> => {
    const res = await api.post<{ data: BeRankEffect }>('/admin/rank-effects', data);
    return mapEffect(res.data);
  },

  /**
   * PUT /api/admin/rank-effects/[id]
   */
  updateEffect: async (id: string, data: Partial<RankEffect>): Promise<RankEffect> => {
    const payload = {
      ...data,
      isEnabled: data.enabled,
    };
    delete (payload as Record<string, unknown>).enabled;
    delete (payload as Record<string, unknown>).rarityColor;
    delete (payload as Record<string, unknown>).rarityBg;
    delete (payload as Record<string, unknown>).rarityBorder;
    const res = await api.put<{ data: BeRankEffect }>(`/admin/rank-effects/${id}`, payload);
    return mapEffect(res.data);
  },

  /**
   * DELETE /api/admin/rank-effects/[id]
   */
  deleteEffect: async (id: string): Promise<void> => {
    await api.delete(`/admin/rank-effects/${id}`);
  },

  /**
   * GET /api/admin/rank-effects/global-toggle
   */
  getGlobalToggle: async (): Promise<{ isEnabled: boolean; total: number; enabled: number; disabled: number }> => {
    const res = await api.get<{ data: { isEnabled: boolean; total: number; enabled: number; disabled: number } }>('/admin/rank-effects/global-toggle');
    return res.data;
  },

  /**
   * PUT /api/admin/rank-effects/global-toggle
   */
  globalToggle: async (isEnabled: boolean): Promise<void> => {
    await api.put(`/admin/rank-effects/global-toggle`, { isEnabled });
  },
};
