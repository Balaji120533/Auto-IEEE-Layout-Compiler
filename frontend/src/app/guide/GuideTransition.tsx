'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Same curve and duration as the landing page's CTA transition, so moving
// between Home, Guide and Editor feels like one continuous surface rather
// than three pages with their own ideas about motion.
const EASE = [0.22, 1, 0.36, 1] as const;
const TRANSITION_MS = 550;

/**
 * Wraps the guide's content to give it an entrance and an exit.
 *
 * Entering is a plain mount animation. Leaving needs interception: a normal
 * <Link> swaps the route immediately, so the exit would never be seen. Any
 * descendant link marked with `data-transition` is captured here — we play the
 * exit first, then navigate once it has finished.
 */
export default function GuideTransition({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-transition]');
    if (!link) return;

    // Let modified clicks (new tab, download, etc.) behave normally.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const href = link.getAttribute('href');
    if (!href) return;

    e.preventDefault();
    if (isLeaving) return;
    setIsLeaving(true);
    setTimeout(() => router.push(href), TRANSITION_MS);
  };

  return (
    <motion.div
      onClick={handleClick}
      initial={{ opacity: 0, y: 12 }}
      animate={
        isLeaving
          ? { opacity: 0, scale: 1.02, filter: 'blur(6px)' }
          : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
      }
      transition={{
        duration: isLeaving ? TRANSITION_MS / 1000 : 0.5,
        ease: EASE,
      }}
    >
      {children}
    </motion.div>
  );
}
