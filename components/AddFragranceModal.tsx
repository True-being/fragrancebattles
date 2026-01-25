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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-arena-gray border border-arena-border rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-arena-border">
          <h2
            id="modal-title"
            className="font-display text-xl text-arena-white tracking-wide"
          >
            ADD FRAGRANCE
          </h2>
          <button
            onClick={onClose}
            className="text-arena-muted hover:text-arena-white transition-colors p-1"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
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
        <div className="p-4">
          {status === "success" && addedFragrance ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-500"
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
              <h3 className="text-arena-white font-semibold mb-1">
                {addedFragrance.brand}
              </h3>
              <p className="text-arena-light text-lg mb-4">
                {addedFragrance.name}
              </p>
              <p className="text-arena-muted text-sm mb-6">
                Added to the arena
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleAddAnother}
                  className="arena-btn"
                >
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
              <p className="text-arena-light text-sm mb-4">
                Paste a Fragrantica URL to add a fragrance to the arena.
              </p>

              <div className="mb-4">
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
                    text-arena-white placeholder-arena-muted
                    focus:outline-none focus:border-arena-light
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                />
              </div>

              {/* Arena selection */}
              <div className="mb-4">
                <p className="text-arena-light text-sm mb-2">Arenas:</p>
                <div className="flex flex-wrap gap-2">
                  {(["masculine", "feminine", "unisex"] as const).map(
                    (arena) => (
                      <button
                        key={arena}
                        type="button"
                        onClick={() => handleArenaToggle(arena)}
                        disabled={status === "loading"}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors
                          ${
                            arenas[arena]
                              ? "bg-arena-accent border-arena-accent text-white"
                              : "bg-arena-dark border-arena-border text-arena-light hover:border-arena-light"
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
                <p className="text-red-400 text-sm mb-4" role="alert">
                  {error}
                </p>
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
        <div className="px-4 pb-4">
          <p className="text-arena-muted text-xs text-center">
            Find fragrances at{" "}
            <a
              href="https://www.fragrantica.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-arena-light hover:text-arena-white underline"
            >
              fragrantica.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
