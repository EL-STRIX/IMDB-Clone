"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Home page error:", error);
  }, [error]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-sm text-zinc-400 mb-6">
        Could not load the movie list. Please try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-4 py-2 bg-[#f5c518] text-black font-semibold text-sm rounded hover:bg-[#e4b612] transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
