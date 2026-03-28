/**
 * LOOP Solutions — Team API Service
 * Public team: list + member detail
 *
 * BE contract:
 * GET /api/v1/team?lang={locale}    → { data: members[], meta }
 * GET /api/v1/team/[slug]?lang=   → { data: member, meta }
 */
import { api } from './client';

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

// ── FE format (matches Home.tsx / MemberDetailPage expectations) ───────────
export interface TeamMember {
  id: number;
  slug: string;
  name: string;
  role: string;
  shortBio: string;
  bio: string;
  image: string;
  avatar: string; // alias for image
  level: number;
  rank: string;
  rankColor: string;
  lpBalance: number;
  roleLevel: number; // sort priority
  department: string;
  tags: string[];
  expertise: BeExpertise[];
  isFeatured: boolean;
  isActive: boolean;
  projectsCompleted: number;
  joinedDate: string;
  location: string;
  languages: string[];
  github?: string;
  linkedin?: string;
  website?: string;
  achievements: string[];
  available: boolean;
  // i18n
  nameEn?: string;
  nameJa?: string;
  nameKo?: string;
  nameZh?: string;
  roleEn?: string;
  roleJa?: string;
  roleKo?: string;
  roleZh?: string;
}

// ── Mapping ──────────────────────────────────────────────────────────────────
function mapMember(be: BeTeamMember): TeamMember {
  const slugParts = be.slug?.split('-') ?? [];
  const roleLevel = slugParts.length > 0 ? parseInt(slugParts[slugParts.length - 1]) || 50 : 50;

  return {
    id: parseInt(be.id) || 0,
    slug: be.slug ?? be.id,
    name: be.name,
    role: be.role,
    shortBio: be.shortBio ?? '',
    bio: be.bio ?? '',
    image: be.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(be.name)}`,
    avatar: be.image ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(be.name)}`,
    level: roleLevel,
    rank: 'member',
    rankColor: '#94A3B8',
    lpBalance: 0,
    roleLevel,
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
};
