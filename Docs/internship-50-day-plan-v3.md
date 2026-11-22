# ElevanceSkills Front-End Internship — 50-Day Plan

**Domain:** Front-End Development **Duration:** 2 months (window only — see rules below) **Start:** Day 1 = Sep 26, 2026 | **Target finish:** Day 50 = Nov 14, 2026 | **Portal deadline:** Nov 24, 2026 **Project:** New IMDb-clone repo, built from scratch, extended with the 6 assigned tasks **Daily requirement:** one short project update message (given below for every day)

---

## Overview

This is a fresh, self-built project — not a copy of any other repo. Days 1–5 build the base IMDb-clone application (the "training project" foundation). Days 6–50 add the 6 assigned tasks as extra features on top of that same project, in this order: API layer → Theming → Movie details → Actor profile → Watchlist → Reviews. The last two days are for polish and submission.

## Important rules

- **One-time submission.** Once submitted, nothing can be changed, edited, or replaced.
- **End date = submission date**, not the end of the 2-month window. Submit as soon as everything is done.
- **Build on the same project.** All 6 tasks must be extra features on this one repo. A different/new project later is rejected.
- **Public links only.** Test every link (GitHub + live URL) in an incognito window before submitting.
- **Deploy live** on Netlify or Vercel. Keep it live until evaluation finishes.
- **Fully responsive** on mobile and tablet.
- **Daily mentor sessions** are available — use them when stuck.
- **Help:** [training@elevanceskills.com](mailto:training@elevanceskills.com) (include name, domain, project link).

## Tech stack

Next.js (App Router), Tailwind CSS, Framer Motion, TanStack Query, Zod, Upstash Redis, Auth.js, IndexedDB (`idb`), `@tanstack/react-virtual`, Vitest, Playwright. Deploy on Vercel.

## The 6 tasks (build order)

1. **API layer** — TMDb/OMDb abstraction, caching, rate limiting, resilience
2. **Theming** — dark/light/high-contrast/auto, flash-free
3. **Movie details page** — carousel, streaming, accessibility
4. **Actor profile page** — ISR, virtualized filmography, filters
5. **Watchlist** — offline-first, cross-tab, conflict-resilient
6. **Review system** — auth, CRUD, voting, live updates

---

## 50-Day Schedule

### Phase 0: Base project (Days 1–5)

**Day 1**

- Create a new public GitHub repo (e.g. `imdb-clone-internship`).
- Scaffold with `npx create-next-app@latest` (App Router, no `src/` needed but either works).
- Install and configure Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`) and Framer Motion (`framer-motion`).
- Commit and push: "Initial Next.js setup with Tailwind and Framer Motion".

> Day 1: Set up a new Next.js repo with Tailwind and Framer Motion. Next: build the home page and layout.

**Day 2**

- Build `app/layout.tsx`: html/body shell, global font, `globals.css` import.
- Build a `Navbar` component (logo, search input placeholder, nav links) and a `Footer` component.
- Build `app/page.tsx` as the home page with a responsive grid (`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4`) filled with placeholder movie cards.

> Day 2: Built the app layout, navbar and home page skeleton. Next: connect movie data.

**Day 3**

- Sign up at themoviedb.org, request an API key (v3 auth) under account settings.
- Sign up at omdbapi.com for a free API key (arrives by email).
- Store both in `.env.local` (`TMDB_API_KEY`, `OMDB_API_KEY`) and add `.env.local` to `.gitignore`.
- Fetch `https://api.themoviedb.org/3/movie/popular` in `app/page.tsx` and render real posters, titles and ratings in the grid.

> Day 3: Got API keys and built a basic movie list page. Next: add movie details page.

**Day 4**

- Create `app/movie/[id]/page.tsx`.
- Fetch `https://api.themoviedb.org/3/movie/{id}` and render poster, title, overview, release date, genres and runtime.
- Add a "Back to list" link and a simple loading state (`loading.tsx`).
- Link each movie card on the home page to its details page.

> Day 4: Added a basic movie details page and dynamic routing. Next: search feature.

