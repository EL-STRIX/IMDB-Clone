# IMDb Clone — Front-End Internship Project

A production-grade, highly resilient IMDb Clone built with Next.js 16 (App Router with Turbopack), TypeScript, Tailwind CSS, Framer Motion, and TanStack Query. 

Engineered for zero-CLS performance, offline persistence, WCAG 2.1 AA accessibility, statistical ranking models, and real-time community engagement.

---

## 🏆 Internship Task Status

All 6 internship tasks spanning 50 days of sequential development have been completed, verified, and documented:

| Task / Milestone | Days | Core Focus Area | Status | Documentation |
| :--- | :---: | :--- | :---: | :---: |
| **Phase 0: Base Project** | Days 1–5 | Next.js architecture, responsive layout, Navbar, TMDB integration, Vercel deployment | **Completed** | [Base Overview](docs/internship-50-day-plan-v3.md) |
| **Task 1: API Layer** | Days 6–15 | Multi-provider abstraction (TMDb/OMDb), cursor pagination, token bucket rate limiter, circuit breaker, stale-while-revalidate caching, Core Web Vitals telemetry | **Completed** | [TASK-1.md](docs/TASK-1.md) |
| **Task 2: Theming** | Days 16–19 | Light/Dark/High-Contrast/System semantic CSS tokens, flash-free `<ThemeProvider>`, nonce-based CSP, zero-CLS layout stability | **Completed** | [TASK-5-THEMING.md](docs/TASK-5-THEMING.md) |
| **Task 3: Movie Details** | Days 20–26 | Suspense streaming, OMDb ratings stream, trailer carousel with autoplay & roving tabindex, request coalescing, ETag caching, axe-core a11y | **Completed** | [TASK-3.md](docs/TASK-3.md) |
| **Task 4: Actor Profile** | Days 27–33 | ISR actor pages (`generateStaticParams`), on-demand revalidation webhook, virtualized filmography explorer, parallel awards slot, Schema.org JSON-LD, i18n dictionary | **Completed** | [TASK-2.md](docs/TASK-2.md) |
| **Task 5: Watchlist** | Days 34–40 | Offline-first IndexedDB repository with LocalStorage fallback, cross-tab synchronization (`BroadcastChannel`), optimistic UI with timed undo toast, Last-Write-Wins (LWW) conflict resolution | **Completed** | [TASK-6.md](docs/TASK-6.md) |
| **Task 6: Review System** | Days 41–48 | Cryptographic Web Crypto HMAC sessions, CRUD API, rolling-window rate limiter, UUID idempotency deduplication, IndexedDB draft autosave, Wilson score 95% CI ranking, soft-delete undo, diff-based revision history, profanity/abuse moderation, live SSE review stream | **Completed** | [TASK-4.md](docs/TASK-4.md) |
| **Phase 7: Polish & Submit** | Days 49–50 | Full-app responsiveness sweep (360px, 768px, 1024px), axe-core accessibility audit, documentation, incognito audit, final submission | **Completed** | [Final Checklist](#final-submission-checklist) |

---

## 🚀 Key Architectural Highlights

### 1. Resilient API & Telemetry Layer (`lib/api/`, `lib/resilience/`)
- Unified multi-provider abstraction combining TMDb and OMDb data sources with automatic failover.
- In-memory Token Bucket rate limiter (40 req/10s burst smoothing) preventing API quota exhaustion.
- State-machine Circuit Breaker (Closed $\to$ Open $\to$ Half-Open) isolating downstream third-party outages.
- Request coalescing (singleflight) eliminating redundant parallel requests for identical movie resources.
- Real-time Core Web Vitals beacon reporting to `/api/telemetry` tracking LCP, FID, CLS, and TTFB.

### 2. Zero-CLS Flash-Free Theming (`components/ThemeProvider.tsx`, `app/globals.css`)
- Semantic design token architecture across **Dark** (default), **Light**, **High Contrast (HC)**, and **System** preference.
- Inline blocking pre-render script setting `data-theme` prior to DOM paint, guaranteeing zero flash of unstyled content (FOUC) and zero cumulative layout shift (CLS).
- High Contrast mode engineered specifically for WCAG AAA compliance with enhanced borders and prominent focus rings.

### 3. Movie Details & Suspense Streaming (`app/movie/[id]/`)
- Partial Prerendering (PPR) streaming core movie metadata instantly while streaming slower OMDb Rotten Tomatoes scores and cast credits in parallel Suspense boundaries.
- Accessible YouTube trailer carousel featuring roving tabindex keyboard navigation, auto-focus management, modal trap, and Escape key dismissal.

### 4. Actor Profiles & Virtualized Filmography (`app/actor/[id]/`)
- Incremental Static Regeneration (ISR) pre-rendering popular actor profiles with `revalidate = 3600` and on-demand webhook revalidation (`/api/revalidate/actor`).
- High-performance virtualized list (`@tanstack/react-virtual`) rendering 100+ actor credits smoothly at 60fps with year and role filter tabs.
- Multi-language dictionary switcher (`en`, `es`, `fr`, `de`, `ja`) with persistent client locale state.
- Rich Search Engine Optimization via `schema.org/Person` structured JSON-LD.

### 5. Offline-First Watchlist & Cross-Tab Sync (`lib/watchlist/`, `components/watchlist/`)
- Multi-tier local persistence: Primary storage in **IndexedDB** (`idb`), automated fallback to **LocalStorage**.
- Live cross-tab sync through native `BroadcastChannel('imdb_watchlist_channel')` and fallback `storage` listeners.
- Real-time `SyncStatusIndicator` displaying **Synced**, **Syncing**, or **Offline** status in the header.
- Optimistic mutations with automatic rollback, animated Framer Motion feedback, and accessible timed "Undo" toasts.
- Deterministic Last-Write-Wins (LWW) conflict resolution reconciling offline queued mutations with the server.

### 6. Comprehensive Review & Rating System (`lib/reviews/`, `components/reviews/`)
- Native Web Crypto HMAC-SHA256 authenticated sessions with 1-click critic, user, and admin demo identities.
- UUID-based idempotency keys eliminating duplicate review submissions under intermittent connectivity.
- Offline IndexedDB draft autosave with 800ms debounce and auto-restoration prompt.
- **Statistical Wilson Score 95% Confidence Lower-Bound** ranking:
  $$\text{Score} = \frac{\hat{p} + \frac{z^2}{2n} - z\sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}} \quad (z = 1.96)$$
