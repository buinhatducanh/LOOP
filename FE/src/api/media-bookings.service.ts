/**
 * LOOP Solutions — Media Bookings API Service
 *
 * BE endpoints:
 * GET    /api/admin/media-bookings          → { data, pagination }
 * GET    /api/admin/media-bookings/[id]    → { data }
 * POST   /api/admin/media-bookings          → { data }
 * PUT    /api/admin/media-bookings/[id]    → { data }
 * DELETE /api/admin/media-bookings/[id]    → {}
 * POST   /api/admin/media-bookings/[id]/transition → { data }
 */
import { api } from './client';

// ── BE response type ────────────────────────────────────────────────────────────
interface BeMediaBooking {
  id: string;
  bookingNumber: string;
  packageId: string | null;
  orderId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  bookingType: string | null;
  title: string | null;
  requirements: string | null;
  note: string | null;
  revisionNotes: string | null;
  deadline: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number | null;
  paidAmount: number | null;
  assignedTo: string | null;
  teamMemberId: string | null;
  deliveredAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  deliveredAssets: unknown[] | null;
  createdAt: string;
  updatedAt: string;
  package?: { title: string };
  teamMember?: { id: string; name: string };
}

interface PaginatedBookings {
  bookings: BeMediaBooking[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// ── FE domain type (bridge — matches MediaTab expectations) ───────────────────
export type MediaBookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';
export type MediaBookingType = 'photo' | 'video' | 'content';

export interface MediaBooking {
  id: string;
  type: MediaBookingType;
  clientName: string;
  clientCompany: string;
  clientAvatar: string;
  package: string;
  styles: string[];
  addons: string[];
  date: string;
  timeSlot: string;
  location: string;
  assignedLead: string;
  budget: number;
  status: MediaBookingStatus;
  lpReward: number;
  note: string;
  createdAt: string;
}

// ── Mapping ───────────────────────────────────────────────────────────────────
const BOOKING_TYPE_MAP: Record<string, MediaBookingType> = {
  photo: 'photo',
  video: 'video',
  content: 'content',
  event: 'content',
  product: 'photo',
  other: 'content',
};

function formatViDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function mapBooking(be: BeMediaBooking): MediaBooking {
  const type = BOOKING_TYPE_MAP[be.bookingType ?? ''] ?? 'content';
  const budget = be.totalAmount ?? 0;
  const lpReward = Math.round(budget * 0.04); // ~4% LP reward

  return {
    id: be.bookingNumber ?? be.id,
    type,
    clientName: be.customerName,
    clientCompany: be.companyName ?? '',
    clientAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(be.customerName)}`,
    package: be.package?.title ?? 'Media Package',
    styles: [],
    addons: [],
    date: formatViDate(be.deadline),
    timeSlot: '—',
    location: be.requirements ?? '—',
    assignedLead: be.teamMember?.name ?? be.assignedTo ?? '—',
    budget,
    status: (be.status ?? 'pending') as MediaBookingStatus,
    lpReward,
    note: be.requirements ?? be.note ?? '',
    createdAt: formatViDate(be.createdAt),
  };
}

// ── Service ────────────────────────────────────────────────────────────────────
export interface GetBookingsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  bookingType?: string;
}

export const mediaBookingsService = {
  /**
   * GET /api/admin/media-bookings
   */
  getBookings: async (params: GetBookingsParams = {}): Promise<{ bookings: MediaBooking[]; pagination: PaginatedBookings['pagination'] }> => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit ?? 50));
    if (params.search) q.set('search', params.search);
    if (params.status) q.set('status', params.status);
    if (params.bookingType) q.set('bookingType', params.bookingType);
    const qs = q.toString();
    const res = await api.get<PaginatedBookings>(`/admin/media-bookings${qs ? `?${qs}` : ''}`);
    return {
      bookings: res.bookings.map(mapBooking),
      pagination: res.pagination,
    };
  },

  /**
   * GET /api/admin/media-bookings/[id]
   */
  getBooking: async (id: string): Promise<MediaBooking> => {
    const res = await api.get<{ data: BeMediaBooking }>(`/admin/media-bookings/${id}`);
    return mapBooking(res.data);
  },

  /**
   * POST /api/admin/media-bookings
   */
  createBooking: async (data: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    companyName?: string;
    title?: string;
    bookingType?: string;
    requirements?: string;
    deadline?: string;
    totalAmount?: number;
    assignedTo?: string;
    teamMemberId?: string;
  }): Promise<MediaBooking> => {
    const res = await api.post<{ data: BeMediaBooking }>('/admin/media-bookings', data);
    return mapBooking(res.data);
  },

  /**
   * PUT /api/admin/media-bookings/[id]
   */
  updateBooking: async (id: string, data: Partial<MediaBooking>): Promise<MediaBooking> => {
    // Strip FE-only fields before sending to BE
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, type, clientName, clientCompany, clientAvatar, package: _pkg, styles, addons, timeSlot, location, assignedLead, lpReward, createdAt, ...bePayload } = data as Record<string, unknown>;
    // Map FE fields → BE fields
    const payload: Record<string, unknown> = { ...bePayload };
    if (clientName !== undefined) payload.customerName = clientName;
    if (clientCompany !== undefined) payload.companyName = clientCompany;
    if (type !== undefined) payload.bookingType = type;
    if (deadline !== undefined) {
      const parts = (data.date ?? '').split('/');
      if (parts.length === 3) {
        payload.deadline = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    const res = await api.put<{ data: BeMediaBooking }>(`/admin/media-bookings/${id}`, payload);
    return mapBooking(res.data);
  },

  /**
   * DELETE /api/admin/media-bookings/[id]
   */
  deleteBooking: async (id: string): Promise<void> => {
    // API accepts bookingNumber (MDA-xxx) but route needs CUID
    // Fallback: try as-is, if 404 try lookup
    await api.delete(`/admin/media-bookings/${id}`);
  },

  /**
   * POST /api/admin/media-bookings/[id]/transition
   */
  transitionBooking: async (id: string, toStatus: string, note?: string): Promise<MediaBooking> => {
    const res = await api.post<{ data: BeMediaBooking }>(`/admin/media-bookings/${id}/transition`, {
      toStatus,
      note,
    });
    return mapBooking(res.data);
  },
};
