/**
 * LOOP Solutions — Orders API Service
 * Wizard quote submit + order list + status management (admin/customer)
 *
 * BE contracts:
 * POST /api/pricing/quote                  → { data: QuoteRequest, message: string }
 * GET  /api/admin/orders                   → { data: Order[], pagination: {...}, meta }
 * POST /api/admin/orders/[id]/transition   → { data: { success: true } }
 */
import { api } from './client';

// ── BE response types ──────────────────────────────────────────────────────────

interface BeQuoteItem {
  featureId: string;
  featureName: string;
  variantId: string;
  variantName: string;
  price: number;
}

interface BeQuoteRequest {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  selectedItems: BeQuoteItem[];
  totalAmount: number;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _localeUsed: string;
}

interface BeOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  packageId: string | null;
  package?: { title: string } | null;
  requirements: string | null;
  totalAmount: number | null;
  lpUsed: number;
  lpReward: number;
  createdAt: string;
  updatedAt: string;
  demo?: {
    id: string;
    status: string;
    figmaUrl: string;
    maskedUrl: string | null;
    createdAt: string;
    approvedAt: string | null;
  } | null;
}

// ── FE domain types ──────────────────────────────────────────────────────────────

export interface QuoteSubmitData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  /** Items sent to BE quote endpoint */
  selectedItems: BeQuoteItem[];
  totalAmount: number;
  notes?: string;
}

export interface QuoteResult {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  message: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  packageId: string | null;
  packageTitle: string;
  requirements: string | null;
  totalAmount: number | null;
  lpUsed: number;
  lpReward: number;
  createdAt: string;
  updatedAt: string;
  demoUrl: string | null;
  maskedUrl: string | null;
  demoStatus: string | null;
}

// ── Mapping ────────────────────────────────────────────────────────────────────

function mapOrder(be: BeOrder): Order {
  return {
    id: be.id,
    orderNumber: be.orderNumber,
    status: be.status,
    paymentStatus: be.paymentStatus,
    customerName: be.customerName,
    customerEmail: be.customerEmail,
    customerPhone: be.customerPhone,
    companyName: be.companyName,
    packageId: be.packageId,
    packageTitle: be.package?.title ?? '',
    requirements: be.requirements,
    totalAmount: be.totalAmount,
    lpUsed: be.lpUsed,
    lpReward: be.lpReward,
    createdAt: be.createdAt,
    updatedAt: be.updatedAt,
    demoUrl: be.demo?.figmaUrl ?? null,
    maskedUrl: be.demo?.maskedUrl ?? null,
    demoStatus: be.demo?.status ?? null,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────

export const ordersService = {
  /**
   * POST /api/pricing/quote
   * Submit wizard configuration → creates QuoteRequest in BE.
   * Returns order number for display in success state.
   */
  submitQuote: async (data: QuoteSubmitData): Promise<QuoteResult> => {
    const res = await api.post<{ data: BeQuoteRequest; message: string }>('/pricing/quote', data);
    return {
      id: res.data.id,
      orderNumber: res.data.orderNumber,
      customerName: res.data.customerName,
      customerEmail: res.data.customerEmail,
      message: res.message ?? 'Yêu cầu đã được gửi thành công!',
    };
  },

  /**
   * GET /api/admin/orders
   * Returns paginated orders (admin/customer portal).
   */
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    customerEmail?: string;
  }): Promise<{
    orders: Order[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    locale: string;
  }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 20));
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.customerEmail) q.set('customerEmail', params.customerEmail);

    const qs = q.toString();
    const path = `/admin/orders${qs ? `?${qs}` : ''}`;

    const res = await api.get<{
      data: BeOrder[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(path);

    return {
      orders: res.data.map(mapOrder),
      pagination: res.pagination,
      locale: 'vi',
    };
  },

  /**
   * POST /api/admin/orders/[id]/transition
   * Advance order to a new status.
   */
  transitionOrderStatus: async (
    orderId: string,
    toStatus: string,
    note?: string
  ): Promise<{ success: boolean }> => {
    const res = await api.post<{ data: { success: boolean } }>(
      `/admin/orders/${orderId}/transition`,
      { toStatus, note }
    );
    return res.data;
  },
};