- Controversy sorting highlighting polar reviews with near 50/50 upvote-to-downvote balance.
- Soft-delete with 5-second timed Undo toast and diff-based revision history modal for edited reviews.
- Abuse reporting with auto-moderation hiding reviews with $\ge 3$ flags behind content warning overlays.
- Real-time Server-Sent Events (SSE) stream (`/api/movies/[id]/reviews/stream`) delivering live updates across tabs.
- Framer Motion `layout` animations reordering reviews smoothly without DOM jump during sort transitions.

---

## 🛠️ Getting Started & Setup

### Prerequisites
- **Node.js**: `v20.0.0` or higher (tested on Node `v24.15.0`)
- **npm**: `v9.0.0` or higher

### 1. Clone & Install
```bash
git clone https://github.com/your-username/imdb-clone-frontend.git
cd imdb-clone-frontend
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your API credentials:
```env
# TMDb API Key (v3) - Required
TMDB_API_KEY=your_tmdb_api_key_here

# OMDb API Key - Required for Rotten Tomatoes & Metacritic scores
OMDB_API_KEY=your_omdb_api_key_here

# Secret for on-demand ISR revalidation endpoints
REVALIDATE_SECRET=your_revalidation_secret_here

# Optional: Session encryption secret for Web Crypto HMAC
SESSION_SECRET=your_session_hmac_secret_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Test Suite
```bash
# Run full Vitest suite (28 test files, 186 unit and integration tests)
npm test

# Run tests in watch mode
npx vitest

# Run Playwright end-to-end tests
npx playwright test
```

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🧪 Verification & Test Suite Summary

The application includes an extensive automated test suite covering unit, integration, accessibility, and end-to-end scenarios:

```
Test Files  28 passed (28)
     Tests  186 passed (186)
```

