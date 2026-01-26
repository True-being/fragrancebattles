import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Fragrance Arena",
  description:
    "Privacy policy for Fragrance Arena. We respect your privacy and collect minimal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <article className="max-w-2xl mx-auto px-4 py-16 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-4xl mb-4 block">🔒</span>
          <h1>
            <span className="font-display text-4xl md:text-5xl text-arena-white tracking-wider block">
              PRIVACY
            </span>
            <span className="font-elegant italic text-3xl md:text-4xl text-arena-light">
              Policy
            </span>
          </h1>
          <p className="font-modern text-arena-muted text-sm mt-4">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="space-y-10">
          <section className="glass rounded-xl border border-arena-border p-6">
            <h2 className="mb-4 flex items-center gap-2">
              <span className="text-base">📊</span>
              <span className="font-display text-xl text-arena-white tracking-wider">WHAT WE</span>
              <span className="font-elegant italic text-lg text-arena-light">Collect</span>
            </h2>
            <p className="font-modern text-arena-light mb-4">
              Fragrance Arena is designed with privacy in mind. We collect the
              minimum amount of data necessary to operate the service:
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-arena-accent">•</span>
                <span className="font-modern text-arena-muted">
                  <span className="font-expressive font-semibold text-arena-light">Session ID:</span> A
                  random identifier stored in your browser&apos;s local storage.
                  This helps us prevent vote manipulation and avoid showing you
                  the same matchups repeatedly.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-arena-accent">•</span>
                <span className="font-modern text-arena-muted">
                  <span className="font-expressive font-semibold text-arena-light">Votes:</span> Your
                  voting choices are recorded to update rankings. Votes are not
                  linked to any personal information.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-arena-accent">•</span>
                <span className="font-modern text-arena-muted">
                  <span className="font-expressive font-semibold text-arena-light">Basic analytics:</span>{" "}
                  We may use privacy-respecting analytics to understand general
                  usage patterns.
                </span>
              </li>
            </ul>
          </section>

          <section className="glass rounded-xl border border-arena-border p-6">
            <h2 className="mb-4 flex items-center gap-2">
              <span className="text-base">🚫</span>
              <span className="font-display text-xl text-arena-white tracking-wider">WHAT WE</span>
              <span className="font-elegant italic text-lg text-arena-accent">Don&apos;t</span>
              <span className="font-elegant italic text-lg text-arena-light">Collect</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "No email addresses",
                "No names or personal identifiers",
                "No passwords (there are no accounts)",
                "No tracking across other websites",
                "No data sold to third parties",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4 text-green-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-modern text-arena-muted text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              COOKIES
            </h2>
            <p className="font-modern text-arena-light leading-relaxed">
              We use local storage (similar to cookies) to store your session
              ID. This is essential for the service to function properly and
              cannot be disabled while using the site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              DATA STORAGE
            </h2>
            <p className="font-modern text-arena-light leading-relaxed">
              Vote data is stored securely using Google Firebase/Firestore. Your
              session ID is stored locally in your browser and is not shared
              with us unless you vote.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              YOUR RIGHTS
            </h2>
            <p className="font-modern text-arena-light leading-relaxed">
              Since we don&apos;t collect personal information, there&apos;s
              nothing to delete or export. If you clear your browser&apos;s
              local storage, your session ID will be reset.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              CHANGES
            </h2>
            <p className="font-modern text-arena-light leading-relaxed">
              We may update this privacy policy from time to time. Any changes
              will be reflected on this page with an updated date.
            </p>
          </section>

          <section className="pt-6 border-t border-arena-border/50">
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              CONTACT
            </h2>
            <p className="font-modern text-arena-light leading-relaxed">
              If you have questions about this privacy policy, you can reach out
              via the contact information provided on our website.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
