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
};
