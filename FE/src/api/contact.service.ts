/**
 * LOOP Solutions — Contact API Service
 *
 * BE contract:
 * POST /api/contact  → { name, email, phone?, service?, budget?, message }
 *                      → { data: ContactMessage } or { error }
 */
import { api } from './client';

// ── Request body ────────────────────────────────────────────────────────────────
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  budget?: string;
  message: string;
}

// ── BE response type ───────────────────────────────────────────────────────────
interface ContactResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  budget?: string;
  message: string;
  status: string;
  createdAt: string;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const contactService = {
  /**
   * POST /api/contact — Submit a contact form message (public, rate-limited)
   */
  submit: async (data: ContactFormData): Promise<ContactResponse> => {
    const res = await api.post<{ data: ContactResponse }>('/contact', data);
    return res.data;
  },
};
