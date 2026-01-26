import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Fragrance Battles — Two Enter. One Wins.",
  description:
    "Head-to-head fragrance battles. Vote for your favorites and see real-time rankings. The ultimate taste battleground.",
  keywords: ["fragrance", "perfume", "cologne", "rankings", "voting", "arena"],
  openGraph: {
    title: "Fragrance Battles",
    description: "Two Enter. One Wins.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-arena-black">
        <NavBar />
        <main className="pt-16">{children}</main>
        <footer className="border-t border-arena-border/50 py-10 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                {/* Logo with mixed fonts */}
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-lg text-arena-white/80 tracking-wide">
                    FRAGRANCE
                  </span>
                  <span className="font-elegant italic text-base text-arena-accent/80">
                    Arena
                  </span>
                </div>
                <span className="hidden sm:block text-arena-border">·</span>
                <p className="font-editorial italic text-arena-muted text-sm">
                  Taste is the argument.
                </p>
              </div>
              <div className="flex items-center gap-6">
                <Link
                  href="/about"
                  className="font-modern text-sm text-arena-muted hover:text-arena-light transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/privacy"
                  className="font-modern text-sm text-arena-muted hover:text-arena-light transition-colors"
                >
                  Privacy
                </Link>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-arena-border/30 text-center">
              <p className="font-modern text-arena-muted/60 text-xs">
                © {new Date().getFullYear()} Fragrance Battles
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
