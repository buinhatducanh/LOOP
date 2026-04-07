import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

/**
 * POST /api/admin/deployments/[id]/trigger
 * Triggers a manual deployment by calling the configured deploy hook.
 * Supports: Vercel deploy hooks, GitHub Actions workflow_dispatch, generic webhooks.
 *
 * If no deployHookUrl is configured, simulates success (manual deployment).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("projects", "update");
    const { id } = await params;

    const deployment = await prisma.deployment.findUnique({ where: { id } });
    if (!deployment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Mark as running immediately
    await prisma.deployment.update({
      where: { id },
      data: { status: "running", deployedAt: new Date(), deployedBy: _session.userId },
    });

    // Call deploy hook if configured
    if (deployment.deployHookUrl) {
      try {
        const hookUrl = new URL(deployment.deployHookUrl);
        // Vercel format: POST with optional ?git_message=...
        const body: Record<string, string> = {};
        if (deployment.commitSha) {
          body["git_message"] = `Deploy ${deployment.commitSha ?? "latest"} to ${deployment.environment}`;
        }

        await fetch(deployment.deployHookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(10_000),
        });

        console.log(`[Deploy] Triggered hook: ${deployment.platform} → ${hookUrl.hostname} (${deployment.environment})`);

        // Update with success (deployment will complete async on the platform side)
        await prisma.deployment.update({
          where: { id },
          data: {
            status: "running",
            deployUrl: deployment.deployUrl ?? `https://${hookUrl.hostname}`,
          },
        });
      } catch (hookErr) {
        console.error(`[Deploy] Hook failed for deployment ${id}:`, hookErr);
        // Still mark as running — platform may have received the trigger
        await prisma.deployment.update({
          where: { id },
          data: { status: "failed" },
        });
        return NextResponse.json({
          error: "Deployment hook failed. Please check the webhook URL.",
        }, { status: 502 });
      }
    } else {
      // No hook configured — simulate manual deployment success
      console.log(`[Deploy] Manual trigger (no hook): ${id} — ${deployment.platform} — ${deployment.environment}`);
      await prisma.deployment.update({
        where: { id },
        data: { status: "success" },
      });
    }

    const final = await prisma.deployment.findUnique({ where: { id } });
    return NextResponse.json({
      data: final,
      message: deployment.deployHookUrl
        ? `Deployment triggered on ${deployment.platform}. Platform will complete asynchronously.`
        : "Deployment marked as successful (manual/no hook configured).",
    });
  } catch (error) {
    return handleError(error);
  }
}
