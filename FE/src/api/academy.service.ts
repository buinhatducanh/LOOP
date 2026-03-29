/**
 * LOOP Solutions — Academy API Service
 * BE contract: see inline for each method.
 */
import { api } from './client';

// ── BE response types ────────────────────────────────────────────────────────────
export interface BeCourse {
  id: string;
  slug: string;
  title: string;
  titleVi: string;
  shortDescription: string;
  description: string | null;
  type: string;
  price: number;
  lpPrice: number;       // LP cost for full LP payment
  lpReward: number;       // LP earned on completion
  maxStudents: number;
  durationWeeks: number;
  status: string;
  coverImage: string | null;
  level: string;
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
    bio?: string | null;
    specialties?: string[];
    rating?: number;
    totalStudents?: number;
  } | null;
  instructorMemberId: string | null;
  _count: {
    lessons: number;
    enrollments: number;
  };
  _localeUsed: string;
}

// Extended type for course detail (includes chapters/curriculum)
export interface BeCourseDetail extends BeCourse {
  chapters: {
    title: string;
    lessons: {
      id: string;
      title: string;
      durationMinutes: number;
      isFree: boolean;
      orderIndex: number;
    }[];
  }[];
}

// Student-facing enrollment types
export interface StudentEnrollment {
  id: string;
  courseId: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  paidAmount: number;
  paidAt: string | null;
  enrolledAt: string;
  course: {
    id: string;
    slug: string;
    title: string;
    titleVi: string;
    shortDescription: string;
    coverImage: string | null;
    level: string;
    type: string;
    durationWeeks: number;
    lpReward: number;
    instructor: { name: string; avatar: string | null } | null;
  };
  progress: {
    progressPercent: number;
    completedLessons: string[];
    courseComplete: boolean;
    lpEarned: number;
    nextLesson: { id: string; title: string } | null;
    lastActivity: string | null;
  };
}

// Enrollment types
export interface EnrollPayload {
  courseId: string;
  paymentMethod: 'vnd' | 'mixed' | 'lp';
  lpAmount?: number;
}

export interface EnrollResponse {
  data: {
    id: string;
    courseId: string;
    status: string;
    paidAmount: number;
    enrolledAt: string;
    course: { id: string; title: string; titleVi: string; lpReward: number };
    user?: { id: string; name: string; email: string };
    member?: { id: string; name: string };
  };
}

// Lesson completion types
export interface LessonCompletePayload {
  watchedSeconds: number;
  lessonDurationSeconds: number;
}

export interface LessonCompleteResponse {
  data: {
    lessonId: string;
    lessonTitle: string;
    completedAt: string;
    progressPercent: number;
    courseComplete: boolean;
    lpRewardAwarded: number;
    nextLesson: { id: string; title: string } | null;
  };
}

// Progress types
export interface ProgressResponse {
  data: {
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    status: string;
    progressPercent: number;
    completedLessons: string[];
    courseComplete: boolean;
    lpEarned: number;
    nextLesson: { id: string; title: string } | null;
    lastActivity: string | null;
    enrolledAt: string;
    totalLessons: number;
  };
}

// Exercise submission types
export interface ExerciseSubmitPayload {
  code: string;
  language?: string;
}

export interface ExerciseResponse {
  data: {
    id: string;
    output: string;
    passed: boolean;
    language: string;
    createdAt: string;
  };
}

// Comment types
export interface CommentAuthor {
  authorName: string;
  authorAvatar: string | null;
}

export interface Comment {
  id: string;
  lessonId: string;
  userId: string | null;
  memberId: string | null;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  likes: number;
  createdAt: string;
  timeAgo: string;
}

export interface CommentsListResponse {
  data: Comment[];
  pagination: Pagination;
}

export interface CommentPostPayload {
  content: string;
}

