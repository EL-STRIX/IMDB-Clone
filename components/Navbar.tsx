import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#121212] border-b border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="bg-[#f5c518] text-black font-black text-xl px-2.5 py-0.5 rounded tracking-tight hover:opacity-95 transition-opacity"
          >
            IMDb
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-zinc-300">
            <Link href="/" className="hover:text-white transition-colors">
              Movies
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              TV Shows
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Watchlist
            </Link>
          </nav>
        </div>

        {/* Search Input Placeholder */}
        <div className="flex-1 max-w-xl mx-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search IMDb..."
              disabled
              className="w-full bg-[#1f1f1f] border border-zinc-700 text-white placeholder-zinc-400 text-sm rounded-md px-3 py-2 pl-9 focus:outline-none cursor-not-allowed"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400"
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
          </div>
        </div>

        {/* Right side nav / actions */}
        <div className="flex items-center gap-4 text-sm font-medium text-zinc-300">
          <Link href="#" className="hover:text-white transition-colors hidden sm:inline-block">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
