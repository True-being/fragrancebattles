import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as fs from "fs";
import * as path from "path";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { Fragrance, RankedFragrance } from "@/types";
import {
  formatNoteName,
  getNoteImagePath,
  generateItemListJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";
import RankingsTable from "@/components/RankingsTable";

interface PageProps {
  params: Promise<{ note: string }>;
}

interface NoteData {
  name: string;
  slug: string;
  displayName: string;
  imagePath: string;
  hasImage: boolean;
  fragrances: RankedFragrance[];
  notePosition: {
    top: number;
    heart: number;
    base: number;
  };
}

/**
 * Get all available notes from the image directory
 */
function getAvailableNotes(): string[] {
  try {
    const notesDir = path.join(process.cwd(), "public", "note-images-optimized");
    const files = fs.readdirSync(notesDir);
    return files
      .filter((f) => f.endsWith(".webp"))
      .map((f) => f.replace(".webp", ""));
  } catch {
    return [];
  }
}

/**
 * Check if a note has an image
 */
function noteHasImage(note: string): boolean {
  const slug = note.toLowerCase().replace(/\s+/g, "_");
  const imagePath = path.join(
    process.cwd(),
    "public",
    "note-images-optimized",
    `${slug}.webp`
  );
  return fs.existsSync(imagePath);
}

/**
 * Get fragrances containing a specific note
 */
async function getNoteData(noteSlug: string): Promise<NoteData | null> {
  const db = getAdminFirestore();

  // Normalize the note slug for matching
  const normalizedNote = noteSlug.toLowerCase().replace(/-/g, "_");
  const displayName = formatNoteName(normalizedNote);

  // Get all fragrances ordered by Elo
  const snapshot = await db
    .collection("fragrances")
    .orderBy("elo.overall", "desc")
    .get();

  const fragrances: RankedFragrance[] = [];
  const notePosition = { top: 0, heart: 0, base: 0 };

  for (const doc of snapshot.docs) {
    const data = doc.data() as Fragrance;
    const notes = data.notes;

    if (!notes) continue;

    // Check if fragrance contains this note
    const inTop = notes.top?.some(
      (n) => n.toLowerCase().replace(/\s+/g, "_") === normalizedNote
    );
    const inMiddle = notes.middle?.some(
      (n) => n.toLowerCase().replace(/\s+/g, "_") === normalizedNote
    );
    const inBase = notes.base?.some(
      (n) => n.toLowerCase().replace(/\s+/g, "_") === normalizedNote
    );
    const inAll = notes.all?.some(
      (n) => n.toLowerCase().replace(/\s+/g, "_") === normalizedNote
    );

    if (inTop || inMiddle || inBase || inAll) {
      if (inTop) notePosition.top++;
      if (inMiddle) notePosition.heart++;
      if (inBase) notePosition.base++;

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
  }

  if (fragrances.length === 0) {
    return null;
  }

  const hasImage = noteHasImage(normalizedNote);

  return {
    name: normalizedNote,
    slug: noteSlug,
    displayName,
    imagePath: getNoteImagePath(normalizedNote),
    hasImage,
    fragrances,
    notePosition,
  };
}

/**
 * Generate static params for all notes with images
 */
export async function generateStaticParams() {
  const notes = getAvailableNotes();
  return notes.map((note) => ({
    note: note.replace(/_/g, "-"),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { note } = await params;
  const noteData = await getNoteData(note);

  if (!noteData) {
    return {
      title: "Note Not Found",
    };
  }

  const title = `Best ${noteData.displayName} Fragrances`;
  const description = `Discover the top-ranked fragrances featuring ${noteData.displayName.toLowerCase()} notes. ${noteData.fragrances.length} fragrances ranked by community votes.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/notes/${note}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: noteData.hasImage
        ? [
            {
              url: noteData.imagePath,
              alt: `${noteData.displayName} note`,
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

export default async function NotePage({ params }: PageProps) {
  const { note } = await params;
  const noteData = await getNoteData(note);

  if (!noteData) {
    notFound();
  }

  const itemListJsonLd = generateItemListJsonLd(
    `Best ${noteData.displayName} Fragrances`,
    noteData.fragrances,
    `/notes/${noteData.slug}`
  );

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Notes", url: "/notes" },
    { name: noteData.displayName, url: `/notes/${noteData.slug}` },
  ]);

  // Determine the most common position for this note
  const { top, heart, base } = noteData.notePosition;
  const totalPositions = top + heart + base;
  const primaryPosition =
    totalPositions > 0
      ? top >= heart && top >= base
        ? "top"
        : heart >= base
          ? "heart"
          : "base"
      : null;

  const positionLabel = {
    top: "Top Note",
    heart: "Heart Note",
    base: "Base Note",
  };

  return (
    <div className="min-h-screen">
      {/* JSON-LD Structured Data */}
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
              href="/notes"
              className="hover:text-arena-light transition-colors"
            >
              Notes
            </Link>
          </li>
          <li className="text-arena-border">/</li>
          <li className="text-arena-white">{noteData.displayName}</li>
        </ol>
      </nav>

      {/* Header */}
      <section className="relative py-10 md:py-14 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-arena-accent/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4">
          {/* Note Image */}
          {noteData.hasImage && (
            <div className="relative w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-2 border-arena-border bg-arena-gray">
              <Image
                src={noteData.imagePath}
                alt={noteData.displayName}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          )}

          <p className="font-modern text-arena-light text-xs uppercase tracking-[0.3em] mb-4">
            {primaryPosition ? positionLabel[primaryPosition] : "Fragrance Note"}
          </p>
          <h1 className="mb-6">
            <span className="font-elegant text-4xl md:text-6xl text-arena-white">
              {noteData.displayName}
            </span>
          </h1>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <p className="font-expressive text-3xl font-bold text-arena-white">
                {noteData.fragrances.length}
              </p>
              <p className="font-modern text-xs text-arena-muted uppercase tracking-wider">
                Fragrances
              </p>
            </div>
            {totalPositions > 0 && (
              <>
                <div className="h-8 w-px bg-arena-border" />
                <div className="flex gap-4">
                  {top > 0 && (
                    <div>
                      <p className="font-expressive text-xl font-bold text-amber-400">
                        {top}
                      </p>
                      <p className="font-modern text-[10px] text-arena-muted uppercase tracking-wider">
                        Top
                      </p>
                    </div>
                  )}
                  {heart > 0 && (
                    <div>
                      <p className="font-expressive text-xl font-bold text-rose-400">
                        {heart}
                      </p>
                      <p className="font-modern text-[10px] text-arena-muted uppercase tracking-wider">
                        Heart
                      </p>
                    </div>
                  )}
                  {base > 0 && (
                    <div>
                      <p className="font-expressive text-xl font-bold text-emerald-400">
                        {base}
                      </p>
                      <p className="font-modern text-[10px] text-arena-muted uppercase tracking-wider">
                        Base
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="max-w-3xl mx-auto px-4 pb-8">
        <p className="font-editorial italic text-arena-light text-lg text-center">
          Fragrances featuring {noteData.displayName.toLowerCase()}, ranked by
          community votes in head-to-head battles.
        </p>
      </section>

      {/* Rankings */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="mb-6 flex items-center gap-3">
          <span className="text-xl">🏆</span>
          <span className="font-display text-xl text-arena-white tracking-wider">
            TOP
          </span>
          <span className="font-elegant italic text-lg text-arena-light">
            {noteData.displayName} Fragrances
          </span>
        </h2>

        <RankingsTable fragrances={noteData.fragrances} />
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="glass rounded-xl border border-arena-border p-8">
          <p className="font-editorial italic text-arena-light text-lg mb-5">
            Love {noteData.displayName.toLowerCase()} fragrances? Help rank them.
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
