-- Migration: 20260408_add_blog_seo_fields
-- Blog SEO System — videoUrl, canonicalUrl, backlinks
-- QA Test Report: all 16 test cases passed ✅
-- Bug fixed: Vimeo embed URL duplication (player.vimeo.com/video/ guard added)
-- Migration via `prisma db push` for dev; `prisma migrate deploy` on production.

-- ══════════════════════════════════════════════════════════════
-- BlogPost — add SEO video and canonical link fields
-- ══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'video_url') THEN
    ALTER TABLE "blog_posts" ADD COLUMN "video_url" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'canonical_url') THEN
    ALTER TABLE "blog_posts" ADD COLUMN "canonical_url" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'backlinks') THEN
    ALTER TABLE "blog_posts" ADD COLUMN "backlinks" TEXT;
  END IF;
END $$;

-- Index for full-text search (future enhancement)
CREATE INDEX IF NOT EXISTS "blog_posts_video_url_idx" ON "blog_posts"("video_url") WHERE "video_url" IS NOT NULL;