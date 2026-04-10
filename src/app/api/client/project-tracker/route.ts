/**
 * GET /api/client/project-tracker — Customer's orders with full project relations
 * Requires customer auth (JWT cookie).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, handleError } from "@/lib/api";

interface ProjectMemberOutput {
  id: string;
  member: {
    id: string;
    name: string;
    rank: string;
    level: number;
    image: string | null;
    avatar: string | null;
  };
  projectRole: { key: string; label: string };
}

interface HandoverPackageOutput {
  id: string;
  scope: unknown;
  figmaUrl: string | null;
  deploymentUrl: string | null;
  githubUrl: string | null;
}

interface OrderOutput {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | null;
  createdAt: Date;
  updatedAt: Date | null;
  gitRepoUrl: string | null;
  package: { title: string } | null;
  figmaDemos: Array<{
    id: string;
    title: string;
    figmaUrl: string;
    status: string;
    sentAt: string | null;
    approvedAt: string | null;
    versionHash: string | null;
    rejectionNote: string | null;
  }>;
  handoverPackages: HandoverPackageOutput[];
  projectMembers: ProjectMemberOutput[];
  statusHistory: Array<{
    fromStatus: string;
    toStatus: string;
    note: string | null;
    createdAt: Date;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    const orders = await prisma.order.findMany({
      where: { customerEmail: session.email },
      orderBy: { createdAt: "desc" },
      include: {
        package: { select: { title: true } },
        figmaDemos: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            figmaUrl: true,
            status: true,
            sentAt: true,
            approvedAt: true,
            versionHash: true,
            rejectionNote: true,
          },
        },
        handoverPackages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            scope: true,
            figmaUrl: true,
            deploymentUrl: true,
            githubUrl: true,
          },
        },
        projectMembers: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                rank: true,
                level: true,
                image: true,
              },
            },
            projectRole: { select: { key: true, label: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
          select: {
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
          },
        },
      },
    });

    // Map image -> avatar for TeamMember
    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      gitRepoUrl: o.gitRepoUrl,
      package: o.package,
      figmaDemos: o.figmaDemos,
      handoverPackages: o.handoverPackages.map((hp) => ({
        ...hp,
        deploymentUrl: hp.deploymentUrl,
        githubUrl: hp.githubUrl,
      })),
      projectMembers: o.projectMembers.map((pm) => ({
        id: pm.id,
        member: {
          id: pm.member.id,
          name: pm.member.name,
          rank: pm.member.rank,
          level: pm.member.level,
          image: pm.member.image,
          avatar: pm.member.image,
        },
        projectRole: pm.projectRole,
      })),
      statusHistory: o.statusHistory,
    }));

    return ok(mapped);
  } catch (err) {
    return handleError(err);
  }
}
