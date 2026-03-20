/**
 * /blog/author/[slug]
 * Author profile page — shows bio + all posts by this author.
 * Server Component with ISR (revalidate=60).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Linkedin, Twitter } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { client } from "@/sanity/client";
import { authorBySlugQuery, postsByAuthorQuery } from "@/sanity/queries";
import { urlForImage } from "@/sanity/image";
import JsonLd from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const revalidate = 60;

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface Author {
  _id: string;
  name: string;
  slug: { current: string };
  image?: {
    asset: { _id: string; url: string };
    alt?: string;
  };
  shortBio?: string;
  shortBioVi?: string;
  bio?: unknown[];
  bioVi?: unknown[];
  role?: string;
  linkedin?: string;
  twitter?: string;
}

interface AuthorPost {
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
  categories?: { title: string; titleVi?: string; slug: { current: string } }[];
}

/* ─── Static params ─────────────────────────────────────────────────────────── */

export async function generateStaticParams() {
  try {
    const authors = await client.fetch<{ slug: { current: string } }[]>(
      `*[_type == "author"]{ slug }`
    );
    return authors.map((a) => ({ slug: a.slug.current }));
  } catch {
    return [];
  }
}

/* ─── Metadata ─────────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  let author: Author | null = null;
  try {
    author = await client.fetch<Author>(authorBySlugQuery, { slug });
  } catch {
    return { title: t("blogTitle") };
  }

  if (!author) return { title: t("blogTitle") };

  const title = author.role
    ? `${author.name} — ${author.role} | LOOP`
    : `${author.name} | LOOP`;
  const description = locale === "vi"
    ? (author.shortBioVi ?? author.shortBio ?? t("blogDescription"))
    : (author.shortBio ?? t("blogDescription"));

  return {
    title,
    description,
    alternates: { canonical: `https://loop.vn/${locale}/blog/author/${slug}` },
  };
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isVi = locale === "vi";

  const [author, t] = await Promise.all([
    client.fetch<Author | null>(authorBySlugQuery, { slug }),
    getTranslations({ locale, namespace: "seo" }),
  ]);

  if (!author) notFound();

  // Fetch posts by this author via dedicated GROQ query
  const posts: AuthorPost[] = await client.fetch(postsByAuthorQuery, { authorSlug: slug });

  const name = author.name;
  const role = author.role ?? "";
  const bio = isVi
    ? (author.shortBioVi ?? author.shortBio)
    : (author.shortBio ?? author.shortBioVi);
  const authorImageUrl = author.image
    ? urlForImage(author.image)?.width(256).height(256).url()
    : null;

  /* ─── JSON-LD Person schema ───────────────────────────────────────────── */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle: role || undefined,
    description: (bio as string) || undefined,
    url: `https://loop.vn/${locale}/blog/author/${slug}`,
    ...(author.linkedin
      ? { sameAs: [author.linkedin, ...(author.twitter ? [author.twitter] : [])] }
      : {}),
    ...(authorImageUrl ? { image: authorImageUrl } : {}),
  };

  /* ─── Breadcrumbs ─────────────────────────────────────────────────────── */
  const breadcrumbs = [
    { label: isVi ? "Trang chủ" : "Home", href: `/${locale}` },
    { label: isVi ? "Blog" : "Blog", href: `/${locale}/blog` },
    { label: name, href: `/${locale}/blog/author/${slug}` },
  ];

  /* ─── Helpers ─────────────────────────────────────────────────────────── */
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(isVi ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <JsonLd data={jsonLd} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Back link */}
        <Link
          href={`/${locale}/blog`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          {isVi ? "Quay lại blog" : "Back to Blog"}
        </Link>

        {/* Author header */}
        <div className="mb-12 flex flex-col items-center text-center">
          {authorImageUrl ? (
            <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border-2 border-blue-500">
              <Image
                src={authorImageUrl}
                alt={author.image?.alt ?? name}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          ) : (
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-800">
              <span className="text-4xl font-bold text-slate-500">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <h1 className="text-3xl font-bold">{name}</h1>
          {role && <p className="mt-1 text-lg text-blue-400">{role}</p>}

          {/* Social links */}
          {(author.linkedin || author.twitter) && (
            <div className="mt-4 flex items-center gap-3">
              {author.linkedin && (
                <a
                  href={author.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-blue-500 hover:text-blue-400"
                >
                  <Linkedin size={14} />
                  LinkedIn
                </a>
              )}
              {author.twitter && (
                <a
                  href={author.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-sky-500 hover:text-sky-400"
                >
                  <Twitter size={14} />
                  Twitter / X
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          {bio && (
            <p className="mt-6 max-w-2xl text-slate-400">
              {bio}
            </p>
          )}
        </div>

        {/* Author's posts */}
        <div className="border-t border-slate-800 pt-8">
          <h2 className="mb-6 text-xl font-bold">
            {isVi ? `Bài viết của ${name}` : `Posts by ${name}`}
            {posts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({posts.length})
              </span>
            )}
          </h2>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-16 text-center">
              <p className="text-slate-400">
                {isVi
                  ? "Tác giả này chưa có bài viết nào."
                  : "This author has not published any posts yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => {
                const postUrl = `/${locale}/blog/${post.slug.current}`;
                const postTitle = isVi && post.titleVi ? post.titleVi : post.title;
                const postImageUrl = post.mainImage
                  ? urlForImage(post.mainImage)?.width(600).height(340).url()
                  : null;
                const postExcerpt = isVi && post.excerptVi ? post.excerptVi : post.excerpt;

                return (
                  <Link
                    key={post._id}
                    href={postUrl}
                    className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-800">
                      {postImageUrl ? (
                        <Image
                          src={postImageUrl}
                          alt={post.mainImage?.alt ?? postTitle}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-4xl text-slate-700">
                            {postTitle.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Categories */}
                      {post.categories && post.categories.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {post.categories.map((cat) => (
                            <span
                              key={cat.slug.current}
                              className="rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400"
                            >
                              {isVi && cat.titleVi ? cat.titleVi : cat.title}
                            </span>
                          ))}
                        </div>
                      )}

                      <h3 className="mb-2 text-base font-bold leading-snug text-white group-hover:text-blue-300">
                        {postTitle}
                      </h3>

                      {postExcerpt && (
                        <p className="mb-3 line-clamp-2 text-sm text-slate-400">
                          {postExcerpt}
                        </p>
                      )}

                      {post.publishedAt && (
                        <p className="text-xs text-slate-500">
                          {formatDate(post.publishedAt)}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
