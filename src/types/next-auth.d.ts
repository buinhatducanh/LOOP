import { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      teamMemberId?: string | null;
      accountType?: "staff" | "customer";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    teamMemberId?: string | null;
    accountType?: "staff" | "customer";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    teamMemberId?: string | null;
    accountType?: string;
  }
}
