import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-6xl text-arena-white tracking-wider mb-4">
        404
      </h1>
      <p className="text-arena-light text-xl mb-8">
        This fragrance doesn&apos;t exist in our arena.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-arena-accent text-white font-semibold text-sm uppercase tracking-wider hover:bg-red-600 transition-colors"
      >
        Back to Arena
      </Link>
    </div>
  );
}
