import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';
import { ArrowLeft, Clock, Calendar, User, Tag } from 'lucide-react';
import Image from 'next/image';
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { client } from '@/sanity/client';
import { postBySlugQuery, postsQuery } from '@/sanity/queries';
import { urlForImage } from '@/sanity/image';

// Thêm tính năng generateStaticParams tương lai nếu cần SSG toàn bộ blog thay vì ISR
// export async function generateStaticParams() { ... }

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string, slug: string }> }): Promise<Metadata> {
    const { locale, slug } = await params;
    const isVn = locale === 'vi';
    const post = await client.fetch(postBySlugQuery, { slug });

    if (!post) {
        return {};
    }

    const title = isVn ? (post.titleVi || post.title) : post.title;
    let description = '';
    if (post.bodyVi || post.body) {
        const body = isVn ? (post.bodyVi || post.body) : post.body;
        description = body.filter((b: any) => b._type === 'block' && b.children).map((b: any) => b.children.map((c: any) => c.text).join('')).join('\n').substring(0, 160) + '...';
    }
    const imageUrl = post.mainImage ? urlForImage(post.mainImage).width(1200).url() : undefined;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            publishedTime: post.publishedAt,
            authors: [post.authorName || 'LOOP'],
            images: imageUrl ? [{ url: imageUrl }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: imageUrl ? [imageUrl] : [],
        },
        alternates: {
            canonical: `https://loop.vn/${locale}/blog/${slug}`,
            languages: {
                'vi': `https://loop.vn/vi/blog/${slug}`,
                'en': `https://loop.vn/en/blog/${slug}`,
            },
        },
    };
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string, slug: string }> }) {
    const { locale, slug } = await params;
    const isVn = locale === 'vi';

    const post = await client.fetch(postBySlugQuery, { slug });

    if (!post) {
        notFound();
    }

    const title = isVn ? (post.titleVi || post.title) : post.title;
    const body = isVn ? (post.bodyVi || post.body) : post.body;
    const dateStr = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    let plainTextDescription = '';
    if (body) {
        plainTextDescription = body.filter((b: any) => b._type === 'block' && b.children).map((b: any) => b.children.map((c: any) => c.text).join('')).join('\n').substring(0, 160) + '...';
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loop.vn';
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: plainTextDescription,
        image: post.mainImage ? [urlForImage(post.mainImage).width(1200).url()] : [],
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        author: [{
            '@type': 'Person',
            name: post.authorName || (isVn ? 'Đội ngũ LOOP' : 'LOOP Team'),
        }],
        publisher: {
            '@type': 'Organization',
            name: 'LOOP',
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/logo.png`,
            },
        },
    };

    // Custom serializers for PortableText to match the site's dark theme
    const portableTextComponents = {
        types: {
            image: ({ value }: any) => {
                if (!value?.asset?._ref) { return null; }
                return (
                    <div style={{ margin: '40px 0', borderRadius: '16px', overflow: 'hidden' }}>
                        <img
                            src={urlForImage(value).width(1200).url()}
                            alt={value.alt || ' '}
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                );
            },
        },
        block: {
            h1: ({ children }: any) => <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '48px', marginBottom: '24px', color: '#FFFFFF' }}>{children}</h1>,
            h2: ({ children }: any) => <h2 style={{ fontSize: '28px', fontWeight: 700, marginTop: '40px', marginBottom: '20px', color: '#FFFFFF' }}>{children}</h2>,
            h3: ({ children }: any) => <h3 style={{ fontSize: '24px', fontWeight: 600, marginTop: '32px', marginBottom: '16px', color: '#FFFFFF' }}>{children}</h3>,
            normal: ({ children }: any) => <p style={{ fontSize: '18px', lineHeight: 1.8, marginBottom: '24px', color: '#cbd5e1' }}>{children}</p>,
            blockquote: ({ children }: any) => (
                <blockquote style={{ borderLeft: '4px solid #3B82F6', paddingLeft: '20px', marginLeft: 0, fontStyle: 'italic', color: '#94A3B8', fontSize: '20px', background: 'rgba(59,130,246,0.05)', padding: '24px' }}>
                    {children}
                </blockquote>
            ),
        },
        marks: {
            link: ({ value, children }: any) => {
                const target = (value?.href || '').startsWith('http') ? '_blank' : undefined;
                return (
                    <a href={value?.href} target={target} rel={target === '_blank' ? 'noindex nofollow' : ''} style={{ color: '#3B82F6', textDecoration: 'underline' }}>
                        {children}
                    </a>
                );
            },
            strong: ({ children }: any) => <strong style={{ color: '#FFFFFF', fontWeight: 700 }}>{children}</strong>,
        },
        list: {
            bullet: ({ children }: any) => <ul style={{ marginLeft: '24px', marginBottom: '24px', color: '#cbd5e1', fontSize: '18px', lineHeight: 1.8 }}>{children}</ul>,
            number: ({ children }: any) => <ol style={{ marginLeft: '24px', marginBottom: '24px', color: '#cbd5e1', fontSize: '18px', lineHeight: 1.8 }}>{children}</ol>,
        },
        listItem: {
            bullet: ({ children }: any) => <li style={{ marginBottom: '8px' }}>{children}</li>,
            number: ({ children }: any) => <li style={{ marginBottom: '8px' }}>{children}</li>,
        },
    };

    return (
        <article style={{ color: "#FFFFFF", minHeight: "100vh", padding: "40px 24px 80px" }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Breadcrumbs
                    locale={locale}
                    items={[
                        { label: isVn ? 'Trang chủ' : 'Home', href: `/${locale}` },
                        { label: 'Blog', href: `/${locale}/blog` },
                        { label: title || 'Bài viết' }
                    ]}
                />

                {/* Post Header */}
                <header style={{ marginBottom: "48px" }}>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                        {post.categories?.map((cat: string) => (
                            <span key={cat} style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 600 }}>
                                {cat}
                            </span>
                        ))}
                    </div>

                    <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.2, marginBottom: "24px", letterSpacing: "-1px" }}>
                        {title}
                    </h1>

                    <div style={{ display: "flex", alignItems: "center", gap: "24px", color: "#94A3B8", fontSize: "15px", flexWrap: "wrap", borderBottom: "1px solid #1F2937", paddingBottom: "32px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <User size={18} /> <span>{post.authorName || (isVn ? 'Đội ngũ LOOP' : 'LOOP Team')}</span>
                        </div>
                        {dateStr && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Calendar size={18} /> <span>{dateStr}</span>
                            </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Clock size={18} /> <span>{isVn ? "5 phút đọc" : "5 min read"}</span>
                        </div>
                    </div>
                </header>

                {/* Featured Image */}
                {post.mainImage && (
                    <div style={{ margin: "0 0 48px", borderRadius: "20px", overflow: "hidden", height: "450px", background: "#1E293B", position: "relative" }}>
                        <Image
                            src={urlForImage(post.mainImage).width(1200).url()}
                            alt={`${title || 'Hero'} - Bài viết LOOP`}
                            fill
                            priority
                            sizes="(max-width: 1200px) 100vw, 1200px"
                            style={{ objectFit: "cover" }}
                        />
                    </div>
                )}

                {/* Post Content with PortableText */}
                <div style={{ fontSize: "18px", color: "#E2E8F0" }}>
                    {body ? (
                        <PortableText value={body} components={portableTextComponents} />
                    ) : (
                        <p style={{ fontStyle: "italic", color: "#94A3B8" }}>
                            {isVn ? "Nội dung đang được cập nhật..." : "Content is being updated..."}
                        </p>
                    )}
                </div>

                {/* Author Bio Section */}
                {post.authorName && (
                    <div style={{ marginTop: "80px", padding: "32px", background: "#0F172A", border: "1px solid #1F2937", borderRadius: "16px", display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
                        {post.authorImage && (
                            <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                                <Image src={urlForImage(post.authorImage).width(200).url()} alt={post.authorName || 'Author'} fill sizes="80px" style={{ objectFit: "cover" }} />
                            </div>
                        )}
                        <div>
                            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>{post.authorName}</h3>
                            <div style={{ color: "#94A3B8", fontSize: "15px", lineHeight: 1.6 }}>
                                {post.authorBio ? (
                                    <PortableText value={isVn && post.authorBioVi ? post.authorBioVi : post.authorBio} />
                                ) : (
                                    <p>{isVn ? "Tác giả của bài viết này." : "Author of this article."}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </article>
    );
}