**Day 5**

- Add a search input in the navbar that calls `https://api.themoviedb.org/3/search/movie?query=`.
- Render search results in the same grid layout as the home page.
- Push all changes, then import the repo into Vercel and deploy.
- Confirm the live URL loads correctly and click through every page once.

> Day 5: Added search and deployed the base project to Vercel. Base project complete — starting internship tasks next.

---

### Phase 1: Task 1 — API layer (Days 6–15)

**Day 6**

- Create `lib/api/types.ts` with normalized types: `Movie`, `MovieDetails`, `Person`, `Page<T>`.
- Create `lib/api/provider.ts` defining a `MovieProvider` interface (`getPopular`, `search`, `getMovie`, `getPerson`).
- Implement `lib/api/tmdb.ts` and `lib/api/omdb.ts`, each mapping raw responses into the normalized types.
- Route every existing fetch call (home page, details page, search) through this provider instead of calling TMDb/OMDb directly.

> Day 6: Built a provider abstraction layer over TMDb and OMDb. Next: pagination and cursor fetching.

**Day 7**

- Wrap TMDb's `page` numbers in an opaque cursor (`base64({ page })`) so callers never see raw page numbers.
- Update `getPopular`/`search` to return `{ items, nextCursor }`.
- Add infinite scroll to the home page using an `IntersectionObserver` on a sentinel div.
- Add a merge function that updates existing items by `id` instead of resetting the list on refresh.

> Day 7: Added cursor-based pagination and incremental list updates. Next: TanStack Query setup.

**Day 8**

- Install `@tanstack/react-query` and add a client `Providers` component wrapping the app with one `QueryClient`.
- Create `lib/queryKeys.ts` as a single source of truth for query keys.
- Set `staleTime` and `gcTime` defaults.
- Add `onMouseEnter`/`onFocus` handlers on movie cards that call `queryClient.prefetchQuery` for the details page.

> Day 8: Set up TanStack Query with request dedupe, cache cleanup and hover prefetch. Next: rate limiting.

**Day 9**

- Create `lib/resilience/tokenBucket.ts`: a class with `capacity`, `refillPerSecond`, and an `acquire()` method that waits for an available token.
- Create `lib/resilience/retry.ts`: retries on network errors, 429 and 5xx, using exponential backoff with jitter, honoring `Retry-After` headers, capped at 3–5 attempts.
- Wrap the TMDb/OMDb fetch calls with both.
- Write a quick unit test proving requests are spaced out correctly.

> Day 9: Built a token bucket rate limiter with retry and exponential backoff. Next: circuit breaker.

**Day 10**

- Create `lib/resilience/circuitBreaker.ts` with closed/open/half-open states and a configurable failure threshold and cool-down period.
- Wrap the provider calls with the breaker (breaker outside, retry inside).
- Add `lib/fallback/movies.json` as static seed data, and a "last successful response" cache used when the breaker is open.
- Test by force-failing the API and confirming fallback data appears.

> Day 10: Added a circuit breaker with fallback data on repeated failures. Next: server-side caching.

**Day 11**

- Set up Upstash Redis (or Next.js `unstable_cache`/`'use cache'`, depending on your Next version) for server-side response caching.
- Tag cached entries by resource (`movies`, `movie-{id}`).
- Create `app/api/revalidate/route.ts`, protected by a secret query param/header, that calls `revalidateTag`.
- Test the revalidation route with `curl` or Postman.

> Day 11: Added server-side caching with tag-based revalidation. Next: error boundaries and skeletons.

**Day 12**

- Add `error.tsx` boundaries for the home, search and details routes.
- Build matching `Skeleton` components sized to match the real content (avoids layout shift).
- Configure TanStack Query with `refetchOnWindowFocus: true` and `refetchOnReconnect: true`.
- Add a small "You're offline" banner using the browser's `online`/`offline` events.

> Day 12: Added error boundaries, loading skeletons and refetch on focus/reconnect. Next: SSR list + streaming details.

**Day 13**

