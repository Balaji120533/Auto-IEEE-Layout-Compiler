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
      {/* Glass nav */}
      <motion.div
        className="glass-bar sticky top-0 z-20 flex items-center gap-7 px-6 sm:px-8 h-12"
        animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        <span className="text-[15px] font-semibold tracking-tight text-[#1d1d1f] whitespace-nowrap">Auto‑IEEE</span>
        <Link href="/editor" onClick={e => { e.preventDefault(); goToEditor(); }} className="text-xs text-[#6e6e73] hover:text-black transition-colors">Editor</Link>
        <Link href="/guide" onClick={e => { e.preventDefault(); goTo('/guide'); }} className="text-xs text-[#6e6e73] hover:text-black transition-colors">Guide</Link>
        <button
          onClick={goToEditor}
          className="pill pill-primary ml-auto text-xs px-4 py-1.5"
        >
          Open editor
        </button>
      </motion.div>

      {/* Hero */}
      <motion.section
        className="relative flex flex-col items-center justify-center px-6 pt-24 pb-8 text-center overflow-hidden"
        animate={isLeaving ? { opacity: 0, scale: 1.04, filter: 'blur(8px)' } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        {/* Aurora background */}
        <div aria-hidden="true" className="absolute -inset-x-[10%] -top-[10%] bottom-0 pointer-events-none" style={{ filter: 'blur(70px)', opacity: 0.85 }}>
          <div className="aurora-blob" style={{ width: 620, height: 520, left: -60, top: -60, background: 'radial-gradient(circle at 40% 40%, rgba(0,113,227,.42), rgba(0,113,227,0) 70%)', animation: 'drift1 22s ease-in-out infinite' }} />
          <div className="aurora-blob" style={{ width: 560, height: 480, right: -80, top: -20, background: 'radial-gradient(circle at 50% 50%, rgba(175,82,222,.34), rgba(175,82,222,0) 70%)', animation: 'drift2 26s ease-in-out infinite' }} />
          <div className="aurora-blob" style={{ width: 640, height: 420, left: '28%', top: 220, background: 'radial-gradient(circle at 50% 50%, rgba(255,149,0,.22), rgba(255,45,85,.16) 45%, rgba(255,45,85,0) 72%)', animation: 'drift3 30s ease-in-out infinite' }} />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: 'radial-gradient(rgba(0,0,0,.12) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            WebkitMaskImage: 'radial-gradient(120% 80% at 50% 12%, #000 20%, transparent 72%)',
            maskImage: 'radial-gradient(120% 80% at 50% 12%, #000 20%, transparent 72%)',
          }}
        />

        <motion.p
          className="relative text-[19px] font-medium tracking-tight text-[#0071e3] mb-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Auto-IEEE Layout Compiler
        </motion.p>

        <motion.h1
          className="relative text-[44px] sm:text-[68px] leading-[1.05] font-semibold tracking-tight max-w-3xl text-[#1d1d1f]"
          initial={{ opacity: 0, filter: 'blur(14px)', scale: 1.05 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.08 }}
        >
          Your draft.
          <br />
          <span className="text-[#86868b]">Perfectly typeset.</span>
        </motion.h1>

        <motion.p
          className="relative mt-6 text-lg sm:text-xl text-[#6e6e73] max-w-xl leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.16 }}
        >
          Paste your title, authors, and sections. Get back a submission-ready,
          double-column IEEE paper — no LaTeX, no Word wrangling.
        </motion.p>

        <motion.div
          className="relative flex gap-3 justify-center mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.26 }}
        >
          <button onClick={goToEditor} className="pill pill-primary text-[15px] px-6 py-3">
            Start writing
          </button>
          <Link
            href="/guide"
            onClick={e => { e.preventDefault(); goTo('/guide'); }}
            className="pill pill-quiet text-[15px] px-6 py-3"
          >
            Read the guide
          </Link>
        </motion.div>

        <motion.div
          className="relative mt-4 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-xs text-[#a1a1a6]">
            No AI in the pipeline. Just your paper, formatted right.
          </p>
        </motion.div>
      </motion.section>

      {/* Live preview visual */}
      <motion.section
        className="relative flex justify-center px-6 pt-8 pb-24"
        animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        <motion.div
          className="relative w-full max-w-[360px]"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <motion.div
            className="bg-white rounded-[10px] p-5 mx-auto"
            style={{ width: 340, height: 460, boxShadow: '0 30px 70px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.08)' }}
            whileHover={{ y: -8, boxShadow: '0 44px 90px rgba(0,0,0,.2)' }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="h-2 w-2/3 bg-[#1d1d1f] rounded-sm mx-auto mb-1.5" />
            <div className="h-[3px] w-2/5 bg-[#d2d2d7] rounded-sm mx-auto mb-1" />
            <div className="h-[3px] w-1/3 bg-[#e3e3e6] rounded-sm mx-auto mb-4" />
            <div className="flex gap-3.5 overflow-hidden">
              {[0, 1].map(col => (
                <div key={col} className={col === 0 ? 'flex-1 overflow-hidden pr-2.5 border-r border-[#f2f2f4]' : 'flex-1 overflow-hidden'}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="h-[3px] bg-[#e3e3e6] rounded-sm mb-1.5" style={{ width: `${55 + ((i * 13) % 40)}%` }} />
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            className="absolute -right-6 top-7 px-3.5 py-2 rounded-full bg-[#0071e3] text-white text-xs font-medium"
            style={{ boxShadow: '0 10px 26px rgba(0,113,227,.4)' }}
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            PDF ready
          </motion.div>
          <p className="text-xs text-[#86868b] text-center mt-4">Live two-column preview — exactly what compiles.</p>
        </motion.div>
      </motion.section>

      {/* Feature strip */}
      <motion.section
        className="bg-[#f5f5f7] px-6 sm:px-16 py-22"
        animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-[32px] sm:text-[40px] leading-tight font-semibold tracking-tight text-[#1d1d1f] max-w-[22ch] mb-10"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            Three things it does better than your template.
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-white rounded-2xl p-6"
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
                whileHover={{ y: -6, boxShadow: '0 18px 40px rgba(0,0,0,.1)' }}
              >
                <p className="text-[13px] font-semibold text-[#0071e3] mb-2">{f.title}</p>
                <p className="text-[15px] leading-relaxed text-[#1d1d1f]">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Closing CTA */}
      <motion.section
        className="relative px-6 py-26 text-center overflow-hidden"
        animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: 760, height: 420, transform: 'translate(-50%,-50%)',
            filter: 'blur(80px)', opacity: 0.7,
            background: 'radial-gradient(closest-side, rgba(0,113,227,.28), rgba(175,82,222,.16) 55%, transparent 75%)',
            animation: 'drift2 24s ease-in-out infinite',
          }}
        />
        <motion.h2
          className="relative text-[32px] sm:text-[48px] leading-tight font-semibold tracking-tight text-[#1d1d1f]"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Stop fighting your template.
        </motion.h2>
        <motion.div
          className="relative mt-7"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
        >
          <button onClick={goToEditor} className="pill pill-primary text-base px-7 py-3.5">
            Open the editor
          </button>
        </motion.div>
      </motion.section>

      <motion.footer
        className="bg-[#f5f5f7] px-6 sm:px-16 py-7 text-center text-xs text-[#86868b]"
        animate={isLeaving ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: TRANSITION_MS / 1000, ease: EASE }}
      >
        Auto‑IEEE Layout Compiler · Your papers stay in your browser.
      </motion.footer>
    </main>
  );
}
