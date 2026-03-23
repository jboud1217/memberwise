import DOMPurify from "dompurify";

// Server-side compatible sanitization
export function sanitizeHtml(html: string): string {
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target"],
    });
  }
  // On server, strip obvious script tags as a basic protection
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "");
}