- Convert the home page into a server component that fetches page 1 directly and renders real movie data in the initial HTML (no client-side loading spinner for the first screen).
- Wrap slower parts (e.g. OMDb ratings) in `<Suspense fallback={<Skeleton />}>` so they stream in after the main content.
- Verify with "View Page Source" that movie titles appear in the raw HTML.

> Day 13: Made list pages render instantly via SSR while details stream in. Next: telemetry.

**Day 14**

- Add `useReportWebVitals` (from `next/web-vitals`) and send metrics to a new `app/api/telemetry/route.ts` using `navigator.sendBeacon`.
- Log request traces (URL, duration, status, retry count, breaker state) and error traces from the resilience layer to the server console (visible in Vercel logs).

> Day 14: Added Web Vitals and request/error telemetry tracking. Next: resilience tests.

**Day 15**

- Install Vitest, Testing Library and MSW (`vitest`, `@testing-library/react`, `msw`).
- Write tests: a burst of 429s then success (retry works), five consecutive 500s (circuit opens and fallback data returns without a network call), and a component test confirming the UI shows a friendly fallback instead of crashing.
- Update `docs/TASK-1.md` and the README status table, then deploy.

> Day 15: Wrote tests simulating API failures and confirmed graceful fallbacks. Task 1 complete.

---

### Phase 2: Task 5 — Theming (Days 16–19)

**Day 16**

- Define CSS variables in `globals.css` for background, foreground, primary, border and focus-ring colors under `[data-theme="light"]`, `[data-theme="dark"]` and `[data-theme="hc"]` (high-contrast).
- Map these variables into `tailwind.config.js` `colors` (e.g. `bg: 'hsl(var(--bg) / <alpha-value>)'`).
- Search the codebase for hard-coded colors (`bg-gray-*`, hex values) and replace them with the new token classes.

> Day 16: Defined CSS variable tokens for light, dark and high-contrast themes. Next: theme provider.

**Day 17**

- Build `ThemeProvider` (React Context) supporting `light | dark | hc | system`.
- Save the choice to a cookie (readable by the server) and to localStorage.
- In `app/layout.tsx`, read the cookie server-side and set `data-theme` on `<html>` before render.
- Add a small inline `<script>` in `<head>` to resolve `system` mode before first paint, avoiding a flash.

> Day 17: Built the theme provider with cookie/localStorage persistence and flash-free SSR. Next: animations and overrides.

**Day 18**

- Add a theme toggle UI (icon button or small menu) with `AnimatePresence` for an icon cross-fade.
- Add a spring-animated indicator for the active theme.
- Wrap the app in `MotionConfig reducedMotion="user"` so animations respect `prefers-reduced-motion`.
- Build a `ThemeScope` component so specific sections (e.g. the trailer player) can force a theme regardless of the global setting.

> Day 18: Added animated theme transitions, reduced-motion support and per-route overrides. Next: CLS check and CSP.

**Day 19**

- Run Lighthouse before and after toggling the theme and confirm CLS stays near 0.
- Add a nonce-based CSP via `middleware.ts`: generate a per-request nonce, set `Content-Security-Policy` headers, and pass the nonce to the inline theme script and any inline styles.
- Fix any CSP violations shown in the browser console, then deploy.

> Day 19: Verified zero layout shift on theme toggle and added a nonce-based CSP. Task 5 complete.

---

### Phase 3: Task 3 — Movie details page (Days 20–26)

**Day 20**

- Rebuild `/movie/[id]/page.tsx` as a server component with separate async sections: `MovieCore`, `Credits`, `Reviews`.
- Start all three fetches in parallel and wrap each in its own `<Suspense>` with a matching skeleton.
- Add `generateMetadata` for a proper page title, description and Open Graph image.

> Day 20: Rebuilt the movie details page using server components with Suspense streaming. Next: trailer carousel.

**Day 21**

- Build a `TrailerCarousel` client component (`"use client"`).
- Use `motion.div drag="x"` with `dragElastic` for a natural feel, and `onDragEnd` logic based on drag offset and velocity to decide the next/previous slide.
- Add prev/next buttons and dot indicators as a non-gesture fallback.

