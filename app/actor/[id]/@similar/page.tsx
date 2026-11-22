import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getCachedSimilarActors } from "@/lib/api/cached";

interface SimilarSlotProps {
  params: Promise<{ id: string }>;
}

export default async function SimilarSlot({ params }: SimilarSlotProps) {
  const { id } = await params;
  const similarActors = await getCachedSimilarActors(id);

  return (
    <div className="p-5 rounded-xl bg-theme-surface border border-theme-border shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 id="similar-heading" className="text-lg font-bold text-theme-fg">
            Frequent Co-Stars & Collaborators
          </h2>
          <p className="text-xs text-theme-fg-muted">
            Actors and performers who have frequently appeared alongside this talent in top shared credits.
          </p>
        </div>
        <span className="text-xs text-theme-fg-muted font-mono">
          {similarActors.length} {similarActors.length === 1 ? "artist" : "artists"}
        </span>
      </div>

      {similarActors.length === 0 ? (
        <div className="p-6 rounded-lg bg-theme-surface-subtle border border-theme-border text-center text-xs text-theme-fg-muted italic">
          No frequent co-stars found for this profile.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {similarActors.map((actor) => (
            <Link
              key={actor.id}
              href={`/actor/${actor.id}`}
              className="group p-2 rounded-xl bg-theme-surface-subtle border border-theme-border hover:border-theme-primary transition-all flex flex-col items-center text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-theme-surface border border-theme-border mb-2 shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src={actor.profileUrl || "/placeholder-poster.svg"}
                  alt={actor.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <p className="text-xs font-semibold text-theme-fg line-clamp-1 group-hover:text-theme-primary transition-colors">
                {actor.name}
              </p>
              <p className="text-[11px] text-theme-fg-muted line-clamp-1 mt-0.5">
                {actor.character || "Frequent Co-Star"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
