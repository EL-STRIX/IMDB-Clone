import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-theme-header border-t border-theme-border text-theme-fg/70 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-theme-fg/90">
          <Link href="#" className="hover:text-theme-primary transition-colors">
            Help
          </Link>
          <Link href="#" className="hover:text-theme-primary transition-colors">
            Site Index
          </Link>
          <Link href="#" className="hover:text-theme-primary transition-colors">
            IMDbPro
          </Link>
          <Link href="#" className="hover:text-theme-primary transition-colors">
            Box Office Mojo
          </Link>
          <Link href="#" className="hover:text-theme-primary transition-colors">
            License IMDb Data
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-theme-fg/60">
          <Link href="#" className="hover:underline">
            Conditions of Use
          </Link>
          <Link href="#" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:underline">
            Your Ads Privacy Choices
          </Link>
        </div>

        <p className="text-theme-fg/50 text-center">
          &copy; 2026 IMDb Clone — Built for ElevanceSkills Internship
        </p>
      </div>
    </footer>
  );
}
