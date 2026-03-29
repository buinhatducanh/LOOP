/**
 * LOOP Solutions — Testimonials API Service
 * Landing page testimonials section
 *
 * BE contract:
 * GET /api/v1/testimonials?lang={locale}  → { data: Testimonial[], meta }
 */
import { api } from './client';

// ── BE response types ──────────────────────────────────────────────────────────
interface BeTestimonial {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  text: string;
  role: string | null;
  company: string | null;
  _localeUsed: string;
}

// ── FE domain type ──────────────────────────────────────────────────────────────
export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  quote: string;
  role: string;
  company: string;
  /** Computed rank fields for LandingPage display */
  rank: string;
  rankColor: string;
  rankSymbol: string;
}

// ── Mapping: BE → FE Testimonial ───────────────────────────────────────────────
function mapTestimonial(be: BeTestimonial): Testimonial {
  const avatar = be.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(be.name)}`;
  // Rank fields: seeded from rating value for visual consistency
  const rankMap: Array<{ threshold: number; rank: string; color: string; symbol: string }> = [
    { threshold: 5, rank: 'GOLD', color: '#FFD700', symbol: '★' },
    { threshold: 4, rank: 'SILVER', color: '#CBD5E1', symbol: '◇' },
    { threshold: 3, rank: 'BRONZE', color: '#CD7F32', symbol: '●' },
  ];
  const entry = rankMap.find(r => be.rating >= r.threshold) ?? rankMap[rankMap.length - 1];

  return {
    id: be.id,
    name: be.name,
    avatar,
    rating: be.rating,
    quote: be.text,
    role: be.role ?? 'Khách hàng',
    company: be.company ?? '',
    rank: entry.rank,
    rankColor: entry.color,
    rankSymbol: entry.symbol,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────
export const testimonialsService = {
  /**
   * GET /api/v1/testimonials?lang={locale}
   * Returns all active testimonials.
   */
  getTestimonials: async (locale = 'vi'): Promise<Testimonial[]> => {
    const res = await api.get<{
      data: BeTestimonial[];
      meta: { count: number; locale: string };
    }>(`/v1/testimonials?lang=${locale}`);
    return res.data.map(mapTestimonial);
  },
};
