import { getSiteDoc } from "../get-site-doc";
import { SitePageRenderer } from "@/components/templates/page-renderer";
import { notFound } from "next/navigation";

export default async function DynamicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getSiteDoc();
  const page = doc?.pages.find((p) => p.slug === slug);

  if (!page) notFound();

  return <SitePageRenderer page={page} />;
}
