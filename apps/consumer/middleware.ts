import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run auth middleware on every route except static assets + API
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|grain.svg|fonts).*)"],
};
