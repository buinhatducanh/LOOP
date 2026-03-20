/**
 * /blog/category/[slug]
 * Blog posts filtered by Sanity category slug.
 * Redirects to /blog?category=slug for client-side filtering.
 * (The blog listing page reads ?category query param.)
 */

import { redirect } from "next/navigation";

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    redirect(`/${locale}/blog?category=${slug}`);
}