> Day 21: Built a swipeable trailer/image carousel with Framer Motion. Next: autoplay and preloading.

**Day 22**

- Add autoplay with `setInterval`, but pause it on hover, on keyboard focus, when the tab is hidden (`visibilitychange`), and when `useReducedMotion()` is true. Include a visible pause/play button.
- Use `next/image` with `loading="lazy"` for non-active slides.
- Prefetch related/adjacent movie pages on hover using `router.prefetch` and `queryClient.prefetchQuery`, keyed by movie id so each is only prefetched once.

> Day 22: Added autoplay, lazy loading and preloading of adjacent movies. Next: request caching.

**Day 23**

- Create `lib/resilience/coalesce.ts`: an in-flight promise map so simultaneous identical requests share one network call.
- Add `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600` headers on the movie API route.
- Generate an ETag (hash of the response body) and return `304 Not Modified` when `If-None-Match` matches.

> Day 23: Added request coalescing and HTTP caching with ETag validation. Next: failure handling.

**Day 24**

- Reuse the Task 1 circuit breaker and backoff/jitter logic for the movie details data fetch.
- Add placeholder assets (`/public/placeholder-poster.svg`, a "Trailer unavailable" card) shown when the API call fails, plus a retry button.
- Add CSP rules allowing only `image.tmdb.org` and `youtube-nocookie.com` for media/frames.

> Day 24: Added static placeholders and a CSP for third-party media on API failure. Next: accessibility.

**Day 25**

- Add `role="region"` and `aria-roledescription="carousel"` to the carousel container, with each slide labeled.
- Implement roving tabindex (only the active thumbnail/tab has `tabIndex={0}`) with arrow-key navigation.
- Build a focus-trapped trailer dialog (`role="dialog" aria-modal="true"`) that closes on Escape and returns focus to the trigger element.

> Day 25: Made the carousel fully keyboard-accessible with focus trapping. Next: a11y tests.

**Day 26**

- Add `@axe-core/playwright` or `jest-axe` tests on the movie details page and assert zero violations.
- Add a keyboard-only navigation test (Tab, arrow keys, Escape).
- Manually check the page at 360px, 768px and 1024px widths, then deploy and update `docs/TASK-3.md`.

> Day 26: Added automated accessibility tests and verified responsiveness. Task 3 complete.

---

### Phase 4: Task 2 — Actor profile page (Days 27–33)

**Day 27**

- Create `app/actor/[id]/page.tsx` as a server component with `export const revalidate = 3600` (ISR).
- Add `generateStaticParams` using TMDb's `/person/popular` endpoint to pre-build common actor pages.
- Add `app/api/revalidate/actor/route.ts`, secret-protected, calling `revalidateTag`/`revalidatePath` for a specific actor.

> Day 27: Built the actor profile page with ISR and on-demand revalidation. Next: filmography explorer.

**Day 28**

- Install `@tanstack/react-virtual`.
- Build a `FilmographyExplorer` client component with a fixed-height scroll container and `useVirtualizer` rendering only visible rows.
- Each row shows a small poster thumbnail, title, year and role.

> Day 28: Added a virtualized filmography list for smooth scrolling. Next: filters.

**Day 29**

- Fetch `/genre/movie/list` once and cache it to map genre ids to names.
- Add year, genre (multi-select) and role (cast/crew) filters above the list, plus a sort control (year/popularity).
- Sync filter state to the URL query params with `useSearchParams`/`router.replace` so filtered views are shareable.

> Day 29: Added year, genre and role filters to the filmography explorer. Next: subpanels.

**Day 30**

- Add parallel route slots `@awards`, `@social`, `@similar` under `app/actor/[id]/`, each with its own `page.tsx`, `loading.tsx`, `error.tsx` and `default.tsx`.
- Update `app/actor/[id]/layout.tsx` to accept and render `{ children, awards, social, similar }`.
- Populate the social panel from TMDb's `external_ids`, and compute "similar actors" from shared top credits.

