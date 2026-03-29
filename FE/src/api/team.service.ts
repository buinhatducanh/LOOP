/**
 * LOOP Solutions — Team API Service
 * Public team: list + member detail
 *
 * BE contract:
 * GET /api/v1/team?lang={locale}    → { data: members[], meta }
 * GET /api/v1/team/[slug]?lang=   → { data: member, meta }
 *
 * Admin team:
 * GET /api/admin/team             → { data: BeAdminMember[], page, limit, total, totalPages }
 */
import { api } from './client';
import { RANKS, type RankKey } from '../app/components/team/memberData';

// ── BE response types ──────────────────────────────────────────────────────────
interface BeExpertise {
  name: string;
  category: string;
  icon: string | null;
}

interface BeTeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  shortBio: string | null;
  bio: string | null;
  image: string | null;
  isFeatured: boolean;
  expertise: BeExpertise[];
  _localeUsed: string;
}

interface BeTeamResponse {
  data: BeTeamMember[];
  meta: { count: number; locale: string };
}

interface BeMemberDetailResponse {
  data: BeTeamMember;
  meta: { locale: string };
}

// ── Admin team member (from BE /admin/team with rank enrichment) ────────────
interface BeAdminMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  shortBio: string | null;
  bio: string | null;
  image: string | null;
  isFeatured: boolean;
  level: number;
  currentXp: number;
  maxXp: number;
  rank: string;
  totalApprovedLp: number;
  lockedLp: number;
  availableLp: number;
  memberExpertise: Array<{ expertise: { name: string; icon: string | null } }>;
}

// ── FE format (matches Home.tsx / MemberDetailPage expectations) ───────────
export interface TeamMember {
  id: string; // BE Prisma CUID
  slug: string;
  name: string;
  role: string;
  shortBio: string;
  bio: string;
  image: string;
  avatar: string; // alias for image
  roleLevel: number; // sort priority (from BE)
  // Additional fields derived at FE level
  level: number;
  rank: string;
  rankColor: string;
  lpBalance: number;
  department: string;
  tags: string[];
  expertise: BeExpertise[];
  isFeatured: boolean;
  isActive: boolean;
  projectsCompleted: number;
  joinedDate: string;
  location: string;
  languages: string[];
  achievements: string[];
  available: boolean;
  github?: string;
  linkedin?: string;
  website?: string;
}

// ── Mapping ──────────────────────────────────────────────────────────────────
function mapMember(be: BeTeamMember): TeamMember {
  const slugParts = be.slug?.split('-') ?? [];
  const roleLevel = slugParts.length > 0 ? parseInt(slugParts[slugParts.length - 1]) || 50 : 50;

  return {
    id: be.id, // BE Prisma CUID string
    slug: be.slug ?? be.id,
    name: be.name,
    role: be.role,
    shortBio: be.shortBio ?? '',
    bio: be.bio ?? '',
    image: be.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(be.name)}`,
    avatar: be.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(be.name)}`,
    roleLevel,
    // FE-level fields (not from BE)
    level: roleLevel,
    rank: 'member',
    rankColor: '#94A3B8',
    lpBalance: 0,
    department: 'engineering',
    tags: be.expertise?.map(e => e.name) ?? [],
    expertise: be.expertise ?? [],
    isFeatured: be.isFeatured ?? false,
    isActive: true,
    projectsCompleted: 0,
    joinedDate: new Date().toISOString().split('T')[0],
    location: 'Hồ Chí Minh',
    languages: ['Tiếng Việt', 'English'],
    achievements: [],
    available: true,
  };
}

/**
 * Convert BE TeamMember (string id) → Home.tsx Member (number id).
 * Looks up fallback by slug to get the numeric id.
 * Note: fallbackBySlug maps slug → Member from memberData.ts
 */
