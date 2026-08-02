'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const FEATURES = [
  {
    title: 'Live preview',
    body: 'A real two-column IEEE layout that updates as you type — see the finished page, not a guess.',
  },
  {
    title: 'Deterministic compile',
    body: 'Every rule is code, not a model. The same draft always produces the same document.',
  },
  {
    title: 'Word and PDF',
    body: 'Download a submission-ready .docx, a .pdf, or both — nothing leaves your machine until you say so.',
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

// Duration of the exit animation before the actual route change fires — the
// hero scales up slightly and blurs out while everything below fades, then
// navigation happens once that's visually complete. Matches Apple's
// product-page CTA transitions: a soft, deliberate dissolve instead of an
// abrupt page swap.
const TRANSITION_MS = 550;

export default function Home() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const goTo = (href: string) => {
    if (isLeaving) return;
    setIsLeaving(true);
    setTimeout(() => router.push(href), TRANSITION_MS);
  };

  const goToEditor = () => goTo('/editor');

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Hero */}
      <motion.section
        className="relative flex flex-col items-center justify-center px-6 pt-40 pb-32 text-center overflow-hidden"
        animate={isLeaving ? { opacity: 0, scale: 1.04, filter: 'blur(8px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        <motion.p
          className="text-sm font-medium tracking-tight text-gray-400 mb-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Auto-IEEE Layout Compiler
        </motion.p>

        <motion.h1
          className="text-[44px] sm:text-[64px] leading-[1.05] font-semibold tracking-tight max-w-3xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
        >
          Your draft.
          <br />
          <span className="text-gray-400">Perfectly typeset.</span>
        </motion.h1>

        <motion.p
          className="mt-6 text-lg sm:text-xl text-gray-500 max-w-xl leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.16 }}
        >
          Paste your title, authors, and sections. Get back a submission-ready,
          double-column IEEE paper — no LaTeX, no Word wrangling.
        </motion.p>

        <motion.button
          onClick={goToEditor}
          className="mt-10 px-8 py-3.5 rounded-full bg-black text-white text-[15px] font-medium tracking-tight transition-colors hover:bg-gray-800"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.26 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Start writing →
        </motion.button>

        <motion.div
          className="mt-4 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-xs text-gray-400">
            No AI in the pipeline. Just your paper, formatted right.
          </p>
          <Link
            href="/guide"
            onClick={e => { e.preventDefault(); goTo('/guide'); }}
            className="text-[13px] text-gray-500 underline underline-offset-4 decoration-gray-300 hover:text-black hover:decoration-black transition-colors"
          >
            Read the user guide
          </Link>
        </motion.div>
      </motion.section>

      {/* Feature strip */}
      <motion.section
        className="border-t border-gray-100 px-6 py-24"
        animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
            >
              <h3 className="text-[17px] font-semibold tracking-tight mb-2">{f.title}</h3>
              <p className="text-[15px] text-gray-500 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Closing CTA */}
      <motion.section
        className="border-t border-gray-100 px-6 py-24 text-center"
        animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        <motion.h2
          className="text-3xl sm:text-4xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Stop fighting your template.
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        >
          <button
            onClick={goToEditor}
            className="mt-8 px-8 py-3.5 rounded-full bg-black text-white text-[15px] font-medium tracking-tight transition-colors hover:bg-gray-800"
          >
            Open the editor
          </button>
        </motion.div>
      </motion.section>

      <motion.footer
        className="px-6 py-10 text-center text-xs text-gray-300"
        animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        Auto-IEEE Layout Compiler
      </motion.footer>
    </main>
  );
}
