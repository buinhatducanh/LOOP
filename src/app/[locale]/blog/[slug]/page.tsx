import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import Image from 'next/image';
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { buildBlogPostJsonLd, buildBreadcrumbJsonLd } from "@/lib/json-ld";
import { client } from '@/sanity/client';
import { postBySlugQuery, postsQuery } from '@/sanity/queries';
import { urlForImage } from '@/sanity/image';

export const revalidate = 60;

// ─── Types ───────────────────────────────────────────────────────────────────

interface PostAuthorImage {
    asset: { _id: string; url: string };
    alt?: string;
}

interface PostCategory {
    _id: string;
    title: string;
    titleVi?: string;
    slug: { current: string };
    description?: string;
    descriptionVi?: string;
}

interface Post {
    _id: string;
    title: string;
    titleVi?: string;
    slug: { current: string };
    body?: unknown[];
    bodyVi?: unknown[];
    mainImage?: {
        asset: { _id: string; url: string };
        alt?: string;
        caption?: string;
        hotspot?: { x: number; y: number; height: number; width: number };
    };
    publishedAt?: string;
    excerpt?: string;
    excerptVi?: string;
    authorName?: string;
    authorRole?: string;
    authorImage?: PostAuthorImage;
    authorBio?: unknown[];
    authorBioVi?: unknown[];
    authorShortBio?: string;
    authorShortBioVi?: string;
    authorLinkedin?: string;
    authorTwitter?: string;
    categories?: PostCategory[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract plain text from Portable Text body for SEO meta descriptions */
function extractPlainText(body: unknown[] | undefined): string {
    if (!body) return '';
    return body
        .filter((b: unknown) => {
            const block = b as { _type?: string };
            return block._type === 'block';
        })
        .flatMap((b: unknown) => {
            const block = b as { children?: Array<{ text?: string }> };
            return (block.children ?? []).map((c) => c.text ?? '');
        })
        .join(' ')
        .trim()
        .substring(0, 300);
}

// ─── Portable Text serializers (dark theme) ──────────────────────────────────

const portableTextComponents = {
    types: {
        image: ({ value }: { value: { asset?: { _ref?: string }; alt?: string; caption?: string } }) => {
            if (!value?.asset?._ref) return null;
            return (
                <figure style={{ margin: '40px 0', borderRadius: '16px', overflow: 'hidden' }}>
                    <img
                        src={urlForImage(value).width(1200).auto('format').url()}
                        alt={value.alt ?? ''}
                        loading="lazy"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                    {value.caption && (
                        <figcaption style={{
                            textAlign: 'center',
                            color: '#94A3B8',
                            fontSize: '14px',
                            marginTop: '8px',
                            fontStyle: 'italic',
                        }}>
                            {value.caption}
                        </figcaption>
                    )}
                </figure>
            );
        },
    },
    block: {
        h1: ({ children }: { children?: React.ReactNode }) => (
            <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '48px', marginBottom: '24px', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                {children}
            </h1>
        ),
        h2: ({ children }: { children?: React.ReactNode }) => (
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginTop: '40px', marginBottom: '20px', color: '#FFFFFF' }}>
                {children}
            </h2>
        ),
        h3: ({ children }: { children?: React.ReactNode }) => (
            <h3 style={{ fontSize: '22px', fontWeight: 600, marginTop: '32px', marginBottom: '16px', color: '#FFFFFF' }}>
                {children}
            </h3>
        ),
        normal: ({ children }: { children?: React.ReactNode }) => (
            <p style={{ fontSize: '18px', lineHeight: 1.8, marginBottom: '24px', color: '#CBD5E1' }}>
                {children}
            </p>
        ),
        blockquote: ({ children }: { children?: React.ReactNode }) => (
            <blockquote style={{
                borderLeft: '4px solid #3B82F6',
                paddingLeft: '20px',
                marginLeft: 0,
                marginBottom: '24px',
                fontStyle: 'italic',
                color: '#94A3B8',
                fontSize: '20px',
                background: 'rgba(59,130,246,0.05)',
                padding: '24px',
                borderRadius: '0 12px 12px 0',
            }}>
                {children}
            </blockquote>
        ),
    },
    marks: {
        link: ({ value, children }: { value?: { href?: string }; children?: React.ReactNode }) => {
            const href = value?.href ?? '';
            const isExternal = href.startsWith('http');
            return (
                <a
                    href={href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer noindex' : 'noindex nofollow'}
                    style={{ color: '#3B82F6', textDecoration: 'underline', textDecorationColor: 'rgba(59,130,246,0.5)' }}
                >
                    {children}
                </a>
            );
        },
        strong: ({ children }: { children?: React.ReactNode }) => (
            <strong style={{ color: '#FFFFFF', fontWeight: 700 }}>{children}</strong>
        ),
    },
    list: {
        bullet: ({ children }: { children?: React.ReactNode }) => (
            <ul style={{ marginLeft: '24px', marginBottom: '24px', color: '#CBD5E1', fontSize: '18px', lineHeight: 1.8, listStyleType: 'disc' }}>
                {children}
            </ul>
        ),
        number: ({ children }: { children?: React.ReactNode }) => (
            <ol style={{ marginLeft: '24px', marginBottom: '24px', color: '#CBD5E1', fontSize: '18px', lineHeight: 1.8 }}>
                {children}
            </ol>
        ),
    },
    listItem: {
        bullet: ({ children }: { children?: React.ReactNode }) => (
            <li style={{ marginBottom: '8px' }}>{children}</li>
        ),
        number: ({ children }: { children?: React.ReactNode }) => (
            <li style={{ marginBottom: '8px' }}>{children}</li>
        ),
    },
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
    const { locale, slug } = await params;
    const isVn = locale === 'vi';
    const post = await client.fetch<Post>(postBySlugQuery, { slug });

    if (!post) return {};

    const title = isVn ? (post.titleVi || post.title) : post.title;

    // Priority: excerpt field > extracted from body
    const rawExcerpt = (isVn ? post.excerptVi : post.excerpt) ?? extractPlainText(isVn ? post.bodyVi : post.body);
    const description = rawExcerpt
        ? rawExcerpt.substring(0, 160) + (rawExcerpt.length > 160 ? '…' : '')
        : undefined;

    const imageUrl = post.mainImage
        ? urlForImage(post.mainImage).width(1200).auto('format').url()
        : undefined;
    const imageAlt = post.mainImage?.alt ?? title ?? undefined;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            publishedTime: post.publishedAt,
            authors: [post.authorName ?? 'LOOP Team'],
            images: imageUrl ? [{ url: imageUrl, alt: imageAlt }] : [],
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

// ─── Page component ───────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
    const { locale, slug } = await params;
    const isVn = locale === 'vi';

    const post = await client.fetch<Post>(postBySlugQuery, { slug });
    if (!post) notFound();

    const title = isVn ? (post.titleVi || post.title) : post.title;
    const body = isVn ? (post.bodyVi || post.body) : post.body;
    const shortBio = isVn ? post.authorShortBioVi : post.authorShortBio;
    const dateStr = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
        : '';

    const imageUrl = post.mainImage
        ? urlForImage(post.mainImage).width(1200).auto('format').url()
        : undefined;
    const imageAlt = post.mainImage?.alt ?? title ?? 'Blog post';

    // SEO description from excerpt or body
    const seoDescription = (isVn ? post.excerptVi : post.excerpt)
        ?? extractPlainText(body).substring(0, 160);

    // JSON-LD
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://loop.vn';
    const jsonLd = buildBlogPostJsonLd({
        title,
        description: seoDescription,
        image: imageUrl,
        authorName: post.authorName ?? (isVn ? 'Đội ngũ LOOP' : 'LOOP Team'),
        publishedAt: post.publishedAt,
        slug,
    });
    const breadcrumbJsonLd = buildBreadcrumbJsonLd([
        { name: isVn ? 'Trang chủ' : 'Home', url: `/${locale}` },
        { name: 'Blog', url: `/${locale}/blog` },
        { name: title },
    ]);

    return (
        <>
            <JsonLd data={jsonLd} />
            <JsonLd data={breadcrumbJsonLd} />

            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}>

                {/* Breadcrumbs */}
                <div style={{ paddingTop: "80px", marginBottom: "32px" }}>
                    <Breadcrumbs
                        locale={locale}
                        items={[
                            { label: isVn ? 'Trang chủ' : 'Home', href: `/${locale}` },
                            { label: 'Blog', href: `/${locale}/blog` },
                            { label: title || 'Bài viết' },
                        ]}
                    />
                </div>

                {/* Back link */}
                <Link
                    href={`/${locale}/blog`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#6366F1',
                        fontSize: '14px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        marginBottom: '24px',
                        transition: 'color 0.2s',
                    }}
                >
                    <ArrowLeft size={14} />
                    {isVn ? 'Tất cả bài viết' : 'All posts'}
                </Link>

