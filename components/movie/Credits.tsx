import Image from "next/image";
import { CastMember } from "@/lib/api/types";

export function CreditsSkeleton() {
  return (
    <div className="mt-12 animate-pulse">
      <div className="h-7 w-44 bg-theme-surface-subtle rounded mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-lg bg-theme-surface border border-theme-border overflow-hidden"
          >
            <div className="aspect-[2/3] w-full bg-theme-surface-subtle" />
            <div className="p-3 flex flex-col gap-2">
              <div className="h-4 w-3/4 bg-theme-surface-subtle rounded" />
              <div className="h-3 w-1/2 bg-theme-surface-subtle rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function Credits({
  promise,
}: {
  promise: Promise<CastMember[]>;
}) {
  const cast = await promise;

  if (!cast || cast.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl sm:text-2xl font-bold text-theme-fg mb-6">
        Top Billed Cast
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {cast.map((member) => (
          <div
            key={member.id}
            className="flex flex-col rounded-lg bg-theme-surface border border-theme-border overflow-hidden shadow-sm hover:border-theme-primary/50 transition-colors"
          >
            <div className="relative aspect-[2/3] w-full bg-theme-surface-subtle">
              {member.profileUrl ? (
                <Image
                  src={member.profileUrl}
                  alt={member.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-theme-fg-muted text-xs">
                  No Photo
                </div>
              )}
            </div>
            <div className="p-3 flex flex-col justify-between flex-1">
              <p className="font-semibold text-sm text-theme-fg line-clamp-1">
                {member.name}
              </p>
              <p className="text-xs text-theme-fg-muted line-clamp-1 mt-0.5">
                {member.character || "Cast"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
