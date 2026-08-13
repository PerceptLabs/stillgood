import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "A practical guide to keeping an older computer useful in 2026",
  description:
    "Safe, practical ways to improve an older computer, choose a supported operating system, and decide when an upgrade is worthwhile.",
  alternates: { canonical: "/guide" },
  robots: { index: false, follow: false },
};

const quickWins = [
  {
    title: "Update, then restart",
    text: "Install operating-system and browser updates, restart fully, and let background work settle before judging the machine.",
  },
  {
    title: "Audit extensions",
    text: "Remove or disable anything you do not actively use. Synced extensions can turn a clean old computer into a busy one again.",
  },
  {
    title: "Free some space",
    text: "Delete unneeded downloads and temporary files. Keep comfortable free space for updates, browser caches, and virtual memory.",
  },
  {
    title: "Check background work",
    text: "Pause cloud sync, indexing, launchers, and auto-start apps you do not need. Keep security software and system services intact.",
  },
  {
    title: "Try one other browser",
    text: "Video decoding and graphics support vary by browser and operating system. Compare the same task before changing deeper settings.",
  },
  {
    title: "Retest normally",
    text: "Use the computer as you actually intend to use it. A clean comparison run is useful, but it is not your everyday experience.",
  },
];

const symptomCards = [
  {
    id: "web",
    label: "Browsing",
    title: "Web pages pause or catch up",
    steps: [
      "Close tabs you are finished with instead of keeping every site live.",
      "Use the browser task manager to find a tab or extension consuming unusual resources.",
      "Remove duplicate extensions and limit background permissions where the browser allows it.",
      "Compare a fresh browser profile before blaming the hardware.",
    ],
    note: "One badly behaved site can feel slower than several ordinary pages. Judge repeatable patterns, not one page load.",
  },
  {
    id: "video",
    label: "Video",
    title: "Video stutters or makes the computer hot",
    steps: [
      "Confirm hardware acceleration is enabled unless it causes crashes or visual corruption.",
      "Try 720p or 1080p30 before assuming the entire computer is too slow.",
      "Compare Firefox and a Chromium-based browser; codec support can differ on the same hardware.",
      "On older hardware with H.264 decoding, h264ify can help YouTube—but it removes 1440p and 4K choices.",
    ],
    note: "Change one thing at a time and compare dropped frames, heat, fan noise, and how responsive the rest of the computer remains.",
  },
  {
    id: "office",
    label: "Documents",
    title: "Office work slows on larger files",
    steps: [
      "Use a native office application when a heavy browser editor struggles.",
      "Split exceptionally large documents, compress oversized images, and avoid embedding whole files when a link will do.",
      "In large spreadsheets, reduce volatile formulas, full-column references, and unnecessary live recalculation.",
      "Save locally while editing if cloud sync produces pauses, then restore normal syncing when finished.",
    ],
    note: "StillGood recreates browser-based office work. LibreOffice or another native application may behave differently—and sometimes much better.",
  },
  {
    id: "hitches",
    label: "Pauses",
    title: "The machine is fast, then suddenly unresponsive",
    steps: [
      "Watch for updates, cloud sync, antivirus scans, and storage activity when the pause occurs.",
      "Test with fewer extensions or a separate browser profile to expose account-synced clutter.",
      "Check storage health before treating long save or open-dialog delays as normal aging.",
      "If pauses appear only on battery, compare the normal and power-saving profiles.",
    ],
    note: "Short bursts of speed can hide memory pressure, slow storage, thermal throttling, or background work. The timing of the hitch is useful evidence.",
  },
];

