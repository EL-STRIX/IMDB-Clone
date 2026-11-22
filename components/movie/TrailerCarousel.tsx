"use client";

import React, { useState, useEffect, useCallback } from "react";
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

  if (!trailers || trailers.length === 0) {
    return (
      <section className="mt-8 mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-theme-fg mb-4">
          Videos & Trailers
        </h2>
        <div className="aspect-video w-full rounded-xl bg-theme-surface border border-theme-border flex flex-col items-center justify-center p-6 text-center text-theme-fg-muted">
          <p className="text-base font-medium">No official trailers available</p>
          <p className="text-sm mt-1">Check back later for promotional video updates.</p>
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

  return (
    <section className="mt-8 mb-12">
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
        <span className="text-xs text-theme-fg-muted">
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
                onClick={() => setActiveVideo(currentTrailer)}
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

      {/* Dot Indicators */}
      {trailers.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {trailers.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setPage([index, index > currentIndex ? 1 : -1])}
                aria-label={`Go to slide ${index + 1}`}
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

      {/* Video Player Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={activeVideo.name}
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
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