// Certificate types
export interface CertificateResponse {
  data:
    | {
        eligible: true;
        certificate: {
          enrollmentId: string;
          courseId: string;
          courseTitle: string;
          instructorName: string;
          studentName: string;
          completedAt: string;
          issuedAt: string;
          lpEarned: number;
          certificateId: string;
        };
      }
    | {
        eligible: false;
        progressPercent: number;
        remainingLessons: number;
        message: string;
      };
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

// Extended type for course detail page (includes chapters/curriculum)
export interface AcademyCourseDetail extends AcademyCourse {
  desc: string;
  highlights: string[];
  objectives: string[];
  curriculum: {
    chapter: string;
    duration: string;
    lessons: {
      id: string;
      title: string;
      duration: string;
      free?: boolean;
      type?: 'video' | 'quiz' | 'project';
    }[];
  }[];
  requirements: string[];
  targetAudience: string[];
  testimonials: { name: string; avatar: string; rating: number; date: string; comment: string }[];
  included: string[];
}

// Map BE course detail (with chapters) → FE AcademyCourseDetail
function mapCourseDetail(be: BeCourseDetail): AcademyCourseDetail {
  // inferCategory is called inside mapCourse; no extra work needed here

  // Group lessons into chapters matching FE structure
  const chapterMap = new Map<number, { title: string; lessons: AcademyCourseDetail['curriculum'][0]['lessons'] }>();
  for (const lesson of be.chapters.flatMap((ch) => ch.lessons)) {
    const chapterIndex = Math.floor(lesson.orderIndex / 10);
    if (!chapterMap.has(chapterIndex)) {
      chapterMap.set(chapterIndex, { title: `Chương ${chapterIndex + 1}`, lessons: [] });
    }
    chapterMap.get(chapterIndex)!.lessons.push({
      id: lesson.id,
      title: lesson.title,
      duration: `${lesson.durationMinutes}p`,
      free: lesson.isFree,
      type: lesson.durationMinutes < 20 ? 'quiz' : undefined,
    });
  }

  // Derive chapter durations from lessons
  const curriculum = Array.from(chapterMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, { title, lessons }]) => {
      const totalMinutes = lessons.reduce((s, l) => s + parseInt(l.duration), 0);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return { chapter: title, duration: h > 0 ? `${h}h ${m}p` : `${m}p`, lessons };
    });

  return {
    ...mapCourse(be),
    desc: be.description ?? be.shortDescription ?? '',
    highlights: [`${be._count.lessons} bài giảng · ${be.durationWeeks * 4}h nội dung`, 'Project thực tế cuối khóa', 'Discord community support', 'Cập nhật lifetime miễn phí'],
    objectives: [
      'Xây dựng project thực tế từ đầu đến cuối',
      'Nắm vững công cụ và workflow chuyên nghiệp',
      'Deploy production-ready application',
      'Hiểu best practices và design patterns',
    ],
    curriculum,
    requirements: ['JavaScript cơ bản', 'HTML/CSS cơ bản', 'Máy tính và internet ổn định'],
    targetAudience: ['Developer muốn nâng cao kỹ năng', 'Designer muốn chuyển sang tech', 'Sinh viên CNTT muốn tìm việc'],
    testimonials: [],
    included: [
      `${be._count.lessons} bài học video HD`,
      'File source code mỗi chương',
      'Certificate PDF có QR xác thực',
      'Discord community riêng',
      'Cập nhật content lifetime',
    ],
  };
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
  // ── Public ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/courses?lang={locale}&page=1&limit=20
   * Returns paginated course list.
   * Falls back to local mock when API unavailable.
   */
  getCourses: async (locale = 'vi', page = 1, limit = 20): Promise<AcademyListResult> => {
    try {
      const res = await api.get<{
        data: BeCourse[];
        pagination: Pagination;
        meta: { locale: string };
      }>(`/v1/courses?lang=${locale}&page=${page}&limit=${limit}`);
      const courses = res.data.map(mapCourse);
      return { courses, pagination: res.pagination, locale: res.meta.locale };
    } catch {
      return { courses: [], pagination: { page, limit, total: 0, totalPages: 0 }, locale };
    }
  },

  /**
   * GET /api/v1/courses/[id]?lang={locale}
   * Returns single course with full curriculum (chapters + lessons).
   * Falls back to local mock when API unavailable.
   */
  getCourseById: async (id: string, locale = 'vi'): Promise<AcademyCourseDetail | null> => {
    try {
      const res = await api.get<{ data: BeCourseDetail }>(`/v1/courses/${id}?lang=${locale}`);
      return mapCourseDetail(res.data);
    } catch {
      return null;
    }
  },

  // ── Student-facing ─────────────────────────────────────────────────────────────

  /**
   * POST /api/academy/enroll
   * Enrolls current user in a course.
   *
   * Auth: reads userId/memberId from localStorage token.
   */
  enroll: async (payload: EnrollPayload): Promise<EnrollResponse> => {
    // Read auth from localStorage (same pattern as authStore)
    const rawUser = localStorage.getItem('loop_user');
    let userId: string | undefined;
    let memberId: string | undefined;
    try {
      if (rawUser) {
        const user = JSON.parse(rawUser);
        userId = user.id;
        memberId = user.memberId;
      }
    } catch { /* ignore */ }

    return api.post<EnrollResponse>('/academy/enroll', {
      ...payload,
      userId,
      memberId,
    });
  },

  /**
   * POST /api/academy/lessons/[id]/complete
   * Marks a lesson as completed (implements Video Gate 35% check).
   *
   * videoGatePassed = true from BE response → proceed to next lesson.
   */
  completeLesson: async (
    lessonId: string,
    payload: LessonCompletePayload
  ): Promise<LessonCompleteResponse> => {
    const rawUser = localStorage.getItem('loop_user');
    let userId: string | undefined;
    let memberId: string | undefined;
    try {
      if (rawUser) {
        const user = JSON.parse(rawUser);
        userId = user.id;
        memberId = user.memberId;
      }
    } catch { /* ignore */ }

    return api.post<LessonCompleteResponse>(`/academy/lessons/${lessonId}/complete`, {
      ...payload,
      userId,
      memberId,
    });
  },

  /**
   * GET /api/academy/progress/[courseId]
   * Loads saved progress for the course player.
   */
  getProgress: async (courseId: string): Promise<ProgressResponse | null> => {
    const rawUser = localStorage.getItem('loop_user');
    let userId: string | undefined;
    let memberId: string | undefined;
    try {
      if (rawUser) {
        const user = JSON.parse(rawUser);
        userId = user.id;
        memberId = user.memberId;
      }
    } catch { /* ignore */ }

    const q = new URLSearchParams();
    if (userId) q.set('userId', userId);
    if (memberId) q.set('memberId', memberId);
    const qs = q.toString();

    try {
      return await api.get<ProgressResponse>(`/academy/progress/${courseId}${qs ? `?${qs}` : ''}`);
    } catch {
      return null;
    }
  },

  // ── Exercise ──────────────────────────────────────────────────────────────────

  /**
   * POST /api/academy/lessons/[id]/exercise
   * Submits code for sandbox execution, returns output + pass/fail.
   */
  submitExercise: async (
    lessonId: string,
    payload: ExerciseSubmitPayload
  ): Promise<ExerciseResponse> => {
    const rawUser = localStorage.getItem('loop_user');
    let userId: string | undefined;
    let memberId: string | undefined;
    try {
      if (rawUser) {
        const user = JSON.parse(rawUser);
        userId = user.id;
        memberId = user.memberId;
      }
    } catch { /* ignore */ }

    return api.post<ExerciseResponse>(`/academy/lessons/${lessonId}/exercise`, {
      ...payload,
      userId,
      memberId,
    });
  },

  // ── Comments ─────────────────────────────────────────────────────────────────

  /**
   * GET /api/academy/lessons/[id]/comments?page=1&limit=20
   * Lists comments for a lesson (paginated).
   */
  getComments: async (lessonId: string, page = 1, limit = 20): Promise<CommentsListResponse> => {
    try {
      return await api.get<CommentsListResponse>(
        `/academy/lessons/${lessonId}/comments?page=${page}&limit=${limit}`
      );
    } catch {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  },

  /**
   * POST /api/academy/lessons/[id]/comments
   * Posts a new comment for a lesson.
   */
  postComment: async (lessonId: string, payload: CommentPostPayload): Promise<{ data: Comment }> => {
    const rawUser = localStorage.getItem('loop_user');
    let userId: string | undefined;
    let memberId: string | undefined;
    try {
      if (rawUser) {
        const user = JSON.parse(rawUser);
        userId = user.id;
        memberId = user.memberId;
      }
    } catch { /* ignore */ }

    return api.post<{ data: Comment }>(`/academy/lessons/${lessonId}/comments`, {
      ...payload,
      userId,
      memberId,
    });
  },

  /**
   * GET /api/academy/certificate/[courseId]
   * Checks certificate eligibility.
   */
  getCertificate: async (courseId: string): Promise<CertificateResponse | null> => {
    const rawUser = localStorage.getItem('loop_user');
    let userId: string | undefined;
    let memberId: string | undefined;
    try {
      if (rawUser) {
        const user = JSON.parse(rawUser);
        userId = user.id;
        memberId = user.memberId;
      }
    } catch { /* ignore */ }

    const q = new URLSearchParams();
    if (userId) q.set('userId', userId);
    if (memberId) q.set('memberId', memberId);
    const qs = q.toString();

    try {
      return await api.get<CertificateResponse>(`/academy/certificate/${courseId}${qs ? `?${qs}` : ''}`);
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
   * POST /api/admin/edu/courses
   * Creates a new course.
   */
  createCourse: async (data: {
    title: string; titleVi: string; instructorId: string;
    price?: number; lpReward?: number; status?: string;
  }): Promise<{ data: BeCourse }> => {
    return api.post<{ data: BeCourse }>('/admin/edu/courses', data);
  },

  /**
   * PUT /api/admin/edu/courses/[id]
   * Updates a course.
   */
  updateCourse: async (id: string, data: Partial<{
    title: string; titleVi: string; description: string; descriptionVi: string;
    type: string; instructorId: string; price: number; lpReward: number;
    maxStudents: number; durationWeeks: number; status: string;
  }>): Promise<{ data: BeCourse }> => {
    return api.put<{ data: BeCourse }>(`/admin/edu/courses/${id}`, data);
  },

  /**
   * DELETE /api/admin/edu/courses/[id]
   */
  deleteCourse: async (id: string): Promise<{ data: { deleted: boolean; id: string } }> => {
    return api.delete<{ data: { deleted: boolean; id: string } }>(`/admin/edu/courses/${id}`);
  },

  /**
   * GET /api/academy/enroll
   * Student-facing: list all enrollments for the logged-in user.
   * Reads userId/memberId from localStorage token (set by auth flow).
   * Returns enriched enrollment data with course info and progress.
   */
  getMyEnrollments: async (): Promise<StudentEnrollment[]> => {
    try {
      const token = localStorage.getItem('loop_token');
      if (!token) return [];
      const res = await api.get<{ data: StudentEnrollment[] }>('/academy/enroll');
      return res.data ?? [];
    } catch {
      return [];
    }
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
