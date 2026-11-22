export interface Movie {
  id: string;
  title: string;
  posterUrl: string | null;
  rating: number;
  releaseDate?: string;
  year?: string;
}

export interface MovieDetails {
  id: string;
  title: string;
  posterUrl: string | null;
  overview: string;
  releaseDate: string;
  genres: string[];
  runtime: number; // minutes
  rating: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Person {
  id: string;
  name: string;
  profileUrl: string | null;
  knownFor?: string;
  biography?: string;
  birthday?: string;
  placeOfBirth?: string;
  popularity?: number;
  alsoKnownAs?: string[];
}

export interface PersonExternalIds {
  imdbId?: string | null;
  facebookId?: string | null;
  instagramId?: string | null;
  twitterId?: string | null;
  tiktokId?: string | null;
  youtubeId?: string | null;
  wikidataId?: string | null;
}

export interface AwardItem {
  id: string;
  event: string;
  year: number;
  category: string;
  work: string;
  outcome: "won" | "nominated";
}

export interface ActorAwardsData {
  actorId: string;
  totalWins: number;
  totalNominations: number;
  awards: AwardItem[];
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  profileUrl: string | null;
}

export interface FilmographyCredit {
  id: string;
  title: string;
  role: string;
  department?: string;
  year?: string;
  posterUrl: string | null;
  rating?: number;
  popularity?: number;
  genreIds?: number[];
}

export interface Review {
  id: string;
  author: string;
  content: string;
  rating?: number;
  createdAt: string;
  url?: string;
}

export interface Trailer {
  id: string;
  name: string;
  key: string;
  site: string;
  type: string;
  thumbnailUrl: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  totalPages?: number;
  totalResults?: number;
}

export interface CursorResult<T> {
  items: T[];
  nextCursor?: string;
  totalResults?: number;
}
