import Link from 'next/link';
import GuideTransition from './GuideTransition';

export const metadata = { title: 'User Guide — Auto-IEEE Compiler' };

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-gray-100 rounded text-[0.9em] text-gray-800 whitespace-nowrap">
      {children}
    </code>
  );
}

/** A titled block in a definition list — no cards, no borders beyond a hairline
 *  rule, matching the typographic rhythm of the rest of the page. */
function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-gray-100">
      <h3 className="text-[17px] font-semibold tracking-tight mb-1.5">{title}</h3>
      <div className="text-[15px] text-gray-600 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <GuideTransition>
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            href="/"
            data-transition
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            ← Home
          </Link>
          <Link
            href="/editor"
            data-transition
            className="px-4 py-2 rounded-full bg-black text-white text-[13px] font-medium hover:bg-gray-800 transition-colors"
          >
            Open the editor
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-[40px] leading-tight font-semibold tracking-tight">User guide</h1>

        {/* Citations — the one piece of syntax */}
        <section className="mt-12">
          <h2 className="text-[26px] font-semibold tracking-tight">Citations</h2>
          <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
            To cite a reference inside a paragraph, type <Code>[CITE 1]</Code> —
            where <b>1</b> is the reference&apos;s number in the References tab.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <p className="text-[13px] text-gray-400 mb-2">You type</p>
              <p className="text-[15px] text-gray-800 leading-relaxed">
                Transformer models changed the field <Code>[CITE 1]</Code>, and
                later work extended them <Code>[CITE 2]</Code>.
              </p>
            </div>
            <div>
              <p className="text-[13px] text-gray-400 mb-2">Your document shows</p>
              <p className="text-[15px] text-gray-800 leading-relaxed">
                Transformer models changed the field [1], and later work extended
                them [2].
              </p>
            </div>
          </div>

          <p className="mt-8 text-[15px] text-gray-600 leading-relaxed">
            It must be the word <b>CITE</b>, a space, then the number — capitals
            optional. If you mistype it, the editor points it out under the
            paragraph and offers to correct it.
          </p>

          <p className="mt-4 text-[15px] text-gray-600 leading-relaxed">
            A <Code>[?]</Code> in the preview means the number has no matching
            reference — <Code>[CITE 5]</Code> when you have three. Numbers renumber
            themselves when you reorder your references.
          </p>

          <p className="mt-4 text-[15px] text-gray-600 leading-relaxed">
            Figures, tables and equations work differently: you add them from the
            Content tab rather than typing a code, and they are numbered
            automatically in the order they appear.
          </p>
        </section>

        {/* Preflight */}
        <section className="mt-10">
          <h2 className="text-[26px] font-semibold tracking-tight">
            Preflight warnings
          </h2>
          <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
            Your paper is checked for problems that cause desk rejections. These
            are warnings, not blockers — the document is still produced.
          </p>

          <div className="mt-8 border-t border-gray-100">
            <Item title="Low image DPI">
              <p>
                Shown right after upload if an image is below 150 DPI. IEEE print
                wants 300 or higher. Screenshots are usually 72–96 DPI and will
                look soft in print — re-export the figure at a higher resolution.
              </p>
            </Item>
            <Item title="Page count">
              <p>
                Flagged when the PDF runs past eight pages, a common IEEE
                conference limit. Check your venue&apos;s call for papers — limits
                vary.
              </p>
            </Item>
            <Item title="Missing or unreadable image">
              <p>
                An image used by a figure could not be found or opened. Re-upload
                it from the Content tab.
              </p>
            </Item>
          </div>
        </section>

        {/* Saving */}
        <section className="mt-16">
          <h2 className="text-[26px] font-semibold tracking-tight">
            Saving your work
          </h2>
          <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
            Papers save automatically as you type and are stored{' '}
            <b>in this browser</b> — not on a server. Open the sidebar (☰, top
            left) to switch between saved papers, start a new one, or delete an
            old one.
          </p>
          <p className="mt-3 text-[15px] text-gray-600 leading-relaxed">
            Because storage is local, your papers will not appear on a different
            device or browser, and clearing browsing data removes them. Download
            the <b>.docx</b> to keep a copy you own.
          </p>
        </section>

        <div className="mt-16 pt-10 border-t border-gray-100 text-center">
          <Link
            href="/editor"
            data-transition
            className="inline-block px-8 py-3.5 rounded-full bg-black text-white text-[15px] font-medium tracking-tight hover:bg-gray-800 transition-colors"
          >
            Open the editor
          </Link>
        </div>
      </div>
      </GuideTransition>
    </main>
  );
}
