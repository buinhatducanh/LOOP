/**
 * Invoices API — /api/admin/invoices
 * GET list + POST create (auto-generate invoiceNumber)
 */

import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, list, badRequest, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { buildPagination } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("orders", "read", req);
    const { searchParams } = req.nextUrl;

    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const search = searchParams.get("search") ?? undefined;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type && type !== "all") where.type = type;
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { lineItems: true },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({ where }),
    ]);

    return list(invoices, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("orders", "create", req);
    const body = await req.json();

    if (!body.invoiceNumber?.trim() && !body.autoGenerate) {
      return badRequest("invoiceNumber is required");
    }

    // Auto-generate invoice number: INV-YYYYMM-XXXX
    let invoiceNumber = body.invoiceNumber?.trim();
    if (body.autoGenerate || !invoiceNumber) {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
      const count = await prisma.invoice.count({
        where: { invoiceNumber: { startsWith: `INV-${yearMonth}` } },
      });
      invoiceNumber = `INV-${yearMonth}-${String(count + 1).padStart(4, "0")}`;
    }

    const amount = parseInt(body.amount, 10) || 0;
    const taxAmount = parseInt(body.taxAmount, 10) || 0;
    const totalAmount = parseInt(body.totalAmount, 10) || (amount + taxAmount);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: body.orderId ?? null,
        customerId: body.customerId ?? null,
        type: body.type ?? "income",
        amount,
        taxAmount,
        totalAmount,
        currency: body.currency ?? "VND",
        status: body.status ?? "draft",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        paidAt: body.paidAt ? new Date(body.paidAt) : null,
        paidMethod: body.paidMethod ?? null,
        description: body.description ?? null,
        note: body.note ?? null,
        createdBy: session.userId,
        lineItems: body.lineItems?.length
          ? {
              create: body.lineItems.map((item: {
                description: string;
                quantity?: number;
                unitPrice?: number;
                totalPrice?: number;
              }) => ({
                description: item.description,
                quantity: item.quantity ?? 1,
                unitPrice: parseInt(String(item.unitPrice ?? 0), 10),
                totalPrice: parseInt(String(item.totalPrice ?? 0), 10),
              })),
            }
          : undefined,
      },
      include: { lineItems: true },
    });

    return ok(invoice, 201);
  } catch (err) {
    return handleError(err);
  }
}
