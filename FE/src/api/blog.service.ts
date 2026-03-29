/**
 * LOOP Solutions — Blog API Service
 * Public blog: list + detail
 *
 * BE contract:
 * GET /api/blog-posts?lang={locale}&page=1&limit=20  → { data: Post[], pagination: {...}, meta }
 * GET /api/blog-posts/[slug]?lang={locale}           → { data: PostDetail }
 *
 * BE also exposes /api/v1/blog (Sanity CMS) but the DB-backed route is used
 * for admin-managed posts.
 */
import { api } from './client';

// ── BE response types ──────────────────────────────────────────────────────────
interface BeBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  authorId: string | null;
  seoTitle: string | null;
  seoDesc: string | null;
  _localeUsed: string;
}

interface BeBlogDetail extends BeBlogPost {
  content: string | null;
  author: {
    id: string;
    name: string;
    image: string | null;
    slug: string;
    role: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── FE domain types ────────────────────────────────────────────────────────────
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
  author: string;
  cat: string;
  time: string;
  color: string;
  img: string;
  featured: boolean;
}

export interface BlogDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Plain HTML or markdown string from BE */
  content: string;
  /** Structured blocks for rendering — derived from content field */
  contentBlocks: Array<{ type: 'p' | 'h2'; text: string }>;
  coverImage: string;
  publishedAt: string;
  author: {
    name: string;
    image: string;
    role: string;
  };
  seoTitle: string;
  seoDesc: string;
}

