import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { Fragrance, Arena, ARENAS, ARENA_LABELS, getFragranticaUrl } from "@/types";
import NoteChip from "@/components/NoteChip";
import { slugify, generateBreadcrumbJsonLd } from "@/lib/seo";

// Revalidate fragrance pages every 5 minutes
// Stats update frequently but users don't need real-time accuracy
export const revalidate = 300;

interface ArenaStat {
  arena: Arena;
  label: string;
  elo: number;
  rank: number;
  battles: number;
  wins: number;
  winRate: number;
}

function generateFragranceJsonLd(fragrance: Fragrance, stats: ArenaStat[]) {
  const overallStat = stats.find((s) => s.arena === "overall") || stats[0];
  const hasBattles = overallStat && overallStat.battles > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fragrance.name,
    brand: {
      "@type": "Brand",
      name: fragrance.brand,
    },
    image: fragrance.imageUrl,
    description:
      fragrance.description ||
      `${fragrance.name} is a fragrance by ${fragrance.brand}${fragrance.year ? ` released in ${fragrance.year}` : ""}.`,
    ...(fragrance.year && { releaseDate: fragrance.year.toString() }),
    // Google requires at least one of: offers, review, or aggregateRating for Product snippets
    aggregateRating: hasBattles
      ? {
          "@type": "AggregateRating",
          ratingValue: Math.min(5, Math.max(1, overallStat.winRate / 20)),
          bestRating: 5,
          worstRating: 1,
          ratingCount: overallStat.battles,
        }
      : {
          "@type": "AggregateRating",
          ratingValue: 3,
          bestRating: 5,
          worstRating: 1,
          ratingCount: 1,
          reviewCount: 0,
        },
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// cache() deduplicates requests within a single render cycle
// This prevents double-fetching for generateMetadata + page component
const getFragranceBySlug = cache(async (slug: string): Promise<Fragrance | null> => {
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
});

async function getArenaRank(
  fragranceId: string,
  arena: Arena,
  fragranceElo: number
): Promise<number> {
  try {
    const db = getAdminFirestore();

    // Count how many fragrances have higher Elo (more efficient than fetching all)
    const snapshot = await db
      .collection("fragrances")
      .where(`arenas.${arena}`, "==", true)
      .where(`elo.${arena}`, ">", fragranceElo)
      .count()
      .get();

    // Rank is count of higher-ranked fragrances + 1
    return snapshot.data().count + 1;
  } catch (error) {
    console.error("Error getting arena rank:", error);
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
      title: "Fragrance Not Found",
    };
  }

  const title = `${fragrance.name} by ${fragrance.brand}`;
  const description = fragrance.description
    ? `${fragrance.description.slice(0, 150)}...`
    : `See how ${fragrance.name} by ${fragrance.brand} ranks in head-to-head fragrance battles. View win rate, battles, and arena rankings.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/fragrance/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: fragrance.imageUrl,
          width: 400,
          height: 400,
          alt: `${fragrance.name} by ${fragrance.brand}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
  
  // Fetch ranks for all active arenas in parallel (using count query - much faster)
  const arenaRanks = await Promise.all(
    activeArenas.map((arena) =>
      getArenaRank(fragrance.id, arena, fragrance.elo[arena] || 1500)
    )
  );
  
  const arenaStats = activeArenas.map((arena, index) => {
    const elo = fragrance.elo[arena] || 1500;
    const battles = fragrance.stats?.battles?.[arena] || 0;
    const wins = fragrance.stats?.wins?.[arena] || 0;
    const rank = arenaRanks[index];

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

  const jsonLd = generateFragranceJsonLd(fragrance, arenaStats);
  const brandSlug = slugify(fragrance.brand);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Rankings", url: "/rankings" },
    { name: fragrance.brand, url: `/brand/${brandSlug}` },
    { name: fragrance.name, url: `/fragrance/${fragrance.slug}` },
  ]);

  return (
    <div className="min-h-screen">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="max-w-4xl mx-auto px-4 py-6">
        <ol className="flex items-center gap-2 font-modern text-sm text-arena-muted">
          <li>
            <Link href="/" className="hover:text-arena-light transition-colors">
              Home
            </Link>
          </li>
          <li className="text-arena-border">/</li>
          <li>
            <Link
              href="/rankings"
              className="hover:text-arena-light transition-colors"
            >
              Rankings
            </Link>
          </li>
          <li className="text-arena-border">/</li>
          <li>
            <Link
              href={`/brand/${brandSlug}`}
              className="hover:text-arena-light transition-colors"
            >
              {fragrance.brand}
            </Link>
          </li>
          <li className="text-arena-border">/</li>
          <li className="text-arena-white truncate max-w-[150px]">{fragrance.name}</li>
        </ol>
      </nav>

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
            {/* Brand - modern clean, linked */}
            <Link
              href={`/brand/${brandSlug}`}
              className="font-modern text-arena-light text-sm uppercase tracking-[0.25em] mb-3 block hover:text-arena-accent transition-colors"
            >
              {fragrance.brand}
            </Link>
            {/* Name - elegant serif, large */}
            <h1 className="font-elegant text-4xl md:text-5xl lg:text-6xl text-arena-white leading-tight mb-6">
              {fragrance.name}
            </h1>
            {/* Year & Concentration badges */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              {fragrance.year && (
                <span className="px-3 py-1.5 font-modern text-xs bg-arena-dark border border-arena-border rounded-full text-arena-white">
                  {fragrance.year}
                </span>
              )}
              {fragrance.concentration && (
                <span className="px-3 py-1.5 font-modern text-xs uppercase tracking-wider bg-arena-dark border border-arena-border rounded-full text-arena-light">
                  {fragrance.concentration}
                </span>
              )}
            </div>

            {/* Arena badges */}
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

      {/* About Section */}
      {(fragrance.description || fragrance.perfumer || fragrance.fragranticaId || fragrance.accords?.length || fragrance.notes) && (
        <section className="max-w-4xl mx-auto px-4 pb-12">
          <h2 className="mb-6 flex items-center gap-3">
            <span className="text-xl">✨</span>
            <span className="font-display text-2xl text-arena-white tracking-wider">ABOUT</span>
          </h2>

          <div className="glass rounded-xl border border-arena-border p-6 space-y-4">
            {fragrance.perfumer && (
              <div className="flex items-baseline gap-3">
                <span className="font-modern text-arena-muted text-sm shrink-0">Perfumer</span>
                <span className="font-elegant text-lg text-arena-white">{fragrance.perfumer}</span>
              </div>
            )}

            {fragrance.accords && fragrance.accords.length > 0 && (
              <div className="space-y-2">
                <span className="font-modern text-arena-muted text-sm">Main Accords</span>
                <div className="flex flex-wrap gap-2">
                  {fragrance.accords.map((accord) => (
                    <span
                      key={accord}
                      className="px-3 py-1.5 font-modern text-xs capitalize bg-arena-accent/20 border border-arena-accent/30 rounded-full text-arena-accent"
                    >
                      {accord}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {fragrance.notes && (fragrance.notes.top || fragrance.notes.middle || fragrance.notes.base) && (
              <div className="space-y-4 pt-2">
                <span className="font-modern text-arena-muted text-sm">Notes Pyramid</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {fragrance.notes.top && fragrance.notes.top.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-modern text-xs uppercase tracking-wider text-amber-400/80">Top</p>
                      <div className="flex flex-wrap gap-1.5">
                        {fragrance.notes.top.map((note) => (
                          <NoteChip key={note} note={note} variant="top" size="md" />
                        ))}
                      </div>
                    </div>
                  )}
                  {fragrance.notes.middle && fragrance.notes.middle.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-modern text-xs uppercase tracking-wider text-rose-400/80">Heart</p>
                      <div className="flex flex-wrap gap-1.5">
                        {fragrance.notes.middle.map((note) => (
                          <NoteChip key={note} note={note} variant="heart" size="md" />
                        ))}
                      </div>
                    </div>
                  )}
                  {fragrance.notes.base && fragrance.notes.base.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-modern text-xs uppercase tracking-wider text-emerald-400/80">Base</p>
                      <div className="flex flex-wrap gap-1.5">
                        {fragrance.notes.base.map((note) => (
                          <NoteChip key={note} note={note} variant="base" size="md" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fallback: display all notes if no pyramid structure */}
            {fragrance.notes?.all && fragrance.notes.all.length > 0 && !fragrance.notes.top && !fragrance.notes.middle && !fragrance.notes.base && (
              <div className="space-y-2">
                <span className="font-modern text-arena-muted text-sm">Notes</span>
                <div className="flex flex-wrap gap-1.5">
                  {fragrance.notes.all.map((note) => (
                    <NoteChip key={note} note={note} size="md" />
                  ))}
                </div>
              </div>
            )}

            {fragrance.description && (
              <p className="font-editorial italic text-arena-light text-lg leading-relaxed">
                {fragrance.description}
              </p>
            )}

            {fragrance.fragranticaId && (
              <a
                href={getFragranticaUrl(fragrance.fragranticaId, fragrance.brand, fragrance.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-modern text-sm text-arena-accent hover:text-red-400 transition-colors group"
              >
                Learn more on Fragrantica
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </section>
      )}

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
