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
      <article className="max-w-2xl mx-auto px-4 py-16 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-4xl mb-4 block">⚔️</span>
          <h1>
            <span className="font-display text-4xl md:text-5xl text-arena-white tracking-wider block">
              THE
            </span>
            <span className="font-elegant italic text-5xl md:text-6xl text-arena-accent">
              Philosophy
            </span>
          </h1>
        </div>

        {/* Main statement - editorial blockquote */}
        <blockquote className="relative glass rounded-xl border border-arena-border p-8 mb-12">
          <div className="absolute -top-3 left-6 bg-arena-black px-2">
            <span className="font-elegant text-arena-accent text-4xl">"</span>
          </div>
          <p className="font-editorial text-2xl text-arena-white leading-relaxed mb-4 italic">
            Fragrance Arena doesn&apos;t rank quality.
          </p>
          <p className="font-editorial text-2xl text-arena-white leading-relaxed mb-4 italic">
            It ranks collective taste, memory, and cultural impact — <span className="text-arena-light">right now.</span>
          </p>
          <p className="font-expressive text-xl text-arena-accent font-semibold tracking-wide">
            Smell is subjective. This is the argument.
          </p>
        </blockquote>

        {/* Explanation - mixed typography */}
        <section className="space-y-6 mb-14">
          <p className="font-modern text-arena-light leading-relaxed text-lg">
            Every fragrance rating system pretends to be objective. Star ratings,
            critic scores, popularity lists — they all claim to tell you what&apos;s
            <span className="font-elegant italic text-arena-white"> &quot;good.&quot;</span>
          </p>

          <p className="font-modern text-arena-light leading-relaxed text-lg">
            We don&apos;t believe that. Fragrance is one of the most 
            <span className="font-elegant italic text-arena-white"> personal</span>, 
            <span className="font-elegant italic text-arena-white"> emotional</span>, and 
            <span className="font-elegant italic text-arena-white"> culturally-loaded</span> forms of expression. 
            There is no objectively best perfume. There never was.
          </p>

          <p className="font-modern text-arena-light leading-relaxed text-lg">
            What we can measure is <span className="font-expressive font-semibold text-arena-white">preference</span>. 
            When given a choice between two fragrances, which one wins? Repeat that thousands of
            times, and you get something interesting: a real-time map of
            collective taste.
          </p>

          <p className="font-editorial italic text-arena-light leading-relaxed text-xl">
            Rankings here move constantly. They reflect what people choose right
            now — not what was popular five years ago, and not what critics tell
            you to like.
          </p>
        </section>

        {/* How it works */}
        <section className="mb-14">
          <h2 className="mb-8 flex items-center gap-3">
            <span className="text-xl">⚙️</span>
            <span className="font-display text-2xl text-arena-white tracking-wider">HOW IT</span>
            <span className="font-elegant italic text-2xl text-arena-light">Works</span>
          </h2>

          <div className="space-y-4">
            {[
              { emphasis: "Choose.", text: "Two fragrances appear. You pick the one you prefer in that context." },
              { emphasis: "Vote.", text: "Your vote updates the rankings using an Elo rating system — the same math used in chess." },
              { emphasis: "Context.", text: "Rankings are separate for different arenas: Overall, Masculine, Feminine, and Unisex." },
              { emphasis: "Pure.", text: "There are no accounts, no reviews, no comments. Just choices." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-arena-accent/10 border border-arena-accent/30 flex items-center justify-center font-expressive text-arena-accent text-sm font-bold">
                  {i + 1}
                </span>
                <p className="pt-1">
                  <span className="font-expressive font-semibold text-arena-white">{item.emphasis}</span>
                  {" "}
                  <span className="font-modern text-arena-light">{item.text}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Expect disagreement */}
        <section className="mb-14">
          <h2 className="mb-6 flex items-center gap-3">
            <span className="text-xl">🔥</span>
            <span className="font-display text-2xl text-arena-white tracking-wider">EXPECT</span>
            <span className="font-elegant italic text-2xl text-arena-accent">Disagreement</span>
          </h2>

          <p className="font-modern text-arena-light leading-relaxed text-lg">
            If you look at our rankings and think 
            <span className="font-expressive font-semibold text-arena-white"> &quot;this is wrong&quot;</span> — 
            <span className="font-elegant italic text-arena-accent"> good.</span>
            {" "}That&apos;s the point. Vote. Change it. The rankings are only as accurate
            as the collective taste of everyone participating.
          </p>
        </section>

        {/* CTA */}
        <div className="text-center pt-10 border-t border-arena-border/50">
          <p className="font-editorial italic text-arena-muted text-lg mb-5">Ready to weigh in?</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-arena-accent text-white font-modern font-semibold text-sm uppercase tracking-wider rounded hover:bg-red-600 transition-all duration-200 shadow-glow hover:shadow-glow-lg"
          >
            Enter the Arena
          </Link>
        </div>
      </article>
    </div>
  );
}