                {/* Post header */}
                <header style={{ marginBottom: "40px" }}>

                    {/* Categories */}
                    {post.categories && post.categories.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                            {post.categories.map((cat) => (
                                <span key={cat._id} style={{
                                    background: "rgba(59,130,246,0.1)",
                                    color: "#3B82F6",
                                    padding: "6px 14px",
                                    borderRadius: "20px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}>
                                    <Tag size={12} />
                                    {isVn ? (cat.titleVi || cat.title) : cat.title}
                                </span>
                            ))}
                        </div>
                    )}

                    <h1 style={{
                        fontSize: "clamp(32px, 5vw, 56px)",
                        fontWeight: 800,
                        lineHeight: 1.2,
                        marginBottom: "20px",
                        letterSpacing: "-1px",
                        color: "#FFFFFF",
                    }}>
                        {title}
                    </h1>

                    {/* Author + meta */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        color: "#94A3B8",
                        fontSize: "15px",
                        flexWrap: "wrap",
                    }}>
                        {post.authorImage?.asset?.url && (
                            <Image
                                src={urlForImage(post.authorImage).width(40).height(40).auto('format').url()}
                                alt={post.authorImage.alt ?? post.authorName ?? 'Author'}
                                width={40}
                                height={40}
                                style={{ borderRadius: '50%', objectFit: 'cover' }}
                            />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ color: '#E2E8F0', fontWeight: 600, fontSize: '15px' }}>
                                {post.authorName ?? (isVn ? 'Đội ngũ LOOP' : 'LOOP Team')}
                            </span>
                            {post.authorRole && (
                                <span style={{ color: '#6366F1', fontSize: '13px' }}>
                                    {post.authorRole}
                                </span>
                            )}
                        </div>
                        {dateStr && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Calendar size={14} />
                                <span>{dateStr}</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Featured image */}
                {imageUrl && (
                    <figure style={{ margin: "0 0 48px", borderRadius: "20px", overflow: "hidden", height: "450px", position: "relative", background: "#1E293B" }}>
                        <Image
                            src={imageUrl}
                            alt={imageAlt}
                            fill
                            priority
                            sizes="(max-width: 1200px) 100vw, 800px"
                            style={{ objectFit: "cover" }}
                        />
                        {post.mainImage?.caption && (
                            <figcaption style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '12px 16px',
                                background: 'rgba(0,0,0,0.6)',
                                color: '#94A3B8',
                                fontSize: '13px',
                                textAlign: 'center',
                                fontStyle: 'italic',
                            }}>
                                {post.mainImage.caption}
                            </figcaption>
                        )}
                    </figure>
                )}

                {/* Excerpt / lead */}
                {(post.excerpt || post.excerptVi) && (
                    <p style={{
                        fontSize: '20px',
                        lineHeight: 1.7,
                        color: '#E2E8F0',
                        fontWeight: 400,
                        borderLeft: '3px solid #3B82F6',
                        paddingLeft: '20px',
                        marginBottom: '40px',
                    }}>
                        {isVn ? (post.excerptVi || post.excerpt) : (post.excerpt || post.excerptVi)}
                    </p>
                )}

                {/* Post content */}
                <div style={{ fontSize: "18px", color: "#E2E8F0" }}>
                    {body ? (
                        <PortableText value={body} components={portableTextComponents} />
                    ) : (
                        <p style={{ fontStyle: "italic", color: "#94A3B8" }}>
                            {isVn ? "Nội dung đang được cập nhật..." : "Content is being updated..."}
                        </p>
                    )}
                </div>

                {/* Author bio section */}
                {(post.authorName || post.authorImage) && (
                    <div style={{
                        marginTop: "80px",
                        padding: "32px",
                        background: "#0F172A",
                        border: "1px solid #1F2937",
                        borderRadius: "16px",
                        display: "flex",
                        gap: "24px",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                    }}>
                        {post.authorImage?.asset?.url && (
                            <Image
                                src={urlForImage(post.authorImage).width(96).height(96).auto('format').url()}
                                alt={post.authorImage.alt ?? post.authorName ?? 'Author'}
                                width={96}
                                height={96}
                                style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                        )}
                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                                    {post.authorName ?? (isVn ? 'Đội ngũ LOOP' : 'LOOP Team')}
                                </h3>
                                {post.authorRole && (
                                    <span style={{ color: '#6366F1', fontSize: '14px' }}>
                                        {post.authorRole}
                                    </span>
                                )}
                                {/* Social links */}
                                {(post.authorLinkedin || post.authorTwitter) && (
                                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                        {post.authorLinkedin && (
                                            <a href={post.authorLinkedin} target="_blank" rel="noopener noreferrer"
                                                style={{ color: '#0A66C2', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                                                LinkedIn
                                            </a>
                                        )}
                                        {post.authorTwitter && (
                                            <a href={post.authorTwitter} target="_blank" rel="noopener noreferrer"
                                                style={{ color: '#1DA1F2', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                                                Twitter/X
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            {shortBio ? (
                                <p style={{ color: "#94A3B8", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>
                                    {shortBio}
                                </p>
                            ) : (post.authorBio || post.authorBioVi) ? (
                                <div style={{ color: "#94A3B8", fontSize: "15px", lineHeight: 1.6 }}>
                                    <PortableText
                                        value={isVn && post.authorBioVi ? post.authorBioVi : post.authorBio}
                                        components={portableTextComponents}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Bottom padding */}
                <div style={{ height: '80px' }} />
            </div>
        </>
    );
}
