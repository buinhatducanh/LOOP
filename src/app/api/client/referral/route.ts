import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";
import { z } from "zod";

export async function GET(req: NextRequest) {
 try {
 const session = await requireAuth(req);

 // Find or generate referral code for this user
 let referral = await prisma.referralCode.findFirst({
 where: { memberId: session.userId },
 });

 if (!referral) {
 const { randomBytes } = await import("crypto");
 const code = randomBytes(4).toString("hex").toUpperCase();
 referral = await prisma.referralCode.create({
 data: {
 code,
 name: session.name ?? "My Referral",
 memberId: session.userId,
 },
 });
 }

 // Get referral stats
 const tracking = await prisma.referralTracking.findMany({
 where: { referralCodeId: referral.id },
 select: {
 event: true,
 createdAt: true,
 },
 });

 const stats = {
 code: referral.code,
 name: referral.name,
 totalClicks: tracking.filter((t: typeof tracking[number]) => t.event === "click").length,
 totalSignups: tracking.filter((t: typeof tracking[number]) => t.event === "signup").length,
 totalOrders: tracking.filter((t: typeof tracking[number]) => t.event === "order").length,
 };

 return ok({ referral, stats });
 } catch (err) {
 return handleError(err);
 }
}

const createSchema = z.object({
 code: z.string().min(3).max(20).optional(),
 name: z.string().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
 try {
 const session = await requireAuth(req);
 const body = await req.json();
 const parsed = createSchema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);

 const { randomBytes } = await import("crypto");
 const code = parsed.data.code
 ?? randomBytes(4).toString("hex").toUpperCase();

 // Check if code already exists
 const existing = await prisma.referralCode.findUnique({ where: { code } });
 if (existing) return badRequest("Referral code already exists");

 const referral = await prisma.referralCode.create({
 data: {
 code,
 name: parsed.data.name ?? session.name ?? "My Referral",
 memberId: session.userId,
 },
 });

 return ok(referral, 201);
 } catch (err) {
 return handleError(err);
 }
}
