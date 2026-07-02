'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { CompileState } from '@/hooks/useCompileJob';
import { api } from '@/lib/api';

interface Props {
  state: CompileState;
  projectId: string | null;
  projectError: string | null;
  onCompile: () => void;
  onReset: () => void;
}

export default function CompilePanel({ state, projectError, onCompile, onReset }: Props) {
  const { phase, messages, artifacts, error } = state;
  const isIdle = phase === 'idle';
  const isCompiling = phase === 'compiling';
  const isDone = phase === 'done';
  const isFailed = phase === 'failed';

  return (
    <div className="flex flex-col h-full">
      {/* Project bootstrap error — compiling will retry automatically */}
      {projectError && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
          {projectError}
        </div>
      )}

      {/* Compile button bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button
          onClick={isIdle || isFailed ? onCompile : onReset}
          disabled={isCompiling}
          className={[
            'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all',
            isCompiling
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isDone
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-900 text-white hover:bg-gray-700 active:scale-95',
          ].join(' ')}
        >
          {isCompiling && (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          )}
          {isCompiling ? 'Compiling…' : isDone ? '↺ Compile Again' : isFailed ? '↺ Retry' : '▶ Compile to IEEE'}
        </button>

        {(isDone || isFailed) && (
          <button
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Progress log */}
      <AnimatePresence>
        {(isCompiling || isDone || isFailed) && messages.length > 0 && (
          <motion.div
            key="log"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-950 px-4 py-3 max-h-48 overflow-y-auto scroll-thin font-mono text-[11px] leading-relaxed">
              {messages.map((msg, i) => (
                <div key={i} className={msg.includes('error') || msg.includes('Error') ? 'text-red-400' : 'text-green-400'}>
                  {msg}
                </div>
              ))}
              {isCompiling && (
                <span className="text-green-300 animate-pulse">▌</span>
              )}
              {isFailed && error && (
                <div className="text-red-400 mt-1">✗ {error}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download artifacts */}
      <AnimatePresence>
        {isDone && Object.keys(artifacts).length > 0 && (
          <motion.div
            key="downloads"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-4 flex flex-col gap-2"
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">
              Downloads
            </p>
            {Object.keys(artifacts).map(filename => {
              const jobId = state.jobId;
              const url = api.artifactUrl(jobId, filename);
              const isDocx = filename.endsWith('.docx');
              return (
                <a
                  key={filename}
                  href={url}
                  download={filename}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all group"
                >
                  <span className="text-lg">{isDocx ? '📄' : '📑'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                      {filename}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isDocx ? 'Word document (.docx)' : 'PDF document (.pdf)'}
                    </p>
                  </div>
                  <span className="ml-auto text-gray-400 group-hover:text-gray-600 text-sm">↓</span>
                </a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle hint */}
      {isIdle && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2 py-8">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="10 8 14 12 10 16" />
          </svg>
          <p className="text-xs text-gray-400">Click Compile to generate your IEEE document</p>
        </div>
      )}
    </div>
  );
}
