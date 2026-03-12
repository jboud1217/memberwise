import { User } from "lucide-react";

interface TeamMember {
  name: string;
  role?: string;
  bio?: string;
  image?: string;
}

interface TeamSectionProps {
  heading?: string;
  subheading?: string;
  columns?: 2 | 3 | 4;
  members?: TeamMember[];
}

export function TeamSection({
  heading,
  subheading,
  columns = 3,
  members = [],
}: TeamSectionProps) {
  const gridCols =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
      ? "sm:grid-cols-2"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-6xl">
        {heading && (
          <h2 className="mb-3 text-center text-3xl font-bold text-[var(--foreground)]">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="mb-10 text-center text-lg text-[var(--muted-foreground)]">
            {subheading}
          </p>
        )}
        <div className={`grid gap-8 ${gridCols}`}>
          {members.map((member, i) => (
            <div key={i} className="text-center">
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="mx-auto h-32 w-32 rounded-full object-cover border-2 border-[var(--border)]"
                />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-[var(--muted)] border-2 border-[var(--border)]">
                  <User className="h-12 w-12 text-[var(--muted-foreground)]/40" />
                </div>
              )}
              <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
                {member.name}
              </h3>
              {member.role && (
                <p className="mt-0.5 text-sm font-medium text-[var(--primary)]">
                  {member.role}
                </p>
              )}
              {member.bio && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  {member.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
