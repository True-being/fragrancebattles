import { Metadata } from "next";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { Arena, ARENAS, ARENA_LABELS, RankedFragrance, Fragrance } from "@/types";
import ArenaTabs from "@/components/ArenaTabs";
import RankingsTable from "@/components/RankingsTable";

interface PageProps {
  searchParams: Promise<{ arena?: string }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const arena = (params.arena as Arena) || "overall";
  const arenaLabel = ARENA_LABELS[arena] || "Overall";

  return {
    title: `${arenaLabel} Fragrance Rankings — Fragrance Arena`,
    description: `See the top-ranked ${arenaLabel.toLowerCase()} fragrances based on head-to-head voting. Rankings update in real time.`,
  };
}

async function getRankings(arena: Arena): Promise<RankedFragrance[]> {
  try {
    const db = getAdminFirestore();

    const snapshot = await db
      .collection("fragrances")
      .where(`arenas.${arena}`, "==", true)
      .orderBy(`elo.${arena}`, "desc")
      .limit(100)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc, index) => {
      const data = doc.data() as Fragrance;
      const battles = data.stats?.battles?.[arena] || 0;
      const wins = data.stats?.wins?.[arena] || 0;

      return {
        rank: index + 1,
        id: doc.id,
        name: data.name,
        brand: data.brand,
        slug: data.slug,
        imageUrl: data.imageUrl,
        elo: data.elo?.[arena] || 1500,
        winRate: battles > 0 ? wins / battles : 0,
        battles,
        movement: "stable" as const,
      };
    });
  } catch (error) {
    console.error("Error fetching rankings:", error);
    return [];
  }
}

export default async function RankingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const arenaParam = params.arena;
  const arena: Arena = ARENAS.includes(arenaParam as Arena)
    ? (arenaParam as Arena)
    : "overall";

  const rankings = await getRankings(arena);
  const arenaLabel = ARENA_LABELS[arena];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-12 text-center">
        <h1 className="font-display text-4xl md:text-6xl text-arena-white tracking-wider mb-4">
          {arenaLabel.toUpperCase()} RANKINGS
        </h1>
        <p className="text-arena-light text-lg">
          The current standings based on head-to-head battles
        </p>
      </section>

      {/* Arena Tabs */}
      <ArenaTabs currentArena={arena} />

      {/* Rankings Table */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <RankingsTable fragrances={rankings} />
      </section>
    </div>
  );
}
