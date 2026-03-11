import { getSiteDoc } from "../get-site-doc";
import { SitePageRenderer } from "@/components/templates/page-renderer";

export default async function AboutPage() {
  const doc = await getSiteDoc();
  const page = doc?.pages.find((p) => p.slug === "about");
  if (!page) return null;

  return <SitePageRenderer page={page} />;
}
