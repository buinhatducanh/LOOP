/**
 * LOOP Solutions — Revenue & Dashboard API Service
 *
 * BE endpoints:
 * GET /api/admin/dashboard              → KPI overview (orders, projects, messages, users)
 * GET /api/admin/dashboard/charts       → Revenue, LP, messages trend data
 * GET /api/admin/sales-leads            → CRM client list
 */
import { api } from './client';

// ── Dashboard Overview ──────────────────────────────────────────────────────
export interface DashboardOverview {
  stats: {
    totalServices: number;
    totalProjects: number;
    totalOrders: number;
    totalMessages: number;
    totalUsers: number;
    newMessages: number;
    pendingOrders: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    package?: { title: string };
  }>;
  recentMessages: Array<{
    id: string;
    name: string;
    email: string;
    content: string;
    status: string;
    createdAt: string;
  }>;
}

// ── Dashboard Charts ────────────────────────────────────────────────────────
export interface MonthlyTrend {
  month: string;
  orders: number;
  revenue: number;
}

export interface DashboardCharts {
  ordersByStatus: Array<{ status: string; count: number }>;
  monthlyTrend: MonthlyTrend[];
  messagesByStatus: Array<{ status: string; count: number }>;
  messageTrend: Array<{ month: string; messages: number }>;
  paymentBreakdown: Array<{ status: string; count: number; amount: number }>;
}

// ── Sales Lead (Client) ─────────────────────────────────────────────────────
export interface SalesLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  website: string;
  status: string;
  totalSpent: number;
  projectCount: number;
  lpBalance: number;
  rank: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  source?: string;
  note?: string;
}

// ── Service ────────────────────────────────────────────────────────────────
export const revenueService = {
  /**
   * GET /api/admin/dashboard
   */
  getDashboard: async (): Promise<DashboardOverview | null> => {
    try {
      return await api.get<DashboardOverview>('/admin/dashboard');
    } catch {
      return null;
    }
  },

  /**
   * GET /api/admin/dashboard/charts
   */
  getCharts: async (): Promise<DashboardCharts | null> => {
    try {
      return await api.get<DashboardCharts>('/admin/dashboard/charts');
    } catch {
      return null;
    }
  },

  /**
   * GET /api/admin/sales-leads
   */
  getSalesLeads: async (params?: {
    page?: number; limit?: number; search?: string; status?: string;
  }): Promise<{ leads: SalesLead[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 20));
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    const path = `/admin/sales-leads${qs ? `?${qs}` : ''}`;
    const res = await api.get<{
      data: SalesLead[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(path);
    return { leads: res.data, pagination: res.pagination };
  },
};
