import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Fragrance Arena — Two Enter. One Wins.",
  description:
    "Head-to-head fragrance battles. Vote for your favorites and see real-time rankings. The ultimate taste battleground.",
  keywords: ["fragrance", "perfume", "cologne", "rankings", "voting", "arena"],
  openGraph: {
    title: "Fragrance Arena",
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
        <footer className="border-t border-arena-border py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-arena-muted text-sm">
                © {new Date().getFullYear()} Fragrance Arena. Taste is the argument.
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="/about"
                  className="text-sm text-arena-muted hover:text-arena-light transition-colors"
                >
                  About
                </a>
                <a
                  href="/privacy"
                  className="text-sm text-arena-muted hover:text-arena-light transition-colors"
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
