"use client";

import { useState } from "react";
import AddFragranceModal from "./AddFragranceModal";

export default function NavBar() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-arena-black/90 backdrop-blur-sm border-b border-arena-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a
              href="/"
              className="font-display text-2xl text-arena-white tracking-wide"
            >
              FRAGRANCE ARENA
            </a>
            <div className="flex items-center gap-4 sm:gap-6">
              <a
                href="/"
                className="text-sm text-arena-light hover:text-arena-white transition-colors"
              >
                Arena
              </a>
              <a
                href="/rankings"
                className="text-sm text-arena-light hover:text-arena-white transition-colors"
              >
                Rankings
              </a>
              <a
                href="/about"
                className="text-sm text-arena-light hover:text-arena-white transition-colors"
              >
                About
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full 
                  bg-arena-gray border border-arena-border 
                  text-arena-light hover:text-arena-white hover:border-arena-light
                  transition-colors"
                aria-label="Add fragrance from Fragrantica"
                title="Add fragrance"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AddFragranceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
