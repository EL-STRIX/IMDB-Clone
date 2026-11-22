"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo, useReducedMotion } from "framer-motion";
import { Trailer } from "@/lib/api/types";

interface TrailerCarouselProps {
  trailers: Trailer[];
  movieTitle?: string;
}

export function TrailerCarouselSkeleton() {
  return (
    <div className="mt-8 mb-12 animate-pulse">
      <div className="h-7 w-36 bg-theme-surface-subtle rounded mb-4" />
      <div className="aspect-video w-full rounded-xl bg-theme-surface-subtle border border-theme-border" />
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-theme-surface-subtle" />
        ))}
      </div>
    </div>
  );
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

export default function TrailerCarousel({
  trailers,
  movieTitle = "Movie",
}: TrailerCarouselProps) {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [activeVideo, setActiveVideo] = useState<Trailer | null>(null);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);

  const reducedMotion = useReducedMotion();
  const triggerRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const paginate = useCallback(
    (newDirection: number) => {
      setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
    },
    []
  );

  // Tab visibility listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Compute overall pause state
  const isPaused =
    isManuallyPaused ||
    isHovered ||
    isFocused ||
    isTabHidden ||
    Boolean(reducedMotion) ||
    Boolean(activeVideo) ||
    trailers.length <= 1;

  // Autoplay interval
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      paginate(1);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, paginate]);

  // Focus trapping and Escape key handler for dialog
  useEffect(() => {
    if (!activeVideo) return;

    // Focus the close button when dialog opens
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), iframe'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeVideo]);

  const openModal = (trailer: Trailer, e: React.MouseEvent<HTMLElement>) => {
    triggerRef.current = e.currentTarget;
    setActiveVideo(trailer);
  };

  const closeModal = () => {
    setActiveVideo(null);
    // Return focus to trigger element
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 50);
  };

  if (!trailers || trailers.length === 0) {
    return (
      <section
        className="mt-8 mb-12"
        role="region"
        aria-roledescription="carousel"
        aria-label={`${movieTitle} Videos & Trailers`}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-theme-fg mb-4">
          Videos & Trailers
        </h2>
        <div className="aspect-video w-full rounded-xl bg-theme-surface border border-theme-border flex flex-col items-center justify-center p-6 text-center text-theme-fg-muted shadow-sm">
          <div className="w-14 h-14 rounded-full bg-theme-surface-subtle flex items-center justify-center text-theme-fg-muted mb-3 border border-theme-border">
            <svg
              className="w-7 h-7 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
              <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-base font-semibold text-theme-fg">Trailer unavailable</p>
          <p className="text-sm mt-1 max-w-sm">
            We couldn&apos;t load the promotional trailers for this title right now.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-theme-accent text-zinc-950 hover:bg-theme-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Retry</span>
          </button>
        </div>
      </section>
    );
  }

  const currentIndex = ((page % trailers.length) + trailers.length) % trailers.length;
  const currentTrailer = trailers[currentIndex];

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const swipeThreshold = 50;
    const velocityThreshold = 400;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      paginate(1);
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      paginate(-1);
    }
  };

  // Roving tabindex arrow navigation on dots
  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    let targetIndex = currentIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      targetIndex = (currentIndex + 1) % trailers.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      targetIndex = (currentIndex - 1 + trailers.length) % trailers.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = trailers.length - 1;
    } else {
      return;
    }

    setPage([targetIndex, targetIndex > currentIndex ? 1 : -1]);
    tabRefs.current[targetIndex]?.focus();
  };

  return (
    <section
      className="mt-8 mb-12"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${movieTitle} Videos & Trailers`}
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-theme-fg">
            Videos & Trailers
          </h2>
          {trailers.length > 1 && (
            <button
              type="button"
              onClick={() => setIsManuallyPaused((prev) => !prev)}
              aria-label={isManuallyPaused ? "Resume autoplay" : "Pause autoplay"}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-theme-surface border border-theme-border text-theme-fg-muted hover:text-theme-fg hover:border-theme-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
            >
              {isManuallyPaused ? (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Play</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                  <span>Pause</span>
                </>
              )}
            </button>
          )}
        </div>
        <span
          className="text-xs text-theme-fg-muted"
          aria-live="polite"
          aria-label={`Slide ${currentIndex + 1} of ${trailers.length}`}
        >
          {currentIndex + 1} of {trailers.length}
        </span>
      </div>

      {/* Carousel Container with Hover & Focus Listeners */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg border border-theme-border"
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${currentIndex + 1} of ${trailers.length}: ${currentTrailer.name}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
          >
            {/* Active Slide Image */}
            <Image
              src={currentTrailer.thumbnailUrl}
              alt={currentTrailer.name}
              fill
              priority={currentIndex === 0}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30 pointer-events-none" />

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => openModal(currentTrailer, e)}
                className="group p-4 rounded-full bg-black/60 hover:bg-theme-accent text-white hover:text-black transition-all backdrop-blur-sm border border-white/20 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-theme-ring"
                aria-label={`Play trailer: ${currentTrailer.name}`}
              >
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>

            {/* Trailer Title / Metadata */}
            <div className="absolute bottom-4 left-4 right-16 pointer-events-none">
              <span className="inline-block px-2 py-0.5 mb-1.5 text-xs font-semibold rounded bg-theme-accent text-black">
                {currentTrailer.type || "Trailer"}
              </span>
              <p className="text-white font-medium text-sm sm:text-base line-clamp-1 drop-shadow-md">
                {currentTrailer.name}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev Button */}
        {trailers.length > 1 && (
          <button
            type="button"
            onClick={() => paginate(-1)}
            aria-label="Previous trailer"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-colors border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next Button */}
        {trailers.length > 1 && (
          <button
            type="button"
            onClick={() => paginate(1)}
            aria-label="Next trailer"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm transition-colors border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Lazy-loaded Non-Active Slides */}
      <div className="hidden" aria-hidden="true">
        {trailers.map((t, idx) => {
          if (idx === currentIndex) return null;
          return (
            <Image
              key={t.id}
              src={t.thumbnailUrl}
              alt=""
              width={320}
              height={180}
              loading="lazy"
            />
          );
        })}
      </div>

      {/* Dot Indicators with Roving Tabindex & ARIA */}
      {trailers.length > 1 && (
        <div
          role="tablist"
          aria-label="Trailer slides navigation"
          onKeyDown={handleTabKeyDown}
          className="flex justify-center items-center gap-2 mt-4"
        >
          {trailers.map((t, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Slide ${index + 1}: ${t.name}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setPage([index, index > currentIndex ? 1 : -1])}
                className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
                  isActive
                    ? "w-6 bg-theme-accent"
                    : "w-2 bg-theme-fg-muted/40 hover:bg-theme-fg-muted"
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Focus-trapped Video Player Dialog */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trailer-dialog-title"
          onClick={closeModal}
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="trailer-dialog-title" className="sr-only">
              {movieTitle} - {activeVideo.name}
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeModal}
              aria-label="Close video player"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeVideo.key}?autoplay=1&rel=0`}
              title={`${movieTitle} - ${activeVideo.name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </section>
  );
}
