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
    <div className="flex items-center justify-center gap-2 mb-8">
      {ARENAS.map((arena) => (
        <button
          key={arena}
          onClick={() => onSelect(arena)}
          className={`
            px-4 py-2 text-sm font-medium uppercase tracking-wider
            transition-all duration-200 border
            ${
              selectedArena === arena
                ? "bg-arena-accent border-arena-accent text-white"
                : "bg-transparent border-arena-border text-arena-light hover:border-arena-light hover:text-arena-white"
            }
          `}
        >
          {ARENA_LABELS[arena]}
        </button>
      ))}
    </div>
  );
}
