import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import SyncStatusIndicator from "@/components/watchlist/SyncStatusIndicator";
import AuthButton from "@/components/auth/AuthButton";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-theme-header border-b border-theme-border text-theme-fg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="bg-theme-primary text-black font-black text-xl px-2.5 py-0.5 rounded tracking-tight hover:opacity-95 transition-opacity"
          >
            IMDb
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-theme-fg/80">
            <Link href="/" className="hover:text-theme-fg transition-colors">
              Movies
            </Link>
            <Link href="#" className="hover:text-theme-fg transition-colors">
              TV Shows
            </Link>
            <Link href="/watchlist" className="hover:text-theme-fg transition-colors">
              Watchlist
            </Link>
          </nav>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-xl mx-2">
          <form action="/search" method="GET" className="relative">
            <input
              type="text"
              name="query"
              placeholder="Search IMDb..."
              required
              className="w-full bg-theme-card border border-theme-border text-theme-fg placeholder:text-theme-fg/50 text-sm rounded-md px-3 py-2 pl-9 focus:outline-none focus:ring-1 focus:ring-theme-ring"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute left-3 top-2.5 h-4 w-4 text-theme-fg/60 hover:text-theme-fg cursor-pointer"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </form>
        </div>

        {/* Right side nav / actions */}
        <div className="flex items-center gap-3 text-sm font-medium text-theme-fg/80">
          <SyncStatusIndicator />
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
