'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Toast } from '@/hooks/useToasts';

const AUTO_DISMISS_MS = 6000;

interface Props {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col-reverse gap-2 w-80 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className={[
        'flex items-start gap-2 px-3 py-2.5 rounded-xl border shadow-lg text-xs',
        toast.level === 'error'
          ? 'bg-red-50 border-red-100 text-red-700'
          : 'bg-amber-50 border-amber-100 text-amber-700',
      ].join(' ')}
    >
      <span className="mt-0.5 flex-shrink-0">{toast.level === 'error' ? '⚠' : '!'}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </motion.div>
  );
}
