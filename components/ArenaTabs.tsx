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
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
      {ARENAS.map((arena) => (
        <Link
          key={arena}
          href={`${basePath}?arena=${arena}`}
          className={`
            px-4 py-2 text-sm font-medium uppercase tracking-wider
            transition-all duration-200 border
            ${
              currentArena === arena
                ? "bg-arena-accent border-arena-accent text-white"
                : "bg-transparent border-arena-border text-arena-light hover:border-arena-light hover:text-arena-white"
            }
          `}
        >
          {ARENA_LABELS[arena]}
        </Link>
      ))}
    </div>
  );
}
