import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Public routes
      const publicRoutes = ["/", "/pricing", "/features", "/about"];
      if (publicRoutes.includes(path)) return true;

      // Auth routes (login, register, etc.) — redirect to dashboard if logged in
      const authRoutes = ["/login", "/register", "/forgot-password"];
      if (authRoutes.some((r) => path.startsWith(r))) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Dashboard routes — require OWNER, ADMIN, or STAFF
      if (path.startsWith("/dashboard") || path.startsWith("/members") || path.startsWith("/contacts") || path.startsWith("/tiers") || path.startsWith("/billing") || path.startsWith("/email") || path.startsWith("/analytics") || path.startsWith("/settings")) {
        if (!isLoggedIn) return false;
        const role = auth?.user?.role;
        return role === "OWNER" || role === "ADMIN" || role === "STAFF";
      }

      // Portal routes — require any authenticated user
      if (path.startsWith("/portal")) {
        return isLoggedIn;
      }

      // API routes — handled by individual route handlers
      if (path.startsWith("/api")) return true;

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.organizationSlug = user.organizationSlug;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationSlug = token.organizationSlug as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
