import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Fragrance Arena",
  description: "Privacy policy for Fragrance Arena. We respect your privacy and collect minimal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <article className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="font-display text-4xl md:text-5xl text-arena-white tracking-wider mb-8">
          PRIVACY POLICY
        </h1>

        <p className="text-arena-muted text-sm mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>

        <div className="space-y-8 text-arena-light leading-relaxed">
          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              WHAT WE COLLECT
            </h2>
            <p>
              Fragrance Arena is designed with privacy in mind. We collect the
              minimum amount of data necessary to operate the service:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-arena-muted">
              <li>
                <strong className="text-arena-light">Session ID:</strong> A random
                identifier stored in your browser&apos;s local storage. This helps us
                prevent vote manipulation and avoid showing you the same matchups
                repeatedly.
              </li>
              <li>
                <strong className="text-arena-light">Votes:</strong> Your voting
                choices are recorded to update rankings. Votes are not linked to
                any personal information.
              </li>
              <li>
                <strong className="text-arena-light">Basic analytics:</strong> We
                may use privacy-respecting analytics to understand general usage
                patterns.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              WHAT WE DON&apos;T COLLECT
            </h2>
            <ul className="list-disc list-inside space-y-2 text-arena-muted">
              <li>No email addresses</li>
              <li>No names or personal identifiers</li>
              <li>No passwords (there are no accounts)</li>
              <li>No tracking across other websites</li>
              <li>No data sold to third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              COOKIES
            </h2>
            <p>
              We use local storage (similar to cookies) to store your session ID.
              This is essential for the service to function properly and cannot be
              disabled while using the site.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              DATA STORAGE
            </h2>
            <p>
              Vote data is stored securely using Google Firebase/Firestore. Your
              session ID is stored locally in your browser and is not shared with
              us unless you vote.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              YOUR RIGHTS
            </h2>
            <p>
              Since we don&apos;t collect personal information, there&apos;s nothing to
              delete or export. If you clear your browser&apos;s local storage, your
              session ID will be reset.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              CHANGES
            </h2>
            <p>
              We may update this privacy policy from time to time. Any changes
              will be reflected on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-arena-white tracking-wider mb-4">
              CONTACT
            </h2>
            <p>
              If you have questions about this privacy policy, you can reach out
              via the contact information provided on our website.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
