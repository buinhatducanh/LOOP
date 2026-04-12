import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";
import { z } from "zod";
import bcrypt from "bcryptjs";

const changeSchema = z.object({
 currentPassword: z.string().min(1, "Current password is required"),
 newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PUT(req: NextRequest) {
 try {
 const session = await requireAuth(req);
 const body = await req.json();
 const parsed = changeSchema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);

 const { currentPassword, newPassword } = parsed.data;

 const user = await prisma.user.findUnique({
 where: { id: session.userId },
 select: { id: true, passwordHash: true },
 });

 if (!user) return badRequest("User not found");

 if (!user.passwordHash) {
 return badRequest("No password set — please use account recovery");
 }

 const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
 if (!isValid) return badRequest("Current password is incorrect");

 const newHash = await bcrypt.hash(newPassword, 12);
 await prisma.user.update({
 where: { id: session.userId },
 data: { passwordHash: newHash },
 });

 return ok({ success: true });
 } catch (err) {
 return handleError(err);
 }
}
