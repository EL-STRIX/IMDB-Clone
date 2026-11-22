"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme, Theme } from "./ThemeProvider";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "hc", label: "High-contrast" },
  { value: "system", label: "System" },
];

const THEME_ORDER: Theme[] = ["light", "dark", "hc", "system"];

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + Shift + L to cycle themes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        const currentIndex = THEME_ORDER.indexOf(theme);
        const nextTheme = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
        setTheme(nextTheme);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [theme, setTheme]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Icon button showing current mode */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle theme menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative flex items-center justify-center p-2 rounded-md bg-theme-card border border-theme-border text-theme-fg hover:border-theme-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg cursor-pointer"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme === "system" ? `system-${resolvedTheme}` : theme}
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 90, scale: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            {resolvedTheme === "light" && (
              /* Sun icon */
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            )}
            {resolvedTheme === "dark" && (
              /* Moon icon */
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
            {resolvedTheme === "hc" && (
              /* High contrast eye/circle icon */
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a5 5 0 00-5 5h10a5 5 0 00-5-5z" clipRule="evenodd" />
              </svg>
            )}
          </motion.span>
        </AnimatePresence>
      </button>

      {/* Dropdown with 4 options and checkmarks */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-theme-card border border-theme-border py-1 z-50 text-sm focus:outline-none">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setTheme(opt.value);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 text-left text-theme-fg hover:bg-theme-header hover:text-theme-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-theme-ring cursor-pointer"
            >
              <span>{opt.label}</span>
              {theme === opt.value && (
                <svg className="w-4 h-4 text-theme-primary stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
