'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden grain"
      style={{
        background: [
          'radial-gradient(ellipse at 18% 52%, rgba(165,148,210,0.82) 0%, transparent 52%)',
          'radial-gradient(ellipse at 78% 42%, rgba(228,212,128,0.80) 0%, transparent 52%)',
          'radial-gradient(ellipse at 55% 85%, rgba(210,195,155,0.50) 0%, transparent 45%)',
          '#cec6a8',
        ].join(', '),
      }}
    >
      <motion.div
        className="relative z-10 flex flex-col items-center gap-9 text-center px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      >
        <motion.h1
          className="text-3xl sm:text-4xl font-light leading-snug tracking-wide text-white drop-shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.7 }}
        >
          Paste your draft.
          <br />
          Download your{' '}
          <span
            style={{ color: '#f5e9a0' }}
            className="font-normal"
          >
            paper.
          </span>
        </motion.h1>

        <motion.button
          onClick={() => router.push('/editor')}
          className="px-9 py-3 rounded-full text-white/95 text-sm font-medium tracking-wide shadow-md"
          style={{
            background: 'rgba(212, 162, 162, 0.52)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.22)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.55 }}
          whileHover={{ scale: 1.05, background: 'rgba(212,162,162,0.68)' }}
          whileTap={{ scale: 0.97 }}
        >
          Get Started
        </motion.button>
      </motion.div>
    </main>
  );
}
