'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import PaperPreview from './PaperPreview';
import CompilePanel from './CompilePanel';
import type { DocPreview } from '@/lib/parsePreview';
import type { CompileState } from '@/hooks/useCompileJob';

interface Props {
  preview: DocPreview;
  compileState: CompileState;
  projectId: string | null;
  projectError: string | null;
  onCompile: () => void;
  onReset: () => void;
}

type Tab = 'preview' | 'compile';

export default function PreviewPane({ preview, compileState, projectId, projectError, onCompile, onReset }: Props) {
  const [tab, setTab] = useState<Tab>('preview');

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
            <PaperPreview preview={preview} />
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
