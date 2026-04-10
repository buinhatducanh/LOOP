/**
 * Invoice by ID API — /api/admin/invoices/[id]
 * GET / PUT / DELETE
 */

import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, notFound, handleError, badRequest } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "read", req);
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!invoice) return notFound("Invoice not found");

    return ok(invoice);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "update", req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true },
    });
    if (!existing) return notFound("Invoice not found");

    // If status → "paid", set paidAt
    const paidAt =
      body.status === "paid" && existing.status !== "paid"
        ? new Date()
        : body.paidAt !== undefined
        ? body.paidAt
          ? new Date(body.paidAt)
          : null
        : existing.paidAt;

    const amount = parseInt(String(body.amount ?? existing.amount), 10);
    const taxAmount = parseInt(String(body.taxAmount ?? existing.taxAmount), 10);
    const totalAmount = parseInt(String(body.totalAmount ?? existing.totalAmount), 10) || amount + taxAmount;

    // Upsert line items if provided
    if (body.lineItems !== undefined) {
      // Delete existing
      await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
    }

    const updateData: Record<string, unknown> = {
      invoiceNumber: body.invoiceNumber ?? existing.invoiceNumber,
      orderId: body.orderId !== undefined ? (body.orderId || null) : existing.orderId,
      customerId: body.customerId !== undefined ? (body.customerId || null) : existing.customerId,
      type: body.type ?? existing.type,
      amount,
      taxAmount,
      totalAmount,
      currency: body.currency ?? existing.currency,
      status: body.status ?? existing.status,
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : existing.dueDate,
      paidAt,
      paidMethod: body.paidMethod !== undefined ? (body.paidMethod || null) : existing.paidMethod,
      description: body.description !== undefined ? (body.description || null) : existing.description,
      note: body.note !== undefined ? (body.note || null) : existing.note,
    };

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...updateData,
        ...(body.lineItems !== undefined && body.lineItems?.length
          ? {
              lineItems: {
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
              },
            }
          : {}),
      },
      include: { lineItems: true },
    });

    return ok(invoice);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "delete", req);
    const { id } = await params;

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) return notFound("Invoice not found");

    if (existing.status !== "draft") {
      return badRequest("Only draft invoices can be deleted");
    }

    await prisma.invoice.delete({ where: { id } });

    return ok({ id }, 200);
  } catch (err) {
    return handleError(err);
  }
}
