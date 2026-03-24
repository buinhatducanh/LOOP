/**
 * Inngest API Handler — connects Inngest cloud to your Next.js App Router.
 * All functions (website + PM) registered under a single "loop" app.
 */

import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/client";
import { allJobs } from "@/lib/jobs/functions";
import { pmFunctions } from "@/lib/inngest/functions";

// Next.js App Router config — required for raw body parsing
export const dynamic = "force-dynamic";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [...allJobs, ...pmFunctions],
});
