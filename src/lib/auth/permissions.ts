import { prisma } from "@/lib/prisma";
import { verifyToken, type JWTPayload } from "./jwt";
import { cookies } from "next/headers";

export type PermissionAction = "create" | "read" | "update" | "delete" | "export" | "approve";

export interface SessionUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  avatar: string | null;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId, isActive: true },
    include: {
      userRoles: { include: { role: true } },
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roles: user.userRoles.map((ur) => ur.role.name),
    avatar: user.avatar,
  };
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function checkPermission(
  userId: string,
  resource: string,
  action: PermissionAction
): Promise<boolean> {
  const count = await prisma.permission.count({
    where: {
      resource,
      action,
      role: {
        users: {
          some: { userId },
        },
      },
    },
  });
  return count > 0;
}

export async function requirePermission(
  resource: string,
  action: PermissionAction
): Promise<SessionUser> {
  const session = await requireAuth();

  // Super admin bypasses all permission checks
  if (session.roles.includes("super_admin")) {
    return session;
  }

  const allowed = await checkPermission(session.userId, resource, action);
  if (!allowed) {
    throw new Error("Forbidden");
  }

  return session;
}
