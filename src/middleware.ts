import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Detect org subdomain from hostname.
 *   nbca.localhost       → "nbca"
 *   nbca.memberwise.com  → "nbca"
 *   localhost / 127.0.0.1 → null
 */
function getSubdomainSlug(host: string): string | null {
  const hostname = host.split(":")[0];
  if (hostname === "localhost" || hostname === "127.0.0.1") return null;
  if (hostname.endsWith(".localhost")) {
    return hostname.replace(".localhost", "");
  }
  const parts = hostname.split(".");
  if (parts.length > 2) return parts[0];
  return null;
}

export default auth((req) => {
  const host = req.headers.get("host") || "";
  const slug = getSubdomainSlug(host);
  // Also support ?site=slug for easy local dev testing
  const siteParam = req.nextUrl.searchParams.get("site");
  const orgSlug = slug || siteParam;

  if (orgSlug) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-org-slug", orgSlug);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
