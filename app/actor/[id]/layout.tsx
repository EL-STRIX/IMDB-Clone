import React from "react";

interface ActorLayoutProps {
  children: React.ReactNode;
  awards: React.ReactNode;
  social: React.ReactNode;
  similar: React.ReactNode;
}

export default function ActorLayout({
  children,
  awards,
  social,
  similar,
}: ActorLayoutProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Main Profile & Filmography */}
      {children}

      {/* Subpanels: Social Links & Awards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-theme-border/60">
        <section aria-labelledby="social-heading">{social}</section>
        <section aria-labelledby="awards-heading">{awards}</section>
      </div>

      {/* Frequent Collaborators / Similar Actors */}
      <section aria-labelledby="similar-heading" className="pt-2">
        {similar}
      </section>
    </div>
  );
}
