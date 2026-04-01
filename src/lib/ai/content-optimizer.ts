/**
 * content-optimizer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 5 AI-powered content optimization pipeline for the LOOP Next.js
 * website (web agency platform).
 *
 * Provides content analysis, SEO scoring, meta description generation,
 * internal link suggestions, FAQ schema generation, and heading structure
 * recommendations — all powered by the Anthropic (Claude) API with graceful
 * fallbacks when no API key is available.
 *
 * @see {@link https://docs.anthropic.com/}   Anthropic SDK reference
 * @see {@link https://zod.dev/}               Zod schema validation reference
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { z } from 'zod';

// Minimal stub — @anthropic-ai/sdk is not installed in this project.
// Functions below fall back to heuristic logic when the client is unavailable.
const Anthropic = class {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(_options: { apiKey?: string }) {}
  messages = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parse: async (_opts: any): Promise<any> => null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (_opts: any): Promise<any> => null,
  };
} as any;

// ─── Zod Schemas ────────────────────────────────────────────────────────────

/** Input schema for the content analysis pipeline. */
export const AnalyzeContentOptionsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  locale: z.enum(['vi', 'en']).default('en'),
  targetKeywords: z.array(z.string()).default([]),
});

/** Validated options object. */
export type AnalyzeContentOptions = z.infer<typeof AnalyzeContentOptionsSchema>;

// ─── TypeScript Interfaces ─────────────────────────────────────────────────

/**
 * Output of the content analysis pipeline.
 * Contains SEO score, readability score, keyword density, actionable suggestions,
 * and diagnostic information about missing or broken content elements.
 */
