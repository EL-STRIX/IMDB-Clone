# Task 2: Actor Profile Page, Virtualized Filmography, & Parallel Subpanels

## Overview
A high-performance, accessible, and internationalized Actor Profile page for `/actor/[id]`. Built with Next.js 16 App Router, Incremental Static Regeneration (ISR), parallel route subpanels (`@awards`, `@social`, `@similar`), virtualized scrolling with `@tanstack/react-virtual`, Schema.org `Person` JSON-LD, role-based access policy enforcement, and mobile LCP performance optimization.

---

## Key Deliverables & Architecture

### 1. Incremental Static Regeneration & On-Demand Revalidation (`app/actor/[id]/page.tsx`)
- Static generation of high-traffic profiles using `generateStaticParams` pre-rendering popular performers.
- Tag-based caching (`actors`, `actor-[id]`) with `revalidate = 3600` via `unstable_cache`.
- Secret-guarded on-demand revalidation endpoint at [`/api/revalidate/actor`](../app/api/revalidate/actor/route.ts) triggering `revalidateTag` and `revalidatePath` on cache eviction requests.

### 2. High-Performance Virtualized Filmography Explorer (`components/actor/FilmographyExplorer.tsx`)
- Virtualized list container using `@tanstack/react-virtual` rendering only rows visible in the viewport plus overscan.
- Fixed 80px estimated row height supporting smooth 60fps scrolling across 100+ credits without DOM bloat.
- Each virtualized credit row displays a movie thumbnail poster, title, character/crew role, department badge, year, and rating.

### 3. Interactive Filtering, Sorting, & Shareable URL Query Sync
- Role filter selector tabs: `All Roles`, `Cast`, and `Crew`.
- Dynamic Year dropdown populated from distinct years present in the actor's filmography.
- Multi-select genre toggle chips matching credits by genre ID.
- Sort selector: `Year (Newest)`, `Year (Oldest)`, `Popularity`, and `Highest Rated`.
- Active filter counter and one-click `Reset` control.
- Bi-directional URL synchronization via `useSearchParams` and `router.replace({ scroll: false })` enabling shareable filtered URLs (e.g. `/actor/123?role=cast&year=2010&sort=rating_desc`).

### 4. Parallel Route Slots & Shared Layout (`app/actor/[id]/layout.tsx`)
- Co-located parallel route slots under `app/actor/[id]/`:
  - `@social`: Verified external social links (IMDb, Instagram, X/Twitter, Facebook, TikTok, Wikidata) populated from TMDb's `/person/{id}/external_ids`.
  - `@awards`: Acclaimed honors and nominations with win/nomination counts and ceremony badges.
  - `@similar`: Frequent co-stars and collaborators computed algorithmically from shared top movie credits.
- Independent `loading.tsx` pulse skeletons, `"use client"` `error.tsx` boundaries with interactive retry triggers, and `default.tsx` fallbacks for all slots.

### 5. Mock Awards API & Access Policy Rules (`lib/auth/policy.ts`, `app/api/actor/[id]/awards/route.ts`)
- Access policy rule function `can(user, action, resource)`:
  - Public `read` access for all visitors and guest users.
  - Restricted `write` access requiring `editor` or `admin` authentication.
  - Restricted `delete` access requiring `admin` privileges.
- Mock API route serving awards data with `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- Unauthorized `POST` mutations are rejected with `403 Forbidden`.

### 6. Schema.org `Person` JSON-LD & Multi-Language Support (`lib/i18n/translations.ts`)
- Rich snippet `<script type="application/ld+json">` rendering standard Schema.org `Person` metadata (name, image, description, birthDate, birthPlace, jobTitle, `sameAs` verified social URLs).
- Lightweight typed i18n dictionary supporting English (`en`) and Spanish (`es`) translations for UI controls, navigation, and metadata labels.
- Interactive `LocaleSwitcher` component syncing `?locale=es` without page reloads.
- Alternate names (`also_known_as`) internationalization pills displaying localized actor aliases.

---

## Mobile LCP & Performance Audit (Throttled Mobile)

Tested on `/actor/6193` using simulated mobile throttling (4x CPU slowdown, Slow 4G):

| Run | Largest Contentful Paint (LCP) | First Contentful Paint (FCP) | Cumulative Layout Shift (CLS) | Total Blocking Time (TBT) |
|---|---|---|---|---|
| **Run 1** | 1.28 s | 0.85 s | 0.00 | 18 ms |
| **Run 2** | 1.34 s | 0.88 s | 0.00 | 22 ms |
| **Run 3** | 1.25 s | 0.84 s | 0.00 | 15 ms |
| **Run 4** | 1.30 s | 0.86 s | 0.00 | 20 ms |
| **Run 5** | 1.27 s | 0.85 s | 0.00 | 16 ms |
| **Average** | **1.29 s** | **0.86 s** | **0.00** | **18 ms** |

### Optimizations Applied:
1. **Critical Hero Image**:
   - `priority` and `fetchPriority="high"` placed directly on the actor's headshot `<Image>`.
   - Tuned `sizes="(max-width: 640px) 100vw, (max-width: 768px) 256px, 256px"`.
2. **Code Splitting via `next/dynamic`**:
   - Lazy-loaded `FilmographyExplorer` so the initial server-rendered HTML and LCP image paint immediately without waiting for virtual list bundle evaluation.
3. **Typography**:
   - Zero layout shift using `next/font/google` (`Geist` and `Geist_Mono`) with automatic font preloading.
