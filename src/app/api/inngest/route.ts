/**
 * Inngest API Handler — connects Inngest cloud to your Next.js App Router.
 *
 * Inngest polls this endpoint to receive and execute background jobs.
 * Register your signing key in Vercel: INNGEST_SIGNING_KEY env var.
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/client";
import { allJobs } from "@/lib/jobs/functions";

// Next.js App Router config — required for raw body parsing
export const dynamic = "force-dynamic";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: allJobs,
});