const systemChoices = [
  {
    name: "Keep the current system",
    best: "Best when it still receives security and browser updates and all hardware works.",
    check: "Confirm the support date, install current updates, and make sure your browser remains supported.",
  },
  {
    name: "ChromeOS Flex",
    best: "A simple web-first option for supported Intel or AMD computers.",
    check: "Google requires 4 GB RAM and 16 GB storage, recommends certified models, and does not support ARM or Android apps on Flex.",
  },
  {
    name: "MX Linux with Xfce",
    best: "A practical middle ground for older 64-bit PCs that still deserve a full desktop.",
    check: "Try the live USB first and verify Wi-Fi, sound, suspend, brightness keys, video, and external displays.",
  },
  {
    name: "Debian with Xfce or LXQt",
    best: "A stable, flexible choice when you are comfortable choosing and maintaining your desktop.",
    check: "Debian specifically points older computers toward Xfce, LXQt, or LXDE rather than its heavier default environment.",
  },
  {
    name: "antiX",
    best: "For genuinely constrained or 32-bit x86 hardware that needs a very light environment.",
    check: "Modern browser availability—not the desktop itself—may become the real limit on very old 32-bit machines.",
  },
];

const roles = [
  ["Everyday helper", "Email, ordinary browsing, writing, PDFs, music, and occasional video."],
  ["Focused work machine", "One main document, research task, or communication app at a time."],
  ["Remote terminal", "Use the old computer as the screen and keyboard for a stronger desktop or server."],
  ["Workshop or kitchen PC", "Manuals, recipes, music, inventory, printing, or a single web application."],
];

