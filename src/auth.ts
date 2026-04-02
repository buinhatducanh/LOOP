import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

// Validate critical env vars before NextAuth boots
function isBlank(v: string | undefined) {
  return !v || v.trim() === "";
}
const missing: string[] = [];
if (isBlank(process.env.AUTH_SECRET)) missing.push("AUTH_SECRET");
if (isBlank(process.env.DATABASE_URL)) missing.push("DATABASE_URL");
if (missing.length) {
  throw new Error(
    `[auth.ts] Missing required env vars: ${missing.join(", ")}\n` +
    `Make sure .env.local exists in the project root and restart: npm run dev`
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id as string;
      }

      // If signing in with Google, get or create user in database
      if (account?.provider === "google" && account?.providerAccountId) {
        try {
          const email = profile?.email?.toLowerCase();

          // Try to find existing user by googleId
          let dbUser = await prisma.user.findUnique({
            where: { googleId: account.providerAccountId },
          });

          // If no user by googleId, try email match (in case googleId was lost/recreated)
          if (!dbUser && email) {
            dbUser = await prisma.user.findUnique({
              where: { email },
            });
          }

          // Auto-link: check if this email belongs to a team member
          let teamMemberId: string | null = null;
          let accountType = "customer";

          if (email) {
            const teamMember = await prisma.teamMember.findFirst({
              where: {
                email: { mode: "insensitive", equals: email },
                isActive: true,
              },
              select: { id: true },
            });
            if (teamMember) {
              teamMemberId = teamMember.id;
              accountType = "staff";
            }
          }

          // If user doesn't exist, create them
          if (!dbUser && email) {
            dbUser = await prisma.user.create({
              data: {
                email,
                name: user?.name || profile?.name || "Google User",
                googleId: account.providerAccountId,
                avatar: (profile?.image as string) || (user?.image as string) || null,
                role: "user",
                accountType,
                teamMemberId,
              },
            });
          } else if (dbUser) {
            // Update googleId if missing
            if (!dbUser.googleId) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { googleId: account.providerAccountId },
              });
            }

            // Auto-link to team member if not already linked
            if (!dbUser.teamMemberId && teamMemberId) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { teamMemberId, accountType: "staff" },
              });
              dbUser.teamMemberId = teamMemberId;
              dbUser.accountType = "staff";
            }
          }

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.teamMemberId = dbUser.teamMemberId;
            token.accountType = dbUser.accountType;
          }
        } catch (error) {
          console.error("Error in Google auth:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // Attach team member ID and account type to session
        (session.user as any).teamMemberId = token.teamMemberId as string | null;
        (session.user as any).accountType = (token.accountType as string) || "customer";
      }
      return session;
    },
  },
  pages: {
    signIn: "/vi/dang-nhap",
  },
});
