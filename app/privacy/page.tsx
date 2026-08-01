import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What StillGood saves locally and what optional anonymous measurements contain.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="method-page privacy-page">
      <header className="method-header">
        <Link className="simple-brand" href="/">
          <span>S</span> StillGood
        </Link>
        <Link className="header-link" href="/methodology">
          Methodology
        </Link>
      </header>

      <article className="method-article">
        <p className="kicker">Privacy, in plain language</p>
        <h1>Your results stay on your device by default.</h1>
        <p className="method-lede">
          StillGood needs no account. Completed results are stored in this
          browser so you can reopen or export them. Nothing is shared with us
          unless you turn on anonymous measurement sharing.
        </p>

        <section>
          <h2>What stays in your browser</h2>
          <p>
            Your full result logs and saved-run history are kept in browser
            storage on the device that ran the test. They are not synced between
            computers. Clearing site data removes them, so export any result you
            want to keep.
          </p>
        </section>

        <section>
          <h2>Optional anonymous measurements</h2>
          <p>
            The sharing option is off by default. If you enable it, StillGood
            sends the measurements needed to compare real devices and improve
            future scoring:
          </p>
          <ul>
            <li>benchmark and result-format versions;</li>
            <li>category scores, workload tiers, timings, hitches, and recovery;</li>
            <li>frame pacing, video playback, memory, and browser-storage measurements;</li>
            <li>browser family and major version, plus broad operating-system family;</li>
            <li>broad processor-count and display-refresh buckets;</li>
            <li>overall score, grade, confidence, form factor, and integrity flags.</li>
          </ul>
          <p>
            Each submission receives a new random run ID on the server. It is
            not reused to follow a device over time.
          </p>
        </section>

        <section>
          <h2>What we do not collect</h2>
          <ul>
            <li>names, email addresses, accounts, or contact information;</li>
            <li>a persistent device identifier or advertising identifier;</li>
            <li>browser history, extensions, open tabs, files, or document contents;</li>
            <li>the full user-agent string, referrer, or the computer&apos;s hostname;</li>
            <li>typed text, passwords, or the contents of other websites.</li>
          </ul>
          <p>
            Cloudflare necessarily processes network information such as an IP
            address to deliver and protect the site. StillGood&apos;s application
            does not put that address into its benchmark database.
          </p>
        </section>

        <section>
          <h2>Your controls</h2>
          <p>
            You can change anonymous sharing from the “What does it test?” panel
            on the home page. You can delete locally saved runs from Saved runs,
            or remove all StillGood data with your browser&apos;s site-data controls.
          </p>
        </section>

        <aside className="method-note">
          <strong>No third-party analytics</strong>
          <p>
            StillGood does not load advertising, tracking pixels, or third-party
            analytics during the benchmark.
          </p>
        </aside>

        <p className="privacy-updated">Last updated August 1, 2026.</p>
      </article>
    </main>
  );
}
