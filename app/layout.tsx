import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://fragrancebattles.com"),
  title: {
    default: "Fragrance Battles — Two Enter. One Wins.",
    template: "%s — Fragrance Battles",
  },
  description:
    "Head-to-head fragrance battles. Vote for your favorites and see real-time rankings powered by Elo. The ultimate taste battleground for perfume enthusiasts.",
  keywords: [
    "fragrance",
    "perfume",
    "cologne",
    "rankings",
    "voting",
    "arena",
    "elo",
    "best perfume",
    "fragrance comparison",
    "perfume battle",
    "fragrance ranking",
  ],
  openGraph: {
    type: "website",
    siteName: "Fragrance Battles",
    title: "Fragrance Battles — Two Enter. One Wins.",
    description:
      "Head-to-head fragrance battles. Vote for your favorites and see real-time rankings powered by Elo.",
    locale: "en_US",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fragrance Battles - Two Enter. One Wins.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fragrance Battles — Two Enter. One Wins.",
    description:
      "Head-to-head fragrance battles. Vote for your favorites and see real-time rankings.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
                <Image
                  src="/images/logo.png"
                  alt="Fragrance Battles"
                  width={32}
                  height={32}
                  className="h-8 w-8 opacity-80"
                />
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