// ── Mapping: BE → FE BlogPost ─────────────────────────────────────────────────
function mapPost(be: BeBlogPost): BlogPost {
  // Infer category from SEO title prefix or slug heuristics
  const cat = inferCategory(be.slug, be.title);
  return {
    id: be.id,
    slug: be.slug,
    title: be.title,
    excerpt: be.excerpt ?? '',
    coverImage: be.coverImage ?? 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
    publishedAt: be.publishedAt
      ? new Date(be.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '',
    author: be.authorId ?? 'LOOP Team',
    cat,
    time: estimateReadTime(be.excerpt ?? be.title),
    color: catColor(cat),
    img: be.coverImage ?? 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
    featured: false,
  };
}

function mapDetail(be: BeBlogDetail): BlogDetail {
  return {
    id: be.id,
    slug: be.slug,
    title: be.title,
    excerpt: be.excerpt ?? '',
    content: be.content ?? '',
    contentBlocks: parseContentBlocks(be.content ?? ''),
    coverImage: be.coverImage ?? 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    publishedAt: be.publishedAt
      ? new Date(be.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '',
    author: {
      name: be.author?.name ?? 'LOOP Team',
      image: be.author?.image ?? 'https://api.dicebear.com/7.x/initials/svg?seed=LOOP',
      role: be.author?.role ?? '',
    },
    seoTitle: be.seoTitle ?? be.title,
    seoDesc: be.seoDesc ?? be.excerpt ?? '',
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
/**
 * Parse a plain content string into structured blocks.
 * Treats lines starting with h2 markers or numbered headings as h2 blocks,
 * everything else as paragraphs. Falls back to splitting by double newlines.
 */
function parseContentBlocks(content: string): Array<{ type: 'p' | 'h2'; text: string }> {
  if (!content.trim()) return [];
  // Simple heuristic: lines starting with "## " or numbers like "1. " → h2
  const lines = content.split('\n');
  const blocks: Array<{ type: 'p' | 'h2'; text: string }> = [];
  let para = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,2}\s/.test(trimmed) || /^\d+\.\s/.test(trimmed) || /^[1-9]\)\s/.test(trimmed)) {
      if (para) { blocks.push({ type: 'p', text: para.trim() }); para = ''; }
      blocks.push({ type: 'h2', text: trimmed.replace(/^#{1,2}\s/, '') });
    } else if (trimmed) {
      para += (para ? ' ' : '') + trimmed;
    } else if (para) {
      blocks.push({ type: 'p', text: para.trim() });
      para = '';
    }
  }
  if (para) blocks.push({ type: 'p', text: para.trim() });
  return blocks;
}

function inferCategory(slug: string, title: string): string {
  const lower = (slug + ' ' + title).toLowerCase();
  if (/design|uiux|ux|figma/.test(lower)) return 'Design';
  if (/react|typescript|javascript|nextjs|frontend/.test(lower)) return 'Tech';
  if (/marketing|seo|content|growth/.test(lower)) return 'Marketing';
  if (/devops|kubernetes|docker|ci.cd/.test(lower)) return 'DevOps';
  if (/lp|rank|point|reward/.test(lower)) return 'LP System';
  return 'Tech';
}

function estimateReadTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} phút`;
}

const catColor: Record<string, string> = {
  Design: '#3B82F6',
  Tech: '#06B6D4',
  Marketing: '#10B981',
  DevOps: '#F59E0B',
  'LP System': '#818CF8',
};

// ── Service ────────────────────────────────────────────────────────────────────
export interface BlogListResult {
  posts: BlogPost[];
  pagination: Pagination;
  locale: string;
}

export const blogService = {
  /**
   * GET /api/blog-posts?lang={locale}&page=1&limit=20
   * Returns paginated blog posts.
   */
  getPosts: async (locale = 'vi', page = 1, limit = 20): Promise<BlogListResult> => {
    const res = await api.get<{
      data: BeBlogPost[];
      pagination: Pagination;
      meta: { locale: string };
    }>(`/blog-posts?lang=${locale}&page=${page}&limit=${limit}`);

    const posts = res.data.map(mapPost);
    return {
      posts,
      pagination: res.pagination,
      locale: res.meta.locale,
    };
  },

  /**
   * GET /api/blog-posts/[slug]?lang={locale}
   * Returns a single blog post by slug.
   */
  getPostBySlug: async (slug: string, locale = 'vi'): Promise<BlogDetail | null> => {
    try {
      const res = await api.get<{ data: BeBlogDetail }>(`/blog-posts/${slug}?lang=${locale}`);
      return mapDetail(res.data);
    } catch {
      return null;
    }
  },

  // ── Admin CRUD ───────────────────────────────────────────────────────────

  /**
   * GET /api/admin/blog-posts
   */
  getAdminPosts: async (params?: { page?: number; limit?: number; search?: string }): Promise<{
    posts: BlogPost[];
    pagination: Pagination;
  }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit ?? 20));
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    const path = `/admin/blog-posts${qs ? `?${qs}` : ''}`;
    const res = await api.get<{ data: BeBlogPost[]; pagination: Pagination }>(path);
    return { posts: res.data.map(mapPost), pagination: res.pagination };
  },

  /**
   * POST /api/admin/blog-posts
   */
  createPost: async (data: {
    title: string; slug: string; excerpt?: string; content?: string;
    coverImage?: string; authorId?: string; seoTitle?: string; seoDesc?: string;
    publishedAt?: string; isPublished?: boolean;
  }): Promise<BlogPost> => {
    const res = await api.post<{ data: BeBlogPost }>('/admin/blog-posts', data);
    return mapPost(res.data);
  },

  /**
   * PUT /api/admin/blog-posts/[id]
   */
  updatePost: async (id: string, data: Partial<{
    title: string; slug: string; excerpt: string; content: string;
    coverImage: string; seoTitle: string; seoDesc: string;
    publishedAt: string; isPublished: boolean;
  }>): Promise<BlogPost> => {
    const res = await api.put<{ data: BeBlogPost }>(`/admin/blog-posts/${id}`, data);
    return mapPost(res.data);
  },

  /**
   * DELETE /api/admin/blog-posts/[id]
   */
  deletePost: async (id: string): Promise<void> => {
    await api.delete(`/admin/blog-posts/${id}`);
  },
};
