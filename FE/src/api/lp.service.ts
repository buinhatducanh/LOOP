/**
 * LOOP Solutions — LP (Loyalty Points) API Service
 *
 * BE endpoints:
 * GET  /api/admin/customer-points       → { data: CustomerPoint[], pagination }
 * GET  /api/admin/customer-points/[id]  → { data: CustomerPoint }
 * GET  /api/admin/lp-transactions/[memberId] → LP transactions for a member
 * GET  /api/admin/lp-awards             → { data: LpAward[] }
 * POST /api/admin/lp-awards             → award LP to member
 * GET  /api/admin/lp-redemptions        → { data: Redemptions[] }
 * GET  /api/points                      → customer LP balance
 * POST /api/points/redeem              → redeem LP
 */
import { api } from './client';

// ── Types ──────────────────────────────────────────────────────────────────
export interface LPTransaction {
  id: string;
  memberId: number;
  source: LPSource;
  amount: number;
  vndEquivalent: number;
  note: string;
  period: string;
  createdAt: string;
  createdBy: string;
}

export type LPSource = 'project' | 'performance' | 'service' | 'salary' | 'tet_bonus' | 'manual';

export interface LpAward {
  id: string;
  memberId: number;
  memberName: string;
  amount: number;
  source: LPSource;
  reason: string;
  awardedBy: string;
  createdAt: string;
}

export interface CustomerPoint {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  totalEarned: number;
  totalSpent: number;
  balance: number;
  transactions: LPTransaction[];
}

export interface LpSummary {
  memberId: number;
  memberName: string;
  totalEarned: number;
  totalSpent: number;
  balance: number;
  projectBreakdown: { projectId: string; projectName: string; amount: number }[];
}

// ── Service ────────────────────────────────────────────────────────────────
export const lpService = {
  /**
   * GET /api/admin/customer-points?email=&page=&limit=
   * Admin list of all customer LP records.
   */
  getCustomerPoints: async (params?: { email?: string; page?: number; limit?: number }): Promise<{
    points: CustomerPoint[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    summary: { totalCustomers: number; totalPointsIssued: number; totalPointsSpent: number };
  }> => {
    const q = new URLSearchParams();
    if (params?.email) q.set('email', params.email);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 20));
    const qs = q.toString();
    const path = `/admin/customer-points${qs ? `?${qs}` : ''}`;
    const res = await api.get<{
      data: CustomerPoint[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
      summary: { totalCustomers: number; totalPointsIssued: number; totalPointsSpent: number };
    }>(path);
    return { points: res.data, pagination: res.pagination, summary: res.summary };
  },

  /**
   * GET /api/admin/lp-transactions/[memberId]
   * LP transactions for a specific member.
   */
  getMemberTransactions: async (memberId: number): Promise<LPTransaction[]> => {
    try {
      const res = await api.get<{ data: LPTransaction[] }>(`/admin/lp-transactions/${memberId}`);
      return res.data;
    } catch {
      return [];
    }
  },

  /**
   * GET /api/admin/lp-awards
   * LP award history.
   */
  getAwards: async (): Promise<LpAward[]> => {
    try {
      const res = await api.get<{ data: LpAward[] }>('/admin/lp-awards');
      return res.data;
    } catch {
      return [];
    }
  },

  /**
   * POST /api/admin/lp-awards
   * Award LP to a member.
   */
  awardLp: async (data: {
    memberId: number;
    amount: number;
    source: LPSource;
    reason: string;
  }): Promise<LpAward> => {
    const res = await api.post<{ data: LpAward }>('/admin/lp-awards', data);
    return res.data;
  },

  /**
   * GET /api/admin/lp-redemptions
   */
  getRedemptions: async (): Promise<unknown[]> => {
    try {
      const res = await api.get<{ data: unknown[] }>('/admin/lp-redemptions');
      return res.data;
    } catch {
      return [];
    }
  },

  /**
   * GET /api/admin/lp-summary/[projectId]
   */
  getProjectSummary: async (projectId: string): Promise<LpSummary | null> => {
    try {
      const res = await api.get<{ data: LpSummary }>(`/admin/lp-summary/${projectId}`);
      return res.data;
    } catch {
      return null;
    }
  },
};
