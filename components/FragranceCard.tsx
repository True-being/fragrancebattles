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
        group relative flex flex-col items-center w-full max-w-xs
        glass border rounded-xl overflow-hidden
        transition-all duration-300 cursor-pointer
        ${disabled ? "pointer-events-none" : ""}
        ${
          isWinner
            ? "border-green-500 scale-[1.02] winner-glow"
            : isLoser
            ? "border-arena-border/50 opacity-40 scale-[0.96] blur-[1px]"
            : "border-arena-border hover:border-arena-light/60"
        }
        ${!disabled && !isWinner && !isLoser ? "hover:scale-[1.03] hover:-translate-y-1" : ""}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-arena-accent focus-visible:ring-offset-2 focus-visible:ring-offset-arena-black
      `}
      style={{
        boxShadow: isWinner 
          ? "0 0 30px rgba(34, 197, 94, 0.3), 0 20px 40px rgba(0, 0, 0, 0.3)"
          : isLoser
          ? "none"
          : undefined
      }}
    >
      {/* Top accent line */}
      <div className={`
        absolute top-0 left-0 right-0 h-[2px] transition-all duration-300
        ${isWinner ? "bg-green-500" : "bg-gradient-to-r from-transparent via-arena-accent/50 to-transparent opacity-0 group-hover:opacity-100"}
      `} />

      {/* Image container */}
      <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-arena-dark to-arena-gray flex items-center justify-center overflow-hidden">
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-arena-gray via-transparent to-transparent opacity-60 pointer-events-none" />
        
        <Image
          src={fragrance.imageUrl}
          alt={`${fragrance.brand} ${fragrance.name}`}
          fill
          className={`
            object-contain p-6 transition-all duration-300
            ${!disabled && !isWinner && !isLoser ? "group-hover:scale-105" : ""}
          `}
          sizes="(max-width: 768px) 45vw, 280px"
        />
        
        {/* Winner crown overlay */}
        {isWinner && (
          <div className="absolute inset-0 bg-gradient-to-t from-green-500/20 to-transparent flex items-center justify-center">
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <span className="text-4xl drop-shadow-lg">👑</span>
            </div>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="relative w-full p-5 text-center bg-gradient-to-t from-arena-dark/50 to-transparent">
        {/* Brand - modern, clean */}
        <p className="font-modern text-arena-light text-xs uppercase tracking-[0.25em] mb-2 font-medium">
          {fragrance.brand}
        </p>
        {/* Fragrance name - elegant, serif, premium */}
        <h3 className="font-elegant text-2xl text-arena-white leading-tight">
          {fragrance.name}
        </h3>
        
        {/* Click hint */}
        <div className={`
          mt-3 font-expressive text-[10px] uppercase tracking-widest font-medium transition-all duration-300
          ${!disabled && !isWinner && !isLoser 
            ? "text-arena-accent/70 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0" 
            : "opacity-0"
          }
        `}>
          Choose
        </div>
      </div>
    </button>
  );
}
