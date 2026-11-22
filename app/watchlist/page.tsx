import type { Metadata } from "next";
import { Suspense } from "react";
import WatchlistView, { WatchlistSkeleton } from "@/components/watchlist/WatchlistView";

export const metadata: Metadata = {
  title: "Your Watchlist | IMDb Clone",
  description: "Track movies you want to watch with offline persistence and cross-tab sync.",
};

export default function WatchlistPage() {
  return (
    <main className="min-h-[calc(100vh-8rem)]">
      <Suspense fallback={<WatchlistSkeleton />}>
        <WatchlistView />
      </Suspense>
    </main>
  );
}
