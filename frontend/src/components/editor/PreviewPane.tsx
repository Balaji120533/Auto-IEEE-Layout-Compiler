'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PaperPreview from './PaperPreview';
import CompilePanel from './CompilePanel';
import type { DocPreview } from '@/lib/parsePreview';
import type { CompileState } from '@/hooks/useCompileJob';
import type { CompileFormats } from '@/lib/api';

interface Props {
  preview: DocPreview;
  compileState: CompileState;
  projectId: string | null;
  projectError: string | null;
  onCompile: (formats: CompileFormats) => void;
  onReset: () => void;
}

type Tab = 'preview' | 'compile';

// Discrete steps rather than a free slider — the useful range is small and
// fixed stops keep 100% (true A4 size) always reachable in one click.
const ZOOM_STEPS = [0.6, 0.75, 0.9, 1, 1.25, 1.5] as const;
const DEFAULT_ZOOM_INDEX = 3; // 1.0

export default function PreviewPane({ preview, compileState, projectId, projectError, onCompile, onReset }: Props) {
  const [tab, setTab] = useState<Tab>('preview');
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const zoom = ZOOM_STEPS[zoomIndex];

  // Auto-switch to compile tab when compiling starts
  const isDone = compileState.phase === 'done';
  const isCompiling = compileState.phase === 'compiling';

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white">
        {(['preview', 'compile'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'relative px-5 py-3 text-sm font-medium capitalize transition-colors',
              tab === t ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600',
            ].join(' ')}
          >
            {t === 'compile' && (isCompiling || isDone) && (
              <span className={[
                'absolute top-2 right-2 w-1.5 h-1.5 rounded-full',
                isCompiling ? 'bg-yellow-400 animate-pulse' : 'bg-green-400',
              ].join(' ')} />
            )}
            {t === 'preview' ? 'Preview' : 'Compile'}
            {tab === t && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
              />
            )}
          </button>
        ))}

        {tab === 'preview' && (
          <div className="ml-auto flex items-center gap-0.5 pr-3">
            <button
              onClick={() => setZoomIndex(i => Math.max(0, i - 1))}
              disabled={zoomIndex === 0}
              title="Zoom out"
              aria-label="Zoom out"
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <button
              onClick={() => setZoomIndex(DEFAULT_ZOOM_INDEX)}
              title="Reset to actual A4 size"
              className="min-w-[3rem] px-1 py-1 text-[11px] tabular-nums text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              onClick={() => setZoomIndex(i => Math.min(ZOOM_STEPS.length - 1, i + 1))}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              title="Zoom in"
              aria-label="Zoom in"
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto overflow-x-auto scroll-thin">
        {tab === 'preview' && (
          <motion.div
            key="preview-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <PaperPreview preview={preview} zoom={zoom} />
          </motion.div>
        )}

        {tab === 'compile' && (
          <motion.div
            key="compile-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <CompilePanel
              state={compileState}
              projectId={projectId}
              projectError={projectError}
              onCompile={onCompile}
              onReset={onReset}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
