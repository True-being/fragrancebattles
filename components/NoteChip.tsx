"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getNoteImage } from "@/lib/noteImages";

interface NoteChipProps {
  note: string;
  variant?: "default" | "top" | "heart" | "base";
  size?: "sm" | "md";
  linkable?: boolean;
}

function getNoteSlug(note: string): string {
  return note.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
}

const variantStyles = {
  default: "bg-arena-gray/50 border-arena-border text-arena-light",
  top: "bg-amber-500/10 border-amber-500/20 text-amber-300/90",
  heart: "bg-rose-500/10 border-rose-500/20 text-rose-300/90",
  base: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300/90",
};

function NotePreview({ imageUrl, note, x, y }: { imageUrl: string; note: string; x: number; y: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="w-20 h-20 rounded-lg overflow-hidden shadow-2xl border-2 border-arena-border bg-arena-dark animate-fade-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={note}
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-center text-[10px] font-modern text-arena-light mt-1 capitalize drop-shadow-md">{note}</p>
    </div>,
    document.body
  );
}

export default function NoteChip({ note, variant = "default", size = "sm", linkable = false }: NoteChipProps) {
  const imageUrl = getNoteImage(note);
  const styles = variantStyles[variant];
  const [showPreview, setShowPreview] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  
  const sizeClasses = size === "sm" 
    ? "px-2 py-0.5 text-[10px] gap-1" 
    : "px-2 py-1 text-xs gap-1.5";
  
  const imgSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  const handleMouseEnter = () => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      setPreviewPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
      setShowPreview(true);
    }
  };

  const chipContent = (
    <span className={`inline-flex items-center font-modern border rounded ${styles} ${sizeClasses} ${linkable ? "hover:opacity-80 transition-opacity cursor-pointer" : ""}`}>
      {imageUrl && (
        <span className={`relative flex-shrink-0 ${imgSize}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt={note}
            className="w-full h-full object-cover rounded-full cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowPreview(false)}
          />
        </span>
      )}
      <span>{note}</span>
    </span>
  );

  return (
    <>
      {linkable ? (
        <Link href={`/notes/${getNoteSlug(note)}`}>
          {chipContent}
        </Link>
      ) : (
        chipContent
      )}
      
      {showPreview && imageUrl && (
        <NotePreview imageUrl={imageUrl} note={note} x={previewPos.x} y={previewPos.y} />
      )}
    </>
  );
}
