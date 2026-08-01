'use client';

import { useCallback, useState } from 'react';

export interface Toast {
  id: string;
  level: 'warn' | 'error';
  message: string;
}

let nextId = 0;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((level: Toast['level'], message: string) => {
    const id = `t${++nextId}`;
    setToasts(prev => [...prev, { id, level, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, pushToast, dismissToast };
}