export function mapTeamMemberToMember(
  be: TeamMember,
  fallbackBySlug: Record<string, {
    id: number;
    missions?: number;
    achievements?: string[];
    skills?: Record<string, number>;
    missionLogs?: unknown[];
    rankHistory?: unknown[];
    currentXP?: number;
    maxXP?: number;
    lpSpent?: number;
  }>
) {
  const fallback = fallbackBySlug[be.slug];
  return {
    id: fallback?.id ?? 0,
    name: be.name,
    title: be.role,
    role: be.role,
    roleCode: be.slug.split('-').pop()?.toUpperCase() ?? 'STAFF',
    team: be.department,
    rank: (be.rank ?? 'iron') as 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'ruby' | 'diamond',
    level: be.level,
    currentXP: fallback?.currentXP ?? 0,
    maxXP: fallback?.maxXP ?? be.level * 100,
    lpBalance: be.lpBalance,
    lpEarned: 0,
    lpSpent: fallback?.lpSpent ?? 0,
    img: be.image,
    bio: be.bio,
    specialty: be.tags.join(', '),
    missions: fallback?.missions ?? 0,
    achievements: fallback?.achievements ?? be.achievements,
    skills: fallback?.skills ?? {},
    missionLogs: (fallback?.missionLogs ?? []) as import('./components/team/memberData').Member['missionLogs'],
    rankHistory: (fallback?.rankHistory ?? []) as import('./components/team/memberData').Member['rankHistory'],
  };
}

// ── Service ───────────────────────────────────────────────────────────────────
export interface TeamResult {
  members: TeamMember[];
  locale: string;
}

export const teamService = {
  /**
   * GET /api/v1/team?lang={locale}
   * Returns all active team members.
   */
  getMembers: async (locale = 'vi'): Promise<TeamResult> => {
    const res = await api.get<BeTeamResponse>(`/v1/team?lang=${locale}`);
    return {
      members: res.data.map(mapMember),
      locale: res.meta.locale,
    };
  },

  /**
   * GET /api/v1/team/[slug]?lang={locale}
   * Returns a single member by slug.
   */
  getMemberBySlug: async (slug: string, locale = 'vi'): Promise<TeamMember | null> => {
    try {
      const res = await api.get<BeMemberDetailResponse>(`/v1/team/${slug}?lang=${locale}`);
      return mapMember(res.data);
    } catch {
      return null;
    }
  },

  // ── Admin team ────────────────────────────────────────────────────────
  /**
   * GET /api/admin/team?page=&limit=&search=&department=&rank=
   * Returns enriched team members with real level/rank/LP from BE.
   */
  getAdminMembers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    rank?: string;
  }): Promise<{ members: TeamMember[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 50));
    if (params?.search) q.set('search', params.search);
    if (params?.department) q.set('department', params.department);
    if (params?.rank) q.set('rank', params.rank);
    const qs = q.toString();
    const path = `/admin/team${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeAdminMember[]; page: number; limit: number; total: number; totalPages: number }>(path);
    return {
      members: res.data.map(mapAdminMember),
      pagination: { page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages },
    };
  },
};

// ── Admin member mapper (BE → TeamMember / Member shape) ──────────────────────
function mapAdminMember(be: BeAdminMember): TeamMember {
  const rankKey = (be.rank ?? 'iron') as RankKey;
  const rankConfig = RANKS[rankKey] ?? RANKS.iron;
  return {
    id: be.id,
    slug: be.slug ?? be.id,
    name: be.name,
    role: be.role,
    shortBio: be.shortBio ?? '',
    bio: be.bio ?? '',
    image: be.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(be.name)}`,
    avatar: be.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(be.name)}`,
    roleLevel: be.level,
    level: be.level,
    rank: rankKey,
    rankColor: rankConfig.color,
    lpBalance: be.availableLp ?? 0,
    department: 'engineering',
    tags: be.memberExpertise?.map(e => e.expertise.name) ?? [],
    expertise: be.memberExpertise?.map(e => ({
      name: e.expertise.name,
      category: '',
      icon: e.expertise.icon ?? null,
    })) ?? [],
    isFeatured: be.isFeatured ?? false,
    isActive: true,
    projectsCompleted: 0,
    joinedDate: new Date().toISOString().split('T')[0],
    location: 'Hồ Chí Minh',
    languages: ['Tiếng Việt', 'English'],
    achievements: [],
    available: true,
  };
}

