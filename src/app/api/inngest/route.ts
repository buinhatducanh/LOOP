/**
 * Inngest API Handler — connects Inngest cloud to Next.js App Router.
 *
 * All job functions (event-driven + cron-scheduled) are consolidated
 * in src/lib/jobs/functions.ts under a single "loop" Inngest app.
 *
 * Next.js App Router config — required for raw body parsing
 */
export const dynamic = "force-dynamic";

import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/client";
import { allJobs } from "@/lib/jobs/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: allJobs,
});
