/**
 * LOOP Solutions — Quests & Events API Service
 *
 * BE endpoints:
 * GET  /api/admin/quests           → quest list with pagination + filters
 * POST /api/admin/quests           → create quest
 * GET  /api/admin/quests/[id]      → single quest
 * PUT  /api/admin/quests/[id]      → update quest
 * DELETE /api/admin/quests/[id]     → delete quest
 *
 * GET  /api/admin/company-events    → event list with pagination
 * POST /api/admin/company-events    → create event
 * GET  /api/admin/company-events/[id] → single event
 * PUT  /api/admin/company-events/[id] → update event
 * DELETE /api/admin/company-events/[id] → delete event
 *
 * GET  /api/admin/quest-participants  → participant list
 * POST /api/admin/quest-participants   → join quest/event
 */
import { api } from './client';
import type { Quest, CompanyEvent as StoreCompanyEvent } from '../app/store/authStore';

export interface BeQuest {
  id: string;
  title: string;
  description: string;
  lpReward: number;
  xpReward: number;
  frequency: string;
  category: string;
  icon: string;
  color: string;
  target: number;
  forRoles: string[];
  isActive: boolean;
  sortOrder: number;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BeCompanyEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  lpBonus: number;
  color: string;
  icon: string;
  bannerUrl: string | null;
  isActive: boolean;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Mappers: BE → store types ─────────────────────────────────────────────────
function mapQuest(be: BeQuest): Quest {
  return {
    id: be.id,
    title: be.title,
    description: be.description,
    lpReward: be.lpReward,
    xpReward: be.xpReward,
    frequency: be.frequency as Quest['frequency'],
    category: be.category,
    icon: be.icon,
    color: be.color,
    target: be.target,
    forRoles: be.forRoles as Quest['forRoles'],
    active: be.isActive,
    participantCount: be.participantCount ?? 0,
    progress: 0,
    status: be.isActive ? 'available' : 'expired',
  };
}

function mapEvent(be: BeCompanyEvent): StoreCompanyEvent {
  return {
    id: be.id,
    title: be.title,
    description: be.description,
    type: be.type,
    startDate: be.startDate,
    endDate: be.endDate,
    lpBonus: be.lpBonus,
    color: be.color,
    icon: be.icon,
    bannerUrl: be.bannerUrl,
    active: be.isActive,
    participants: be.participantCount ?? 0,
    maxParticipants: 999,
    quests: [],
    rewards: [],
  };
}

// ── Service ───────────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const questsService = {
  // ── Quests ────────────────────────────────────────────────────────────────
  getQuests: async (params?: {
    page?: number;
    limit?: number;
    frequency?: string;
    isActive?: boolean;
  }): Promise<PaginatedResult<Quest>> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 50));
    if (params?.frequency) q.set('frequency', params.frequency);
    if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));
    const qs = q.toString();
    const path = `/admin/quests${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeQuest[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(path);
    return { data: res.data.map(mapQuest), pagination: res.pagination };
  },

  createQuest: async (data: {
    title: string;
    description?: string;
    lpReward?: number;
    xpReward?: number;
    frequency: string;
    category?: string;
    icon?: string;
    color?: string;
    target?: number;
    forRoles?: string[];
  }): Promise<Quest> => {
    const res = await api.post<{ data: BeQuest }>('/admin/quests', data);
    return mapQuest(res.data);
  },

  updateQuest: async (id: string, data: Partial<Quest>): Promise<Quest> => {
    const payload = {
      ...data,
      isActive: data.active,
    };
    delete (payload as Record<string, unknown>).active;
    delete (payload as Record<string, unknown>).participantCount;
    delete (payload as Record<string, unknown>).progress;
    delete (payload as Record<string, unknown>).completed;
    const res = await api.put<{ data: BeQuest }>(`/admin/quests/${id}`, payload);
    return mapQuest(res.data);
  },

  deleteQuest: async (id: string): Promise<void> => {
    await api.delete(`/admin/quests/${id}`);
  },

  // ── Company Events ──────────────────────────────────────────────────────────
  getEvents: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<PaginatedResult<CompanyEvent>> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 50));
    if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));
    const qs = q.toString();
    const path = `/admin/company-events${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeCompanyEvent[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(path);
    return { data: res.data.map(mapEvent), pagination: res.pagination };
  },

  createEvent: async (data: {
    title: string;
    description?: string;
    type?: string;
    startDate: string;
    endDate: string;
    lpBonus?: number;
    color?: string;
    icon?: string;
    bannerUrl?: string | null;
  }): Promise<CompanyEvent> => {
    const res = await api.post<{ data: BeCompanyEvent }>('/admin/company-events', data);
    return mapEvent(res.data);
  },

  updateEvent: async (id: string, data: Partial<CompanyEvent>): Promise<CompanyEvent> => {
    const payload = {
      ...data,
      isActive: data.active,
    };
    delete (payload as Record<string, unknown>).active;
    delete (payload as Record<string, unknown>).participants;
    delete (payload as Record<string, unknown>).rewards;
    delete (payload as Record<string, unknown>).quests;
    delete (payload as Record<string, unknown>).maxParticipants;
    const res = await api.put<{ data: BeCompanyEvent }>(`/admin/company-events/${id}`, payload);
    return mapEvent(res.data);
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/admin/company-events/${id}`);
  },

  // ── Participants ─────────────────────────────────────────────────────────────
  joinQuest: async (userId: string, questId: string): Promise<void> => {
    await api.post('/admin/quest-participants', { userId, questId });
  },

  joinEvent: async (userId: string, eventId: string): Promise<void> => {
    await api.post('/admin/quest-participants', { userId, eventId });
  },
};
