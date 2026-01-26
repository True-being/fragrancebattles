"use client";

import { Arena, ARENA_LABELS, ARENAS } from "@/types";

interface ArenaSelectorProps {
  selectedArena: Arena;
  onSelect: (arena: Arena) => void;
}

export default function ArenaSelector({
  selectedArena,
  onSelect,
}: ArenaSelectorProps) {
  return (
    <div className="flex justify-center mb-10 md:mb-12 px-4">
      <div className="inline-flex items-center gap-1 p-1 bg-arena-dark/80 backdrop-blur-sm border border-arena-border rounded-full">
        {ARENAS.map((arena) => (
          <button
            key={arena}
            onClick={() => onSelect(arena)}
            className={`
              relative px-4 py-2 font-modern text-xs sm:text-sm font-medium uppercase tracking-wider
              transition-all duration-200 rounded-full
              ${
                selectedArena === arena
                  ? "bg-arena-accent text-white shadow-glow"
                  : "text-arena-light hover:text-arena-white hover:bg-arena-gray/50"
              }
            `}
          >
            <span className="relative">{ARENA_LABELS[arena]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