| Domain | Test File | Test Count | Key Invariants Tested |
| :--- | :--- | :---: | :--- |
| **Resilience & Caching** | `tests/resilience.test.tsx` | 3 | Circuit breaker tripping, friendly error boundary fallbacks |
| **Token Bucket** | `lib/resilience/tokenBucket.test.ts` | 1 | Request spacing, capacity overflow throttling |
| **Request Coalescing** | `tests/coalesce.test.ts` | 5 | Singleflight deduplication of concurrent fetches |
| **Theming System** | `tests/theming.test.tsx` | 5 | Light/Dark/HC modes, documentElement attributes, cookie storage |
| **Movie Details & A11y** | `tests/a11y.test.tsx` | 5 | Trailer carousel keyboard roving tabindex, modal trap, zero axe violations |
| **Actor Profile & ISR** | `tests/actor.test.tsx` | 7 | JSON-LD schema generation, metadata, profile details |
| **Parallel Slots & Awards** | `tests/actorSlots.test.tsx`, `tests/awards.test.ts` | 12 | Parallel awards slot streaming, fallback states |
| **Filmography Explorer** | `tests/filmography.test.tsx` | 9 | Virtualization, role/year/genre filters, sort criteria |
| **IndexedDB Watchlist** | `tests/indexedDbRepository.test.ts`, `tests/watchlistRepository.test.ts` | 20 | Dual-store IndexedDB, LocalStorage fallback, FIFO mutation queue |
| **Watchlist UI & Undo** | `tests/watchlistButton.test.tsx`, `tests/watchlistPage.test.tsx` | 12 | Optimistic updates, undo toast restoration, filter tabs, drag reorder |
| **Multi-Tab Sync** | `tests/crossTabSync.test.tsx`, `tests/watchlistSync.test.ts` | 15 | `BroadcastChannel` propagation, LWW conflict timestamp resolution |
| **Watchlist E2E** | `tests/watchlistE2E.test.ts` | 5 | Offline mutation queue drainage upon reconnect |
| **Auth & Sessions** | `tests/auth.test.tsx`, `tests/authGuard.test.ts` | 14 | Web Crypto HMAC-SHA256 tokens, demo login switcher, route guards |
| **Reviews API** | `tests/reviewsApi.test.ts` | 13 | CRUD endpoints, Zod schema validation, rolling-window rate limiter |
| **Optimistic Form & Drafts** | `tests/reviewForm.test.tsx`, `tests/reviewDrafts.test.tsx` | 11 | UUID idempotency keys, rollback on error, 800ms debounced autosave |
| **Statistical Ranking** | `tests/reviewRanking.test.ts` | 13 | Wilson score 95% confidence lower-bound, controversy calculation |
| **Revision History & Undo** | `tests/reviewHistory.test.tsx` | 5 | Soft-delete, timed undo restoration, diff modal history |
| **Moderation & Live SSE** | `tests/reviewModeration.test.tsx` | 15 | Leetspeak profanity filter, abuse flagging API, 3-flag warning overlay, SSE stream |
| **Pagination & Animations** | `tests/reviewPagination.test.tsx` | 4 | 105 mock reviews load-testing, pagination windowing, Framer Motion reordering |
| **Comprehensive A11y Sweep** | `tests/a11ySweep.test.tsx` | 3 | Full-app axe-core audit of Navbar, Watchlist, Reviews, and Toast regions |

---

## 📱 Responsive Design Matrix

Tested and optimized across all standard screen widths:
- **Mobile (360px–480px)**: Compact navigation bar with dedicated watchlist icon shortcut, 2-column movie grid, full-width touch-target buttons ($\ge 44\text{px}$), collapsible moderation alerts, and touch-friendly drag handles.
- **Tablet (768px–1023px)**: 3-column movie grid, side-by-side movie hero details with poster thumbnail, responsive filter bar.
- **Desktop (1024px+)**: 4-column movie grid, expansive trailer carousel with roving tabindex, full sidecar ratings, and multi-tier review layout.

---

## 🔒 Known Limitations & Production Considerations

1. **In-Memory Store Persistence**:
   - The review store (`lib/reviews/store.ts`) uses an in-memory concurrent Map architecture for fast zero-latency demonstration. In multi-instance serverless deployments, swap with a distributed datastore (e.g., PostgreSQL with Prisma/Drizzle or Redis) by replacing the store repository methods.
2. **Third-Party API Rate Limits**:
   - Free-tier TMDb and OMDb keys have upstream quota constraints. The internal token-bucket rate limiter and stale-while-revalidate caching layers shield clients from quota breaches.
3. **SSE Connection Limits in HTTP/1.1**:
   - HTTP/1.1 browsers limit concurrent connections to 6 per domain. In production, deploy on HTTP/2 or HTTP/3 (standard on Vercel/Cloudflare) to enable multiplexed SSE channels.

---

## Final Submission Checklist

- [x] **All 6 tasks completed**: Base Project, API Layer, Theming, Movie Details, Actor Profile, Watchlist, and Review System.
- [x] **Live URL deployed**: Deployed and accessible on Vercel with clean partial pre-rendering and dynamic route streaming.
- [x] **GitHub repo public**: Public repository with full commit history tracking all 50 days of implementation.
- [x] **No API keys committed**: `.env.local` strictly gitignored; clean `.env.example` template provided.
- [x] **Fully responsive**: Verified across 360px, 768px, and 1024px viewports with zero horizontal overflow.
- [x] **Complete documentation**: Full documentation available for every task in `docs/` (`TASK-1.md` through `TASK-6.md`).
- [x] **Incognito verified**: All core features, browsing, search, trailers, actor profiles, offline watchlist, and reviews accessible publicly without mandatory login.
- [x] **Automated test suite**: 28 test suites, 186 tests passing with 100% success rate.
