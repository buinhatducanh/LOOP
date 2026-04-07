/**
 * Quote service — quote creation, approval, conversion.
 */

import { prisma } from "@/lib/prisma";


// ─── Create Quote ─────────────────────────────────────────────────────────────

export type CreateQuoteInput = {
  salesLeadId: string;
  quoteNumber: string;
  title: string;
  totalAmount: number;
  lpAllocation?: Record<string, number>;
  milestones?: Array<{ name: string; amount: number; dueDate?: string }>;
  validUntil?: string;
  note?: string;
};

export async function createQuote(
  input: CreateQuoteInput,
  _userId: string
) {
  const lp = input.lpAllocation ?? {};
  const lpSum = Object.values(lp).reduce((s, v) => s + v, 0);
  if (lpSum !== 0 && lpSum !== 100) {
    throw new Error(`LP allocation must sum to 0% or 100%. Got: ${lpSum}%`);
  }

  return prisma.quote.create({
    data: {
      salesLeadId: input.salesLeadId,
      quoteNumber: input.quoteNumber,
      title: input.title,
      totalAmount: input.totalAmount,
      lpAllocation: lp,
      milestones: input.milestones,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      note: input.note ?? null,
    },
    include: {
      salesLead: { select: { id: true, customerName: true, customerEmail: true } },
    },
  });
}

// ─── Approve Quote ────────────────────────────────────────────────────────────

export async function approveQuote(quoteId: string, _userId: string) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Not found");

  return prisma.quote.update({
    where: { id: quoteId },
    data: { status: "accepted" },
  });
}
