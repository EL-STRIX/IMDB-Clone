"use client";

import React from "react";

export default function AwardsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-5 rounded-xl bg-theme-surface border border-rose-500/30 text-xs shadow-sm">
      <h3 className="font-semibold text-rose-400 mb-1">Failed to load awards</h3>
      <p className="text-theme-fg-muted mb-3">Unable to retrieve accolade information.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-2.5 py-1 rounded bg-theme-surface-subtle border border-theme-border text-theme-fg hover:border-theme-primary text-xs font-medium"
      >
        Retry
      </button>
    </div>
  );
}
