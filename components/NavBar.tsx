"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddFragranceModal from "./AddFragranceModal";

export default function NavBar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Arena" },
    { href: "/rankings", label: "Rankings" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-arena-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - expressive mixed typography */}
            <Link href="/" className="group flex items-baseline gap-1">
              <span className="font-display text-xl sm:text-2xl text-arena-white tracking-wider">
                FRAGRANCE
              </span>
              <span className="font-elegant italic text-lg sm:text-xl text-arena-accent">
                Arena
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-2 sm:gap-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || 
                  (link.href === "/rankings" && pathname.startsWith("/rankings"));
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      relative px-3 py-2 font-modern text-sm font-medium transition-colors duration-200
                      ${isActive 
                        ? "text-arena-white" 
                        : "text-arena-light hover:text-arena-white"
                      }
                    `}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-arena-accent" />
                    )}
                  </Link>
                );
              })}

              {/* Add button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="
                  ml-2 w-8 h-8 flex items-center justify-center rounded-full 
                  bg-arena-gray/80 border border-arena-border 
                  text-arena-light hover:text-arena-white hover:border-arena-light
                  hover:bg-arena-gray transition-all duration-200
                "
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
