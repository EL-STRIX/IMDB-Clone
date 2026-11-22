"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FilmographyCredit } from "@/lib/api/types";

interface FilmographyExplorerProps {
  credits: FilmographyCredit[];
}

export function FilmographySkeleton() {
  return (
    <div className="mt-8 animate-pulse">
      <div className="h-7 w-36 bg-theme-surface-subtle rounded mb-4" />
      <div className="h-[460px] rounded-xl bg-theme-surface border border-theme-border p-4 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-theme-border/50">
            <div className="w-12 h-16 rounded bg-theme-surface-subtle shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-48 bg-theme-surface-subtle rounded" />
              <div className="h-3 w-32 bg-theme-surface-subtle rounded" />
            </div>
            <div className="h-4 w-12 bg-theme-surface-subtle rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FilmographyExplorer({ credits }: FilmographyExplorerProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: credits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
    initialRect: { width: 800, height: 480 },
  });

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-theme-fg">
          Filmography
        </h2>
        <span className="text-xs text-theme-fg-muted">
          {credits.length} {credits.length === 1 ? "title" : "titles"}
        </span>
      </div>

      {credits.length === 0 ? (
        <div className="p-8 rounded-xl bg-theme-surface border border-theme-border text-center text-theme-fg-muted text-sm">
          No filmography records found for this person.
        </div>
      ) : (
        <div
          ref={parentRef}
          role="region"
          aria-label="Virtualized filmography list"
          tabIndex={0}
          className="h-[480px] overflow-y-auto rounded-xl border border-theme-border bg-theme-surface shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const credit = credits[virtualRow.index];
              return (
                <div
                  key={`${credit.id}-${virtualRow.index}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="px-4 py-2 flex items-center gap-3 border-b border-theme-border/50 hover:bg-theme-surface-subtle/50 transition-colors"
                >
                  {/* Thumbnail Poster */}
                  <Link
                    href={`/movie/${credit.id}`}
                    className="relative w-11 h-15 rounded overflow-hidden bg-theme-surface-subtle shrink-0 border border-theme-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
                    tabIndex={-1}
                  >
                    <Image
                      src={credit.posterUrl || "/placeholder-poster.svg"}
                      alt={credit.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </Link>

                  {/* Title and Role */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/movie/${credit.id}`}
                      className="font-semibold text-sm text-theme-fg hover:text-theme-primary transition-colors line-clamp-1 focus-visible:outline-none focus-visible:underline"
                    >
                      {credit.title}
                    </Link>
                    <p className="text-xs text-theme-fg-muted line-clamp-1 mt-0.5">
                      {credit.role} {credit.department && credit.department !== "Cast" && `(${credit.department})`}
                    </p>
                  </div>

                  {/* Year & Rating */}
                  <div className="flex items-center gap-2.5 shrink-0 text-right">
                    {credit.rating && credit.rating > 0 ? (
                      <span className="text-xs font-semibold text-theme-primary">
                        ★ {credit.rating.toFixed(1)}
                      </span>
                    ) : null}
                    <span className="text-xs text-theme-fg-muted min-w-[36px] font-mono">
                      {credit.year || "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
