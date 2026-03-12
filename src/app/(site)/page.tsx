import { headers } from "next/headers";
import { getSiteDoc } from "./get-site-doc";
import { SitePageRenderer } from "@/components/templates/page-renderer";
import { MarketingHome } from "@/components/marketing/home";

export default async function HomePage() {
  const headersList = await headers();
  const orgSlug = headersList.get("x-org-slug");

  // No org slug — show the MemberWise marketing page
  if (!orgSlug) {
    return <MarketingHome />;
  }

  // Org slug present — render the customer's landing page
  const doc = await getSiteDoc();
  const page = doc?.pages.find((p) => p.slug === "landing");

  if (page) {
    return <SitePageRenderer page={page} />;
  }

  // No site document yet
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Site Coming Soon</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">
          This organization hasn&apos;t published their website yet.
        </p>
      </div>
    </div>
  );
}
