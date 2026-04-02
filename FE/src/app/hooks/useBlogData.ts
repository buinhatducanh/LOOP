/**
 * useBlogData — returns blog posts and categories for the current locale.
 * Reactive: re-renders when locale changes.
 */
import { useLocaleStore } from '@/store/localeStore';
import { BLOG_POSTS } from '@/data/locales';
import { DS } from '@/components/layout/ds';

export function useBlogData() {
  const locale = useLocaleStore(s => s.locale);
  const posts = BLOG_POSTS[locale] ?? BLOG_POSTS.vi;

  const catColors: Record<string, string> = {
    Design: DS.blue,
    Tech: DS.cyan,
    Marketing: DS.green,
    DevOps: DS.amber,
    'LP System': DS.purple,
  };

  // All unique categories across posts
  const allCats = Array.from(new Set(posts.map(p => p.cat)));

  return { posts, catColors, allCats };
}
