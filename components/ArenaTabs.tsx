"use client";

import Link from "next/link";
import { Arena, ARENA_LABELS, ARENAS } from "@/types";

interface ArenaTabsProps {
  currentArena: Arena;
  basePath?: string;
}

export default function ArenaTabs({
  currentArena,
  basePath = "/rankings",
}: ArenaTabsProps) {
  return (
    <div className="flex justify-center mb-10 px-4">
      <div className="inline-flex items-center gap-1 p-1 bg-arena-dark/80 backdrop-blur-sm border border-arena-border rounded-full flex-wrap justify-center">
        {ARENAS.map((arena) => (
          <Link
            key={arena}
            href={`${basePath}?arena=${arena}`}
            className={`
              relative px-4 py-2 font-modern text-xs sm:text-sm font-medium uppercase tracking-wider
              transition-all duration-200 rounded-full
              ${
                currentArena === arena
                  ? "bg-arena-accent text-white shadow-glow"
                  : "text-arena-light hover:text-arena-white hover:bg-arena-gray/50"
              }
            `}
          >
            {ARENA_LABELS[arena]}
          </Link>
        ))}
      </div>
    </div>
  );
}
