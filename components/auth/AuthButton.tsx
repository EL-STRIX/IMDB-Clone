"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSession } from "./SessionProvider";

export default function AuthButton() {
  const { user, status, isAuthenticated, signIn, signOut } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset image error state when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.image]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Handle escape key to close modal/menu
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setIsMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleProviderSignIn = async (
    provider: "demo" | "github" | "google",
    username?: string
  ) => {
    setIsSubmitting(true);
    try {
      const success = await signIn({ provider, username });
      if (success) {
        setIsModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="h-8 w-20 rounded-lg bg-theme-surface-subtle animate-pulse" />
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-label={`User menu for ${user.name}`}
          className="flex items-center gap-2 h-9 px-2.5 rounded-lg bg-theme-card border border-theme-border hover:border-theme-primary/50 text-theme-fg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer"
        >
          {user.image && !imageError ? (
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-theme-border shrink-0 bg-theme-surface-subtle">
              <Image
                src={user.image}
                alt={user.name}
                fill
                sizes="24px"
                unoptimized
                onError={() => setImageError(true)}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-theme-primary text-black font-extrabold text-xs flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="hidden sm:inline text-xs font-semibold text-theme-fg whitespace-nowrap">
            {user.name}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-theme-fg-muted shrink-0 transition-transform duration-200 ${
              isMenuOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            aria-label="User account actions"
            className="absolute right-0 mt-2 w-56 rounded-xl bg-theme-card border border-theme-border shadow-xl py-2 z-50 text-xs text-theme-fg animate-in fade-in slide-in-from-top-1"
          >
            <div className="px-3 py-2 border-b border-theme-border/60">
              <p className="font-bold text-theme-fg truncate">{user.name}</p>
              <p className="text-theme-fg-muted truncate text-[11px]">{user.email}</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-theme-primary/20 text-theme-primary border border-theme-primary/30">
                {user.role === "critic" ? "★ Critic" : "Member"}
              </span>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setIsMenuOpen(false);
                await signOut();
              }}
              className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:bg-rose-500/10"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        className="h-9 px-3.5 rounded-lg text-xs font-bold bg-theme-primary text-black hover:opacity-90 active:scale-95 transition-all shadow-sm border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer flex items-center justify-center"
      >
        Sign In
      </button>

      {/* Accessible Sign-In Dialog Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div
            ref={modalRef}
            className="w-full max-w-sm rounded-2xl bg-theme-card border-2 border-theme-border shadow-2xl p-6 text-theme-fg animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="signin-modal-title" className="text-lg font-extrabold text-theme-fg">
                Sign In to IMDb Clone
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close sign in dialog"
                className="p-1 rounded-lg text-theme-fg-muted hover:text-theme-fg hover:bg-theme-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-theme-fg-muted mb-6">
              Sign in to write reviews, vote on user helpfulness, and customize your cinephile profile.
            </p>

            <div className="space-y-2.5">
              {/* Quick Demo: Film Critic */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleProviderSignIn("demo", "critic")}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-theme-border bg-theme-surface-subtle hover:border-theme-primary/50 font-semibold text-xs text-theme-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">★</span>
                  <span>Demo Critic (Eleanor Vance)</span>
                </span>
                <span className="text-[10px] text-theme-fg-muted font-mono">1-Click</span>
              </button>

              {/* Quick Demo: Regular Cinephile */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleProviderSignIn("demo", "cinephile")}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-theme-border bg-theme-surface-subtle hover:border-theme-primary/50 font-semibold text-xs text-theme-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>🎬</span>
                  <span>Demo Cinephile (Alex Rivera)</span>
                </span>
                <span className="text-[10px] text-theme-fg-muted font-mono">1-Click</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-theme-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-theme-card px-2 text-theme-fg-muted font-semibold">
                    Or OAuth Sign In
                  </span>
                </div>
              </div>

              {/* GitHub OAuth Provider */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleProviderSignIn("github", "octocat")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-theme-border bg-theme-surface-subtle hover:border-theme-primary/50 font-semibold text-xs text-theme-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Continue with GitHub</span>
              </button>

              {/* Google OAuth Provider */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleProviderSignIn("google", "Cinephile User")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-theme-border bg-theme-surface-subtle hover:border-theme-primary/50 font-semibold text-xs text-theme-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.02h3.87c2.26-2.09 3.675-5.17 3.675-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.12C3.26 21.36 7.37 24 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.61H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.39l3.99-3.12z" />
                  <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.64 1.28 6.61l3.99 3.12c.95-2.85 3.6-4.96 6.73-4.96z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
