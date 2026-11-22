import React from "react";

export default function SocialLoading() {
  return (
    <div className="p-5 rounded-xl bg-theme-surface border border-theme-border shadow-sm animate-pulse h-full">
      <div className="h-5 w-40 bg-theme-surface-subtle rounded mb-2" />
      <div className="h-3 w-56 bg-theme-surface-subtle rounded mb-4" />
      <div className="flex flex-wrap gap-2">
        <div className="h-8 w-24 bg-theme-surface-subtle rounded-lg" />
        <div className="h-8 w-28 bg-theme-surface-subtle rounded-lg" />
        <div className="h-8 w-20 bg-theme-surface-subtle rounded-lg" />
      </div>
    </div>
  );
}
