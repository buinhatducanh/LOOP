"use client";

/**
 * AdminSessionInit — reads server-side session from props and
 * initializes the Zustand auth store so all admin pages can use it.
 */
import { useEffect } from "react";
import { useAuthStore, type AuthUser } from "@/app/store/authStore";

type Props = { session: {
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  roleLevel: number;
  accountType: "staff" | "customer";
  department?: string;
} };

export function AdminSessionInit({ session }: Props) {
  const { loginAs } = useAuthStore();

  useEffect(() => {
    const roleLevel = session.roleLevel ?? 1;
    const accountType = session.accountType ?? "staff";

    let userRole: AuthUser["role"] = "guest";
    if (accountType === "customer") userRole = "client";
    else if (roleLevel <= 1) userRole = "admin";
    else if (roleLevel === 2) userRole = "manager";
    else if (roleLevel <= 4) userRole = "staff";

    const user: AuthUser = {
      id: session.email,
      name: session.name || session.email,
      shortName: (session.name || session.email).split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase(),
      email: session.email,
      avatar: session.avatar ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.name || session.email)}`,
      role: userRole,
      department: session.department,
      lpBalance: 0,
      level: 1,
    };

    loginAs(user);
  }, []);

  return null;
}
