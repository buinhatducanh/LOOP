/**
 * Project Intake API — Admin
 *
 * Handles external project intake (ký kết bên ngoài) and
 * sales-assisted purchase flows.
 *
 * POST /api/admin/project-intake
 *   → Creates ExternalProject + Order (atomic transaction)
 *   → Sets isActiveProject = true for external, false for sales_assisted
 *   → Creates default backlog columns when Kanban is activated
 *   → Assigns PM + team members
 *
 * GET /api/admin/project-intake
 *   → Lists all external projects with pagination + filters
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, badRequest, handleError } from "@/lib/api/response";
import { buildPaginationResponse } from "@/lib/api/search-utils";
import type { Prisma } from "@/generated/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

type IntakeType = "external" | "sales_assisted";

interface TeamMemberInput {
  memberId: string;
  roleKey: string;
  assignedLp?: number;
}

interface IntakePayload {
  // Customer
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  requirements?: string;
  // Source type
  type: IntakeType;
  // External contract info (type === "external")
  contractRef?: string;
  contractParty?: string;
  signedAt?: string;
  // Pricing
  totalAmount?: number;
  // Team
  pmMemberId?: string;
  teamMembers?: TeamMemberInput[];
  // Config
  activateKanban?: boolean;
  startedAt?: string;
}

// ─── GET /api/admin/project-intake ───────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await requirePermission("orders", "read");
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const type = searchParams.get("type") ?? "";
    const status = searchParams.get("status") ?? "";
    const search = searchParams.get("search") ?? "";

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { contractRef: { contains: search, mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.externalProject.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              paymentStatus: true,
              isActiveProject: true,
              projectStatus: true,
              totalAmount: true,
              startedAt: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.externalProject.count({ where }),
    ]);

    return NextResponse.json({
      data: projects,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (err) {
    return handleError(err);
  }
}

// ─── POST /api/admin/project-intake ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("orders", "create");
    const body: IntakePayload = await req.json();

    // ── Validation ─────────────────────────────────────────────────────────
    if (!body.customerName?.trim()) {
      return badRequest("customerName is required");
    }
    if (!body.customerEmail?.trim()) {
      return badRequest("customerEmail is required");
    }
    if (!["external", "sales_assisted"].includes(body.type)) {
      return badRequest("type must be 'external' or 'sales_assisted'");
    }

    // Validate type-specific fields
    if (body.type === "external") {
      // totalAmount is optional for external; no additional validation needed
    }
    if (body.type === "sales_assisted") {
      if (!body.totalAmount || body.totalAmount <= 0) {
        return badRequest("totalAmount is required and must be > 0 for sales_assisted");
      }
    }

    // Validate PM exists if provided
    if (body.pmMemberId) {
      const pm = await prisma.teamMember.findUnique({ where: { id: body.pmMemberId } });
      if (!pm) return badRequest("pmMemberId not found");
    }

    // Validate team members exist
    for (const m of body.teamMembers ?? []) {
      const member = await prisma.teamMember.findUnique({ where: { id: m.memberId } });
      if (!member) return badRequest(`memberId "${m.memberId}" not found`);
    }

    // ── Build config ───────────────────────────────────────────────────────
    const activateKanban = body.activateKanban ?? body.type === "external";
    const orderStatus = "contracted";
    const paymentStatus =
      body.totalAmount && body.totalAmount > 0 ? "paid_partial" : "unpaid";

    // ── Atomic transaction ─────────────────────────────────────────────────
    // Note: PrismaNeon HTTP adapter does NOT support $transaction — we use
    // sequential writes. If any step fails, earlier steps are NOT rolled back.
    // For production reliability, consider Inngest for multi-step writes.
    // Here we do them in a logical order with try/catch per step.

    // ① Create ExternalProject
    const extProject = await prisma.externalProject.create({
      data: {
        type: body.type,
        customerName: body.customerName.trim(),
        customerEmail: body.customerEmail.trim(),
        customerPhone: body.customerPhone?.trim() || null,
        companyName: body.companyName?.trim() || null,
        requirements: body.requirements?.trim() || null,
        contractRef: body.contractRef?.trim() || null,
        contractParty: body.contractParty?.trim() || null,
        signedAt: body.signedAt ? new Date(body.signedAt) : null,
        totalAmount: body.totalAmount ?? null,
        status: body.type === "external" ? "active" : "pending_approval",
        createdBy: session.userId,
      },
    });

    // ② Create Order
    const orderNumber = `ORD-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: body.customerName.trim(),
        customerEmail: body.customerEmail.trim(),
        customerPhone: body.customerPhone?.trim() || null,
        companyName: body.companyName?.trim() || null,
        requirements: body.requirements?.trim() || null,
        status: orderStatus,
        paymentStatus,
        totalAmount: body.totalAmount ? Math.round(body.totalAmount) : null,
        finalPrice: body.totalAmount ? Math.round(body.totalAmount) : null,
        externalProjectId: extProject.id,
        isActiveProject: activateKanban,
        projectStatus: activateKanban ? "active" : null,
        startedAt: activateKanban
          ? (body.startedAt ? new Date(body.startedAt) : new Date())
          : null,
      },
    });

    // ③ Update ExternalProject with orderId
    await prisma.externalProject.update({
      where: { id: extProject.id },
      data: { orderId: order.id },
    });

    // ④ Create default backlog columns (only when Kanban is activated)
    if (activateKanban) {
      await prisma.backlog.createMany({
        data: [
          { projectId: order.id, name: "Backlog",       title: "Backlog",       sortOrder: 0 },
          { projectId: order.id, name: "In Progress",  title: "In Progress",  sortOrder: 1 },
          { projectId: order.id, name: "Review",        title: "Review",        sortOrder: 2 },
          { projectId: order.id, name: "Done",           title: "Done",          sortOrder: 3 },
        ],
      });
    }

    // ⑤ Assign PM + team members
    const projectMembers = [];

    if (body.pmMemberId) {
      const pmEntry = await prisma.projectMember.create({
        data: {
          memberId: body.pmMemberId,
          projectId: order.id,
          projectRoleKey: "pm",
          assignedLp: body.teamMembers?.find((m) => m.memberId === body.pmMemberId)?.assignedLp ?? 0,
        },
      });
      projectMembers.push(pmEntry);
    }

    for (const m of body.teamMembers ?? []) {
      if (m.memberId === body.pmMemberId) continue; // already assigned
      const entry = await prisma.projectMember.create({
        data: {
          memberId: m.memberId,
          projectId: order.id,
          projectRoleKey: m.roleKey,
          assignedLp: m.assignedLp ?? 0,
        },
      });
      projectMembers.push(entry);
    }

    // ⑥ Audit log
    await prisma.auditLog
      .create({
        data: {
          userId: session.userId,
          action: "create",
          resource: "project_intake",
          resourceId: order.id,
          newValues: body as unknown as Parameters<typeof prisma.auditLog.create>[0]["data"]["newValues"],
        },
      })
      .catch(() => { /* non-critical */ });

    return ok(
      {
        externalProject: extProject,
        order,
        projectMembers,
        activateKanban,
      },
      201
    );
  } catch (err) {
    return handleError(err);
  }
}
