import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { Fragrance, Arena, ARENAS, ARENA_LABELS } from "@/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getFragranceBySlug(slug: string): Promise<Fragrance | null> {
  try {
    const db = getAdminFirestore();

    const snapshot = await db
      .collection("fragrances")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Fragrance;
  } catch (error) {
    console.error("Error fetching fragrance:", error);
    return null;
  }
}

async function getArenaRankings(arena: Arena): Promise<Map<string, number>> {
  try {
    const db = getAdminFirestore();

    // Fetch all fragrances in this arena, ordered by Elo descending
    const snapshot = await db
      .collection("fragrances")
      .where(`arenas.${arena}`, "==", true)
      .orderBy(`elo.${arena}`, "desc")
      .get();

    const rankMap = new Map<string, number>();
    snapshot.docs.forEach((doc, index) => {
      rankMap.set(doc.id, index + 1);
    });

    return rankMap;
  } catch (error) {
    console.error("Error getting arena rankings:", error);
    return new Map();
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const fragrance = await getFragranceBySlug(slug);

  if (!fragrance) {
    return {
      title: "Fragrance Not Found — Fragrance Arena",
    };
  }

  return {
    title: `${fragrance.name} by ${fragrance.brand} — Fragrance Arena`,
    description: `See how ${fragrance.name} by ${fragrance.brand} ranks in head-to-head fragrance battles. View win rate, battles, and arena rankings.`,
    openGraph: {
      title: `${fragrance.name} by ${fragrance.brand}`,
      description: `Ranking stats for ${fragrance.name}`,
      images: [fragrance.imageUrl],
    },
  };
}

export default async function FragranceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const fragrance = await getFragranceBySlug(slug);

  if (!fragrance) {
    notFound();
  }

  // Get ranks for each arena the fragrance participates in
  const activeArenas = ARENAS.filter((arena) => fragrance.arenas[arena]);
  
  // Fetch rankings for all active arenas in parallel
  const arenaRankings = await Promise.all(
    activeArenas.map((arena) => getArenaRankings(arena))
  );
  
  const arenaStats = activeArenas.map((arena, index) => {
    const elo = fragrance.elo[arena] || 1500;
    const battles = fragrance.stats?.battles?.[arena] || 0;
    const wins = fragrance.stats?.wins?.[arena] || 0;
    const rankMap = arenaRankings[index];
    const rank = rankMap.get(fragrance.id) || 0;

    return {
      arena,
      label: ARENA_LABELS[arena],
      elo,
      rank,
      battles,
      wins,
      winRate: battles > 0 ? Math.round((wins / battles) * 100) : 0,
    };
  });

  return (
    <div className="min-h-screen">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link
          href="/rankings"
          className="inline-flex items-center gap-2 font-modern text-arena-light hover:text-arena-white transition-colors text-sm group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rankings
        </Link>
      </div>

      {/* Hero */}
      <section className="relative max-w-4xl mx-auto px-4 pb-12">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-arena-accent/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Image */}
          <div className="relative w-56 h-72 md:w-64 md:h-80 glass rounded-xl overflow-hidden flex-shrink-0 border border-arena-border">
            <div className="absolute inset-0 bg-gradient-to-t from-arena-gray to-transparent opacity-50 pointer-events-none z-10" />
            <Image
              src={fragrance.imageUrl}
              alt={`${fragrance.brand} ${fragrance.name}`}
              fill
              className="object-contain p-6"
              sizes="256px"
              priority
            />
          </div>

          {/* Info */}
          <div className="text-center md:text-left">
            {/* Brand - modern clean */}
            <p className="font-modern text-arena-light text-sm uppercase tracking-[0.25em] mb-3">
              {fragrance.brand}
            </p>
            {/* Name - elegant serif, large */}
            <h1 className="font-elegant text-4xl md:text-5xl lg:text-6xl text-arena-white leading-tight mb-6">
              {fragrance.name}
            </h1>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {activeArenas.map((arena) => (
                <span
                  key={arena}
                  className="px-3 py-1.5 font-modern text-xs uppercase tracking-wider bg-arena-gray/80 border border-arena-border rounded-full text-arena-light"
                >
                  {ARENA_LABELS[arena]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="mb-6 flex items-center gap-3">
          <span className="text-xl">📊</span>
          <span className="font-display text-2xl text-arena-white tracking-wider">ARENA</span>
          <span className="font-elegant italic text-xl text-arena-light">Stats</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {arenaStats.map((stat) => (
            <div
              key={stat.arena}
              className="glass rounded-xl border border-arena-border p-5 hover:border-arena-border/80 transition-colors"
            >
              <p className="font-modern text-arena-light text-xs uppercase tracking-wider mb-5 font-medium">
                {stat.label}
              </p>

              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-modern text-arena-muted text-sm">Rank</span>
                  <span className="font-expressive text-4xl font-bold text-arena-white">
                    #{stat.rank}
                  </span>
                </div>

                <div className="h-px bg-arena-border/50" />

                <div className="flex justify-between items-baseline">
                  <span className="font-modern text-arena-muted text-sm">Win Rate</span>
                  <span className={`font-expressive font-semibold ${stat.winRate >= 50 ? "text-green-400" : "text-arena-white"}`}>
                    {stat.battles > 0 ? `${stat.winRate}%` : "—"}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="font-modern text-arena-muted text-sm">Battles</span>
                  <span className="font-modern text-arena-light">{stat.battles}</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="font-modern text-arena-muted text-sm">Wins</span>
                  <span className="font-modern text-arena-light">{stat.wins}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-20 text-center">
        <div className="glass rounded-xl border border-arena-border p-8">
          <p className="font-editorial italic text-arena-light text-lg mb-5">Think this ranking is wrong?</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-arena-accent text-white font-modern font-semibold text-sm uppercase tracking-wider rounded hover:bg-red-600 transition-all duration-200 shadow-glow hover:shadow-glow-lg"
          >
            Vote Now
          </Link>
        </div>
      </section>
    </div>
  );
}
