import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getCachedPerson,
  getCachedPersonCredits,
  getCachedPopularPeople,
  getCachedGenres,
} from "@/lib/api/cached";
import FilmographyExplorer, {
  FilmographySkeleton,
} from "@/components/actor/FilmographyExplorer";

interface ActorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  try {
    const popular = await getCachedPopularPeople();
    if (popular.length > 0) {
      return popular.map((p) => ({ id: p.id }));
    }
  } catch {
    // Ignore build error during static generation fallback
  }
  return [];
}

export async function generateMetadata({
  params,
}: ActorPageProps): Promise<Metadata> {
  const { id } = await params;
  const person = await getCachedPerson(id);

  if (!person) {
    return {
      title: "Actor Not Found | IMDb Clone",
      description: "The requested actor or crew profile could not be found.",
    };
  }

  const title = `${person.name} - IMDb Clone`;
  const description = person.biography
    ? person.biography.slice(0, 160)
    : `Explore the biography and filmography for ${person.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: person.profileUrl ? [{ url: person.profileUrl, alt: person.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: person.profileUrl ? [person.profileUrl] : [],
    },
  };
}

export default async function ActorPage({ params }: ActorPageProps) {
  const { id } = await params;

  // Start person details, filmography credits, and genres fetches in parallel
  const personPromise = getCachedPerson(id);
  const creditsPromise = getCachedPersonCredits(id);
  const genresPromise = getCachedGenres();

  const [person, credits, genres] = await Promise.all([
    personPromise,
    creditsPromise,
    genresPromise,
  ]);

  if (!person) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-theme-fg-muted hover:text-theme-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring rounded"
        >
          <span>&larr; Back to list</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Headshot */}
        <div className="relative w-full md:w-64 aspect-[2/3] bg-theme-surface border border-theme-border rounded-xl overflow-hidden shrink-0 shadow-md">
          <Image
            src={person.profileUrl || "/placeholder-poster.svg"}
            alt={person.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 256px"
            className="object-cover"
          />
        </div>

        {/* Details & Biography */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-theme-fg mb-2">
              {person.name}
            </h1>

            {/* Metadata Pills */}
            <div className="flex flex-wrap gap-2 text-xs font-medium text-theme-fg-muted">
              {person.knownFor && (
                <span className="px-2.5 py-1 rounded-full bg-theme-surface-subtle text-theme-fg border border-theme-border">
                  {person.knownFor}
                </span>
              )}
              {person.birthday && (
                <span className="px-2.5 py-1 rounded-full bg-theme-surface-subtle text-theme-fg-muted border border-theme-border">
                  Born: {person.birthday}
                </span>
              )}
              {person.placeOfBirth && (
                <span className="px-2.5 py-1 rounded-full bg-theme-surface-subtle text-theme-fg-muted border border-theme-border">
                  {person.placeOfBirth}
                </span>
              )}
            </div>
          </div>

          {/* Biography */}
          <div className="mt-2">
            <h2 className="text-base sm:text-lg font-semibold text-theme-fg mb-2">
              Biography
            </h2>
            <div className="text-sm sm:text-base text-theme-fg-muted leading-relaxed whitespace-pre-line space-y-3">
              {person.biography || "No biography available for this person."}
            </div>
          </div>
        </div>
      </div>

      {/* Virtualized Filmography Explorer */}
      <Suspense fallback={<FilmographySkeleton />}>
        <FilmographyExplorer credits={credits} genres={genres} actorId={id} />
      </Suspense>
    </div>
  );
}
