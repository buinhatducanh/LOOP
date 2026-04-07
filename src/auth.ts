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

      // If signing in with Google, get or create user in a SINGLE transaction
      if (account?.provider === "google" && account?.providerAccountId) {
        try {
          const email = profile?.email?.toLowerCase();

          // Single transaction: find + update/create in one roundtrip to Neon
          const result = await prisma.$transaction(async (tx) => {
            // 1. Find by googleId
            let dbUser = await tx.user.findUnique({
              where: { googleId: account.providerAccountId },
            });

            // 2. Fallback: find by email if googleId miss
            if (!dbUser && email) {
              dbUser = await tx.user.findUnique({ where: { email } });
            }

            // 3. Check team member email match (parallel, non-blocking reads)
            let teamMemberId: string | null = null;
            let accountType = "customer";

            if (email) {
              const teamMember = await tx.teamMember.findFirst({
                where: { email: { mode: "insensitive", equals: email }, isActive: true },
                select: { id: true },
              });
              if (teamMember) {
                teamMemberId = teamMember.id;
                accountType = "staff";
              }
            }

            if (!dbUser && email) {
              // 4a. Create new user (customer onboarding: isOnboarded=false, loginCount=1)
              dbUser = await tx.user.create({
                data: {
                  email,
                  name: user?.name || profile?.name || "Google User",
                  googleId: account.providerAccountId,
                  avatar: (profile?.image as string) || (user?.image as string) || null,
                  role: "user",
                  accountType,
                  teamMemberId,
                  isOnboarded: false,
                  loginCount: 1,
                  lastLogin: new Date(),
                },
              });
            } else if (dbUser) {
              // 4b. Backfill googleId if missing
              if (!dbUser.googleId) {
                await tx.user.update({ where: { id: dbUser.id }, data: { googleId: account.providerAccountId } });
              }
              // 4c. Auto-link to team member
              if (!dbUser.teamMemberId && teamMemberId) {
                await tx.user.update({ where: { id: dbUser.id }, data: { teamMemberId, accountType: "staff" } });
                dbUser.teamMemberId = teamMemberId;
                dbUser.accountType = "staff";
              }
              // 4d. Track every Google login
              await tx.user.update({
                where: { id: dbUser.id },
                data: {
                  loginCount: { increment: 1 },
                  lastLogin: new Date(),
                },
              });
            }

            return dbUser;
          });

          if (result) {
            token.id = result.id;
            token.role = result.role;
            token.teamMemberId = result.teamMemberId;
            token.accountType = result.accountType;
            // Expose isOnboarded on JWT token for downstream use
            (token as Record<string, unknown>).isOnboarded = result.isOnboarded ?? false;
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
        session.user.teamMemberId = (token.teamMemberId as string | null) ?? undefined;
        session.user.accountType = ((token.accountType as string) || "customer") as "staff" | "customer";
      }
      return session;
    },
  },
  pages: {
    signIn: "/vi/dang-nhap",
  },
});
