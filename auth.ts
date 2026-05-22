import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          if (!prisma) {
            console.error("Prisma client is undefined in authorize");
            return null;
          }

          if (!(prisma as any).user) {
            console.error("prisma.user is undefined. Available models:", Object.keys(prisma).filter(k => !k.startsWith('_')));
            return null;
          }

          const user = await (prisma as any).user.findUnique({
            where: { email: credentials.email as string }
          });

          if (!user || user.password !== credentials.password) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      }
    }),
  ],
});
