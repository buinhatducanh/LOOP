# LOOP Content Strategy — 2026

> Document version: 1.0 | Date: 2026-03-21 | Owner: LOOP Marketing & Dev

---

## 1. Vision & Goals

**Mission:** Position LOOP as the authoritative voice in Vietnamese web development by producing deep, practical content that developers and business owners both trust.

**Goals:**
- Increase organic blog traffic by 150% within 6 months
- Rank #1-3 for 20+ targeted keywords in Vietnamese
- Become the go-to resource for "website design Vietnam" queries
- Support sales pipeline with high-quality educational content
- Establish thought leadership in ASEAN tech community

---

## 2. Content Pillars

### Pillar A — Technical Deep Dives
Educational content targeting developers and technical decision-makers.

| Content Type | Examples | SEO Target |
|---|---|---|
| How-to guides | "Cách deploy Next.js lên Vercel", "Setup PostgreSQL Neon" | Technical queries |
| Architecture posts | "Server Components vs Client Components", "ISR vs SSR" | React/Next.js community |
| Tool comparisons | "Prisma vs Drizzle vs Drizzle", "Sanity vs Contentful" | Decision-maker queries |
| Best practices | "10 sai lầm SEO website", "Performance checklist" | Actionable guides |

### Pillar B — Business & Strategy
Content targeting business owners and marketing teams.

| Content Type | Examples | SEO Target |
|---|---|---|
| Website buying guide | "Website giá bao nhiêu là hợp lý?", "Template vs Custom" | Pre-purchase research |
| ROI calculators | "Chi phí website: breakdown đầy đủ" | Commercial intent |
| Industry insights | "Xu hướng thiết kế web 2026", "E-commerce Vietnam trends" | Market intelligence |
| Case studies | Portfolio deep dives with results | Social proof |

### Pillar C — News & Culture
Light content for brand building and community engagement.

| Content Type | Frequency | Purpose |
|---|---|---|
| Company news | Monthly | Brand personality |
| Tech picks | Bi-weekly | Community engagement |
| Event recaps | Per event | Social content |

---

## 3. Content Types & Specs

### 3.1 Long-Form Blog Posts (Pillar A — Primary)

**Definition:** In-depth, 1,500–3,000 word articles covering a single topic thoroughly.

**Required Elements:**
- [ ] H1 + logical H2/H3 hierarchy
- [ ] Excerpt (150–160 chars) for SEO + social sharing
- [ ] Featured image with descriptive alt text
- [ ] Author attribution with bio link
- [ ] Estimated reading time (calculated)
- [ ] Table of contents (for posts >1,500 words)
- [ ] Internal links to at least 3 related pages
- [ ] External links to authoritative sources
- [ ] FAQ section (3–5 Q&As) for FAQ schema
- [ ] Call-to-action at end (related service or consultation)

**SEO Requirements:**
- Primary keyword in: title, H1, first 100 words, URL, meta description
- Secondary keywords in: 2–3 H2s, image alt texts
- JSON-LD: Article schema + HowTo (if step-by-step) + BreadcrumbList
- Open Graph image: 1200×630px

**Publishing Cadence:** 2 posts/month

---

### 3.2 Short-Form Technical Notes (Pillar A — Secondary)

**Definition:** 400–800 word focused tips/tricks targeting specific developer queries.

**Required Elements:**
- [ ] H1 with the specific problem/tip
- [ ] Code examples with syntax highlighting
- [ ] Expected output or demo
- [ ] Related term in Glossary (cross-link)
- [ ] Author attribution

**Publishing Cadence:** 1 post/week

---

### 3.3 Buying Guides (Pillar B — High Priority)

**Definition:** Comprehensive comparison/decision guides, 2,000–4,000 words.

**Required Elements:**
- [ ] Clear decision framework (pro/con table)
- [ ] Price breakdown section
- [ ] "Who is this for?" section
- [ ] Warning/red flags section (what to avoid)
- [ ] Next steps CTA
- [ ] JSON-LD: FAQPage + Product/Offer

**Publishing Cadence:** 1 guide/quarter

---

### 3.4 Case Studies

**Definition:** Project deep-dives with real metrics and client outcomes.

**Template Structure:**
```
1. Client background (industry, challenge)
2. Solution approach
3. Technical highlights (what made it interesting)
4. Results (metrics: load time, conversions, SEO rank)
5. Testimonial quote
6. Related services CTA
```

**Publishing Cadence:** 1 case study/quarter

---

### 3.5 Glossary Updates

**Definition:** Living document — new terms added as industry evolves.

**Trigger:** When a new technical term appears in 3+ articles, add to Glossary.

---

## 4. Editorial Calendar — 2026

### Q2 (Apr–Jun) — Foundation
| Month | Primary Post | Secondary Posts | Focus |
|---|---|---|---|
| Apr | "Next.js 15 Full Guide 2026" | "Prisma 7 Migration", "Neon PostgreSQL Setup" | Tech fundamentals |
| May | "Website Cost Breakdown Vietnam 2026" | "Template vs Custom", "SSL Setup Guide" | Business decision |
| Jun | "Core Web Vitals Checklist" | "Image Optimization", "CDN Explained" | Performance |

