"use client";

import Image from "next/image";
import Link from "next/link";
import { RankedFragrance } from "@/types";

interface RankingsTableProps {
  fragrances: RankedFragrance[];
}

export default function RankingsTable({ fragrances }: RankingsTableProps) {
  if (fragrances.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-arena-muted">No fragrances ranked in this arena yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-arena-border">
            <th className="py-4 px-2 text-left text-xs uppercase tracking-wider text-arena-muted w-16">
              Rank
            </th>
            <th className="py-4 px-2 text-left text-xs uppercase tracking-wider text-arena-muted">
              Fragrance
            </th>
            <th className="py-4 px-2 text-right text-xs uppercase tracking-wider text-arena-muted w-24 hidden sm:table-cell">
              Win Rate
            </th>
            <th className="py-4 px-2 text-right text-xs uppercase tracking-wider text-arena-muted w-24 hidden sm:table-cell">
              Battles
            </th>
          </tr>
        </thead>
        <tbody>
          {fragrances.map((fragrance, index) => (
            <tr
              key={fragrance.id}
              className="border-b border-arena-border/50 hover:bg-arena-gray/50 transition-colors"
            >
              {/* Rank */}
              <td className="py-4 px-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`
                      font-display text-2xl
                      ${index === 0 ? "text-arena-gold" : ""}
                      ${index === 1 ? "text-gray-400" : ""}
                      ${index === 2 ? "text-amber-700" : ""}
                      ${index > 2 ? "text-arena-light" : ""}
                    `}
                  >
                    {fragrance.rank}
                  </span>
                  {fragrance.movement && fragrance.movement !== "stable" && (
                    <span
                      className={`text-xs ${
                        fragrance.movement === "up"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {fragrance.movement === "up" ? "▲" : "▼"}
                    </span>
                  )}
                </div>
              </td>

              {/* Fragrance info */}
              <td className="py-4 px-2">
                <Link
                  href={`/fragrance/${fragrance.slug}`}
                  className="flex items-center gap-4 group"
                >
                  <div className="relative w-12 h-14 bg-arena-dark rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={fragrance.imageUrl}
                      alt={fragrance.name}
                      fill
                      className="object-contain p-1"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <p className="text-arena-light text-xs uppercase tracking-wider">
                      {fragrance.brand}
                    </p>
                    <p className="text-arena-white font-medium group-hover:text-arena-accent transition-colors">
                      {fragrance.name}
                    </p>
                  </div>
                </Link>
              </td>

              {/* Win Rate */}
              <td className="py-4 px-2 text-right hidden sm:table-cell">
                <span className="text-arena-white">
                  {fragrance.battles > 0
                    ? `${Math.round(fragrance.winRate * 100)}%`
                    : "—"}
                </span>
              </td>

              {/* Battles */}
              <td className="py-4 px-2 text-right hidden sm:table-cell">
                <span className="text-arena-muted">{fragrance.battles}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
