'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/** Global custom cursor: a small round dot that follows the pointer with a
 *  smooth spring trail, replacing the native cursor site-wide. Mounted once
 *  in the root layout. */
export function SiteCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { damping: 25, stiffness: 300 });
  const y = useSpring(rawY, { damping: 25, stiffness: 300 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      setIsVisible(true);

      const target = e.target as HTMLElement | null;
      setIsPointer(!!target?.closest('a, button, [role="button"], input, textarea, select, label, [data-cursor-pointer]'));
    };

    const handleLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMove);
    document.documentElement.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.documentElement.removeEventListener('mouseleave', handleLeave);
    };
  }, [rawX, rawY]);

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.3 }}
      transition={{ duration: 0.15, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <motion.div
        layout
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        animate={{
          width: isPointer ? 32 : 16,
          height: isPointer ? 32 : 16,
        }}
        className="rounded-full bg-gray-500/40 backdrop-blur-md dark:bg-gray-300/40"
      />
    </motion.div>
  );
}
