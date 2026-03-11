import { getSiteDoc } from "../get-site-doc";
import { SitePageRenderer } from "@/components/templates/page-renderer";

export default async function ContactPage() {
  const doc = await getSiteDoc();
  const page = doc?.pages.find((p) => p.slug === "contact");
  if (!page) return null;

  return <SitePageRenderer page={page} />;
}
