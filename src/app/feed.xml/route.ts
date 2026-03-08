import { Feed } from 'feed';
import { client } from '@/sanity/client';
import { postsQuery } from '@/sanity/queries';
import { urlForImage } from '@/sanity/image';

export const dynamic = 'force-dynamic';

export async function GET() {
    const posts = await client.fetch(postsQuery);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loop.vn';

    const feed = new Feed({
        title: 'LOOP Blog',
        description: 'Cập nhật những xu hướng công nghệ mới nhất và kiến thức từ chuyên gia của LOOP.',
        id: siteUrl,
        link: siteUrl,
        language: 'vi', // Default RSS language
        image: `${siteUrl}/logo.png`,
        favicon: `${siteUrl}/favicon.ico`,
        copyright: `All rights reserved ${new Date().getFullYear()}, LOOP`,
        feedLinks: {
            rss2: `${siteUrl}/feed.xml`,
        },
        author: {
            name: 'LOOP',
            email: 'hello@loop.vn',
            link: siteUrl,
        },
    });

    posts.forEach((post: any) => {
        let description = '';
        // Extract text from portable text body for RSS description 
        if (post.bodyVi || post.body) {
            const body = post.bodyVi || post.body;
            description = body.filter((b: any) => b._type === 'block' && b.children).map((b: any) => b.children.map((c: any) => c.text).join('')).join('\n').substring(0, 200) + '...';
        }

        feed.addItem({
            title: post.titleVi || post.title,
            id: `${siteUrl}/vi/blog/${post.slug.current}`,
            link: `${siteUrl}/vi/blog/${post.slug.current}`,
            description: description,
            content: description,
            author: [
                {
                    name: post.authorName || 'LOOP Team',
                },
            ],
            date: new Date(post.publishedAt || Date.now()),
            image: post.mainImage ? urlForImage(post.mainImage).width(1200).url() : undefined,
        });
    });

    return new Response(feed.rss2(), {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
        },
    });
}
