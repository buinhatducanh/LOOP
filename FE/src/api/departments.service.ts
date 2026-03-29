/**
 * LOOP Solutions — Departments API Service
 *
 * BE endpoints:
 * GET /api/admin/team        → all members (group by department client-side)
 * (No dedicated /api/admin/departments route — dept grouping done via team data)
 */
import { api } from './client';
import { RANKS } from '../app/components/team/memberData';

// ── BE response types ──────────────────────────────────────────────────────────
interface BeTeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  image: string | null;
  department?: string;
  level?: number;
  rank?: string;
  availableLp?: number;
}

// ── FE domain types ───────────────────────────────────────────────────────────
export interface DepartmentMember {
  id: string;
  name: string;
  role: string;
  img: string;
  department: string;
  level: number;
  rank: string;
  rankColor: string;
  lpBalance: number;
}

export interface DepartmentSummary {
  department: string;
  members: DepartmentMember[];
  headCount: number;
}

// ── Mapping ──────────────────────────────────────────────────────────────────
function mapMember(be: BeTeamMember): DepartmentMember {
  const rankKey = (be.rank ?? 'iron') as keyof typeof RANKS;
  const rankConfig = RANKS[rankKey] ?? RANKS.iron;
  return {
    id: be.id,
    name: be.name,
    role: be.role,
    img: be.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(be.name)}`,
    department: be.department ?? 'engineering',
    level: be.level ?? 1,
    rank: rankKey,
    rankColor: rankConfig.color,
    lpBalance: be.availableLp ?? 0,
  };
}

// ── Group helpers ─────────────────────────────────────────────────────────────
const DEPT_ORDER = ['engineering', 'design', 'media', 'marketing', 'sales', 'finance', 'hr', 'management', 'admin'];

export const departmentsService = {
  /**
   * GET /api/admin/team
   * Fetch all team members, then group by department client-side.
   */
  getDepartments: async (): Promise<DepartmentSummary[]> => {
    const res = await api.get<{ data: BeTeamMember[] }>('/admin/team');
    const members = res.data.map(mapMember);

    // Group by department
    const grouped = members.reduce<Record<string, DepartmentMember[]>>((acc, m) => {
      const dept = m.department.toLowerCase();
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(m);
      return acc;
    }, {});

    // Return sorted by DEPT_ORDER
    return DEPT_ORDER
      .filter(d => grouped[d])
      .map(dept => ({
        department: dept,
        members: grouped[dept],
        headCount: grouped[dept].length,
      }));
  },

  /**
   * GET /api/admin/team
   * Fetch raw member list (for filters/sorting in DepartmentTab).
   */
  getMembers: async (params?: {
    department?: string;
    search?: string;
    rank?: string;
  }): Promise<DepartmentMember[]> => {
    const q = new URLSearchParams();
    if (params?.department) q.set('department', params.department);
    if (params?.search) q.set('search', params.search);
    if (params?.rank) q.set('rank', params.rank);
    const qs = q.toString();
    const path = `/admin/team${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeTeamMember[] }>(path);
    return res.data.map(mapMember);
  },
};
