"use client";

import Image from "next/image";
import { FragrancePublic } from "@/types";

interface FragranceCardProps {
  fragrance: FragrancePublic;
  onClick: () => void;
  disabled: boolean;
  isWinner?: boolean;
  isLoser?: boolean;
}

export default function FragranceCard({
  fragrance,
  onClick,
  disabled,
  isWinner,
  isLoser,
}: FragranceCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center w-full max-w-sm
        bg-arena-gray border-2 rounded-lg overflow-hidden
        transition-all duration-300 cursor-pointer
        ${disabled ? "pointer-events-none" : ""}
        ${
          isWinner
            ? "border-green-500 scale-[1.02] shadow-lg shadow-green-500/20"
            : isLoser
            ? "border-arena-border opacity-50 scale-[0.98]"
            : "border-arena-border hover:border-arena-light hover:scale-[1.02]"
        }
        active:scale-[0.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-arena-accent
      `}
    >
      {/* Image container */}
      <div className="relative w-full aspect-[4/5] bg-arena-dark flex items-center justify-center overflow-hidden">
        <Image
          src={fragrance.imageUrl}
          alt={`${fragrance.brand} ${fragrance.name}`}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 50vw, 300px"
        />
        
        {/* Winner/Loser overlay */}
        {isWinner && (
          <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
            <span className="text-4xl">👑</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="w-full p-4 text-center">
        <p className="text-arena-light text-sm uppercase tracking-wider mb-1">
          {fragrance.brand}
        </p>
        <h3 className="font-display text-xl text-arena-white tracking-wide">
          {fragrance.name}
        </h3>
      </div>
    </button>
  );
}
