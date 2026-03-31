/**
 * LOOP Solutions — Projects API Service
 * Public projects: list + detail
 *
 * BE contract:
 * GET /api/v1/projects?lang={locale}  → { data: projects[], meta }
 * GET /api/v1/projects/[slug]?lang= → { data: project, meta }
 */
import { api } from './client';
import type { PortfolioProject } from '../store/loopStore';

// ── BE response types ──────────────────────────────────────────────────────────
interface BeProject {
  id: string;
  slug: string;
  category: string;
  client: string;
  year: string;
  image: string | null;
  title: string;
  description: string;
  techStack: string[];
  features: string[];
  results: string | null;
  screenshots: string[];
  isPublished: boolean;
  sortOrder: number | null;
  service?: { slug: string };
  teamMember?: { id: string; slug: string; role: string; image: string };
  _localeUsed: string;
  // i18n fields
  titleEn?: string; titleJa?: string; titleKo?: string; titleZh?: string;
  challengeEn?: string; challengeJa?: string; challengeKo?: string; challengeZh?: string;
  solutionEn?: string;  solutionJa?: string;  solutionKo?: string;  solutionZh?: string;
  resultEn?: string;    resultJa?: string;    resultKo?: string;    resultZh?: string;
  techStackEn?: string[]; techStackJa?: string[]; techStackKo?: string[]; techStackZh?: string[];
  featuresEn?: string[]; featuresJa?: string[]; featuresKo?: string[]; featuresZh?: string[];
}

interface BeProjectsResponse {
  data: BeProject[];
  meta: { count: number; locale: string };
}

interface BeProjectDetailResponse {
  data: BeProject;
  meta: { locale: string };
}

// ── Mapping: BE → FE PortfolioProject ──────────────────────────────────────────
function getColorByCat(cat: string): string {
  switch (cat?.toLowerCase()) {
    case 'website': return '#3B82F6';
    case 'saas': return '#8B5CF6';
    case 'app': return '#10B981';
    case 'mobile': return '#06B6D4';
    case 'ecommerce': return '#F59E0B';
    default: return '#818CF8';
  }
}

function mapProject(be: BeProject): PortfolioProject {
  return {
    id: be.id,
    title: be.title,
    tag: be.category,
    cat: be.category.toLowerCase(),
    client: be.client,
    color: getColorByCat(be.category),
    img: be.image ?? 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=900&q=80',
    year: be.year,
    duration: '',
    budget: '',
    budgetNum: 0,
    team: '',
    status: 'completed',
    metric1: '',
    m1label: '',
    metric2: '',
    m2label: '',
    metric3: '',
    m3label: '',
    challenge: '',
    solution: be.results ?? '',
    result: be.results ?? '',
    tags: be.techStack ?? [],
    features: be.features ?? [],
    lp: 0,
    hasDemo: false,
    demoUrl: '#',
    maskedUrl: '#',
    demoTitle: '',
    featured: be.isPublished,
    publishedAt: new Date().toISOString().split('T')[0],
    // i18n fields
    titleEn: be.titleEn, titleJa: be.titleJa, titleKo: be.titleKo, titleZh: be.titleZh,
    challengeEn: be.challengeEn, challengeJa: be.challengeJa, challengeKo: be.challengeKo, challengeZh: be.challengeZh,
    solutionEn: be.solutionEn, solutionJa: be.solutionJa, solutionKo: be.solutionKo, solutionZh: be.solutionZh,
    resultEn: be.resultEn, resultJa: be.resultJa, resultKo: be.resultKo, resultZh: be.resultZh,
    tagsEn: be.techStackEn, tagsJa: be.techStackJa, tagsKo: be.techStackKo, tagsZh: be.techStackZh,
    featuresEn: be.featuresEn, featuresJa: be.featuresJa, featuresKo: be.featuresKo, featuresZh: be.featuresZh,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────
export interface ProjectsResult {
  projects: PortfolioProject[];
  locale: string;
}

export const projectsService = {
  /**
   * GET /api/v1/projects?lang={locale}
   * Returns all published projects.
   */
  getProjects: async (locale = 'vi'): Promise<ProjectsResult> => {
    const res = await api.get<BeProjectsResponse>(`/v1/projects?lang=${locale}`);
    return {
      projects: res.data.map(mapProject),
      locale: res.meta.locale,
    };
  },

  /**
   * GET /api/v1/projects/[slug]?lang={locale}
   * Returns a single project by slug.
   */
  getProjectBySlug: async (slug: string, locale = 'vi'): Promise<PortfolioProject | null> => {
    try {
      const res = await api.get<BeProjectDetailResponse>(`/v1/projects/${slug}?lang=${locale}`);
      return mapProject(res.data);
    } catch {
      return null;
    }
  },

  // ── Admin CRUD ───────────────────────────────────────────────────────────

  /**
   * GET /api/admin/projects
   */
  getAdminProjects: async (): Promise<PortfolioProject[]> => {
    const res = await api.get<{ data: BeProject[] }>('/admin/projects');
    return (res.data ?? []).map(mapProject);
  },

  /**
   * POST /api/admin/projects
   */
  createProject: async (data: Partial<PortfolioProject>): Promise<PortfolioProject> => {
    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.solution,
      challenge: data.challenge,
      results: data.result,
      techStack: data.tags,
      features: data.features,
      isPublished: data.featured,
    };
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    );
    const res = await api.post<{ data: BeProject }>('/admin/projects', cleanPayload);
    return mapProject(res.data);
  },

  /**
   * PUT /api/admin/projects/[id]
   * Sends i18n fields as flat Prisma columns.
   */
  updateProject: async (id: string, data: Partial<PortfolioProject>): Promise<PortfolioProject> => {
    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.solution, // FE uses 'solution' for description
      challenge: data.challenge,
      results: data.result,
      techStack: data.tags,
      features: data.features,
      isPublished: data.featured,
      // i18n flat fields
      titleEn: data.titleEn, titleJa: data.titleJa, titleKo: data.titleKo, titleZh: data.titleZh,
      challengeEn: data.challengeEn, challengeJa: data.challengeJa,
      challengeKo: data.challengeKo, challengeZh: data.challengeZh,
      solutionEn: data.solutionEn, solutionJa: data.solutionJa,
      solutionKo: data.solutionKo, solutionZh: data.solutionZh,
      resultEn: data.resultEn, resultJa: data.resultJa,
      resultKo: data.resultKo, resultZh: data.resultZh,
      techStackEn: data.tagsEn, techStackJa: data.tagsJa,
      techStackKo: data.tagsKo, techStackZh: data.tagsZh,
      featuresEn: data.featuresEn, featuresJa: data.featuresJa,
      featuresKo: data.featuresKo, featuresZh: data.featuresZh,
    };
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    );
    const res = await api.put<{ data: BeProject }>(`/admin/projects/${id}`, cleanPayload);
    return mapProject(res.data);
  },

  /**
   * DELETE /api/admin/projects/[id]
   */
  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/admin/projects/${id}`);
  },
};
