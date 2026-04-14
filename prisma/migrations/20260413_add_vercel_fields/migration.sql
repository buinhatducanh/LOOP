-- Migration: add_vercel_deploy_fields
-- Adds fields for Vercel deployment tracking

-- PricingWebPackage: GitHub template repo URL
ALTER TABLE "pricing_web_packages" ADD COLUMN "template_repo_url" TEXT;

-- CustomerWebsite: Vercel project tracking
ALTER TABLE "customer_websites" ADD COLUMN "vercel_project_id" TEXT;
ALTER TABLE "customer_websites" ADD COLUMN "vercel_project_url" TEXT;
