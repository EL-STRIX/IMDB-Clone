import React from "react";

export default function SimilarLoading() {
  return (
    <div className="p-5 rounded-xl bg-theme-surface border border-theme-border shadow-sm animate-pulse">
      <div className="h-5 w-52 bg-theme-surface-subtle rounded mb-2" />
      <div className="h-3 w-80 bg-theme-surface-subtle rounded mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center p-2 rounded-xl bg-theme-surface-subtle">
            <div className="w-16 h-16 rounded-full bg-theme-surface mb-2" />
            <div className="h-3 w-16 bg-theme-surface rounded mb-1" />
            <div className="h-2 w-12 bg-theme-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
