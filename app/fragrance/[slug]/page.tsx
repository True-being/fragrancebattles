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

async function getFragranceRank(
  fragranceId: string,
  arena: Arena,
  currentElo: number
): Promise<number> {
  try {
    const db = getAdminFirestore();

    // Count how many fragrances have higher Elo
    const snapshot = await db
      .collection("fragrances")
      .where(`arenas.${arena}`, "==", true)
      .where(`elo.${arena}`, ">", currentElo)
      .count()
      .get();

    return snapshot.data().count + 1;
  } catch (error) {
    console.error("Error getting rank:", error);
    return 0;
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
  const arenaStats = await Promise.all(
    activeArenas.map(async (arena) => {
      const elo = fragrance.elo[arena] || 1500;
      const battles = fragrance.stats?.battles?.[arena] || 0;
      const wins = fragrance.stats?.wins?.[arena] || 0;
      const rank = await getFragranceRank(fragrance.id, arena, elo);

      return {
        arena,
        label: ARENA_LABELS[arena],
        elo,
        rank,
        battles,
        wins,
        winRate: battles > 0 ? Math.round((wins / battles) * 100) : 0,
      };
    })
  );

  return (
    <div className="min-h-screen">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link
          href="/rankings"
          className="text-arena-light hover:text-arena-white transition-colors text-sm"
        >
          ← Back to Rankings
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Image */}
          <div className="relative w-64 h-80 bg-arena-gray rounded-lg overflow-hidden flex-shrink-0">
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
            <p className="text-arena-light text-sm uppercase tracking-wider mb-2">
              {fragrance.brand}
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-arena-white tracking-wider mb-6">
              {fragrance.name.toUpperCase()}
            </h1>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {activeArenas.map((arena) => (
                <span
                  key={arena}
                  className="px-3 py-1 text-xs uppercase tracking-wider bg-arena-gray border border-arena-border text-arena-light"
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
        <h2 className="font-display text-2xl text-arena-white tracking-wider mb-6">
          ARENA STATS
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {arenaStats.map((stat) => (
            <div
              key={stat.arena}
              className="bg-arena-gray border border-arena-border rounded-lg p-6"
            >
              <p className="text-arena-light text-xs uppercase tracking-wider mb-4">
                {stat.label}
              </p>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-arena-muted text-sm">Rank</span>
                  <span className="font-display text-3xl text-arena-white">
                    #{stat.rank}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-arena-muted text-sm">Win Rate</span>
                  <span className="text-arena-white font-medium">
                    {stat.battles > 0 ? `${stat.winRate}%` : "—"}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-arena-muted text-sm">Battles</span>
                  <span className="text-arena-light">{stat.battles}</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-arena-muted text-sm">Wins</span>
                  <span className="text-arena-light">{stat.wins}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <p className="text-arena-muted mb-4">Think this ranking is wrong?</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-arena-accent text-white font-semibold text-sm uppercase tracking-wider hover:bg-red-600 transition-colors"
        >
          Vote Now
        </Link>
      </section>
    </div>
  );
}
