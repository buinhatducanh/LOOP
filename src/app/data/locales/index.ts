/**
 * Locale data registry — BE uses this to serve translated static data arrays.
 *
 * Academy: Courses, instructors, FAQ, etc.
 * Blog: Blog posts with full content.
 *
 * Fallback chain: requested locale → EN → VI
 */

export type Locale = "vi" | "en" | "ja" | "ko" | "zh";

// Services data is now database-driven via /api/pricing/config
// Static files (services-vi.ts, services-en.ts, etc.) have been removed.
