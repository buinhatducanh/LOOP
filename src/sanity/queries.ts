import { groq } from 'next-sanity'

/**
 * ─── Blog Posts ──────────────────────────────────────────────────────────────
 * Posts listing query — used on /blog page.
 * Includes excerpt for listing cards and social sharing.
 */
export const postsQuery = groq`*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  titleVi,
  slug,
  mainImage {
    asset->{
      _id,
      url
    },
    alt,
    caption,
    hotspot {
      x, y, height, width
    }
  },
  publishedAt,
  excerpt,
  excerptVi,
  "authorName": author->name,
  "authorRole": author->role,
  "categories": categories[]->{
    _id,
    title,
    titleVi,
    slug
  }
}`

/**
 * Single post query — used on /blog/[slug] page.
 * Includes full body, all metadata, and image details.
 */
export const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  titleVi,
  slug,
  body,
  bodyVi,
  mainImage {
    asset->{
      _id,
      url
    },
    alt,
    caption,
    hotspot {
      x, y, height, width
    }
  },
  publishedAt,
  excerpt,
  excerptVi,
  "authorName": author->name,
  "authorRole": author->role,
  "authorImage": author->image {
    asset->{ _id, url },
    alt
  },
  "authorBio": author->bio,
  "authorBioVi": author->bioVi,
  "authorShortBio": author->shortBio,
  "authorShortBioVi": author->shortBioVi,
  "authorLinkedin": author->linkedin,
  "authorTwitter": author->twitter,
  "categories": categories[]->{
    _id,
    title,
    titleVi,
    slug,
    description,
    descriptionVi
  }
}`

/**
 * ─── Authors ────────────────────────────────────────────────────────────────
 * All authors — used for author listing pages.
 */
export const authorsQuery = groq`*[_type == "author"] | order(name asc) {
  _id,
  name,
  slug,
  image {
    asset->{ _id, url },
    alt
  },
  shortBio,
  shortBioVi,
  role,
  linkedin,
  twitter
}`

/**
 * Single author query — used on /blog/author/[slug] page.
 */
export const authorBySlugQuery = groq`*[_type == "author" && slug.current == $slug][0] {
  _id,
  name,
  slug,
  image {
    asset->{ _id, url },
    alt
  },
  shortBio,
  shortBioVi,
  bio,
  bioVi,
  role,
  linkedin,
  twitter
}`

/**
 * ─── Categories ────────────────────────────────────────────────────────────
 * All categories — used on blog listing sidebar or filter.
 */
export const categoriesQuery = groq`*[_type == "category"] | order(order asc, title asc) {
  _id,
  title,
  titleVi,
  slug,
  description,
  descriptionVi,
  seoTitle,
  seoTitleVi,
  seoDescription,
  seoDescriptionVi,
  order
}`

/**
 * Posts by author — used for /blog/author/[slug] page.
 * Filters by author slug via cross-reference join.
 */
export const postsByAuthorQuery = groq`*[
  _type == "post" &&
  defined(slug.current) &&
  author->slug.current == $authorSlug
] | order(publishedAt desc) {
  _id,
  title,
  titleVi,
  slug,
  mainImage {
    asset->{ _id, url },
    alt
  },
  publishedAt,
  excerpt,
  excerptVi,
  "categories": categories[]->{ title, titleVi, slug }
}`;

/**
 * Posts by category — used for category filtering.
 */
export const postsByCategoryQuery = groq`*[
  _type == "post" &&
  defined(slug.current) &&
  $categorySlug in categories[]->slug.current
] | order(publishedAt desc) {
  _id,
  title,
  titleVi,
  slug,
  mainImage {
    asset->{ _id, url },
    alt,
    hotspot
  },
  publishedAt,
  excerpt,
  excerptVi,
  "authorName": author->name,
  "categories": categories[]->{ title, titleVi, slug }
}`

/**
 * ─── Sitemap helper ─────────────────────────────────────────────────────────
 * Lightweight query — only fields needed for sitemap generation.
 * Avoids fetching full body or images.
 */
export const postSlugsQuery = groq`*[_type == "post" && defined(slug.current)] {
  slug,
  publishedAt,
  title,
  titleVi
}`
