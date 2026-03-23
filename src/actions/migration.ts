"use server";

import { auth } from "@/auth";

interface ExtractedPage {
  url: string;
  title: string;
  headings: string[];
  paragraphs: string[];
  images: string[];
  links: string[];
}

/**
 * Scrape a website URL and extract content (headings, text, images).
 * Scans the main page and up to 5 linked internal pages.
 */
export async function scrapeWebsiteContent(
  inputUrl: string
): Promise<{ pages: ExtractedPage[] } | { error: string }> {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { error: "Not authenticated" };
  }

  // Validate and normalize URL
  let baseUrl: URL;
  try {
    const normalized = inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`;
    baseUrl = new URL(normalized);
  } catch {
    return { error: "Invalid URL. Please enter a valid website address." };
  }

  const pages: ExtractedPage[] = [];
  const visited = new Set<string>();

  // Fetch and parse a single page
  async function fetchPage(url: string): Promise<ExtractedPage | null> {
    if (visited.has(url)) return null;
    visited.add(url);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Memberwise-Migration-Bot/1.0",
          Accept: "text/html",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) return null;

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) return null;

      const html = await res.text();
      return extractContent(url, html);
    } catch {
      return null;
    }
  }

  // Extract structured content from HTML
  function extractContent(url: string, html: string): ExtractedPage {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : "";

    // Extract headings (h1-h3)
    const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
    const headings: string[] = [];
    let match;
    while ((match = headingRegex.exec(html)) !== null) {
      const text = stripTags(match[1]).trim();
      if (text && text.length > 2 && text.length < 200) {
        headings.push(text);
      }
    }

    // Extract paragraphs
    const paraRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphs: string[] = [];
    while ((match = paraRegex.exec(html)) !== null) {
      const text = stripTags(match[1]).trim();
      if (text && text.length > 20 && text.length < 2000) {
        paragraphs.push(text);
      }
    }

    // Extract images
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images: string[] = [];
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1];
      if (src.startsWith("/")) {
        src = `${baseUrl.origin}${src}`;
      }
      if (src.startsWith("http") && !src.includes("data:") && !src.includes("tracking")) {
        images.push(src);
      }
    }

    // Extract internal links
    const linkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>/gi;
    const links: string[] = [];
    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith("/")) {
        href = `${baseUrl.origin}${href}`;
      }
      try {
        const linkUrl = new URL(href);
        if (linkUrl.hostname === baseUrl.hostname && !links.includes(href)) {
          links.push(href);
        }
      } catch {
        // Skip invalid URLs
      }
    }

    return { url, title, headings, paragraphs, images: images.slice(0, 20), links };
  }

  // Fetch main page
  const mainPage = await fetchPage(baseUrl.href);
  if (!mainPage) {
    return { error: "Could not fetch the website. Make sure the URL is correct and publicly accessible." };
  }
  pages.push(mainPage);

  // Fetch up to 5 internal linked pages
  const internalLinks = mainPage.links
    .filter((l) => l !== baseUrl.href && !l.includes("login") && !l.includes("logout") && !l.includes("admin"))
    .slice(0, 5);

  const linkedPages = await Promise.all(internalLinks.map((link) => fetchPage(link)));
  for (const page of linkedPages) {
    if (page && (page.headings.length > 0 || page.paragraphs.length > 0)) {
      pages.push(page);
    }
  }

  return { pages };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}