export default function GuidePage() {
  return (
    <main className="methodology-shell guide-page">
      <header className="simple-header methodology-header guide-header">
        <Link className="simple-brand" href="/" aria-label="StillGood home">
          <span>S</span> StillGood
        </Link>
        <div className="guide-header-meta">
          <span>Practical guide</span>
          <span>Reviewed August 2026</span>
        </div>
      </header>

      <article className="guide-paper">
        <header className="guide-hero">
          <div className="guide-year" aria-hidden="true">
            <span>20</span>
            <span>26</span>
          </div>
          <div>
            <p className="kicker">The StillGood second-life guide</p>
            <h1>Get more useful years from an older computer.</h1>
            <p className="guide-lede">
              Start with safe, free changes. Upgrade only when the evidence
              points to a real bottleneck. Replace the machine only when safety,
              software support, or reliability makes that the honest answer.
            </p>
          </div>
        </header>

        <div className="guide-principles" aria-label="Guide principles">
          <p><strong>First</strong> Protect your files and safety.</p>
          <p><strong>Then</strong> Fix the problem you can actually feel.</p>
          <p><strong>Last</strong> Spend money or replace the operating system.</p>
        </div>

        <nav className="guide-toc" aria-label="Guide sections">
          <strong>Jump to</strong>
          <a href="#start">15-minute reset</a>
          <a href="#symptoms">Fix a symptom</a>
          <a href="#system">Choose a system</a>
          <a href="#hardware">Upgrade wisely</a>
          <a href="#roles">Give it a job</a>
        </nav>

        <section className="guide-safety" aria-labelledby="safety-title">
          <div className="guide-safety-mark" aria-hidden="true">!</div>
          <div>
            <p className="guide-eyebrow">Before changing anything</p>
            <h2 id="safety-title">Back up important files and inspect the battery.</h2>
            <p>
              Stop using a laptop with a swollen battery, a lifting trackpad or
              case, unusual chemical smell, smoke, or extreme heat. Do not put a
              damaged lithium battery in household trash. If the machine is
              physically sound, make a verified copy of files you cannot replace
              before reinstalling an operating system or opening the case.
            </p>
          </div>
        </section>

        <section id="start" className="guide-section">
          <div className="guide-section-heading">
            <p className="paper-number">01 · START HERE</p>
            <h2>Try this 15-minute reset first.</h2>
            <p>
              These changes are reversible and often reveal whether the machine
              is actually too slow or simply carrying years of accumulated work.
            </p>
          </div>
          <div className="guide-quick-grid">
            {quickWins.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          <aside className="guide-note">
            <strong>Do not install a “PC cleaner.”</strong>
            <p>
              Registry cleaners, driver-updater bundles, and one-click optimizer
              tools often add background work or risk. Use the operating system’s
              own update, startup, storage, and security controls.
            </p>
          </aside>
        </section>

        <section id="symptoms" className="guide-section">
          <div className="guide-section-heading">
            <p className="paper-number">02 · FOLLOW THE SYMPTOM</p>
            <h2>Fix what you notice—not the computer’s age.</h2>
            <p>
              A slow drive, poor video decoding, account-synced extensions, and
              limited memory can all feel like “a slow computer,” but they need
              different fixes.
            </p>
          </div>
          <div className="guide-symptom-grid">
            {symptomCards.map((card) => (
              <article id={card.id} key={card.id}>
                <p className="guide-eyebrow">{card.label}</p>
                <h3>{card.title}</h3>
                <ol>
                  {card.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
                <p className="guide-card-note">{card.note}</p>
              </article>
            ))}
          </div>
          <div className="guide-source-strip">
            <p>
              Google recommends updating Chrome, closing unused tabs, removing
              unwanted extensions, and checking its task manager. Mozilla says
              hardware acceleration normally reduces CPU work but may be worth
              disabling only when graphics problems or crashes point to it.
            </p>
            <div>
              <a href="https://support.google.com/chrome/answer/1385029" target="_blank" rel="noreferrer">
                Chrome performance guidance
              </a>
              <a href="https://support.mozilla.org/en-US/kb/performance-settings" target="_blank" rel="noreferrer">
                Firefox performance settings
              </a>
              <a href="https://addons.mozilla.org/en-US/firefox/addon/h264ify/" target="_blank" rel="noreferrer">
                What h264ify changes
              </a>
            </div>
          </div>
        </section>

        <section id="system" className="guide-section">
          <div className="guide-section-heading">
            <p className="paper-number">03 · OPERATING SYSTEM</p>
            <h2>Stay supported without making the machine harder to use.</h2>
            <p>
              A light desktop is helpful, but a current browser, working sleep,
              reliable Wi-Fi, video decoding, and security updates matter more
              than winning an idle-memory contest.
            </p>
          </div>

          <div className="guide-support-alert">
            <strong>Windows 10 needs a decision now.</strong>
            <p>
              Free Windows 10 support ended October 14, 2025. Microsoft’s current
              consumer Extended Security Updates option can protect eligible PCs
              through October 12, 2027. Enroll, move to a supported Windows release,
              or test another supported operating system—do not treat an unpatched
              internet computer as a permanent solution.
            </p>
            <a href="https://support.microsoft.com/en-US/Windows/Deployment/Updates-Lifecycle/windows-10-support-has-ended-on-october-14-2025" target="_blank" rel="noreferrer">
              Check Microsoft’s current Windows 10 options
            </a>
          </div>

          <div className="guide-system-list">
            {systemChoices.map((choice, index) => (
              <article key={choice.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{choice.name}</h3>
                  <p>{choice.best}</p>
                </div>
                <p>{choice.check}</p>
              </article>
            ))}
          </div>

          <div className="guide-links-row" aria-label="Operating system sources">
            <a href="https://support.google.com/chromeosflex/answer/11552529" target="_blank" rel="noreferrer">ChromeOS Flex requirements</a>
            <a href="https://support.google.com/chromeosflex/answer/11513094" target="_blank" rel="noreferrer">ChromeOS Flex certified models</a>
            <a href="https://mxlinux.org/blog/mx-25-2-infinity-isos-now-available/" target="_blank" rel="noreferrer">MX Linux 25.2</a>
            <a href="https://wiki.debian.org/DebianDesktopHowTo" target="_blank" rel="noreferrer">Debian desktop choices</a>
            <a href="https://antixlinux.com/download/" target="_blank" rel="noreferrer">antiX 26</a>
          </div>

          <aside className="guide-note">
            <strong>Always try the live USB first.</strong>
            <p>
              Test Wi-Fi, speakers, microphone, webcam, touchpad, brightness,
              suspend and resume, charging, external displays, printing, and a
              real video. Installation should be the final step, not the test.
            </p>
          </aside>
        </section>

        <section id="hardware" className="guide-section">
          <div className="guide-section-heading">
            <p className="paper-number">04 · HARDWARE</p>
            <h2>Upgrade only when it changes the experience.</h2>
            <p>
              Look up the exact model and service manual first. Many thin laptops
              and Chromebooks have soldered memory or storage that cannot be
              economically upgraded.
            </p>
          </div>

          <div className="guide-upgrade-order">
            <article>
              <span>1</span>
              <div><h3>Replace a hard drive with an SSD</h3><p>Usually the most noticeable upgrade when the machine still uses a mechanical drive. It does not make a slow processor fast.</p></div>
            </article>
            <article>
              <span>2</span>
              <div><h3>Add memory when it is truly upgradeable</h3><p>Useful when ordinary work causes tab reloads, application restarts, or repeated storage-backed pauses. Match the supported type and capacity.</p></div>
            </article>
            <article>
              <span>3</span>
              <div><h3>Restore cooling when heat is the problem</h3><p>Clear blocked vents and fans using a model-specific repair guide. Opening a laptop or replacing thermal paste is not a beginner requirement.</p></div>
            </article>
            <article>
              <span>4</span>
              <div><h3>Replace a worn battery for mobility</h3><p>A weak but physically safe battery does not make a plugged-in computer useless. A swollen battery is a safety problem, not a performance upgrade.</p></div>
            </article>
          </div>

          <div className="guide-stop-spending">
            <p className="guide-eyebrow">Know when to stop</p>
            <h3>Do not keep spending because you already started.</h3>
            <ul>
              <li>The browser or operating system cannot receive security updates.</li>
              <li>Storage reports errors or important files cannot be trusted to it.</li>
              <li>The battery is swollen or the device shows heat, smoke, or physical damage.</li>
              <li>The repair costs more than a comparable supported refurbished machine.</li>
              <li>The ports, Wi-Fi, sleep, or display problems prevent its intended job.</li>
            </ul>
            <a href="https://www.ifixit.com/Wiki/What_to_do_with_a_swollen_battery" target="_blank" rel="noreferrer">
              Read iFixit’s swollen-battery safety guidance
            </a>
          </div>
        </section>

        <section id="roles" className="guide-section">
          <div className="guide-section-heading">
            <p className="paper-number">05 · A USEFUL SECOND LIFE</p>
            <h2>Give the computer a job it can do well.</h2>
            <p>
              A second-life computer does not have to replace a modern workstation.
              Reliability and a clear role can matter more than unused peak speed.
            </p>
          </div>
          <div className="guide-role-grid">
            {roles.map(([title, text], index) => (
              <article key={title}>
                <span aria-hidden="true">{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="guide-retest">
            <div>
              <p className="kicker">Measure the difference</p>
              <h2>Test before and after—not just once.</h2>
              <p>
                Use the same browser and similar power conditions. Run StillGood
                two or three times, then confirm the change with the real task you
                care about. A tiny score movement is normal variation; fewer hitches,
                smoother video, or a better sustained workload is the useful result.
              </p>
            </div>
            <Link className="guide-run-button" href="/">Run StillGood</Link>
          </div>
        </section>

        <section className="guide-sources" aria-labelledby="sources-title">
          <p className="paper-number">SOURCES &amp; EDITORIAL STANDARD</p>
          <h2 id="sources-title">Independent advice, checked against primary sources.</h2>
          <p>
            StillGood favors official support documentation, operating-system
            projects, standards bodies, and established repair guidance. Product
            behavior and support dates change, so check the linked source before a
            major installation or repair.
          </p>
          <div>
            <a href="https://www.w3.org/WAI/tips/writing/" target="_blank" rel="noreferrer">W3C accessible writing guidance</a>
            <a href="https://www.gov.uk/guidance/government-design-principles" target="_blank" rel="noreferrer">GOV.UK design principles</a>
            <a href="https://support.google.com/chrome/answer/1385029" target="_blank" rel="noreferrer">Google Chrome Help</a>
            <a href="https://support.mozilla.org/en-US/kb/performance-settings" target="_blank" rel="noreferrer">Mozilla Support</a>
            <a href="https://www.ifixit.com/Info/Device_Safety" target="_blank" rel="noreferrer">iFixit device safety</a>
          </div>
          <p className="guide-independence">No paid placements or affiliate links. Last reviewed August 13, 2026.</p>
        </section>
      </article>
    </main>
  );
}
