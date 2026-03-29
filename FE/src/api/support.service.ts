/**
 * Support / ticket API — stub with graceful fallback
 * BE does not have /api/support or /api/tickets yet
 */
import { api } from './client';

export interface SupportTicket {
  id: string;
  title: string;
  status: 'open' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  /** PM assigned */
  pm: {
    name: string;
    img: string;
    rank: string;
  } | null;
  date: string;
  reply: string | null;
}

export interface CreateTicketPayload {
  title: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
}

export const supportService = {
  /** GET /api/support/tickets — list customer tickets */
  getTickets: async (): Promise<SupportTicket[]> => {
    try {
      const data = await api.get<{ data: SupportTicket[] }>('/support/tickets');
      return data.data ?? [];
    } catch {
      return [];
    }
  },

  /** POST /api/support/tickets — create new ticket */
  createTicket: async (payload: CreateTicketPayload): Promise<{ success: boolean }> => {
    try {
      await api.post('/support/tickets', payload);
      return { success: true };
    } catch {
      return { success: false };
    }
  },
};
