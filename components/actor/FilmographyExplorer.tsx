"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { FilmographyCredit, Genre } from "@/lib/api/types";

interface FilmographyExplorerProps {
  credits: FilmographyCredit[];
  genres?: Genre[];
  actorId?: string;
}

export function FilmographySkeleton() {
  return (
    <div className="mt-8 animate-pulse">
      <div className="h-7 w-36 bg-theme-surface-subtle rounded mb-4" />
      <div className="h-10 w-full bg-theme-surface-subtle rounded mb-4" />
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

export default function FilmographyExplorer({
  credits,
  genres = [],
  actorId,
}: FilmographyExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentRef = useRef<HTMLDivElement | null>(null);

  // Initialize state from URL search params
  const initialRole = searchParams.get("role") || "all";
  const initialYear = searchParams.get("year") || "all";
  const initialGenres = searchParams.get("genres")
    ? searchParams.get("genres")!.split(",").map(Number).filter(Boolean)
    : [];
  const initialSort = searchParams.get("sort") || "year_desc";

  const [roleFilter, setRoleFilter] = useState<string>(initialRole);
  const [yearFilter, setYearFilter] = useState<string>(initialYear);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>(initialGenres);
  const [sortBy, setSortBy] = useState<string>(initialSort);

  // Map genre ID to genre name
  const _genreMap = useMemo(() => {
    const map = new Map<number, string>();
    genres.forEach((g) => map.set(g.id, g.name));
    return map;
  }, [genres]);

  // Distinct available years sorted descending
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    credits.forEach((c) => {
      if (c.year && c.year.length === 4) years.add(c.year);
    });
    return Array.from(years).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
  }, [credits]);

  // Distinct genres present in this actor's credits
  const relevantGenres = useMemo(() => {
    const idSet = new Set<number>();
    credits.forEach((c) => {
      c.genreIds?.forEach((gid) => idSet.add(gid));
    });
    return genres.filter((g) => idSet.has(g.id));
  }, [credits, genres]);

  // Sync state changes to URL query params
  const updateUrl = (
    newRole: string,
    newYear: string,
    newGenres: number[],
    newSort: string
  ) => {
    const params = new URLSearchParams();
    if (newRole !== "all") params.set("role", newRole);
    if (newYear !== "all") params.set("year", newYear);
    if (newGenres.length > 0) params.set("genres", newGenres.join(","));
    if (newSort !== "year_desc") params.set("sort", newSort);

    const queryString = params.toString();
    const pathname = actorId ? `/actor/${actorId}` : "";
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const handleRoleChange = (role: string) => {
    setRoleFilter(role);
    updateUrl(role, yearFilter, selectedGenreIds, sortBy);
  };

  const handleYearChange = (year: string) => {
    setYearFilter(year);
    updateUrl(roleFilter, year, selectedGenreIds, sortBy);
  };

  const toggleGenre = (genreId: number) => {
    const next = selectedGenreIds.includes(genreId)
      ? selectedGenreIds.filter((id) => id !== genreId)
      : [...selectedGenreIds, genreId];
    setSelectedGenreIds(next);
    updateUrl(roleFilter, yearFilter, next, sortBy);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateUrl(roleFilter, yearFilter, selectedGenreIds, sort);
  };

  const handleClearFilters = () => {
    setRoleFilter("all");
    setYearFilter("all");
    setSelectedGenreIds([]);
    setSortBy("year_desc");
    updateUrl("all", "all", [], "year_desc");
  };

  // Filter and sort items
  const filteredCredits = useMemo(() => {
    return credits
      .filter((credit) => {
        // Role filter
        if (roleFilter === "cast" && credit.department !== "Cast") return false;
        if (roleFilter === "crew" && credit.department === "Cast") return false;

        // Year filter
        if (yearFilter !== "all" && credit.year !== yearFilter) return false;

        // Genre multi-select filter (must match at least one selected genre if any are selected)
        if (selectedGenreIds.length > 0) {
          const hasMatch = selectedGenreIds.some((gid) =>
            credit.genreIds?.includes(gid)
          );
          if (!hasMatch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "year_asc") {
          return parseInt(a.year || "0", 10) - parseInt(b.year || "0", 10);
        }
        if (sortBy === "popularity_desc") {
          return (b.popularity || 0) - (a.popularity || 0);
        }
        if (sortBy === "rating_desc") {
          return (b.rating || 0) - (a.rating || 0);
        }
        // default: year_desc
        return parseInt(b.year || "0", 10) - parseInt(a.year || "0", 10);
      });
  }, [credits, roleFilter, yearFilter, selectedGenreIds, sortBy]);

  const rowVirtualizer = useVirtualizer({
    count: filteredCredits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
    initialRect: { width: 800, height: 480 },
  });

  if (credits.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="text-xl sm:text-2xl font-bold text-theme-fg mb-4">
          Filmography
        </h2>
        <div className="p-8 rounded-xl bg-theme-surface border border-theme-border text-center text-theme-fg-muted text-sm">
          No filmography records found for this person.
        </div>
      </section>
    );
  }

  const isFiltered =
    roleFilter !== "all" ||
    yearFilter !== "all" ||
    selectedGenreIds.length > 0 ||
    sortBy !== "year_desc";

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-theme-fg">
          Filmography
        </h2>
        <span className="text-xs text-theme-fg-muted">
          Showing {filteredCredits.length} of {credits.length} {credits.length === 1 ? "credit" : "credits"}
        </span>
      </div>

      {/* Filter and Sort Controls Bar */}
      <div className="p-4 rounded-xl bg-theme-surface border border-theme-border mb-4 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-theme-surface-subtle border border-theme-border text-xs">
            {["all", "cast", "crew"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                aria-pressed={roleFilter === r}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
                  roleFilter === r
                    ? "bg-theme-accent text-zinc-950 font-semibold shadow-xs"
                    : "text-theme-fg-muted hover:text-theme-fg"
                }`}
              >
                {r === "all" ? "All Roles" : r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Year Filter Dropdown */}
            <label className="sr-only" htmlFor="year-select">Filter by Year</label>
            <select
              id="year-select"
              aria-label="Filter by Year"
              value={yearFilter}
              onChange={(e) => handleYearChange(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-theme-surface-subtle border border-theme-border text-theme-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Sort Control Dropdown */}
            <label className="sr-only" htmlFor="sort-select">Sort credits</label>
            <select
              id="sort-select"
              aria-label="Sort credits"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-theme-surface-subtle border border-theme-border text-theme-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
            >
              <option value="year_desc">Year (Newest)</option>
              <option value="year_asc">Year (Oldest)</option>
              <option value="popularity_desc">Popularity</option>
              <option value="rating_desc">Highest Rated</option>
            </select>

            {/* Clear All Filters Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs px-2.5 py-1.5 rounded-lg text-theme-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Multi-Select Genre Chips */}
        {relevantGenres.length > 0 && (
          <div className="pt-2 border-t border-theme-border/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-fg-muted mb-2 block">
              Filter by Genre:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {relevantGenres.map((genre) => {
                const isSelected = selectedGenreIds.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => toggleGenre(genre.id)}
                    aria-pressed={isSelected}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
                      isSelected
                        ? "bg-theme-accent text-zinc-950 font-semibold border-theme-accent"
                        : "bg-theme-surface-subtle text-theme-fg-muted border-theme-border hover:border-theme-primary/60 hover:text-theme-fg"
                    }`}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Virtualized Filmography List */}
      {filteredCredits.length === 0 ? (
        <div className="p-8 rounded-xl bg-theme-surface border border-theme-border text-center text-theme-fg-muted text-sm">
          No matching credits found with the selected filters.
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
              const credit = filteredCredits[virtualRow.index];
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
                      {credit.role}{" "}
                      {credit.department && credit.department !== "Cast" && `(${credit.department})`}
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
