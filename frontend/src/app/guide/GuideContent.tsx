'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import GuideTransition from './GuideTransition';

const EASE = [0.22, 1, 0.36, 1] as const;

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-[#f5f5f7] rounded-md text-[0.9em] text-[#1d1d1f] whitespace-nowrap">
      {children}
    </code>
  );
}

/** Fade-and-rise wrapper for scroll-triggered reveals, matching the mockup's
 *  `.reveal` treatment via Framer Motion's viewport observer. */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** A titled block in a definition list — no cards, no borders beyond a hairline
 *  rule, matching the typographic rhythm of the rest of the page. */
function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal className="py-5 border-t border-gray-100">
      <h3 className="text-[17px] font-semibold tracking-tight mb-1.5">{title}</h3>
      <div className="text-[15px] text-gray-600 leading-relaxed space-y-2">{children}</div>
    </Reveal>
  );
}

export default function GuideContent() {
  return (
    <main className="min-h-screen bg-white text-black">
      <GuideTransition>
      {/* Glass header */}
      <div className="glass-bar sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center">
          <Link
            href="/"
            data-transition
            className="text-[13px] text-[#6e6e73] hover:text-black transition-colors"
          >
            ← Home
          </Link>
          <Link
            href="/editor"
            data-transition
            className="pill pill-primary ml-auto text-xs px-4 py-1.5"
          >
            Open editor
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.h1
          className="text-[44px] leading-tight font-semibold tracking-tight text-[#1d1d1f]"
          initial={{ opacity: 0, filter: 'blur(14px)', scale: 1.05 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          User guide
        </motion.h1>

        {/* Citations — the one piece of syntax */}
        <section className="mt-12">
          <Reveal>
            <h2 className="text-[26px] font-semibold tracking-tight">Citations</h2>
            <p className="mt-3 text-[15px] text-gray-600 leading-relaxed max-w-[58ch]">
              To cite a reference inside a paragraph, type <Code>[CITE 1]</Code> —
              where <b>1</b> is the reference&apos;s number in the References tab.
            </p>
          </Reveal>

          <Reveal className="mt-8 bg-[#f5f5f7] rounded-2xl p-6">
            <div className="space-y-6">
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
          </Reveal>

          <Reveal className="mt-8" delay={0.06}>
            <p className="text-[15px] text-gray-600 leading-relaxed max-w-[58ch]">
              It must be the word <b>CITE</b>, a space, then the number — capitals
              optional. If you mistype it, the editor points it out under the
              paragraph and offers to correct it.
            </p>

            <p className="mt-4 text-[15px] text-gray-600 leading-relaxed max-w-[58ch]">
              A <Code>[?]</Code> in the preview means the number has no matching
              reference — <Code>[CITE 5]</Code> when you have three. Numbers renumber
              themselves when you reorder your references.
            </p>

            <p className="mt-4 text-[15px] text-gray-600 leading-relaxed max-w-[58ch]">
              Figures, tables and equations work differently: you add them from the
              Content tab rather than typing a code, and they are numbered
              automatically in the order they appear.
            </p>
          </Reveal>
        </section>

        {/* Preflight */}
        <section className="mt-14">
          <Reveal>
            <h2 className="text-[26px] font-semibold tracking-tight">
              Preflight warnings
            </h2>
            <p className="mt-3 text-[15px] text-gray-600 leading-relaxed max-w-[58ch]">
              Your paper is checked for problems that cause desk rejections. These
              are warnings, not blockers — the document is still produced.
            </p>
          </Reveal>

          <div className="mt-8">
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
          <Reveal>
            <h2 className="text-[26px] font-semibold tracking-tight">
              Saving your work
            </h2>
            <p className="mt-3 text-[15px] text-gray-600 leading-relaxed max-w-[58ch]">
              Papers save automatically as you type and are stored{' '}
              <b>in this browser</b> — not on a server. Open the sidebar (☰, top
              left) to switch between saved papers, start a new one, or delete an
              old one.
            </p>
            <p className="mt-3 text-[15px] text-gray-600 leading-relaxed max-w-[58ch]">
              Because storage is local, your papers will not appear on a different
              device or browser, and clearing browsing data removes them. Download
              the <b>.docx</b> to keep a copy you own.
            </p>
          </Reveal>
        </section>

        <Reveal className="mt-16 pt-10 border-t border-gray-100 text-center">
          <Link
            href="/editor"
            data-transition
            className="pill pill-primary inline-block text-[15px] px-8 py-3.5"
          >
            Open the editor
          </Link>
        </Reveal>
      </div>
      </GuideTransition>
    </main>
  );
}
