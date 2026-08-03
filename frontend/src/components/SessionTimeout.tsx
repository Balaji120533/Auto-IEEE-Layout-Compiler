'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { SESSION_MAX_AGE } from '@/lib/session-config';

/** Warn this many seconds before the session actually expires. */
const WARN_BEFORE = 60;

/** Activity that counts as "still here". Scroll and keydown matter most for a
 *  writing tool — someone drafting a paragraph may not move the mouse at all. */
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

/**
 * Idle session timeout.
 *
 * The JWT's own maxAge (auth.config.ts) is the source of truth for expiry, but
 * it only refreshes when a request reaches the server. Someone typing in the
 * editor generates no requests, so without this component their session would
 * lapse mid-draft. Here we track real interaction, refresh the token while the
 * user is active, and surface a warning before signing them out — papers live
 * in localStorage per browser, so a silent redirect is a bad surprise.
 */
export default function SessionTimeout() {
  const { data: session, update } = useSession();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Wall-clock deadline. A ref rather than state: activity updates it many
  // times a second and must not trigger a re-render each time.
  const deadline = useRef<number>(Date.now() + SESSION_MAX_AGE * 1000);
  // Throttle token refreshes — an active user fires activity events constantly,
  // but the server only needs to hear from us occasionally.
  const lastRefresh = useRef<number>(Date.now());

  const isAuthed = !!session?.user;

  const resetTimer = useCallback(() => {
    deadline.current = Date.now() + SESSION_MAX_AGE * 1000;
    setSecondsLeft(null);

    // Push the server-side expiry out too, at most once a minute.
    if (Date.now() - lastRefresh.current > 60_000) {
      lastRefresh.current = Date.now();
      void update();
    }
  }, [update]);

  // Track activity
  useEffect(() => {
    if (!isAuthed) return;

    // Ignore activity once the warning is up: the countdown must not be reset
    // by the very click the user makes to dismiss it, or by stray scrolling.
    // Only the explicit "Stay signed in" button clears the warning.
    let warned = false;
    const onActivity = () => {
      if (warned) return;
      resetTimer();
    };

    ACTIVITY_EVENTS.forEach(e =>
      window.addEventListener(e, onActivity, { passive: true }),
    );

    const tick = setInterval(() => {
      const remaining = Math.round((deadline.current - Date.now()) / 1000);

      if (remaining <= 0) {
        signOut({ callbackUrl: '/login?expired=1' });
        return;
      }

      if (remaining <= WARN_BEFORE) {
        warned = true;
        setSecondsLeft(remaining);
      } else {
        warned = false;
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
      clearInterval(tick);
    };
  }, [isAuthed, resetTimer]);

  const staySignedIn = () => {
    lastRefresh.current = 0; // force a refresh on the next reset
    resetTimer();
  };

  if (!isAuthed) return null;

  return (
    <AnimatePresence>
      {secondsLeft !== null && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          role="alertdialog"
          aria-live="assertive"
          className="fixed bottom-6 right-6 z-50 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-5"
        >
          <h2 className="text-[15px] font-semibold tracking-tight">
            Still there?
          </h2>
          <p className="mt-1.5 text-[13px] text-gray-500 leading-relaxed">
            You&apos;ll be signed out in {secondsLeft} second
            {secondsLeft === 1 ? '' : 's'}. Your paper is saved in this browser.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={staySignedIn}
              className="flex-1 py-2 text-[13px] font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
            >
              Stay signed in
            </button>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 text-[13px] text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
