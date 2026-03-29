/**
 * Referral service — customer-facing referral API
 * /api/ref/[code]/info (public, no auth)
 */
import { api } from './client';

export interface ReferralInfo {
  code: string;
  name: string;
  campaign: string;
  memberName: string;
  memberImage: string | null;
  totalReferred: number;
  lpRate: number;
  tier: string;
  /** Companies referred via this code */
  referredCompanies?: Array<{
    name: string;
    project: string;
    amount: number;
    lpEarned: number;
    status: 'paid' | 'pending' | 'cancelled';
    date: string;
  }>;
}

export const referralService = {
  /** Get referral info + referred companies by referral code */
  getReferralInfo: async (code: string): Promise<ReferralInfo | null> => {
    try {
      const data = await api.get<ReferralInfo>(`/ref/${encodeURIComponent(code)}/info`);
      return data;
    } catch {
      return null;
    }
  },
};
