# IMDb Clone — Front-End Internship

A production-grade, highly resilient IMDb Clone built with Next.js (App Router), Tailwind CSS, Framer Motion, and TanStack Query.

## Internship Task Status

| Task / Phase | Days | Focus Area | Status |
| :--- | :---: | :--- | :---: |
| **Phase 0: Base Project** | Days 1–5 | Next.js setup, Layout, Navbar, Grid, TMDb integration, Search, Vercel deployment | **Completed** |
| **Task 1: API Layer** | Days 6–15 | TMDb/OMDb abstraction, cursor pagination, TanStack Query, rate limiting, retry, circuit breaker, caching, Web Vitals, resilience test suite | **Completed** |
| **Task 2: Theming** | Days 16–19 | Light/Dark/HC/System CSS tokens, flash-free ThemeProvider | Pending |
| **Task 3: Movie Details** | Days 20–27 | Hero backdrop, trailers, cast carousel, streaming providers, accessibility | Pending |
| **Task 4: Actor Profile** | Days 28–34 | ISR actor pages, virtualized filmography, sort & filter | Pending |
| **Task 5: Watchlist** | Days 35–41 | Offline-first IndexedDB, cross-tab sync, optimistic UI | Pending |
| **Task 6: Review System** | Days 42–48 | User auth, CRUD reviews, helpfulness voting, optimistic mutations | Pending |
| **Polish & Submission** | Days 49–50 | Cross-browser testing, final audit, portal submission | Pending |

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables in `.env.local`:**
   ```env
   TMDB_API_KEY=your_tmdb_api_key
   OMDB_API_KEY=your_omdb_api_key
   REVALIDATE_SECRET=your_secret
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Run resilience test suite:**
   ```bash
   npm test
   ```

5. **Production build:**
   ```bash
   npm run build
   ```
