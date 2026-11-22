/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "theme-bg": "hsl(var(--bg) / <alpha-value>)",
        "theme-fg": "hsl(var(--fg) / <alpha-value>)",
        "theme-card": "hsl(var(--card) / <alpha-value>)",
        "theme-header": "hsl(var(--header) / <alpha-value>)",
        "theme-primary": "hsl(var(--primary) / <alpha-value>)",
        "theme-border": "hsl(var(--border) / <alpha-value>)",
        "theme-ring": "hsl(var(--ring) / <alpha-value>)",
      },
    },
  },
};
