import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Fragrance Arena",
  description:
    "Fragrance Arena ranks collective taste, memory, and cultural impact through head-to-head battles. Smell is subjective. This is the argument.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <article className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <h1 className="font-display text-4xl md:text-5xl text-arena-white tracking-wider mb-8">
          THE PHILOSOPHY
        </h1>

        {/* Main statement */}
        <blockquote className="border-l-4 border-arena-accent pl-6 mb-12">
          <p className="text-xl text-arena-white leading-relaxed mb-4">
            Fragrance Arena doesn&apos;t rank &quot;quality.&quot;
          </p>
          <p className="text-xl text-arena-white leading-relaxed mb-4">
            It ranks collective taste, memory, and cultural impact — right now.
          </p>
          <p className="text-xl text-arena-accent font-medium">
            Smell is subjective. This is the argument.
          </p>
        </blockquote>

        {/* Explanation */}
        <section className="space-y-6 text-arena-light leading-relaxed mb-12">
          <p>
            Every fragrance rating system pretends to be objective. Star ratings,
            critic scores, popularity lists — they all claim to tell you what&apos;s
            &quot;good.&quot;
          </p>

          <p>
            We don&apos;t believe that. Fragrance is one of the most personal,
            emotional, and culturally-loaded forms of expression. There is no
            objectively best perfume. There never was.
          </p>

          <p>
            What we can measure is <em>preference</em>. When given a choice
            between two fragrances, which one wins? Repeat that thousands of
            times, and you get something interesting: a real-time map of
            collective taste.
          </p>

          <p>
            Rankings here move constantly. They reflect what people choose right
            now — not what was popular five years ago, and not what critics tell
            you to like.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-arena-white tracking-wider mb-6">
            HOW IT WORKS
          </h2>

          <ul className="space-y-4 text-arena-light">
            <li className="flex gap-3">
              <span className="text-arena-accent font-bold">1.</span>
              <span>
                Two fragrances appear. You pick the one you prefer in that
                context.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-arena-accent font-bold">2.</span>
              <span>
                Your vote updates the rankings using an Elo rating system — the
                same math used in chess rankings.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-arena-accent font-bold">3.</span>
              <span>
                Rankings are separate for different arenas: Overall, Masculine,
                Feminine, and Unisex.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-arena-accent font-bold">4.</span>
              <span>
                There are no accounts, no reviews, no comments. Just choices.
              </span>
            </li>
          </ul>
        </section>

        {/* Expect disagreement */}
        <section className="mb-12">
          <h2 className="font-display text-2xl text-arena-white tracking-wider mb-6">
            EXPECT DISAGREEMENT
          </h2>

          <p className="text-arena-light leading-relaxed">
            If you look at our rankings and think &quot;this is wrong&quot; — good.
            That&apos;s the point. Vote. Change it. The rankings are only as accurate
            as the collective taste of everyone participating.
          </p>
        </section>

        {/* CTA */}
        <div className="text-center pt-8 border-t border-arena-border">
          <p className="text-arena-muted mb-4">Ready to weigh in?</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-arena-accent text-white font-semibold text-sm uppercase tracking-wider hover:bg-red-600 transition-colors"
          >
            Enter the Arena
          </Link>
        </div>
      </article>
    </div>
  );
}
