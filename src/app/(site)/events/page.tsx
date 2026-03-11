import { getSiteDoc } from "../get-site-doc";
import { SitePageRenderer } from "@/components/templates/page-renderer";

export default async function EventsPage() {
  const doc = await getSiteDoc();
  const page = doc?.pages.find((p) => p.slug === "events");
  if (!page) return null;

  return <SitePageRenderer page={page} />;
}
