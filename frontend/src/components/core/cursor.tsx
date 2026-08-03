'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/** Global custom cursor: a small round dot that follows the pointer with a
 *  smooth spring trail, replacing the native cursor site-wide. Mounted once
 *  in the root layout. */
export function SiteCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  // Mirror the two flags in refs so the event handlers can compare against the
  // current value without re-subscribing, and only call setState on an actual
  // change rather than on every event.
  const visibleRef = useRef(false);
  const pointerRef = useRef(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  // Stiffer and heavier-damped than the original (300/25), which trailed far
  // enough behind the pointer to read as lag rather than as smoothing.
  // These values still ease the motion but keep the dot under the pointer.
  const spring = { damping: 30, stiffness: 800, mass: 0.2 };
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);

  useEffect(() => {
    // globals.css restores the native cursor under reduced-motion, so don't
    // also draw the dot — that would show two cursors at once.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Position goes through motion values, which write straight to the DOM
    // without a React render — so the dot itself is cheap to move.
    const handleMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      if (!visibleRef.current) {
        visibleRef.current = true;
        setIsVisible(true);
      }
    };

    // Hover detection is deliberately NOT on mousemove: running closest()
    // against this selector list and calling setState on every pointer event
    // re-rendered the component dozens of times a second, which is what made
    // the cursor feel like it was dragging behind the pointer.
    //
    // mouseover/mouseout fire only when the pointer actually crosses an
    // element boundary, so this does the same job with a couple of events per
    // hover instead of hundreds.
    const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, [data-cursor-pointer]';

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const next = !!target?.closest(INTERACTIVE);
      if (next !== pointerRef.current) {
        pointerRef.current = next;
        setIsPointer(next);
      }
    };

    const handleLeave = () => {
      visibleRef.current = false;
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('mouseover', handleOver, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleOver);
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
      {/* No `layout` prop: it makes Framer measure the element every render,
          and the size is already animated explicitly below.

          Scale rather than width/height so the change runs on the compositor
          instead of triggering layout on each frame. backdrop-blur was removed
          — re-sampling the page behind a continuously moving element is one of
          the most expensive things you can ask a compositor to do, and it was
          a major part of the cursor lag. */}
      <motion.div
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        animate={{ scale: isPointer ? 2 : 1 }}
        style={{ width: 16, height: 16, willChange: 'transform' }}
        className="rounded-full bg-gray-500/40 dark:bg-gray-300/40"
      />
    </motion.div>
  );
}
