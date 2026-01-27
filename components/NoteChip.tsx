"use client";

import { getNoteImage } from "@/lib/noteImages";

interface NoteChipProps {
  note: string;
  variant?: "default" | "top" | "heart" | "base";
  size?: "sm" | "md";
}

const variantStyles = {
  default: "bg-arena-gray/50 border-arena-border text-arena-light",
  top: "bg-amber-500/10 border-amber-500/20 text-amber-300/90",
  heart: "bg-rose-500/10 border-rose-500/20 text-rose-300/90",
  base: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300/90",
};

export default function NoteChip({ note, variant = "default", size = "sm" }: NoteChipProps) {
  const imageUrl = getNoteImage(note);
  const styles = variantStyles[variant];
  
  const sizeClasses = size === "sm" 
    ? "px-2 py-0.5 text-[10px] gap-1" 
    : "px-2 py-1 text-xs gap-1.5";
  
  const imgSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <span className={`inline-flex items-center font-modern border rounded ${styles} ${sizeClasses}`}>
      {imageUrl && (
        <span className={`relative rounded-full overflow-hidden flex-shrink-0 ${imgSize}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </span>
      )}
      <span>{note}</span>
    </span>
  );
}
