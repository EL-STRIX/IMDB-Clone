# IMDb Clone

A modern, production-grade movie discovery and rating web application built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

---

## Features

- **Movie Discovery:** Explore trending and popular movies with infinite scroll pagination and genre filtering.
- **Instant Search:** Fast search across movies and cast members with instant results and keyboard navigation.
- **Rich Movie Details:** Comprehensive movie overviews, ratings, cast lists, and accessible YouTube trailer carousels.
- **Actor Profiles:** Detailed biographies, awards showcases, and high-performance virtualized filmographies.
- **Offline-First Watchlist:** Save favorite movies locally using IndexedDB with automatic cross-tab synchronization and offline support.
- **Community Reviews:** User reviews, Wilson score helpfulness ranking, offline draft autosave, and community moderation.
- **Multi-Theme Engine:** Seamless switching between **Dark**, **Light**, and **High-Contrast** modes with zero flash on load.
- **Fully Responsive & Accessible:** Optimized for mobile, tablet, and desktop with WCAG 2.1 AA keyboard and screen reader accessibility.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State & Local Storage:** IndexedDB (`idb`), TanStack Query, React Context
- **Testing:** Vitest, Testing Library, Playwright

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/imdb-clone.git
cd imdb-clone
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory (refer to `.env.example`):

```env
# TMDb API Key (v3) - Required
TMDB_API_KEY=your_tmdb_api_key_here

# OMDb API Key - Optional (for additional rating streams)
OMDB_API_KEY=your_omdb_api_key_here

# Revalidation & Auth Secrets
REVALIDATE_SECRET=your_secret_here
AUTH_SECRET=your_auth_secret_here
```

> **Note:** You can obtain a free API key at [The Movie Database (TMDb)](https://www.themoviedb.org/settings/api).

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development server with Turbopack |
| `npm run build` | Creates an optimized production build |
| `npm start` | Runs the production build locally |
| `npm test` | Runs unit and integration test suites via Vitest |
| `npm run test:e2e` | Runs end-to-end tests via Playwright |
| `npm run lint` | Runs Next.js ESLint checks |

---

## License

This project is licensed under the [MIT License](LICENSE).
