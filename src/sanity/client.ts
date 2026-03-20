import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from './env'

/**
 * Sanity client for data fetching.
 *
 * IMPORTANT: useCdn = false because this site uses Next.js ISR (revalidate).
 *
 * Why? When ISR revalidates, Next.js fetches fresh data from Sanity.
 * If useCdn = true, Sanity's CDN returns stale data (cached for ~60s),
 * causing ISR to serve outdated content even after revalidation triggers.
 *
 * The CDN benefit (caching at Sanity edge) conflicts with Next.js ISR
 * (which controls its own cache TTL via the revalidate export).
 *
 * For truly static pages without ISR, set useCdn = true to reduce
 * Sanity API costs and improve response times.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // ISR controls caching — Sanity CDN cache is redundant/conflicting
})
