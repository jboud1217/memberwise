interface RichTextSectionProps {
  heading?: string;
  content?: string; // HTML string
}

export function RichTextSection({ heading, content }: RichTextSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-3xl">
        {heading && (
          <h2 className="mb-8 text-3xl font-bold text-[var(--foreground)]">
            {heading}
          </h2>
        )}
        {content ? (
          <div
            className="prose prose-lg max-w-none text-[var(--foreground)] prose-headings:text-[var(--foreground)] prose-p:text-[var(--muted-foreground)] prose-a:text-[var(--primary)] prose-strong:text-[var(--foreground)] prose-ul:text-[var(--muted-foreground)] prose-ol:text-[var(--muted-foreground)] prose-blockquote:border-[var(--primary)] prose-blockquote:text-[var(--muted-foreground)]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)] p-12 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">Add your content here...</p>
          </div>
        )}
      </div>
    </section>
  );
}
