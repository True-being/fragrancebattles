"use client";

import { useState, useEffect, useRef } from "react";
import type { FragrancePublic } from "@/types";

interface AddFragranceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ArenaSelection {
  masculine: boolean;
  feminine: boolean;
  unisex: boolean;
}

type Status = "idle" | "loading" | "success" | "error";

export default function AddFragranceModal({
  isOpen,
  onClose,
}: AddFragranceModalProps) {
  const [url, setUrl] = useState("");
  const [arenas, setArenas] = useState<ArenaSelection>({
    masculine: false,
    feminine: false,
    unisex: false,
  });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [addedFragrance, setAddedFragrance] = useState<FragrancePublic | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setArenas({ masculine: false, feminine: false, unisex: false });
      setStatus("idle");
      setError("");
      setAddedFragrance(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Please enter a Fragrantica URL");
      return;
    }

    // Require at least one arena selection
    if (!arenas.masculine && !arenas.feminine && !arenas.unisex) {
      setError("Please select at least one arena");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/fragrance/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), arenas }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Failed to add fragrance");
        return;
      }

      setStatus("success");
      setAddedFragrance(data.fragrance);
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  };

  const handleArenaToggle = (arena: keyof ArenaSelection) => {
    setArenas((prev) => ({ ...prev, [arena]: !prev[arena] }));
  };

  const handleAddAnother = () => {
    setUrl("");
    setArenas({ masculine: false, feminine: false, unisex: false });
    setStatus("idle");
    setError("");
    setAddedFragrance(null);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass border border-arena-border rounded-xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-arena-border/50">
          <h2
            id="modal-title"
            className="flex items-center gap-2"
          >
            <span className="text-lg">➕</span>
            <span className="font-display text-xl text-arena-white tracking-wider">ADD</span>
            <span className="font-elegant italic text-lg text-arena-light">Fragrance</span>
          </h2>
          <button
            onClick={onClose}
            className="text-arena-muted hover:text-arena-white transition-colors p-1 rounded hover:bg-arena-gray"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {status === "success" && addedFragrance ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-modern text-arena-light text-xs uppercase tracking-[0.2em] mb-1">
                {addedFragrance.brand}
              </p>
              <h3 className="font-elegant text-2xl text-arena-white mb-5">
                {addedFragrance.name}
              </h3>
              <p className="font-editorial italic text-arena-muted text-sm mb-6">
                Added to the arena successfully
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={handleAddAnother} className="arena-btn">
                  Add Another
                </button>
                <button
                  onClick={onClose}
                  className="arena-btn arena-btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="font-modern text-arena-light text-sm mb-5">
                Paste a Fragrantica URL to add a fragrance to the arena.
              </p>

              <div className="mb-5">
                <label htmlFor="fragrantica-url" className="sr-only">
                  Fragrantica URL
                </label>
                <input
                  ref={inputRef}
                  id="fragrantica-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.fragrantica.com/perfume/..."
                  disabled={status === "loading"}
                  className="w-full px-4 py-3 bg-arena-dark border border-arena-border rounded-lg
                    font-modern text-arena-white placeholder-arena-muted text-sm
                    focus:outline-none focus:border-arena-light focus:ring-1 focus:ring-arena-light/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200"
                />
              </div>

              {/* Arena selection */}
              <div className="mb-5">
                <p className="font-modern text-arena-light text-sm mb-3">Select arenas:</p>
                <div className="flex flex-wrap gap-2">
                  {(["masculine", "feminine", "unisex"] as const).map(
                    (arena) => (
                      <button
                        key={arena}
                        type="button"
                        onClick={() => handleArenaToggle(arena)}
                        disabled={status === "loading"}
                        className={`px-4 py-2 font-modern text-sm rounded-full border transition-all duration-200
                          ${
                            arenas[arena]
                              ? "bg-arena-accent border-arena-accent text-white shadow-glow"
                              : "bg-arena-dark border-arena-border text-arena-light hover:border-arena-light hover:text-arena-white"
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {arena.charAt(0).toUpperCase() + arena.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="font-modern text-red-400 text-sm" role="alert">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full arena-btn arena-btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Adding...
                  </>
                ) : (
                  "Add Fragrance"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-5">
          <p className="font-modern text-arena-muted text-xs text-center">
            Find fragrances at{" "}
            <a
              href="https://www.fragrantica.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-arena-light hover:text-arena-accent underline transition-colors"
            >
              fragrantica.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
