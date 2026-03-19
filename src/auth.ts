import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        token.id = user.id;
      }
      // If signing in with Google, get or create user in database
      if (account?.provider === "google" && account?.providerAccountId) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { googleId: account.providerAccountId },
          });

          // If user doesn't exist, create them
          if (!dbUser && profile?.email) {
            dbUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: user?.name || profile?.name || "Google User",
                googleId: account.providerAccountId,
                avatar: profile?.image || user?.image || null,
                role: "user",
              },
            });
          }

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
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
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
