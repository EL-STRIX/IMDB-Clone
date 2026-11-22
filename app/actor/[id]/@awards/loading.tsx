import React from "react";

export default function AwardsLoading() {
  return (
    <div className="p-5 rounded-xl bg-theme-surface border border-theme-border shadow-sm animate-pulse h-full">
      <div className="h-5 w-44 bg-theme-surface-subtle rounded mb-2" />
      <div className="h-3 w-56 bg-theme-surface-subtle rounded mb-4" />
      <div className="space-y-2.5">
        <div className="h-12 w-full bg-theme-surface-subtle rounded-lg" />
        <div className="h-12 w-full bg-theme-surface-subtle rounded-lg" />
        <div className="h-12 w-full bg-theme-surface-subtle rounded-lg" />
      </div>
    </div>
  );
}
