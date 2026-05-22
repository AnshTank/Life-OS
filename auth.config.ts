import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
        },
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute = nextUrl.pathname === "/";
      const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuthRoute) return true;

      if (isLoggedIn) {
        if (isPublicRoute || isAuthRoute) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      } else {
        if (!isPublicRoute && !isAuthRoute && !isApiAuthRoute) {
          return false; // Redirect to login
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
