"use client";

import React, { useEffect, useRef } from "react";
import { Review, ReviewRevision } from "@/lib/reviews/schema";

interface ReviewHistoryModalProps {
  review: Review;
  onClose: () => void;
}

export default function ReviewHistoryModal({ review, onClose }: ReviewHistoryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const revisions: ReviewRevision[] = review.revisions || [];

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-2xl bg-theme-surface border border-theme-border shadow-2xl p-6 text-theme-fg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
          <div>
            <h2 id="history-modal-title" className="text-base font-extrabold text-theme-fg">
              Edit History
            </h2>
            <p className="text-xs text-theme-fg-muted">
              {revisions.length} previous {revisions.length === 1 ? "revision" : "revisions"} for this review
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit history dialog"
            className="p-1 rounded-lg text-theme-fg-muted hover:text-theme-fg hover:bg-theme-surface-subtle transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 py-4 flex-1">
          {/* Current Version */}
          <div className="p-4 rounded-xl border border-theme-primary/40 bg-theme-surface-subtle">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-extrabold text-theme-primary uppercase tracking-wider text-[10px]">
                ● Current Version
              </span>
              <time className="text-theme-fg-muted text-[11px]">
                {new Date(review.updatedAt).toLocaleString()}
              </time>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-amber-400">★ {review.rating}/10</span>
              <span className="text-xs font-bold text-theme-fg">{review.title}</span>
            </div>
            <p className="text-xs text-theme-fg/80 leading-relaxed whitespace-pre-line">
              {review.content}
            </p>
          </div>

          {/* Previous Revisions */}
          {revisions.map((rev, index) => {
            const versionNumber = revisions.length - index;
            return (
              <div
                key={rev.id || index}
                className="p-4 rounded-xl border border-theme-border bg-theme-surface opacity-85"
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-theme-fg-muted text-[11px]">
                    Version {versionNumber}
                  </span>
                  <time className="text-theme-fg-muted text-[11px]">
                    {new Date(rev.timestamp).toLocaleString()}
                  </time>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-theme-fg-muted">★ {rev.rating}/10</span>
                  <span className="text-xs font-bold text-theme-fg-muted">{rev.title}</span>
                </div>
                <p className="text-xs text-theme-fg-muted leading-relaxed whitespace-pre-line">
                  {rev.content}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-theme-border/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-theme-surface-subtle border border-theme-border text-theme-fg hover:bg-theme-border/40 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
