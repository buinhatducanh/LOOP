import { Suspense } from 'react';
import Link from 'next/link';
import { client } from '@/sanity/client';
import { postsQuery } from '@/sanity/queries';
import { urlForImage } from '@/sanity/image';
import { Metadata } from 'next';
import { getTranslations } from "next-intl/server";
import Image from "next/image";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'seo' });

    return {
        title: t('blogTitle'),
        description: t('blogDescription'),
        alternates: { canonical: `https://loop.vn/${locale}/blog` },
    };
}

export const revalidate = 60; // ISR revalidation every 60 seconds

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const isVn = locale === 'vi';

    const posts = await client.fetch(postsQuery);

    return (
        <div style={{ color: "#FFFFFF", minHeight: "100vh", padding: "80px 24px" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

                <div style={{ textAlign: "center", marginBottom: "60px" }}>
                    <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 800, marginBottom: "16px" }}>
                        {isVn ? "Blog & Tin tức" : "Blog & Articles"}
                    </h1>
                    <p style={{ color: "#94A3B8", fontSize: "18px", maxWidth: "600px", margin: "0 auto" }}>
                        {isVn
                            ? "Cập nhật những xu hướng công nghệ mới nhất và kiến thức từ chuyên gia của LOOP."
                            : "Stay updated with the latest tech trends and insights from LOOP experts."}
                    </p>
                </div>

                <Suspense fallback={<div style={{ textAlign: "center" }}>Loading posts...</div>}>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                        gap: "32px",
                    }}>
                        {posts.length > 0 ? posts.map((post: any) => (
                            <Link
                                href={`/${locale}/blog/${post.slug.current}`}
                                key={post._id}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div style={{
                                    background: "#0F172A",
                                    border: "1px solid #1F2937",
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                    transition: "all 0.3s ease",
                                    cursor: "pointer",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column"
                                }}>
                                    <div style={{ height: "220px", width: "100%", position: "relative", background: "#1E293B" }}>
                                        {post.mainImage ? (
                                            <Image
                                                src={urlForImage(post.mainImage).width(800).url()}
                                                alt={isVn ? post.titleVi || post.title : post.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                style={{ objectFit: "cover" }}
                                            />
                                        ) : (
                                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}>
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                                            {post.categories?.map((cat: string) => (
                                                <span key={cat} style={{
                                                    background: "rgba(59,130,246,0.1)",
                                                    color: "#3B82F6",
                                                    padding: "4px 10px",
                                                    borderRadius: "20px",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                }}>
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", lineHeight: 1.4 }}>
                                            {isVn ? (post.titleVi || post.title) : post.title}
                                        </h2>
                                        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "20px", borderTop: "1px solid #1F2937", color: "#94A3B8", fontSize: "14px" }}>
                                            <span>{post.authorName || (isVn ? 'Đội ngũ LOOP' : 'LOOP Team')}</span>
                                            <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale) : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px", color: "#94A3B8" }}>
                                {isVn ? "Chưa có bài viết nào." : "No posts found."}
                            </div>
                        )}
                    </div>
                </Suspense>

            </div>
        </div>
    );
}
