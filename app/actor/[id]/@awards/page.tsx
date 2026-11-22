import React from "react";
import { getCachedActorAwards } from "@/lib/api/cached";

interface AwardsSlotProps {
  params: Promise<{ id: string }>;
}

export default async function AwardsSlot({ params }: AwardsSlotProps) {
  const { id } = await params;
  const awardsData = await getCachedActorAwards(id);

  return (
    <div className="p-5 rounded-xl bg-theme-surface border border-theme-border shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 id="awards-heading" className="text-lg font-bold text-theme-fg">
            Awards & Accolades
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {awardsData.totalWins} {awardsData.totalWins === 1 ? "Win" : "Wins"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-theme-surface-subtle text-theme-fg-muted border border-theme-border">
              {awardsData.totalNominations} Nominations
            </span>
          </div>
        </div>
        <p className="text-xs text-theme-fg-muted mb-4">
          Verified awards, honors, and nominations from recognized film institutions.
        </p>

        {awardsData.awards.length === 0 ? (
          <p className="text-xs text-theme-fg-muted italic py-2">
            No awards records documented for this profile.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {awardsData.awards.map((award) => (
              <div
                key={award.id}
                className="flex items-start justify-between p-2.5 rounded-lg bg-theme-surface-subtle border border-theme-border text-xs gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-theme-fg">{award.event}</span>
                    <span className="text-[11px] text-theme-fg-muted font-mono">({award.year})</span>
                  </div>
                  <p className="text-[11px] text-theme-fg font-medium line-clamp-1 mt-0.5">
                    {award.category}
                  </p>
                  <p className="text-[10px] text-theme-fg-muted line-clamp-1 italic">
                    {award.work}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 tracking-wider ${
                    award.outcome === "won"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-theme-surface text-theme-fg-muted border border-theme-border"
                  }`}
                >
                  {award.outcome === "won" ? "Winner" : "Nominee"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
