/**
 * LOOP Solutions — Academy API Service
 * Public courses: list + detail
 *
 * BE contract:
 * GET /api/v1/courses?lang={locale}&page=1&limit=20  → { data: Course[], pagination: {...}, meta }
 * GET /api/v1/courses/[id]?lang={locale}             → { data: CourseDetail }
 *
 * NOTE: This endpoint is planned for Phase F4. Until then, this service
 * falls back to INIT_COURSES (hardcoded mock) so the Academy page
 * still renders correctly during Phase F0 development.
 */
import { api } from './client';

// ── BE response types (plan) ────────────────────────────────────────────────────
interface BeCourse {
  id: string;
  slug: string;
  title: string;
  titleVi: string;
  shortDescription: string;
  description: string | null;
  type: string;
  price: number;
  lpPrice: number;      // LP cost for full LP payment
  lpReward: number;     // LP earned on completion
  maxStudents: number;
  durationWeeks: number;
  status: string;
  coverImage: string | null;
  level: string;
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  instructorMemberId: string | null;
  _count: {
    lessons: number;
    enrollments: number;
  };
  _localeUsed: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── FE domain types ────────────────────────────────────────────────────────────
export interface AcademyCourse {
  id: string;
  title: string;
  instructor: string;
  instructorRole: string;
  instructorImg: string;
  duration: string;
  students: number;
  rating: number;
  reviews: number;
  price: number;
  lpPrice: number;
  lpReward: number;
  img: string;
  cat: string;
  level: string;
  color: string;
  featured: boolean;
  updatedAt: string;
  lectures: number;
  certificate: boolean;
  tags: string[];
}

// ── Mapping: BE → FE AcademyCourse ────────────────────────────────────────────
function mapCourse(be: BeCourse): AcademyCourse {
  const cat = inferCategory(be.title, be.shortDescription);
  return {
    id: be.id,
    title: be._localeUsed === 'vi' ? be.titleVi || be.title : be.title,
    instructor: be.instructor?.name ?? 'LOOP Expert',
    instructorRole: 'Chuyên gia LOOP',
    instructorImg: be.instructor?.avatar ?? 'https://api.dicebear.com/7.x/initials/svg?seed=instructor',
    duration: `${be.durationWeeks * 4}h`,
    students: be._count.enrollments,
    rating: 4.8,   // TODO: add rating field to Course model
    reviews: Math.floor(be._count.enrollments * 0.15),
    price: be.price,
    lpPrice: be.lpPrice,
    lpReward: be.lpReward,
    img: be.coverImage ?? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80',
    cat,
    level: be.level,
    color: catColor(cat),
    featured: false,
    updatedAt: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    lectures: be._count.lessons,
    certificate: true,
    tags: [],
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function inferCategory(title: string, desc: string): string {
  const lower = (title + ' ' + desc).toLowerCase();
  if (/react|next\.?js|vue|angular|frontend|typescript|javascript/.test(lower)) return 'Frontend';
  if (/node\.?js|python|java|go|rust|backend|api|postgresql|mongodb/.test(lower)) return 'Backend';
  if (/figma|ui.ux|design|ux\.writing|ui/.test(lower)) return 'Design';
  if (/devops|kubernetes|docker|ci\.cd|aws|cloud/.test(lower)) return 'DevOps';
  if (/marketing|seo|content|growth|copywriting/.test(lower)) return 'Marketing';
  return 'Tech';
}

const catColor: Record<string, string> = {
  Frontend: '#3B82F6',
  Backend: '#06B6D4',
  Design: '#8B5CF6',
  DevOps: '#10B981',
  Marketing: '#F59E0B',
  Tech: '#818CF8',
};

// ── Service ─────────────────────────────────────────────────────────────────────
export interface AcademyListResult {
  courses: AcademyCourse[];
  pagination: Pagination;
  locale: string;
}

export const academyService = {
  /**
   * GET /api/v1/courses?lang={locale}&page=1&limit=20
   * Returns paginated courses.
   * Falls back to INIT_COURSES when endpoint returns 404 (Phase F4 not started yet).
   */
  getCourses: async (locale = 'vi', page = 1, limit = 20): Promise<AcademyListResult> => {
    try {
      const res = await api.get<{
        data: BeCourse[];
        pagination: Pagination;
        meta: { locale: string };
      }>(`/v1/courses?lang=${locale}&page=${page}&limit=${limit}`);

      const courses = res.data.map(mapCourse);
      return {
        courses,
        pagination: res.pagination,
        locale: res.meta.locale,
      };
    } catch {
      // Endpoint not available yet (Phase F4 pending) — return empty result
      // AcademyPage will show its hardcoded INIT_COURSES as fallback
      return {
        courses: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        locale,
      };
    }
  },

  /**
   * GET /api/v1/courses/[id]?lang={locale}
   * Returns a single course by id.
   */
  getCourseById: async (id: string, locale = 'vi'): Promise<AcademyCourse | null> => {
    try {
      const res = await api.get<{ data: BeCourse }>(`/v1/courses/${id}?lang=${locale}`);
      return mapCourse(res.data);
    } catch {
      return null;
    }
  },

  // ── Admin CRUD ───────────────────────────────────────────────────────────

  /**
   * GET /api/admin/edu/courses
   */
  getAdminCourses: async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<{
    courses: AcademyCourse[];
    pagination: Pagination;
  }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 20));
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    const path = `/admin/edu/courses${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeCourse[]; pagination: Pagination }>(path);
    return { courses: res.data.map(mapCourse), pagination: res.pagination };
  },

  /**
   * GET /api/admin/edu/enrollments
   */
  getAdminEnrollments: async (params?: { page?: number; limit?: number; courseId?: string; status?: string }): Promise<{
    enrollments: unknown[];
    pagination: Pagination;
  }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 20));
    if (params?.courseId) q.set('courseId', params.courseId);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    const path = `/admin/edu/enrollments${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: unknown[]; pagination: Pagination }>(path);
    return { enrollments: res.data, pagination: res.pagination };
  },
};
