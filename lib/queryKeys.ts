export const queryKeys = {
  movies: {
    all: ["movies"] as const,
    popular: (cursor?: string) => ["movies", "popular", cursor] as const,
    search: (query: string, cursor?: string) => ["movies", "search", query, cursor] as const,
    detail: (id: string) => ["movies", "detail", id] as const,
  },
  person: {
    detail: (id: string) => ["person", "detail", id] as const,
  },
};