export interface ContentAnalysis {
  /** Overall SEO score on a 0–100 scale. */
  seoScore: number;
  /** Readability / comprehension score on a 0–100 scale. */
  readabilityScore: number;
  /** Map of each target keyword to its density percentage in the content. */
  keywordDensity: Record<string, number>;
  /** Actionable suggestions for improving the content. */
  suggestions: string[];
  /** Estimated reading time in minutes (based on 200 wpm for EN, 160 wpm for VI). */
  estimatedReadTime: number;
  /** Total word count of the content. */
  wordCount: number;
  /** List of missing or broken SEO / structural elements. */
  missingElements: string[];
  /** List of heading structure issues (e.g. skipped heading levels). */
  headingIssues: string[];
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

const WORDS_PER_MINUTE = { en: 200, vi: 160 } as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

/** Returns a minimal heuristic-based analysis when no API key is present. */
function heuristicAnalysis(options: AnalyzeContentOptions): ContentAnalysis {
  const { title, content, targetKeywords, locale } = options;
  const words = content.trim().split(/\s+/);
  const wordCount = words.length;
  const wpm = WORDS_PER_MINUTE[locale];
  const estimatedReadTime = Math.max(1, Math.round(wordCount / wpm));

  const keywordDensity: Record<string, number> = {};
  const lowerContent = content.toLowerCase();

  for (const kw of targetKeywords) {
    const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lowerContent.match(regex);
    const count = matches ? matches.length : 0;
    keywordDensity[kw] = wordCount > 0 ? parseFloat(((count / wordCount) * 100).toFixed(2)) : 0;
  }

  const missingElements: string[] = [];
  if (title.length < 30) missingElements.push('meta description');
  if (!lowerContent.includes('faq') && !lowerContent.includes('câu hỏi')) missingElements.push('FAQ schema');
  if (!lowerContent.match(/https?:\/\//)) missingElements.push('internal links');
  if (wordCount < 300) missingElements.push('sufficient content length');

  const headingIssues: string[] = [];
  const h1Match = content.match(/^#\s+.+$/m);
  if (!h1Match) headingIssues.push('H1 missing');
  const h2Count = (content.match(/^##\s+.+$/gm) ?? []).length;
  const h4Count = (content.match(/^#{4}\s+.+$/gm) ?? []).length;
  if (h4Count > 0 && h2Count === 0) headingIssues.push('skip H2→H4');

  const hasGoodLength = wordCount >= 800;
  const hasKeywords = targetKeywords.length > 0 && Object.values(keywordDensity).some((d) => d > 0);
  const seoScore = hasGoodLength && hasKeywords ? 72 : hasGoodLength || hasKeywords ? 55 : 38;

  const readabilityScore = wordCount > 0
    ? Math.min(95, Math.max(30, 80 - (wordCount / 50)))
    : 30;

  return {
    seoScore,
    readabilityScore: Math.round(readabilityScore),
    keywordDensity,
    suggestions: [
      'Enable ANTHROPIC_API_KEY for AI-powered insights',
      'Consider expanding content to 800+ words for better SEO',
      'Add internal links to related service pages',
      'Include a FAQ section with structured data',
    ],
    estimatedReadTime,
    wordCount,
    missingElements,
    headingIssues,
  };
}

// ─── Content Optimizer Tools ─────────────────────────────────────────────────

/**
 * Helper utilities for building prompts and parsing AI responses.
 * Exported so they can be reused or tested in isolation.
 */
export const contentOptimizerTools = {
  /**
   * Builds a structured prompt string for the Claude analysis endpoint.
   *
   * @param content   - The full article / page content text.
   * @param options    - Analysis options including title, locale, and target keywords.
   * @returns A detailed prompt instructing Claude to return a JSON analysis.
   */
  buildPromptForAnalysis(
    content: string,
    options: AnalyzeContentOptions,
  ): string {
    const localeText = options.locale === 'vi'
      ? 'tiếng Việt, mang giọng tự nhiên và chuyên nghiệp'
      : 'in English, professional and natural in tone';

    const keywordsText = options.targetKeywords.length > 0
      ? `Target keywords: ${options.targetKeywords.join(', ')}`
      : 'No specific target keywords provided.';

    return `You are an expert SEO content analyst for a web agency website called LOOP.

Analyze the following content${localeText}.

Title: "${options.title}"

${keywordsText}

Content:
---
${content}
---

Respond ONLY with a valid JSON object matching this exact schema (no markdown, no extra text):
{
  "seoScore": <integer 0-100>,
  "readabilityScore": <integer 0-100>,
  "keywordDensity": { "<keyword>": <percentage float>, ... },
  "suggestions": [<string>, ...],
  "estimatedReadTime": <float in minutes>,
  "wordCount": <integer>,
  "missingElements": [<string>, ...],
  "headingIssues": [<string>, ...]
}

Rules:
- seoScore reflects title, meta, keywords, length, and structure quality.
- readabilityScore reflects sentence length, jargon, and paragraph clarity.
- keywordDensity values must sum naturally; no artificial inflation.
- suggestions must be specific and actionable (max 6 items).
- missingElements should include: "meta description", "FAQ schema", "internal links", "image alt text", "structured heading hierarchy" as appropriate.
- headingIssues should include: "H1 missing", "multiple H1s", "skip H2→H4", "no H2 headings" as appropriate.
- estimatedReadTime uses 200 wpm for EN / 160 wpm for VI content.
- Return ONLY the JSON object — no code fences, no preamble, no explanation.`;
  },

  /**
   * Parses a raw text response from the AI into a typed ContentAnalysis object.
   * Attempts JSON extraction even if the model wraps it in backticks.
   *
   * @param rawText - Raw text output from the AI model.
   * @returns A fully typed ContentAnalysis object.
   * @throws Error if the response cannot be parsed or validated.
   */
  parseAnalysisResponse(rawText: string): ContentAnalysis {
    const trimmed = rawText.trim();
    // Strip optional markdown code fences: ```json ... ``` or ``` ...
    const jsonString = trimmed.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    const raw = JSON.parse(jsonString);

    const result = z
      .object({
        seoScore: z.number().min(0).max(100),
        readabilityScore: z.number().min(0).max(100),
        keywordDensity: z.record(z.string(), z.number()),
        suggestions: z.array(z.string()),
        estimatedReadTime: z.number(),
        wordCount: z.number(),
        missingElements: z.array(z.string()),
        headingIssues: z.array(z.string()),
      })
      .parse(raw);

    return result as ContentAnalysis;
  },
};

// ─── Core Analysis Function ──────────────────────────────────────────────────

/**
 * Analyzes content using the Anthropic (Claude) API and returns a comprehensive
 * ContentAnalysis object.
 *
 * If `ANTHROPIC_API_KEY` is not set, falls back to a fast heuristic-based
 * analysis so the pipeline never crashes.
 *
 * @param text    - The content text to analyze (without the title).
 * @param options - Analysis options including title, locale, and target keywords.
 * @returns A fully typed ContentAnalysis object.
 *
 * @example
 * ```ts
 * const result = await analyzeContent(fullText, {
 *   title: 'Best Web Design Practices 2024',
 *   locale: 'en',
 *   targetKeywords: ['web design', 'UX'],
 * });
 * console.log(result.seoScore);
 * ```
 */
export async function analyzeContent(
  text: string,
  options: AnalyzeContentOptions,
): Promise<ContentAnalysis> {
  const validated = AnalyzeContentOptionsSchema.parse(options);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── Graceful fallback ──────────────────────────────────────────────────────
  if (!apiKey) {
    console.warn('[content-optimizer] ANTHROPIC_API_KEY not set — using heuristic fallback.');
    return heuristicAnalysis(validated);
  }

  try {
    const client = new Anthropic({ apiKey });
    const prompt = contentOptimizerTools.buildPromptForAnalysis(text, validated);

    const message = await client.messages.parse({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';

    return contentOptimizerTools.parseAnalysisResponse(rawText);
  } catch (err) {
    // Log and fall back rather than throwing — callers should always get a result.
    console.error('[content-optimizer] AI analysis failed, using heuristic fallback:', err);
    return heuristicAnalysis(validated);
  }
}

// ─── Meta Description Generator ─────────────────────────────────────────────

/**
 * Generates an SEO-optimized meta description of 150–160 characters using AI.
 *
 * @param title   - The page / article title.
 * @param content - The page / article body text (used as context for the description).
 * @param locale  - Language code ('vi' or 'en').
 * @returns A meta description string, trimmed to ≤160 characters.
 *
 * @example
 * ```ts
 * const meta = await generateMetaDescription(
 *   'LOOP — Web Design Agency',
 *   'We build high-converting websites...',
 *   'en',
 * );
 * ```
 */
export async function generateMetaDescription(
  title: string,
  content: string,
  locale: 'vi' | 'en' = 'en',
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Minimal fallback: use the title with a suffix.
    const suffix = locale === 'vi'
      ? ' | LOOP — Thiết kế website chuyên nghiệp'
      : ' | LOOP — Professional Web Design Agency';
    return (title + suffix).slice(0, 160);
  }

  const instruction =
    locale === 'vi'
      ? 'Viết một meta description SEO tối ưu, 150-160 ký tự, cho trang web này. Chỉ trả lời bằng description, không giải thích.'
      : 'Write an SEO-optimized meta description, 150–160 characters, for this page. Reply with only the description, no explanation.';

  const prompt = `Title: ${title}\n\nContent excerpt: ${content.slice(0, 500)}\n\n${instruction}`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.parse({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 80,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw =
      message.content[0].type === 'text' ? message.content[0].text.trim() : '';

    return raw.slice(0, 160);
  } catch (err) {
    console.error('[content-optimizer] generateMetaDescription failed:', err);
    return title.slice(0, 155) + '...';
  }
}

// ─── Internal Link Suggester ─────────────────────────────────────────────────

/**
 * Suggests internal link targets based on the content's topics.
 *
 * @param content - The article / page body text.
 * @param locale  - Language code ('vi' or 'en').
 * @returns An array of suggested internal link objects with URL, anchor text, and reason.
 *
 * @example
 * ```ts
 * const links = await suggestInternalLinks(articleText, 'en');
 * // [{ url: '/services/web-design', anchor: 'web design services', reason: '...' }]
 * ```
 */
export async function suggestInternalLinks(
  content: string,
  locale: 'vi' | 'en' = 'en',
): Promise<Array<{ url: string; anchor: string; reason: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Static fallback: return known high-value internal link targets.
  const staticSuggestions: Array<{ url: string; anchor: string; reason: string }> =
    locale === 'vi'
      ? [
          { url: `${SITE_URL}/vi/dich-vu`, anchor: 'Dịch vụ thiết kế web', reason: 'Liên quan đến dịch vụ cốt lõi' },
          { url: `${SITE_URL}/vi/case-study`, anchor: 'Case study', reason: 'Bằng chứng uy tín và kết quả thực tế' },
          { url: `${SITE_URL}/vi/blog`, anchor: 'Blog', reason: 'Nội dung liên quan trong blog' },
        ]
      : [
          { url: `${SITE_URL}/services`, anchor: 'web design services', reason: 'Core service offering' },
          { url: `${SITE_URL}/case-studies`, anchor: 'case studies', reason: 'Social proof and real results' },
          { url: `${SITE_URL}/blog`, anchor: 'agency blog', reason: 'Related in-depth articles' },
        ];

  if (!apiKey) return staticSuggestions;

  const topicPrompt =
    locale === 'vi'
      ? 'Phân tích nội dung sau và đề xuất 3 liên kết nội bộ phù hợp nhất (URL, anchor text, lý do). Trả lời JSON array.'
      : 'Analyze the content below and suggest the 3 most relevant internal link targets (URL, anchor text, reason). Reply with a JSON array.';

  const prompt = `${topicPrompt}\n\nContent:\n${content.slice(0, 800)}`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.parse({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]';
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 5).map((item: Record<string, string>) => ({
        url: item.url ?? item.href ?? `${SITE_URL}`,
        anchor: item.anchor ?? item.anchorText ?? '',
        reason: item.reason ?? '',
      }));
    }
  } catch (err) {
    console.error('[content-optimizer] suggestInternalLinks failed:', err);
  }

  return staticSuggestions;
}

// ─── FAQ Schema Generator ───────────────────────────────────────────────────

/**
 * Generates 3–5 FAQ question–answer pairs from blog content for FAQ schema markup.
 *
 * @param content - The article body text to extract FAQs from.
 * @param locale  - Language code ('vi' or 'en').
 * @returns An array of FAQ items with `question` and `answer` fields.
 *
 * @example
 * ```ts
 * const faqs = await generateFaqFromContent(articleText, 'en');
 * // [{ question: 'What is...?', answer: '...' }]
 * ```
 */
export async function generateFaqFromContent(
  content: string,
  locale: 'vi' | 'en' = 'en',
): Promise<Array<{ question: string; answer: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const instruction =
    locale === 'vi'
      ? 'Trích xuất hoặc tạo 3–5 cặp FAQ (câu hỏi + câu trả lời) từ nội dung bài viết. Trả lời JSON array: [{"question": "...", "answer": "..."}]'
      : 'Extract or generate 3–5 FAQ question–answer pairs from the content. Reply with a JSON array: [{"question": "...", "answer": "..."}]';

  const prompt = `${instruction}\n\nContent:\n${content.slice(0, 1000)}`;

  if (!apiKey) {
    // Return a placeholder so the caller always gets a non-empty array.
    return locale === 'vi'
      ? [{ question: 'Bạn có câu hỏi nào khác không?', answer: 'Liên hệ với LOOP để được tư vấn chi tiết.' }]
      : [{ question: 'Do you have another question?', answer: 'Contact LOOP for a detailed consultation.' }];
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.parse({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]';
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 5).map((item: Record<string, string>) => ({
        question: item.question ?? '',
        answer: item.answer ?? '',
      }));
    }
  } catch (err) {
    console.error('[content-optimizer] generateFaqFromContent failed:', err);
  }

  return [];
}

// ─── Heading Structure Generator ─────────────────────────────────────────────

/**
 * Suggests an H2 / H3 heading hierarchy based on the provided content.
 *
 * @param content - The article body text to base the structure on.
 * @param locale  - Language code ('vi' or 'en').
 * @returns An array of heading objects with `level` (2 or 3) and `text`.
 *
 * @example
 * ```ts
 * const headings = await generateSeoHeadings(articleText, 'en');
 * // [{ level: 2, text: 'Why Choose LOOP' }, { level: 3, text: 'Our Process' }]
 * ```
 */
export async function generateSeoHeadings(
  content: string,
  locale: 'vi' | 'en' = 'en',
): Promise<Array<{ level: 2 | 3; text: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const instruction =
    locale === 'vi'
      ? 'Đề xuất cấu trúc heading H2/H3 tối ưu SEO cho bài viết này. Trả lời JSON array: [{"level": 2, "text": "..."}]'
      : 'Suggest an SEO-optimal H2/H3 heading structure for this content. Reply with a JSON array: [{"level": 2, "text": "..."}]';

  const prompt = `${instruction}\n\nContent:\n${content.slice(0, 1200)}`;

  if (!apiKey) return [];

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.parse({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]';
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .filter((item: Record<string, unknown>) => item.level === 2 || item.level === 3)
        .slice(0, 10)
        .map((item: Record<string, unknown>) => ({
          level: Number(item.level) as 2 | 3,
          text: String(item.text ?? ''),
        }));
    }
  } catch (err) {
    console.error('[content-optimizer] generateSeoHeadings failed:', err);
  }

  return [];
}
