import { Feed } from 'feed';
import { client } from '@/sanity/client';
import { postsQuery } from '@/sanity/queries';
import { urlForImage } from '@/sanity/image';

// ISR — revalidate every 5 minutes (blog posts don't change every second)
export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://loop.vn';

// Bilingual feed metadata — keyed by locale
const FEED_META: Record<string, { title: string; description: string; language: string }> = {
  vi: {
    title: 'LOOP Blog',
    description: 'Cập nhật những xu hướng công nghệ mới nhất và kiến thức từ chuyên gia của LOOP.',
    language: 'vi',
  },
  en: {
    title: 'LOOP Blog',
    description: 'Stay updated with the latest tech trends and insights from LOOP experts.',
    language: 'en',
  },
};

/**
 * Extract plain text from a Portable Text body array.
 * Handles both Vietnamese (bodyVi) and English (body) fields.
 */
function extractExcerpt(body: unknown[], maxLength = 200): string {
  if (!Array.isArray(body)) return '';
  const text = body
    .filter((b: unknown) => typeof b === 'object' && b !== null && (b as Record<string, unknown>)._type === 'block')
    .map((b: unknown) => {
      const block = b as Record<string, unknown>;
      const children = block.children as Array<{ text?: string }>;
      if (!Array.isArray(children)) return '';
      return children.map((c) => c.text ?? '').join('');
    })
    .join('\n')
    .trim();

  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '…';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const validLocale = locale === 'en' ? 'en' : 'vi';
  const meta = FEED_META[validLocale];

  const posts = await client.fetch<Array<Record<string, unknown>>>(postsQuery);

  const feed = new Feed({
    title: meta.title,
    description: meta.description,
    id: `${SITE_URL}/${validLocale}`,
    link: `${SITE_URL}/${validLocale}`,
    language: meta.language,
    image: `${SITE_URL}/logo.png`,
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, LOOP`,
    feedLinks: {
      rss2: `${SITE_URL}/${validLocale}/feed.xml`,
    },
    author: {
      name: 'LOOP',
      email: 'hello@loop.vn',
      link: SITE_URL,
    },
  });

  posts.forEach((post) => {
    // Pick the right language body — fall back gracefully
    const bodyVi = post.bodyVi as unknown[] | undefined;
    const bodyEn = post.body as unknown[] | undefined;
    const body = validLocale === 'en' ? (bodyEn ?? bodyVi ?? []) : (bodyVi ?? bodyEn ?? []);

    const excerpt = extractExcerpt(body);
    const title = validLocale === 'en'
      ? ((post.title as string) || (post.titleVi as string) || '')
      : ((post.titleVi as string) || (post.title as string) || '');

    const slug = (post.slug as { current?: string } | undefined)?.current;
    if (!slug || !title) return;

    feed.addItem({
      title,
      id: `${SITE_URL}/${validLocale}/blog/${slug}`,
      link: `${SITE_URL}/${validLocale}/blog/${slug}`,
      description: excerpt,
      content: excerpt,
      author: [
        {
          name: (post.authorName as string) || 'LOOP Team',
        },
      ],
      date: new Date((post.publishedAt as string) || Date.now()),
      image: post.mainImage ? urlForImage(post.mainImage as Parameters<typeof urlForImage>[0]).width(1200).url() : undefined,
    });
  });

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Allow CDN caching but revalidate frequently
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
