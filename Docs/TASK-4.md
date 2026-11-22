# Task 4: Interactive Review & Rating System

## Overview
A production-grade, highly resilient community review and rating system built with Next.js 16, TypeScript, TanStack Query, Framer Motion, and Tailwind CSS. The architecture combines optimistic mutations, multi-tier client persistence (IndexedDB drafts), statistical ranking models (Wilson score lower bound), soft-deletion with timed undo, diff-based revision history, community abuse moderation, and live Server-Sent Events (SSE).

---

## Key Deliverables & Implementation

### 1. Cryptographic Session & Auth Architecture (`lib/auth/`)
- Native Web Crypto API HMAC-SHA256 session token generation and verification (`crypto.subtle`).
- Zero external package dependency: Edge, Server Component, and Route Handler compatible across Next.js 16.
- Multi-role demo accounts: **Critic (Verified)**, **User (Cinephile)**, and **Admin**.
- Client `<SessionProvider>` context with 1-click account switching and persistent session cookie tracking.
- Protected route guards (`requireAuth`, `requireRole`) returning standardized 401/403 responses.

### 2. Validated Review CRUD & In-Memory Store (`lib/reviews/`)
- **Strict Zod v4 Schemas (`lib/reviews/schema.ts`)**:
  - `CreateReviewSchema`: Rating (1–10), title (3–100 chars), content (10–5000 chars), spoiler boolean, idempotency key.
  - `UpdateReviewSchema`: Partial updates preserving review authorship.
  - `ReviewRevisionSchema`: Snapshot of previous title, content, rating, and timestamp.
  - `FlagReviewSchema`: Abuse categorization (`spam`, `harassment`, `spoilers`, `inappropriate`, `other`).
- **In-Memory Store (`lib/reviews/store.ts`)**:
  - Fast O(1) indexed lookups for movies and individual reviews.
  - Concurrent voting mechanics and idempotent deduplication.
  - Rolling-window rate limiter (`lib/reviews/rateLimiter.ts`): enforces 5 review creations/min per user with `Retry-After` headers.

### 3. Optimistic Submission & Draft Autosave (`components/reviews/`, `lib/reviews/draftStore.ts`)
- **Optimistic UI (`ReviewForm.tsx`)**:
  - Instant insertion into TanStack Query cache (`movie-reviews`) before network completion.
  - Cryptographic UUID idempotency key attached to every submission payload to prevent duplicate creations on network retries.
  - Automatic rollback on API errors with toast notifications.
- **Offline Draft Autosave (`draftStore.ts`)**:
  - Dual-layer storage: Primary in **IndexedDB** (`idb`), automatic fallback to **LocalStorage**.
  - Debounced background saving (800ms) while typing.
  - Auto-restore prompt on page revisit with "Discard Draft" option.
  - Complete cleanup on successful post.

### 4. Statistical Ranking Strategies (`lib/reviews/ranking.ts`)
- **Wilson Score 95% Confidence Interval**:
  - Uses the Wilson score lower-bound formulation with $z = 1.96$ to rank reviews by statistical helpfulness:
    $$\hat{p} = \frac{\text{up}}{\text{total}}, \quad \text{score} = \frac{\hat{p} + \frac{z^2}{2n} - z\sqrt{\frac{\hat{p}(1-\hat{p})}{n} + \frac{z^2}{4n^2}}}{1 + \frac{z^2}{n}}$$
  - Prevents a review with a single 5-star upvote from improperly outranking an established review with 150 upvotes and 5 downvotes.
- **Controversy Sorting**:
  - Highlights heavily debated reviews with high total volume and near 50/50 upvote-to-downvote balance:
    $$\text{balance} = 1 - \frac{|\text{up} - \text{down}|}{\text{total}}, \quad \text{controversy} = \text{total}^{0.7} \times \text{balance}$$
- **Most Recent**:
  - Chronological ISO 8601 ordering.

### 5. Soft-Delete, Timed Undo & Revision History (`components/reviews/ReviewHistoryModal.tsx`)
- Soft-delete marking `deletedAt` without destroying relational data.
- Timed 5-second "Undo" toast with one-click restoration via `POST /api/reviews/[id]/restore`.
- Diff-based revision history snapshotting on edits (`POST /api/reviews/[id]`), viewable via the `(edited)` history modal.

### 6. Abuse Moderation & Profanity Filtering (`lib/reviews/profanityFilter.ts`)
- Content moderation filter with leetspeak normalization and regex word-boundary checks, preventing Scunthorpe false positives.
- `POST /api/reviews/[id]/flag` endpoint with self-reporting prevention and duplicate flag restriction.
- Automated moderation threshold: Reviews flagged by $\ge 3$ unique users are masked behind a content warning accordion overlay.

### 7. Real-Time Updates via Server-Sent Events (`/api/movies/[id]/reviews/stream`)
- Pub/sub event distribution using `reviewEventBus` (`lib/reviews/events.ts`).
- Server-Sent Events route handler streaming creations, votes, and moderation events with periodic keep-alive pings.
- Client SSE listener automatically invalidating query caches and displaying a live pulsing status badge.

### 8. Framer Motion Layout Reordering & Smooth Pagination
- `<motion.article layout ...>` layout animations reordering reviews smoothly without DOM jump when changing sort orders.
- Paginated windowing (5 reviews per page with "Load More" and "Show All") preventing DOM bloat and scroll jank on 100+ review datasets.

---

## Test & Verification Suite

| Test File | Focus Area | Status |
| :--- | :--- | :---: |
| `tests/auth.test.tsx` | Web Crypto HMAC session tokens, demo login, cookie handling | **Passed** |
| `tests/authGuard.test.ts` | Route protection, 401/403 status codes, role validation | **Passed** |
| `tests/reviewsApi.test.ts` | Review CRUD endpoints, Zod validation, rate limiter | **Passed** |
| `tests/reviewForm.test.tsx` | Optimistic submission, UUID idempotency, rollback on error | **Passed** |
| `tests/reviewDrafts.test.tsx` | IndexedDB draft autosave, 800ms debounce, auto-restore | **Passed** |
| `tests/reviewRanking.test.ts` | Wilson score 95% CI formulation, controversy ranking | **Passed** |
| `tests/reviewHistory.test.tsx` | Soft-delete, timed undo toast, revision history modal | **Passed** |
| `tests/reviewModeration.test.tsx` | Profanity filter, flag API, $\ge 3$ flag overlay, SSE route | **Passed** |
| `tests/reviewPagination.test.tsx` | 105 mock reviews load-testing, pagination, reorder speed | **Passed** |

**Total Suite Verification**: 27 test files, 183 tests passed with 0 failures.
Production build verified with zero TypeScript or route compilation errors.