> Day 30: Added parallel route panels for awards, social links and similar actors. Next: data source and caching.

**Day 31**

- Build a small mock API (route handlers backed by JSON or Redis) or a Firestore emulator for awards data, since TMDb has no awards endpoint.
- Add a simple policy check (`can(user, 'read'|'write', resource)`) so only reads are public.
- Add `stale-while-revalidate` cache headers and `fetchPriority="high"` on the actor's main photo.

> Day 31: Connected a mock data source with access rules and stale-while-revalidate caching. Next: JSON-LD and i18n.

**Day 32**

- Add a `Person` JSON-LD `<script type="application/ld+json">` block (name, image, bio, birthDate, sameAs social links) and validate it with a schema/rich-results checker.
- Add a `[locale]` segment or `next-intl` for at least one extra language, translating UI labels and showing `also_known_as` alternate names and alternate movie titles.

> Day 32: Added Person JSON-LD and multi-language support for names and titles. Next: performance tuning.

**Day 33**

- Run Lighthouse in mobile mode (throttled) at least 5 times on the deployed actor page and record LCP.
- Optimize: `priority` on the main photo, correct `next/image` `sizes`, `next/font`, and lazy-load the filmography explorer with `next/dynamic` if it blocks first paint.
- Save screenshots to `docs/`, update the README, and deploy.

> Day 33: Tuned the actor page for fast mobile LCP and deployed. Task 2 complete.

---

### Phase 5: Task 6 — Watchlist (Days 34–40)

**Day 34**

- Define a `WatchlistItem` Zod schema (movie id, title, poster, addedAt).
- Build `lib/watchlist/repository.ts` with `add`, `remove`, `list`, `update` methods validated against the schema, backed by an in-memory implementation to start.
- Write unit tests for the repository logic.

> Day 34: Built a typed watchlist repository with Zod validation. Next: offline storage.

**Day 35**

- Install `idb` and implement an `IndexedDbRepository` fulfilling the same interface.
- Add a `localStorage` fallback for very old browsers.
- Test with DevTools set to "Offline" and confirm the saved watchlist still displays.

> Day 35: Added IndexedDB caching so the watchlist works fully offline. Next: mock server sync.

**Day 36**

- Build `app/api/watchlist/route.ts` as a mock remote store (in-memory array or Redis).
- Add optimistic add/remove in the UI: update local state immediately, call the API, and roll back with an error toast if it fails.

> Day 36: Added optimistic watchlist updates with rollback on failure. Next: conflict handling.

**Day 37**

- Add an `updatedAt` timestamp to every watchlist write.
- On sync, compare local vs. remote timestamps per item and keep whichever is newer (last-write-wins).
- Simulate a conflict manually (edit locally while "offline," then edit the mock remote) and confirm the merge resolves without duplicates.

> Day 37: Added last-write-wins conflict resolution for the watchlist. Next: background sync.

**Day 38**

- Register a service worker (`public/sw.js`) and register it in a client component.
- Queue failed writes while offline and flush them via the Background Sync API, or a `online` event listener as a simpler fallback.
- Test by going offline, adding an item, then coming back online and confirming it syncs automatically.

> Day 38: Added a service worker so offline changes sync automatically when back online. Next: cross-tab sync.

**Day 39**

- Add a `BroadcastChannel('watchlist')` so all open tabs receive updates instantly and re-render.
- Build the "Add to Watchlist" toggle button with a Framer Motion press/spring animation, a brief "Added — Undo" state, and an `aria-live="polite"` region announcing the change.

> Day 39: Added cross-tab sync and an animated "Add to Watchlist" toggle with undo. Next: E2E tests.

**Day 40**

- Install Playwright and write E2E tests: (1) add an item, refresh, confirm it persists; (2) go offline, add an item, go online, confirm it syncs; (3) open two tabs, edit in both, confirm no duplicates or lost updates.
- Update `docs/TASK-6.md`, the README, and deploy.

> Day 40: Wrote E2E tests for offline sync and multi-tab edits. Task 6 complete.

---

### Phase 6: Task 4 — Review system (Days 41–48)

