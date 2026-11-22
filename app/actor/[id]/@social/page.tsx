import React from "react";
import { getCachedPersonExternalIds } from "@/lib/api/cached";

interface SocialSlotProps {
  params: Promise<{ id: string }>;
}

export default async function SocialSlot({ params }: SocialSlotProps) {
  const { id } = await params;
  const externalIds = await getCachedPersonExternalIds(id);

  const links: Array<{ name: string; url: string; icon: string }> = [];

  if (externalIds.imdbId) {
    links.push({
      name: "IMDb Profile",
      url: `https://www.imdb.com/name/${externalIds.imdbId}`,
      icon: "IMDb",
    });
  }
  if (externalIds.instagramId) {
    links.push({
      name: `@${externalIds.instagramId}`,
      url: `https://instagram.com/${externalIds.instagramId}`,
      icon: "Instagram",
    });
  }
  if (externalIds.twitterId) {
    links.push({
      name: `@${externalIds.twitterId}`,
      url: `https://twitter.com/${externalIds.twitterId}`,
      icon: "X (Twitter)",
    });
  }
  if (externalIds.facebookId) {
    links.push({
      name: "Facebook",
      url: `https://facebook.com/${externalIds.facebookId}`,
      icon: "Facebook",
    });
  }
  if (externalIds.tiktokId) {
    links.push({
      name: `@${externalIds.tiktokId}`,
      url: `https://tiktok.com/@${externalIds.tiktokId}`,
      icon: "TikTok",
    });
  }
  if (externalIds.wikidataId) {
    links.push({
      name: "Wikidata",
      url: `https://www.wikidata.org/wiki/${externalIds.wikidataId}`,
      icon: "Wiki",
    });
  }

  return (
    <div className="p-5 rounded-xl bg-theme-surface border border-theme-border shadow-sm h-full flex flex-col justify-between">
      <div>
        <h2 id="social-heading" className="text-lg font-bold text-theme-fg mb-1">
          Official Links & Socials
        </h2>
        <p className="text-xs text-theme-fg-muted mb-4">
          Verified external accounts and biographical databases.
        </p>

        {links.length === 0 ? (
          <p className="text-xs text-theme-fg-muted italic py-2">
            No verified external social profiles found.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-theme-surface-subtle border border-theme-border text-theme-fg hover:border-theme-primary hover:text-theme-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring"
              >
                <span className="font-semibold text-theme-primary">{link.icon}:</span>
                <span>{link.name}</span>
                <span className="text-[10px] text-theme-fg-muted">&nearr;</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
