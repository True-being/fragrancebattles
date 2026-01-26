"use client";

import Image from "next/image";
import Link from "next/link";
import { RankedFragrance } from "@/types";

interface RankingsTableProps {
  fragrances: RankedFragrance[];
}

function getRankBadge(rank: number) {
  if (rank === 1) return { emoji: "🥇", class: "text-arena-gold" };
  if (rank === 2) return { emoji: "🥈", class: "text-arena-silver" };
  if (rank === 3) return { emoji: "🥉", class: "text-arena-bronze" };
  return { emoji: null, class: "text-arena-light" };
}

function getPodiumClass(rank: number) {
  if (rank === 1) return "podium-gold";
  if (rank === 2) return "podium-silver";
  if (rank === 3) return "podium-bronze";
  return "";
}

export default function RankingsTable({ fragrances }: RankingsTableProps) {
  if (fragrances.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-arena-gray border border-arena-border flex items-center justify-center">
          <span className="text-2xl">🏆</span>
        </div>
        <p className="font-editorial italic text-arena-muted text-lg">No fragrances ranked in this arena yet.</p>
        <p className="font-modern text-arena-muted text-sm mt-2">Start voting to build the rankings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fragrances.map((fragrance) => {
        const rankBadge = getRankBadge(fragrance.rank);
        const podiumClass = getPodiumClass(fragrance.rank);
        const isTopThree = fragrance.rank <= 3;

        return (
          <Link
            key={fragrance.id}
            href={`/fragrance/${fragrance.slug}`}
            className={`
              group flex items-center gap-4 p-4 rounded-lg
              border border-arena-border/50 
              transition-all duration-200
              hover:border-arena-border hover:bg-arena-gray/30
              ${podiumClass}
            `}
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-12 text-center">
              {rankBadge.emoji ? (
                <span className="text-2xl">{rankBadge.emoji}</span>
              ) : (
                <span className={`font-expressive text-2xl font-bold ${rankBadge.class}`}>
                  {fragrance.rank}
                </span>
              )}
              {fragrance.movement && fragrance.movement !== "stable" && (
                <div className="mt-1">
                  <span
                    className={`font-modern text-xs ${
                      fragrance.movement === "up"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {fragrance.movement === "up" ? "▲" : "▼"}
                  </span>
                </div>
              )}
            </div>

            {/* Image */}
            <div className={`
              relative flex-shrink-0 bg-arena-dark rounded-lg overflow-hidden
              ${isTopThree ? "w-16 h-20" : "w-12 h-14"}
            `}>
              <Image
                src={fragrance.imageUrl}
                alt={fragrance.name}
                fill
                className="object-contain p-1"
                sizes={isTopThree ? "64px" : "48px"}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Brand - modern uppercase */}
              <p className="font-modern text-arena-light text-xs uppercase tracking-[0.2em] mb-0.5">
                {fragrance.brand}
              </p>
              {/* Name - elegant serif */}
              <p className={`
                font-elegant truncate group-hover:text-arena-accent transition-colors
                ${isTopThree ? "text-xl text-arena-white" : "text-lg text-arena-white"}
              `}>
                {fragrance.name}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
              <div className="text-right">
                <p className="font-modern text-[10px] text-arena-muted uppercase tracking-wider mb-0.5">Win Rate</p>
                <p className={`font-expressive font-semibold ${isTopThree ? "text-arena-white" : "text-arena-light"}`}>
                  {fragrance.battles > 0
                    ? `${Math.round(fragrance.winRate * 100)}%`
                    : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-modern text-[10px] text-arena-muted uppercase tracking-wider mb-0.5">Battles</p>
                <p className="font-modern text-arena-muted">{fragrance.battles}</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-arena-border group-hover:text-arena-light transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
