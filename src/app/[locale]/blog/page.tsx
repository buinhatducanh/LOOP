import { Suspense } from 'react';
import Link from 'next/link';
import { client } from '@/sanity/client';
import { postsQuery } from '@/sanity/queries';
import { urlForImage } from '@/sanity/image';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'seo' });
    return {
        title: t('blogTitle'),
        description: t('blogDescription'),
        alternates: { canonical: `https://loop.vn/${locale}/blog` },
    };
}

export const revalidate = 60;

interface PostCategory {
    _id: string;
    title: string;
    titleVi?: string;
    slug: { current: string };
}

interface Post {
    _id: string;
    title: string;
    titleVi?: string;
    slug: { current: string };
    mainImage?: {
        asset: { _id: string; url: string };
        alt?: string;
    };
    publishedAt?: string;
    excerpt?: string;
    excerptVi?: string;
    authorName?: string;
    authorRole?: string;
    categories?: PostCategory[];
}

function formatDate(dateStr: string | undefined, locale: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getHref(locale: string, slug: string): string {
    return '/' + locale + '/blog/' + slug;
}

function PostCard({ post, locale, isVn }: { post: Post; locale: string; isVn: boolean }) {
    const title = isVn ? (post.titleVi || post.title) : post.title;
    const excerpt = isVn
        ? (post.excerptVi || post.excerpt)
        : (post.excerpt || post.excerptVi);
    const imageUrl = post.mainImage
        ? urlForImage(post.mainImage).width(800).auto('format').url()
        : null;
    const imageAlt = (post.mainImage?.alt) || (isVn ? post.titleVi : post.title) || 'Blog post image';
    const dateFormatted = formatDate(post.publishedAt, locale);
    const href = getHref(locale, post.slug.current);

    const cardStyle: React.CSSProperties = {
        background: '#0F172A',
        border: '1px solid #1F2937',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.3s, transform 0.3s',
    };

    return (
        <article>
            <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                <div
                    style={cardStyle}
                    onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = '#6366F1';
                        el.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = '#1F2937';
                        el.style.transform = 'translateY(0)';
                    }}
                >
                    {/* Thumbnail */}
                    <div style={{ height: '220px', width: '100%', position: 'relative', background: '#1E293B', flexShrink: 0 }}>
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={imageAlt}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontSize: '14px' }}>
                                {isVn ? 'Không có ảnh' : 'No image'}
                            </div>
                        )}
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                        {/* Categories */}
                        {post.categories && post.categories.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                {post.categories.slice(0, 2).map((cat) => (
                                    <span key={cat._id} style={{
                                        background: 'rgba(59,130,246,0.1)',
                                        color: '#3B82F6',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                    }}>
                                        {isVn ? (cat.titleVi || cat.title) : cat.title}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Title */}
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            marginBottom: excerpt ? '8px' : '16px',
                            lineHeight: 1.4,
                            color: '#FFFFFF',
                        }}>
                            {title}
                        </h2>

                        {/* Excerpt */}
                        {excerpt ? (
                            <p style={{
                                fontSize: '14px',
                                color: '#94A3B8',
                                lineHeight: 1.6,
                                marginBottom: '16px',
                                flex: 1,
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                            }}>
                                {excerpt}
                            </p>
                        ) : null}

                        {/* Meta row */}
                        <div style={{
                            marginTop: 'auto',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            paddingTop: '16px',
                            borderTop: '1px solid #1F2937',
                            flexWrap: 'wrap',
                            gap: '8px',
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ color: '#CBD5E1', fontWeight: 500, fontSize: '13px' }}>
                                    {post.authorName || (isVn ? 'Đội ngũ LOOP' : 'LOOP Team')}
                                </span>
                                {post.authorRole && (
                                    <span style={{ color: '#6366F1', fontSize: '12px' }}>
                                        {post.authorRole}
                                    </span>
                                )}
                            </div>
                            {dateFormatted && (
                                <time style={{ color: '#94A3B8', fontSize: '13px' }}>
                                    {dateFormatted}
                                </time>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </article>
    );
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const isVn = locale === 'vi';
    const posts = await client.fetch<Post[]>(postsQuery);

    return (
        <div style={{ color: '#FFFFFF', minHeight: '100vh', padding: '80px 24px' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, marginBottom: '16px' }}>
                        {isVn ? 'Blog & Tin tức' : 'Blog & Articles'}
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        {isVn
                            ? 'Cập nhật những xu hướng công nghệ mới nhất và kiến thức từ chuyên gia của LOOP.'
                            : 'Stay updated with the latest tech trends and insights from LOOP experts.'}
                    </p>
                </div>

                <Suspense fallback={
                    <div style={{ textAlign: 'center', color: '#94A3B8', padding: '60px' }}>
                        {isVn ? 'Đang tải bài viết...' : 'Loading posts...'}
                    </div>
                }>
                    {posts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px', color: '#94A3B8' }}>
                            {isVn ? 'Chưa có bài viết nào.' : 'No posts found.'}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                            gap: '32px',
                        }}>
                            {posts.map((post) => (
                                <PostCard key={post._id} post={post} locale={locale} isVn={isVn} />
                            ))}
                        </div>
                    )}
                </Suspense>

            </div>
        </div>
    );
}
