import { list, handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// ─── GET /api/admin/media-bookings ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await requirePermission("media-bookings", "read");
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const skip = (page - 1) * limit;

    // Build text search where clause
    const searchWhere = search
      ? {
          OR: [
            { bookingNumber: { contains: search, mode: "insensitive" as const } },
            { customerName: { contains: search, mode: "insensitive" as const } },
            { customerEmail: { contains: search, mode: "insensitive" as const } },
            { title: { contains: search, mode: "insensitive" as const } },
            { companyName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Build field filter where clause
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const bookingType = searchParams.get("bookingType");
    const portfolio = searchParams.get("portfolio"); // "true" = approved bookings with assets

    const fieldWhere: Record<string, unknown> = {};
    if (status) fieldWhere.status = status;
    if (paymentStatus) fieldWhere.paymentStatus = paymentStatus;
    if (bookingType) fieldWhere.bookingType = bookingType;

    // Portfolio filter: only approved bookings that have delivered assets
    if (portfolio === "true") {
      fieldWhere.status = "approved";
      // Prisma Json fields can't be filtered directly, so we fetch all approved
      // and filter in JS — acceptable since approved set is small
    }

    const where = { ...searchWhere, ...fieldWhere };
    const orderBy = { createdAt: "desc" as const };

    const [allBookings, total] = await Promise.all([
      portfolio === "true"
        ? prisma.mediaBooking.findMany({
            where: { ...searchWhere, status: "approved" },
            orderBy,
            include: {
              package: { select: { title: true } },
              teamMember: { select: { name: true } },
            },
          })
        : prisma.mediaBooking.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
              package: { select: { title: true } },
              teamMember: { select: { name: true } },
            },
          }),
      prisma.mediaBooking.count({ where }),
    ]);

    // Portfolio: filter bookings that actually have delivered assets (in memory)
    const bookings = portfolio === "true"
      ? (allBookings as Array<{ deliveredAssets: unknown }>).filter((b) =>
          Array.isArray(b.deliveredAssets) && b.deliveredAssets.length > 0
        )
      : allBookings;

    // Portfolio: no pagination, return all filtered bookings
    if (portfolio === "true") {
      return list(bookings, { page: 1, limit: bookings.length, total: bookings.length, totalPages: 1 });
    }

    return list(bookings, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST /api/admin/media-bookings ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await requirePermission("media-bookings", "create");
    const data = await req.json();

    // Required fields
    if (!data.customerName || !data.customerEmail) {
      return NextResponse.json(
        { error: "customerName and customerEmail are required" },
        { status: 400 }
      );
    }

    // Booking number: MBK-{12-char-uuid}
    const bookingNumber = `MBK-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

    const booking = await prisma.mediaBooking.create({
      data: {
        bookingNumber,
        packageId: data.packageId || null,
        orderId: data.orderId || null,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        companyName: data.companyName || null,
        bookingType: data.bookingType || "event",
        title: data.title || `${data.customerName} — Media Booking`,
        requirements: data.requirements || null,
        note: data.note || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        status: "pending",
        paymentStatus: data.paymentStatus || "unpaid",
        totalAmount: data.totalAmount ? parseInt(data.totalAmount, 10) : null,
        assignedTo: data.assignedTo || null,
        teamMemberId: data.teamMemberId || null,
      },
      include: {
        package: { select: { title: true } },
        teamMember: { select: { name: true } },
      },
    });

    await createAuditLog({
      userId: "system",
      action: "create",
      resource: "media-bookings",
      resourceId: booking.id,
      newValues: data,
    });

    return ok(booking, 201);
  } catch (error) {
    return handleError(error);
  }
}
