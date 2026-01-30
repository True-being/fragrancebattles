import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import * as fs from "fs";
import * as path from "path";
import { formatNoteName, getNoteImagePath } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Fragrance Notes",
  description:
    "Explore fragrances by note. Find the best vanilla, oud, bergamot, sandalwood, and more fragrances ranked by community votes.",
  alternates: {
    canonical: "/notes",
  },
};

interface NoteInfo {
  slug: string;
  displayName: string;
  imagePath: string;
}

function getAllNotes(): NoteInfo[] {
  try {
    const notesDir = path.join(process.cwd(), "public", "note-images-optimized");
    const files = fs.readdirSync(notesDir);

    return files
      .filter((f) => f.endsWith(".webp"))
      .map((f) => {
        const name = f.replace(".webp", "");
        return {
          slug: name.replace(/_/g, "-"),
          displayName: formatNoteName(name),
          imagePath: getNoteImagePath(name),
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  } catch {
    return [];
  }
}

export default function NotesIndexPage() {
  const notes = getAllNotes();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative py-14 md:py-16 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-arena-accent/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">🌸</span>
          </div>
          <h1 className="mb-4">
            <span className="font-display text-4xl md:text-6xl text-arena-white tracking-wider">
              FRAGRANCE
            </span>
            <br />
            <span className="font-elegant italic text-3xl md:text-5xl text-arena-light">
              Notes
            </span>
          </h1>
          <p className="font-editorial italic text-arena-light text-base md:text-lg max-w-md mx-auto">
            Explore fragrances by their signature notes
          </p>
        </div>
      </section>

      {/* Notes Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {notes.map((note) => (
            <Link
              key={note.slug}
              href={`/notes/${note.slug}`}
              className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:border-arena-border hover:bg-arena-gray/30 transition-all"
            >
              <div className="relative w-14 h-14 rounded-full overflow-hidden border border-arena-border bg-arena-gray group-hover:border-arena-accent/50 transition-colors">
                <Image
                  src={note.imagePath}
                  alt={note.displayName}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <span className="font-modern text-xs text-arena-light text-center group-hover:text-arena-white transition-colors">
                {note.displayName}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
