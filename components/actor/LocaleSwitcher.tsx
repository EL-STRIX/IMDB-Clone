"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function LocaleSwitcher({ currentLocale = "en" }: { currentLocale?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newLocale === "en") {
      params.delete("locale");
    } else {
      params.set("locale", newLocale);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-theme-surface-subtle border border-theme-border text-xs">
      <button
        type="button"
        onClick={() => handleLocaleChange("en")}
        aria-pressed={currentLocale === "en"}
        className={`px-2 py-0.5 rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
          currentLocale === "en"
            ? "bg-theme-accent text-zinc-950 font-bold"
            : "text-theme-fg-muted hover:text-theme-fg"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleLocaleChange("es")}
        aria-pressed={currentLocale === "es"}
        className={`px-2 py-0.5 rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring ${
          currentLocale === "es"
            ? "bg-theme-accent text-zinc-950 font-bold"
            : "text-theme-fg-muted hover:text-theme-fg"
        }`}
      >
        ES
      </button>
    </div>
  );
}
