/**
 * LOOP Solutions — Orders Service
 * Wizard quote submission + order list + status management
 *
 * BE contracts:
 * POST /api/pricing/quote              → { data: { id, orderNumber }, message }
 * POST /api/admin/orders/[id]/transition → { data: { success: true } }
 */
import { apiClient } from "@/lib/api/client";

// ── Quote Item ──────────────────────────────────────────────────────────────

export interface QuoteItem {
  featureId: string;
  featureName: string;
  variantId: string;
  variantName: string;
  price: number;
}

// ── Quote Response ────────────────────────────────────────────────────────────

export interface QuoteResponse {
  id: string;
  orderNumber: string;
  message: string;
}

/**
 * Submit a booking wizard quote → creates Order in DB.
 */
export async function submitQuote(payload: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  selectedItems: QuoteItem[];
  totalAmount: number;
  notes?: string;
}): Promise<QuoteResponse> {
  const res = await apiClient.post<{ data: QuoteResponse }>("/pricing/quote", payload);
  return res.data;
}
