import { baseApi } from "@/api";
import { User } from "@/types/user";
import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, account, trigger }) {
      if (trigger === "signIn" || trigger === "signUp") {
        const res = await baseApi.post("users/signin", {
          json: {
            name: token.name,
            email: token.email,
          },
        });
        const data = await res.json<{ message: string; user: User }>();
        token.user = data.user;
      }
      if (account && account.id_token) {
        token.accessToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.user && token.accessToken) {
        return {
          ...session,
          user: token.user,
          accessToken: token.accessToken,
        };
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthOptions;

export const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
