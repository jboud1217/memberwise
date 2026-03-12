import { Star } from "lucide-react";

interface Review {
  author: string;
  rating: number;
  text: string;
  date?: string;
}

interface GoogleReviewsSectionProps {
  heading?: string;
  placeId?: string;
  embedCode?: string;
  reviews?: Review[];
  overallRating?: string;
  totalReviews?: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-[var(--muted)] text-[var(--muted)]"
          }`}
        />
      ))}
    </div>
  );
}

export function GoogleReviewsSection({
  heading,
  embedCode,
  reviews = [],
  overallRating,
  totalReviews,
}: GoogleReviewsSectionProps) {
  if (embedCode) {
    return (
      <section className="py-16 px-6">
        <div className="mx-auto max-w-4xl">
          {heading && (
            <h2 className="mb-8 text-center text-3xl font-bold text-[var(--foreground)]">
              {heading}
            </h2>
          )}
          <div dangerouslySetInnerHTML={{ __html: embedCode }} />
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        {heading && (
          <h2 className="mb-4 text-center text-3xl font-bold text-[var(--foreground)]">
            {heading}
          </h2>
        )}
        {overallRating && (
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-[var(--foreground)]">{overallRating}</span>
            <div>
              <StarRating rating={Math.round(parseFloat(overallRating))} />
              {totalReviews && (
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  Based on {totalReviews} reviews
                </p>
              )}
            </div>
          </div>
        )}
        {reviews.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => (
              <div
                key={i}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-5"
              >
                <StarRating rating={review.rating} />
                <p className="mt-3 text-sm text-[var(--card-foreground)]">{review.text}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--foreground)]">{review.author}</span>
                  {review.date && (
                    <span className="text-[10px] text-[var(--muted-foreground)]">{review.date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--muted)] p-12 text-center">
            <Star className="h-8 w-8 text-yellow-400 mb-2" />
            <p className="text-sm text-[var(--muted-foreground)]">
              Add your Google Place ID or paste reviews manually
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
