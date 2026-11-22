# Task 5 (Theming): Design System, CSS Variable Tokens & Flash-Free Provider

## Overview
A zero-layout-shift (CLS = 0), WCAG AAA accessible multi-theme system featuring semantic CSS variable tokens (`light`, `dark`, and high-contrast `hc`), animated theme switching with keyboard shortcuts, server-side cookie reading with an inline anti-flash script, per-section scoped theming (`ThemeScope`), and a strict per-request nonce-based Content Security Policy (CSP).

---

## Token Reference Architecture

All color tokens are abstracted to semantic CSS variables in `app/globals.css` and mapped in `tailwind.config.js`:

| Token | Light Theme | Dark Theme | High-Contrast (`hc`) | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--theme-bg` | `#f8fafc` (slate-50) | `#0b0f19` (slate-950) | `#000000` (pure black) | Main background |
| `--theme-surface` | `#ffffff` (white) | `#131b2e` (slate-900) | `#050505` (deep black) | Cards, panels, dropdowns |
| `--theme-surface-subtle` | `#f1f5f9` (slate-100) | `#1e293b` (slate-800) | `#121212` | Hover surfaces, borders |
| `--theme-fg` | `#0f172a` (slate-900) | `#f8fafc` (slate-50) | `#ffffff` (pure white) | Primary headings & text |
| `--theme-fg-muted` | `#475569` (slate-600) | `#94a3b8` (slate-400) | `#ffff00` (pure yellow) | Subtitles, metadata, secondary |
| `--theme-border` | `#e2e8f0` (slate-200) | `#2d3748` (slate-700) | `#ffffff` (2px solid white) | Card and input borders |
| `--theme-accent` | `#f5c518` (IMDb yellow) | `#f5c518` (IMDb yellow) | `#ffff00` (high-vis yellow) | Action buttons, badges |
| `--theme-ring` | `#f5c518` | `#f5c518` | `#ffff00` | 2px/3px offset focus-visible ring |

---

## Key Features & Components

1. **Flash-Free SSR & Anti-Flash Inline Script (`app/layout.tsx`)**:
   - `getThemeCookie()` reads the `theme` cookie on the server before first paint.
   - Sets `data-theme` attribute on `<html>` directly during server rendering.
   - An inline script in `<head>` (secured by per-request CSP nonce) detects `system` mode and localStorage fallback prior to hydration, preventing any Flash of Unstyled Content (FOUC).

2. **ThemeProvider & State Management (`components/ThemeProvider.tsx`)**:
   - Manages `theme` state (`light`, `dark`, `hc`, `system`) and `resolvedTheme` (`light`, `dark`, `hc`).
   - Synchronizes selections to `localStorage` and a 1-year `Lax` cookie.
   - Listens to `(prefers-color-scheme: dark)` media query changes when set to `system`.
   - Exports `ThemeScope` for scoped per-route or per-component theme overrides.

3. **Animated Theme Toggle UI (`components/ThemeToggle.tsx`)**:
   - Framer Motion icon swap (`Sun`, `Moon`, `Contrast`, `Laptop`) with `AnimatePresence`.
   - Accessible keyboard shortcut (`Ctrl/Cmd + Shift + L`) for fast theme cycling.
   - WCAG AAA focus indicators with custom rings.

4. **Nonce-Based Content Security Policy (`proxy.ts`)**:
   - Generates a cryptographically strong per-request base64 nonce.
   - Injects `Content-Security-Policy` and `x-nonce` headers.
   - Allows strict-dynamic execution of Next.js scripts and the theme detection script with zero console violations.

5. **Zero Layout Shift (CLS)**:
   - All theme switches toggle CSS variables on root `<html>` without modifying DOM geometry or element layout dimensions, ensuring Cumulative Layout Shift remains 0.

6. **Automated Vitest Suite (`tests/theming.test.tsx`)**:
   - Verifies server cookie initialization, HTML data-theme injection, state transitions across all 4 themes, prefers-color-scheme media listener, and `ThemeScope` subtree isolation.
