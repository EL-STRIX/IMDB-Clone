import React from "react";
import { getCachedPerson } from "@/lib/api/cached";

interface AwardsSlotProps {
  params: Promise<{ id: string }>;
}

export default async function AwardsSlot({ params }: AwardsSlotProps) {
  const { id } = await params;
  const person = await getCachedPerson(id);

  // Awards summary structure (will connect to dedicated mock/Firestore in Day 31)
  const isHighProfile = (person?.popularity || 0) > 20;

  const highlights = isHighProfile
    ? [
        { title: "Academy Awards (Oscars)", result: "Winner & Nominee", icon: "🏆", count: "1 Win, 6 Nominations" },
        { title: "Golden Globe Awards", result: "Winner", icon: "🌟", count: "3 Wins, 12 Nominations" },
        { title: "BAFTA Film Awards", result: "Winner", icon: "🎭", count: "1 Win, 4 Nominations" },
      ]
    : [
        { title: "Industry Recognition", result: "Credited Talent", icon: "⭐", count: "Active Performer" },
        { title: "Festival Nominations", result: "Nominee", icon: "🎬", count: "Independent Selection" },
      ];

  return (
    <div className="p-5 rounded-xl bg-theme-surface border border-theme-border shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 id="awards-heading" className="text-lg font-bold text-theme-fg">
            Awards & Accolades
          </h2>
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Honors
          </span>
        </div>
        <p className="text-xs text-theme-fg-muted mb-4">
          Key achievements and international cinematic nominations.
        </p>

        <div className="space-y-2.5">
          {highlights.map((award) => (
            <div
              key={award.title}
              className="flex items-center justify-between p-2.5 rounded-lg bg-theme-surface-subtle border border-theme-border text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-base" aria-hidden="true">
                  {award.icon}
                </span>
                <div>
                  <p className="font-semibold text-theme-fg">{award.title}</p>
                  <p className="text-[11px] text-theme-fg-muted">{award.count}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
                {award.result}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
