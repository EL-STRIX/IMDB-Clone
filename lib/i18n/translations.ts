export type SupportedLocale = "en" | "es";

export interface TranslationDictionary {
  backToList: string;
  biography: string;
  noBiography: string;
  born: string;
  birthPlace: string;
  knownFor: string;
  alsoKnownAs: string;
  filmography: string;
  showingCredits: (count: number, total: number) => string;
  roles: {
    all: string;
    cast: string;
    crew: string;
  };
  filterByYear: string;
  allYears: string;
  sort: {
    label: string;
    yearDesc: string;
    yearAsc: string;
    popularityDesc: string;
    ratingDesc: string;
  };
  filterByGenre: string;
  reset: string;
  switchLanguage: string;
}

export const translations: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    backToList: "Back to list",
    biography: "Biography",
    noBiography: "No biography available for this person.",
    born: "Born",
    birthPlace: "Birthplace",
    knownFor: "Known For",
    alsoKnownAs: "Also Known As",
    filmography: "Filmography",
    showingCredits: (count, total) =>
      `Showing ${count} of ${total} ${total === 1 ? "credit" : "credits"}`,
    roles: {
      all: "All Roles",
      cast: "Cast",
      crew: "Crew",
    },
    filterByYear: "Filter by Year",
    allYears: "All Years",
    sort: {
      label: "Sort credits",
      yearDesc: "Year (Newest)",
      yearAsc: "Year (Oldest)",
      popularityDesc: "Popularity",
      ratingDesc: "Highest Rated",
    },
    filterByGenre: "Filter by Genre",
    reset: "Reset",
    switchLanguage: "Language",
  },
  es: {
    backToList: "Volver a la lista",
    biography: "Biografía",
    noBiography: "No hay biografía disponible para esta persona.",
    born: "Nacimiento",
    birthPlace: "Lugar de nacimiento",
    knownFor: "Conocido por",
    alsoKnownAs: "También conocido como",
    filmography: "Filmografía",
    showingCredits: (count, total) =>
      `Mostrando ${count} de ${total} ${total === 1 ? "crédito" : "créditos"}`,
    roles: {
      all: "Todos los roles",
      cast: "Reparto",
      crew: "Equipo técnico",
    },
    filterByYear: "Filtrar por año",
    allYears: "Todos los años",
    sort: {
      label: "Ordenar créditos",
      yearDesc: "Año (Más reciente)",
      yearAsc: "Año (Más antiguo)",
      popularityDesc: "Popularidad",
      ratingDesc: "Mejor calificados",
    },
    filterByGenre: "Filtrar por género",
    reset: "Restablecer",
    switchLanguage: "Idioma",
  },
};

export function getDictionary(locale?: string): TranslationDictionary {
  if (locale === "es") {
    return translations.es;
  }
  return translations.en;
}
