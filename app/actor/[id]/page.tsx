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
  getCachedPersonExternalIds,
} from "@/lib/api/cached";
import FilmographyExplorer, {
  FilmographySkeleton,
} from "@/components/actor/FilmographyExplorer";
import LocaleSwitcher from "@/components/actor/LocaleSwitcher";
import { getDictionary } from "@/lib/i18n/translations";

interface ActorPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ locale?: string }>;
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

export default async function ActorPage({
  params,
  searchParams,
}: ActorPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const locale = resolvedSearchParams.locale || "en";
  const t = getDictionary(locale);

  // Start person details, filmography credits, genres, and external IDs fetches in parallel
  const personPromise = getCachedPerson(id);
  const creditsPromise = getCachedPersonCredits(id);
  const genresPromise = getCachedGenres();
  const externalIdsPromise = getCachedPersonExternalIds(id);

  const [person, credits, genres, externalIds] = await Promise.all([
    personPromise,
    creditsPromise,
    genresPromise,
    externalIdsPromise,
  ]);

  if (!person) {
    notFound();
  }

  // Build Person JSON-LD with social and sameAs links
  const sameAsLinks: string[] = [];
  if (externalIds?.imdbId) sameAsLinks.push(`https://www.imdb.com/name/${externalIds.imdbId}`);
  if (externalIds?.instagramId) sameAsLinks.push(`https://instagram.com/${externalIds.instagramId}`);
  if (externalIds?.twitterId) sameAsLinks.push(`https://twitter.com/${externalIds.twitterId}`);
  if (externalIds?.facebookId) sameAsLinks.push(`https://facebook.com/${externalIds.facebookId}`);
  if (externalIds?.wikidataId) sameAsLinks.push(`https://www.wikidata.org/wiki/${externalIds.wikidataId}`);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    alternateName: person.alsoKnownAs && person.alsoKnownAs.length > 0 ? person.alsoKnownAs : undefined,
    image: person.profileUrl || undefined,
    description: person.biography || undefined,
    birthDate: person.birthday || undefined,
    birthPlace: person.placeOfBirth
      ? {
          "@type": "Place",
          name: person.placeOfBirth,
        }
      : undefined,
    jobTitle: person.knownFor || "Actor",
    sameAs: sameAsLinks.length > 0 ? sameAsLinks : undefined,
  };

  return (
    <div className="space-y-6">
      {/* Structured JSON-LD Script Block for Search Engines & Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      {/* Top action bar: Back button + Language Switcher */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-theme-fg-muted hover:text-theme-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring rounded"
        >
          <span>&larr; {t.backToList}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-theme-fg-muted">{t.switchLanguage}:</span>
          <LocaleSwitcher currentLocale={locale} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Headshot */}
        <div className="relative w-full md:w-64 aspect-[2/3] bg-theme-surface border border-theme-border rounded-xl overflow-hidden shrink-0 shadow-md">
          <Image
            src={person.profileUrl || "/placeholder-poster.svg"}
            alt={person.name}
            fill
            priority
            fetchPriority="high"
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
                  {t.born}: {person.birthday}
                </span>
              )}
              {person.placeOfBirth && (
                <span className="px-2.5 py-1 rounded-full bg-theme-surface-subtle text-theme-fg-muted border border-theme-border">
                  {person.placeOfBirth}
                </span>
              )}
            </div>

            {/* Also Known As (Alternate Names) */}
            {person.alsoKnownAs && person.alsoKnownAs.length > 0 && (
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-theme-fg-muted uppercase tracking-wider block mb-1.5">
                  {t.alsoKnownAs}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {person.alsoKnownAs.slice(0, 6).map((alias) => (
                    <span
                      key={alias}
                      className="text-xs px-2.5 py-0.5 rounded-md bg-theme-surface-subtle border border-theme-border text-theme-fg"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Biography */}
          <div className="mt-2">
            <h2 className="text-base sm:text-lg font-semibold text-theme-fg mb-2">
              {t.biography}
            </h2>
            <div className="text-sm sm:text-base text-theme-fg-muted leading-relaxed whitespace-pre-line space-y-3">
              {person.biography || t.noBiography}
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
