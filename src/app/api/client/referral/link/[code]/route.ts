import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ok, notFound } from "@/lib/api";

export async function GET(
 req: NextRequest,
 { params }: { params: Promise<{ code: string }> }
) {
 try {
 const { code } = await params;

 const referral = await prisma.referralCode.findUnique({
 where: { code: code.toUpperCase() },
 include: {
 member: { select: { id: true, name: true, image: true } },
 },
 });

 if (!referral) return notFound("Referral code not found");

 // Track click event
 await prisma.referralTracking.create({
 data: {
 referralCodeId: referral.id,
 event: "click",
 landingUrl: req.nextUrl.origin,
 },
 });

 return ok({
 valid: true,
 code: referral.code,
 memberName: referral.member?.name ?? "LOOP Member",
 campaign: referral.campaign,
 });
 } catch (err) {
 return handleError(err);
 }
}
