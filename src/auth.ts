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
          // Normalize: lowercase + trim to handle email whitespace / case mismatch
          const email = profile?.email?.toLowerCase().trim();

          const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
            // 1. Find by googleId (primary — Google account already linked)
            let dbUser = await tx.user.findUnique({
              where: { googleId: account.providerAccountId },
            });

            // 2. Fallback: find by email if googleId miss
            //    (covers pre-created users who linked their Google account)
            if (!dbUser && email) {
              dbUser = await tx.user.findUnique({ where: { email } });
            }

            // 3. Resolve TeamMember
            // Priority: invite cookie (specific memberId) > email match (fallback)
            let teamMemberId: string | null = null;
            let accountType = "customer";

            if (email) {
              // Primary: check invite cookie — exact memberId match
              // The invite token guarantees this OAuth email belongs to this member
              // Note: NextAuth jwt() callback doesn't have cookie access directly.
              // We read the email from the OAuth profile instead.
              // Since google-callback is the final arbiter, auth.ts handles the
              // email-match fallback which covers both invite and pre-created cases.

              // Fallback: match by email (pre-created members without invite)
              const teamMember = await tx.teamMember.findFirst({
                where: {
                  email: { equals: email, mode: "insensitive" },
                  isActive: true,
                },
                select: { id: true },
              });
              if (teamMember) {
                teamMemberId = teamMember.id;
                accountType = "staff";
              }
            }

            // ──────────────────────────────────────────────────────────────────
            // CASE A: No existing User → CREATE one
            // ──────────────────────────────────────────────────────────────────
            if (!dbUser && email) {
              dbUser = await tx.user.create({
                data: {
                  email,
                  name: user?.name || profile?.name || "Google User",
                  googleId: account.providerAccountId,
                  avatar: (profile?.image as string) || (user?.image as string) || null,
                  role: "user",
                  accountType,
                  teamMemberId,
                  // Staff users from TeamMember are pre-approved → onboarded immediately
                  isOnboarded: accountType === "staff",
                  loginCount: 1,
                  lastLogin: new Date(),
                },
              });
            }
            // ──────────────────────────────────────────────────────────────────
            // CASE B: Existing User found → UPDATE
            // ──────────────────────────────────────────────────────────────────
            else if (dbUser) {
              // 3a. Backfill googleId if missing (user created via other method first)
              if (!dbUser.googleId) {
                await tx.user.update({
                  where: { id: dbUser.id },
                  data: { googleId: account.providerAccountId },
                });
              }

              // 3b. Auto-link to TeamMember (HR pre-created member, now logging in for 1st time)
              if (!dbUser.teamMemberId && teamMemberId) {
                await tx.user.update({
                  where: { id: dbUser.id },
                  data: { teamMemberId, accountType: "staff" },
                });
                dbUser.teamMemberId = teamMemberId;
                dbUser.accountType = "staff";
              }

              // 3c. Promote existing customer → staff if email now matches TeamMember
              //     (HR added this member AFTER the user first logged in)
              else if (dbUser.accountType === "customer" && teamMemberId) {
                await tx.user.update({
                  where: { id: dbUser.id },
                  data: { teamMemberId, accountType: "staff", isOnboarded: true },
                });
                dbUser.teamMemberId = teamMemberId;
                dbUser.accountType = "staff";
                dbUser.isOnboarded = true;
              }

              // 3d. Track every login
              await tx.user.update({
                where: { id: dbUser.id },
                data: { loginCount: { increment: 1 }, lastLogin: new Date() },
              });
            }

            return dbUser;
          });

          if (result) {
            token.id = result.id;
            token.role = result.role ?? "member";
            token.teamMemberId = result.teamMemberId;
            token.accountType = result.accountType;
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
