import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/portal/[token] — public endpoint, returns project data for client portal
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Validate token
    const portalToken = await prisma.projectPortalToken.findUnique({
      where: { token },
      include: {
        project: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
            companyName: true,
            domainName: true,
            projectStatus: true,
          },
        },
      },
    });

    if (!portalToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    if (!portalToken.isActive) {
      return NextResponse.json({ error: "Portal access has been disabled" }, { status: 403 });
    }

    if (portalToken.expiresAt && new Date(portalToken.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Portal link has expired" }, { status: 403 });
    }

    const projectId = portalToken.projectId;

    // Fetch all project progress data in parallel
    const [
      projectMembers,
      epics,
      tasks,
      deployments,
      handover,
    ] = await Promise.all([
      prisma.projectMember.findMany({
        where: { projectId },
        include: {
          member: { select: { id: true, name: true, role: true, image: true } },
        },
      }),
      prisma.epic.findMany({
        where: { projectId, isActive: true },
        include: {
          backlogs: {
            where: { projectId },
            include: {
              tasks: {
                select: {
                  id: true, title: true, status: true,
                  completedAt: true, violated: true, slaDeadline: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.task.findMany({
        where: { backlog: { projectId } },
        select: {
          id: true, title: true, status: true, priority: true,
          completedAt: true, violated: true, slaDeadline: true,
        },
      }),
      prisma.deployment.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, environment: true, status: true,
          deployedAt: true, deployUrl: true,
        },
      }),
      prisma.handoverPackage.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true, status: true, items: true,
          handoverDate: true, createdAt: true,
        },
      }),
    ]);

    const allTasks = tasks;
    const doneTasks = allTasks.filter(t => t.status === "done").length;
    const totalTasks = allTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const latestHandover = handover[0];
    const handoverItems = (Array.isArray(latestHandover?.items) ? latestHandover.items : []) as Array<Record<string, unknown>>;
    const completedSections = handoverItems.filter(i => i.checked === true).length;

    return NextResponse.json({
      data: {
        project: portalToken.project,
        label: portalToken.label,
        stats: {
          totalTasks,
          doneTasks,
          completionRate,
          memberCount: projectMembers.length,
        },
        members: projectMembers.map(pm => pm.member),
        epics: epics.map(epic => ({
          id: epic.id,
          name: epic.title,
          color: epic.color,
          backlogs: epic.backlogs.map(b => ({
            id: b.id,
            name: b.name,
            tasks: b.tasks.map(t => ({
              id: t.id,
              title: t.title,
              status: t.status,
              completedAt: t.completedAt?.toISOString() ?? null,
            })),
          })),
        })),
        recentDeployments: deployments.map(d => ({
          ...d,
          deployedAt: d.deployedAt?.toISOString() ?? null,
        })),
        handoverStatus: latestHandover ? {
          status: latestHandover.status,
          completedSections,
          totalSections: handoverItems.length,
        } : null,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
