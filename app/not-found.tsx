import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-arena-accent/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        <div className="mb-6">
          <span className="text-6xl">🔍</span>
        </div>
        {/* Expressive 404 */}
        <h1 className="mb-4">
          <span className="font-display text-8xl md:text-9xl text-arena-white tracking-wider text-glow-white">
            404
          </span>
        </h1>
        <p className="font-elegant italic text-2xl md:text-3xl text-arena-light mb-2">
          Not Found
        </p>
        <p className="font-modern text-arena-muted text-base md:text-lg mb-8 max-w-md">
          This fragrance doesn&apos;t exist in our arena. It may have been
          removed or never existed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-arena-accent text-white font-modern font-semibold text-sm uppercase tracking-wider rounded hover:bg-red-600 transition-all duration-200 shadow-glow hover:shadow-glow-lg"
          >
            Back to Arena
          </Link>
          <Link
            href="/rankings"
            className="px-8 py-3 bg-arena-gray border border-arena-border text-arena-white font-modern font-semibold text-sm uppercase tracking-wider rounded hover:border-arena-light hover:bg-arena-border transition-all duration-200"
          >
            View Rankings
          </Link>
        </div>
      </div>
    </div>
  );
}