**Day 41**

- Install Auth.js (or set up Firebase Auth) with a sign-in provider (GitHub or Google OAuth).
- Add a session provider to the app and a sign-in/sign-out UI in the navbar.
- Protect review-writing API routes so only signed-in users can post; reading stays public.

> Day 41: Set up authentication for the review system. Next: review CRUD API.

**Day 42**

- Build `app/api/movies/[id]/reviews/route.ts` (`GET`, `POST`) and `app/api/reviews/[id]/route.ts` (`PATCH`, `DELETE`).
- Define a shared Zod schema used for both client-side form validation and server-side request validation.
- Add per-user rate limiting (e.g. `@upstash/ratelimit`) on the POST route.

> Day 42: Built review create/edit/delete routes with validation and rate limiting. Next: optimistic UI.

**Day 43**

- Make the review form optimistic: on submit, add the review to the UI immediately, then reconcile with the server's actual response (or roll back on error).
- Generate a UUID idempotency key per submission and check it server-side to prevent duplicate reviews from double-clicks or retries.

> Day 43: Added optimistic review submission with idempotency keys to stop duplicates. Next: draft autosave.

**Day 44**

- Autosave the review text field to IndexedDB every few seconds while typing.
- On page load, check for an existing draft for that movie and restore it automatically, with an option to discard it.

> Day 44: Added review draft autosave with background sync. Next: voting and sorting.

**Day 45**

- Add upvote/downvote buttons per review, storing vote counts.
- Implement a Wilson score lower-bound calculation for fair "helpful" ranking.
- Add sort options: Helpful (Wilson score), Recent, and Controversial (close up/down vote counts).

> Day 45: Added review voting with Wilson score ranking and sort options. Next: delete/undo and history.

**Day 46**

- Implement soft-delete: mark a review `deletedAt` instead of removing it, hide it from the list, and show a timed "Undo" toast that restores it.
- Store a diff-based revision history (previous text + timestamp) each time a review is edited, viewable in an "edit history" panel.

> Day 46: Added soft-delete with undo and diff-based revision history. Next: moderation and live updates.

**Day 47**

- Add an "Report/Flag" button on each review that marks it for moderation review.
- Add a basic profanity filter checked on submission.
- Add live updates using Server-Sent Events (`app/api/movies/[id]/reviews/stream/route.ts`) so a new review posted in one tab appears in another without a refresh, with simple throttling to avoid flooding the client.

> Day 47: Added abuse flagging, a profanity filter and live SSE review updates. Next: animations and performance.

**Day 48**

- Add Framer Motion `layout` animations so the review list animates smoothly when the sort order changes.
- Load-test pagination with 100+ mock reviews and confirm scrolling stays smooth (virtualize if needed).
- Write remaining tests, update `docs/TASK-4.md` and the README, then deploy. All 6 tasks are now complete.

> Day 48: Added reorder animations, verified smooth pagination and deployed. All 6 tasks complete.

---

### Phase 7: Polish and submit (Days 49–50)

**Day 49**

- Go through every page (home, search, movie, actor, watchlist) at 360px, 768px and 1024px widths and fix any overflow, spacing or touch-target issues.
- Run a full Lighthouse and accessibility (axe) sweep across all main pages and fix anything flagged.

> Day 49: Polished responsiveness and accessibility across the whole app. Next: final documentation and checks.

**Day 50**

- Finish the README: setup instructions, environment variables needed, a status table for all 6 tasks, screenshots, and known limitations.
- Open the GitHub repo and the live Vercel URL in an incognito window and click through every link to confirm nothing requires login.
- Go through the final submission checklist below, then submit.

> Day 50: Finished documentation, verified all links are public, and submitted the project.

---

## Final Submission Checklist

- [x] All 6 tasks completed
- [x] Live URL deployed on Vercel/Netlify and public
- [x] GitHub repo public
- [x] No API keys committed
- [x] Fully responsive on mobile and tablet
- [x] README complete
- [x] All links tested in incognito
- [x] Reviewed everything — submission cannot be changed after this