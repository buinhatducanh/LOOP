import { api } from './client';

export interface MemberEffectOverrideDto {
  id: string;
  memberId: string;
  effectId: string;
  visible: boolean;
  selectedByMember: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  effect?: {
    id: string;
    name: string;
    type: string;
    rarity: string;
    minRank: string;
    minLevel: number;
    isEnabled: boolean;
  };
}

export interface MemberEffectsResponse {
  memberId: string;
  memberName: string;
  overrides: MemberEffectOverrideDto[];
}

export const teamEffectsService = {
  getMemberEffects: async (memberId: string): Promise<MemberEffectsResponse> => {
    const res = await api.get<{ data: MemberEffectsResponse }>(`/admin/team/${memberId}/effects`);
    return res.data;
  },

  upsertMemberEffectOverride: async (
    memberId: string,
    effectId: string,
    payload: {
      visible?: boolean;
      selectedByMember?: boolean;
      priority?: number;
    },
  ): Promise<MemberEffectOverrideDto> => {
    const res = await api.put<{ data: MemberEffectOverrideDto }>(`/admin/team/${memberId}/effects/${effectId}`, payload);
    return res.data;
  },

  deleteMemberEffectOverride: async (memberId: string, effectId: string): Promise<void> => {
    await api.delete(`/admin/team/${memberId}/effects/${effectId}`);
  },
};
