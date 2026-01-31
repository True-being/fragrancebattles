import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { Fragrance, RankedFragrance } from "@/types";
import {
  generateBrandJsonLd,
  generateItemListJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";
import RankingsTable from "@/components/RankingsTable";

// Revalidate brand pages every 5 minutes
export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface BrandData {
  name: string;
  slug: string;
  fragrances: RankedFragrance[];
  totalBattles: number;
  avgWinRate: number;
}

/**
 * Get brand data by slug - uses brandSlug field for efficient queries
 * Limited to top 100 fragrances to reduce Firestore reads
 * cache() deduplicates requests within a single render cycle
 */
const getBrandData = cache(async (slug: string): Promise<BrandData | null> => {
  const db = getAdminFirestore();

  // Query directly by brandSlug with limit to prevent excessive reads
  const snapshot = await db
    .collection("fragrances")
    .where("brandSlug", "==", slug)
    .orderBy("elo.overall", "desc")
    .limit(100)
    .get();

  if (snapshot.empty) {
    return null;
  }

  let brandName: string | null = null;
  const fragrances: RankedFragrance[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as Fragrance;
    if (!brandName) brandName = data.brand;

    const battles = data.stats?.battles?.overall || 0;
    const wins = data.stats?.wins?.overall || 0;

    fragrances.push({
      rank: fragrances.length + 1,
      id: doc.id,
      name: data.name,
      brand: data.brand,
      slug: data.slug,
      imageUrl: data.imageUrl,
      elo: data.elo?.overall || 1500,
      winRate: battles > 0 ? wins / battles : 0,
      battles,
      movement: "stable",
    });
  }

  if (!brandName || fragrances.length === 0) {
    return null;
  }

  // Calculate aggregate stats
  const totalBattles = fragrances.reduce((sum, f) => sum + f.battles, 0);
  const avgWinRate =
    fragrances.length > 0
      ? fragrances.reduce((sum, f) => sum + f.winRate, 0) / fragrances.length
      : 0;

  return {
    name: brandName,
    slug,
    fragrances,
    totalBattles,
    avgWinRate,
  };
});

/**
 * Force dynamic rendering - brand pages are server-rendered on demand
 * to avoid OOM during build (each page fetches full fragrances collection)
 */
export const dynamic = "force-dynamic";

// No static params - all brand pages rendered on-demand
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brandData = await getBrandData(slug);

  if (!brandData) {
    return {
      title: "Brand Not Found",
    };
  }

  const title = `${brandData.name} Fragrances Ranked`;
  const description = `See how ${brandData.fragrances.length} ${brandData.name} fragrances rank in head-to-head battles. Community-voted rankings updated in real time.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/brand/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: brandData.fragrances[0]
        ? [
            {
              url: brandData.fragrances[0].imageUrl,
              alt: `${brandData.name} top fragrance`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BrandPage({ params }: PageProps) {
  const { slug } = await params;
  const brandData = await getBrandData(slug);

  if (!brandData) {
    notFound();
  }

  const brandJsonLd = generateBrandJsonLd(
    brandData.name,
    brandData.slug,
    brandData.fragrances
  );

  const itemListJsonLd = generateItemListJsonLd(
    `Top ${brandData.name} Fragrances`,
    brandData.fragrances,
    `/brand/${brandData.slug}`
  );

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Rankings", url: "/rankings" },
    { name: brandData.name, url: `/brand/${brandData.slug}` },
  ]);

  return (
    <div className="min-h-screen">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="max-w-3xl mx-auto px-4 py-6">
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
          <li className="text-arena-white">{brandData.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <section className="relative py-10 md:py-14 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-arena-accent/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <p className="font-modern text-arena-light text-xs uppercase tracking-[0.3em] mb-4">
            Brand Rankings
          </p>
          <h1 className="mb-6">
            <span className="font-elegant text-4xl md:text-6xl text-arena-white">
              {brandData.name}
            </span>
          </h1>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <p className="font-expressive text-3xl font-bold text-arena-white">
                {brandData.fragrances.length}
              </p>
              <p className="font-modern text-xs text-arena-muted uppercase tracking-wider">
                Fragrances
              </p>
            </div>
            <div className="h-8 w-px bg-arena-border" />
            <div>
              <p className="font-expressive text-3xl font-bold text-arena-white">
                {brandData.totalBattles.toLocaleString()}
              </p>
              <p className="font-modern text-xs text-arena-muted uppercase tracking-wider">
                Total Battles
              </p>
            </div>
            <div className="h-8 w-px bg-arena-border" />
            <div>
              <p className="font-expressive text-3xl font-bold text-arena-white">
                {Math.round(brandData.avgWinRate * 100)}%
              </p>
              <p className="font-modern text-xs text-arena-muted uppercase tracking-wider">
                Avg Win Rate
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rankings */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="mb-6 flex items-center gap-3">
          <span className="text-xl">🏆</span>
          <span className="font-display text-xl text-arena-white tracking-wider">
            {brandData.name.toUpperCase()}
          </span>
          <span className="font-elegant italic text-lg text-arena-light">
            Rankings
          </span>
        </h2>

        <RankingsTable fragrances={brandData.fragrances} />
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="glass rounded-xl border border-arena-border p-8">
          <p className="font-editorial italic text-arena-light text-lg mb-5">
            Think a {brandData.name} fragrance should rank higher?
          </p>
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
