import { groq } from 'next-sanity'

export const postsQuery = groq`*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  titleVi,
  slug,
  mainImage,
  publishedAt,
  "authorName": author->name,
  "categories": categories[]->title
}`

export const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  titleVi,
  slug,
  body,
  bodyVi,
  mainImage,
  publishedAt,
  "authorName": author->name,
  "authorImage": author->image,
  "authorBio": author->bio,
  "authorBioVi": author->bioVi,
  "categories": categories[]->title
}`
