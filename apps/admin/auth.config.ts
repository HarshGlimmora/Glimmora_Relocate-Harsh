import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/sign-in", error: "/sign-in" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnApp = nextUrl.pathname.startsWith("/app");
      const isOnAuth = nextUrl.pathname.startsWith("/sign-in");

      if (isOnApp) return isLoggedIn;
      if (isOnAuth && isLoggedIn) return Response.redirect(new URL("/app", nextUrl));
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as { role?: string }).role ?? "OPS";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
