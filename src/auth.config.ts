import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl, headers } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Subdomain requests are always public site pages — allow through
      const host = headers.get("host") || "";
      const hostname = host.split(":")[0];
      const isSubdomain =
        (hostname.endsWith(".localhost") && hostname !== "localhost") ||
        (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname.split(".").length > 2);
      if (isSubdomain) return true;

      // ?site= param is only for public site routes (not dashboard/auth/settings)
      const protectedPrefixes = ["/dashboard", "/members", "/contacts", "/tiers", "/billing", "/email", "/analytics", "/assets", "/settings", "/portal", "/onboarding", "/api", "/donations", "/documents", "/volunteers", "/committees", "/forms", "/reports", "/events", "/automations"];
      const hasSiteParam = nextUrl.searchParams.has("site");
      if (hasSiteParam && !protectedPrefixes.some((p) => path.startsWith(p))) return true;

      // Public routes
      const publicRoutes = ["/", "/pricing", "/features", "/about", "/contact"];
      if (publicRoutes.includes(path)) return true;

      // Auth routes (login, register, etc.) — redirect to dashboard if logged in
      const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
      if (authRoutes.some((r) => path.startsWith(r))) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Onboarding — requires login but no role check
      if (path.startsWith("/onboarding")) {
        return isLoggedIn;
      }

      // Dashboard routes — require OWNER, ADMIN, or STAFF
      if (path.startsWith("/dashboard") || path.startsWith("/members") || path.startsWith("/contacts") || path.startsWith("/tiers") || path.startsWith("/billing") || path.startsWith("/email") || path.startsWith("/analytics") || path.startsWith("/assets") || path.startsWith("/settings") || path.startsWith("/donations") || path.startsWith("/documents") || path.startsWith("/volunteers") || path.startsWith("/committees") || path.startsWith("/forms") || path.startsWith("/reports") || path.startsWith("/events") || path.startsWith("/automations")) {
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
