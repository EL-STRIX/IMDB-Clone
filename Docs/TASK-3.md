# Task 3: Movie Details Page Architecture, Gestures, & Accessibility

## Overview
A resilient, streaming server-component architecture for `/movie/[id]` featuring parallel Suspense boundaries, gesture-driven trailer carousel with Framer Motion, request coalescing, HTTP caching with ETag validation, and automated accessibility verified with `axe-core`.

---

## Key Deliverables & Implementation

1. **Parallel Async Server Components (`app/movie/[id]/page.tsx`)**:
   - `MovieCore`: Poster, title, runtime, release date, TMDb rating, and streamed OMDb rating.
   - `TrailersSection`: Videos and promotional clips carousel.
   - `Credits`: Top-billed cast grid with actor profile photos and character names.
   - `Reviews`: User review cards with author, ratings, and submission dates.
   - `RelatedMoviesSection`: "More Like This" adjacent titles grid.
   - All async fetches dispatched simultaneously before mounting dedicated `<Suspense>` boundaries with matching skeletons.

2. **Swipeable Trailer Carousel (`components/movie/TrailerCarousel.tsx`)**:
   - Framer Motion `motion.div drag="x"` with `dragElastic={0.2}` and `dragConstraints={{ left: 0, right: 0 }}`.
   - Gesture velocity and offset calculation on `onDragEnd` to trigger next/previous slide transitions.
   - Non-gesture controls: arrow buttons, active dot indicators, and play button overlay.
   - Adaptive autoplay (5000ms `setInterval`) automatically pausing on:
     - Container hover
     - Keyboard focus
     - Tab backgrounding (`visibilitychange`)
     - Accessibility preference (`useReducedMotion`)
     - Active dialog playback
     - Visible manual Play / Pause toggle button
   - Preloaded non-active slide images with `loading="lazy"`.

3. **Adjacent Movie Preloading with Deduplication (`components/movie/RelatedMovies.tsx`)**:
   - Dispatches both Next.js route prefetch (`router.prefetch`) and TanStack Query prefetch (`queryClient.prefetchQuery`) on hover.
   - Keyed with an in-memory `Set<string>` ref ensuring each movie is prefetched strictly once.

4. **Request Coalescing & HTTP Caching (`lib/resilience/coalesce.ts`)**:
   - In-flight promise map deduplicating concurrent identical API queries.
   - `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600` headers on `/api/movies/[id]` and `/api/movies/popular`.
   - Deterministic MD5 ETag generation returning `304 Not Modified` when `If-None-Match` matches.

5. **Failure Handling & Fallback Placeholders**:
   - Unified `withRetry` (exponential backoff with jitter and `Retry-After`) with circuit breaker.
   - Vector placeholder graphic [`/public/placeholder-poster.svg`](../public/placeholder-poster.svg) for missing/failed poster images.
   - "Trailer unavailable" fallback card with a dedicated **Retry** button.
   - Strict Content Security Policy in [`proxy.ts`](../proxy.ts) allowing only `image.tmdb.org` and `youtube-nocookie.com` for frames and media.

6. **Accessibility & Keyboard Navigation (WCAG AAA)**:
   - Carousel container with `role="region"` and `aria-roledescription="carousel"`.
   - Slides with `role="group"` and `aria-roledescription="slide"`.
   - Roving tabindex on slide tabs (`tabIndex={0}` on active tab, `-1` on inactive) with arrow-key (`ArrowRight`, `ArrowLeft`, `Home`, `End`) navigation.
   - Focus-trapped trailer dialog (`role="dialog" aria-modal="true"`) that traps Tab cycles, closes on Escape, and returns focus to trigger element.
   - Automated tests with `axe-core` asserting zero accessibility violations.

7. **Responsive Layouts**:
   - Fully fluid and tested across 360px (mobile single-column), 768px (tablet two-column), and 1024px+ (desktop multi-column grid).
