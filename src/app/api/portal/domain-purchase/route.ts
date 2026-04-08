/**
 * POST /api/portal/domain-purchase
 *
 * Customer purchases domain + hosting.
 * Creates a CustomerWebsite record and notifies admin for domain registration.
 *
 * Body: {
 *   orderId?: string,
 *   packageId: string,
 *   domain: string,
 *   name: string,
 *   hostingProvider: string,
 *   ekycName?: string,
 *   ekycIdNumber?: string,
 *   ekycDob?: string,
 *   ekycAddress?: string,
 * }
 *
 * Sets:
 *   CustomerWebsite.configStatus = "pending_config"
 *   CustomerWebsite.status = "active"
 *   (Optionally) Order.projectStatus = "pending_config"
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError } from "@/lib/api";
import { ok, badRequest } from "@/lib/api/response";

const purchaseSchema = z.object({
  orderId: z.string().optional(),
  packageId: z.string().optional(),
  domain: z.string().optional(),
  name: z.string().min(1, "Tên website là bắt buộc"),
  hostingProvider: z.string().optional(),
  ekycName: z.string().optional(),
  ekycIdNumber: z.string().optional(),
  ekycDob: z.string().optional(),
  ekycAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    const body = await req.json();
    const parsed = purchaseSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.message);

    const {
      orderId,
      packageId,
      domain,
      name,
      hostingProvider,
      ekycName,
      ekycIdNumber,
      ekycDob,
      ekycAddress,
    } = parsed.data;

    // ── 1. Create CustomerWebsite record ──────────────────────────────────
    const website = await prisma.customerWebsite.create({
      data: {
        orderId: orderId ?? null,
        packageId: packageId ?? null,
        domain: domain ?? null,
        name,
        hostingProvider: hostingProvider ?? null,
        customerId: session.userId,
        customerName: session.name,
        customerEmail: session.email,
        configStatus: "pending_config",
        status: "active",
        ekycName: ekycName ?? null,
        ekycIdNumber: ekycIdNumber ?? null,
        ekycDob: ekycDob ?? null,
        ekycAddress: ekycAddress ?? null,
      },
      select: {
        id: true,
        orderId: true,
        packageId: true,
        domain: true,
        name: true,
        hostingProvider: true,
        configStatus: true,
        status: true,
        createdAt: true,
      },
    });

    // ── 2. Optionally update order project status ─────────────────────────
    if (orderId) {
      await prisma.order
        .update({
          where: { id: orderId },
          data: { projectStatus: "pending_config" },
        })
        .catch(() => {
          /* non-fatal — orderId may be stale or not exist */
        });
    }

    // ── 3. Notify admin to register the domain ────────────────────────────
    const adminLink = website.id ? `/admin/web_packages` : undefined;

    await prisma.adminNotification.create({
      data: {
        type: "domain_purchase",
        title: "Yêu cầu đăng ký domain",
        message: `${session.name} vừa mua domain hosting — cần đăng ký domain cho "${name}".`,
        link: adminLink,
        priority: "normal",
        isRead: false,
      },
    });

    return ok(website, 201);
  } catch (err) {
    return handleError(err);
  }
}
