# Task 1: API Layer Architecture & Resilience

## Overview
A resilient, normalized provider abstraction layer built over TMDb and OMDb with client and server caching, rate limiting, retry with jitter, circuit breaker fallback, and telemetry.

## Key Deliverables & Implementation
1. **Provider Abstraction (`lib/api/`)**:
   - Normalized types: `Movie`, `MovieDetails`, `Person`, `CursorResult<T>` ([`lib/api/types.ts`](../lib/api/types.ts)).
   - Provider interface: `MovieProvider` ([`lib/api/provider.ts`](../lib/api/provider.ts)).
   - Implementations: `TmdbProvider` ([`lib/api/tmdb.ts`](../lib/api/tmdb.ts)) and `OmdbProvider` ([`lib/api/omdb.ts`](../lib/api/omdb.ts)).
2. **Cursor Pagination**:
   - Opaque base64 cursor encoding/decoding ([`lib/api/cursor.ts`](../lib/api/cursor.ts)).
   - Infinite scroll using `IntersectionObserver` and incremental merge ([`lib/api/merge.ts`](../lib/api/merge.ts)).
3. **Client Caching & Prefetching**:
   - TanStack Query with `staleTime: 5m`, `gcTime: 30m`, `refetchOnWindowFocus: true`, `refetchOnReconnect: true`.
   - Hover and focus prefetching on movie cards.
4. **Resilience Layer (`lib/resilience/`)**:
   - **Rate Limiting**: Token bucket algorithm ([`lib/resilience/tokenBucket.ts`](../lib/resilience/tokenBucket.ts)).
   - **Retry Mechanism**: Exponential backoff with jitter and `Retry-After` header support ([`lib/resilience/retry.ts`](../lib/resilience/retry.ts)).
   - **Circuit Breaker**: `CLOSED`, `OPEN`, and `HALF_OPEN` states with automatic fallback data on repeated failures ([`lib/resilience/circuitBreaker.ts`](../lib/resilience/circuitBreaker.ts)).
5. **Server-Side Caching & Revalidation**:
   - Tagged resource caching (`movies`, `movie-{id}`) via Next.js cache ([`lib/api/cached.ts`](../lib/api/cached.ts)).
   - Secret-protected on-demand revalidation endpoint ([`app/api/revalidate/route.ts`](../app/api/revalidate/route.ts)).
6. **Telemetry & Error Boundaries**:
   - Core Web Vitals beaconed to `/api/telemetry` ([`components/WebVitals.tsx`](../components/WebVitals.tsx)).
   - Structured request and error console tracing ([`lib/resilience/telemetry.ts`](../lib/resilience/telemetry.ts)).
   - Granular `error.tsx` boundaries and zero-layout-shift Skeletons.
7. **Test Suite**:
   - 429 burst retry test, 500 circuit breaker test, and UI fallback component test ([`tests/resilience.test.tsx`](../tests/resilience.test.tsx)).