### Q3 (Jul–Sep) — Authority
| Month | Primary Post | Secondary Posts | Focus |
|---|---|---|---|
| Jul | "Headless CMS Comparison" | "Sanity Studio Guide", "Strapi vs Sanity" | CMS decision |
| Aug | "E-commerce Website Checklist" | "Payment Gateway Guide", "Product Schema" | E-commerce |
| Sep | "SEO Audit Checklist 2026" | "JSON-LD Guide", "Sitemap Best Practices" | SEO |

### Q4 (Oct–Dec) — Conversion
| Month | Primary Post | Secondary Posts | Focus |
|---|---|---|---|
| Oct | "How to Choose Web Agency" | "Red Flags in Web Dev", "Contract Guide" | Agency selection |
| Nov | "Website Maintenance Guide" | "Security Checklist", "Backup Strategy" | Ongoing ops |
| Dec | "2026 Web Trends Wrap-up" | Year review, predictions | Industry intel |

---

## 5. Content Production Workflow

### 5.1 Writing Process

```
1. Topic Selection → 2. Keyword Research → 3. Outline → 4. Draft → 5. Review → 6. Edit → 7. Publish
     ↑______________ Topic Bank __________________________________________|
```

**Topic Bank:** Google Search Console queries + competitor analysis + industry news. Refresh quarterly.

### 5.2 Quality Checklist (Pre-Publish)

- [ ] Pass Hemingway App (grade level ≤ 8 for EN, vi equivalent)
- [ ] All headings semantic (H1→H2→H3, never skip)
- [ ] Images: WebP, described alt text, lazy-loaded
- [ ] Internal links: minimum 3, relevant
- [ ] External links: authoritative sources only (no broken links)
- [ ] URL: lowercase, hyphens, keyword-rich, <75 chars
- [ ] Meta description: 150–160 chars, includes primary keyword
- [ ] OG image: 1200×630px, branded
- [ ] JSON-LD: Article + BreadcrumbList + relevant extras
- [ ] Schema validation: [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Mobile: responsive check
- [ ] Performance: Lighthouse > 90

### 5.3 AI Assistance Guidelines

**What AI CAN do:**
- Generate outline drafts (human-refined)
- Suggest related topics based on keyword analysis
- Proofread for grammar/spelling
- Suggest JSON-LD field mappings
- Check for heading structure issues

**What AI CANNOT do (human must):**
- Write final content without review (AI hallucination risk)
- Make strategic content decisions
- Approve testimonials or case study quotes
- Replace expert technical accuracy
- Guarantee SEO performance

---

## 6. Distribution & Promotion

### 6.1 On-Site
- [ ] RelatedContent widget (relevance-scored cross-links)
- [ ] Blog newsletter signup (bottom of every post)
- [ ] Table of contents with anchor links

### 6.2 Off-Site
| Channel | Content Type | Frequency |
|---|---|---|
| LinkedIn | Summary + link | Every post |
| Facebook | Vietnamese summary + link | Every post |
| Newsletter (Resend) | Full post | 2×/month |
| DEV Community | Technical cross-post | Monthly |
| Hacker News | Tech posts with high relevance | As relevant |

### 6.3 Internal Linking Strategy
- Every blog post → 3 related posts (via RelatedContent widget)
- Every blog post → 1 service page (relevant)
- Every service page → 2+ blog posts
- Glossary terms → relevant blog posts (bidirectional)

---

## 7. Measurement

| Metric | Target | How to Measure |
|---|---|---|
| Organic sessions (blog) | +150% in 6 months | GA4 |
| Blog pageviews/month | 10,000 → 25,000 | GA4 |
| Average time on blog post | >3 minutes | GA4 |
| Blog bounce rate | <60% | GA4 |
| SERP positions (top 10) | 20+ keywords | Google Search Console |
| Newsletter subscribers | 500 → 2,000 | Resend |
| Social shares/post | 20+ | Native analytics |

**Review Cadence:** Monthly metrics review, quarterly strategy adjustment.

---

## 8. Roles & Responsibilities

| Role | Responsibility |
|---|---|
| **Content Lead** | Editorial calendar, quality review, SEO oversight |
| **Technical Writers** | Pillar A content (dev-focused) |
| **Marketing Writer** | Pillar B content (business-focused) |
| **Developers** | Code examples, technical accuracy review |
| **Design** | Featured images, OG images |
| **SEO Tooling** | AI content optimization pipeline (dev) |

---

## 9. Resources

- **Sanity CMS:** `src/sanity/` — Blog posts, authors, categories
- **Glossary:** `src/app/[locale]/glossary/page.tsx`
- **AI Content Optimizer:** `src/lib/ai/content-optimizer.ts`
- **JSON-LD Builders:** `src/lib/json-ld.ts`
- **Internal Linking:** `src/lib/db/internal-linking.ts`
- **Analytics Events:** `src/lib/analytics/events.ts`
- **RSS Feeds:** `src/app/[locale]/feed.xml/route.ts`
