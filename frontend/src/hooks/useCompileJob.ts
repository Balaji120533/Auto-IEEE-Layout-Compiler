'use client';

import { useState, useCallback, useRef } from 'react';
import { api, type PreflightWarning } from '@/lib/api';

export type JobPhase = 'idle' | 'compiling' | 'done' | 'failed';

export interface CompileState {
  phase: JobPhase;
  jobId: string;
  messages: string[];
  artifacts: Record<string, string>;
  warnings: PreflightWarning[];
  error?: string;
}

const IDLE: CompileState = { phase: 'idle', jobId: '', messages: [], artifacts: {}, warnings: [] };

export function useCompileJob() {
  const [state, setState] = useState<CompileState>(IDLE);
  const es = useRef<EventSource | null>(null);

  const compile = useCallback(async (projectId: string, model?: unknown) => {
    es.current?.close();
    setState({ phase: 'compiling', jobId: '', messages: ['Submitting job…'], artifacts: {}, warnings: [] });

    let jobId: string;
    try {
      if (model) {
        ({ jobId } = await api.compileModel(projectId, model));
      } else {
        ({ jobId } = await api.compile(projectId));
      }
    } catch (err: any) {
      setState({ phase: 'failed', jobId: '', messages: [], artifacts: {}, warnings: [], error: err.message });
      return;
    }

    setState(s => ({ ...s, jobId }));

    // SSE progress stream
    const source = new EventSource(api.jobStreamUrl(jobId));
    es.current = source;

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          setState(s => ({ ...s, messages: [...s.messages, data.message as string] }));
        } else if (data.type === 'warning') {
          setState(s => ({
            ...s,
            warnings: [...s.warnings, { level: data.level, anchor: data.anchor, message: data.message }],
          }));
        } else if (data.type === 'done') {
          source.close();
          api.getJobStatus(jobId).then(status => {
            setState(s => ({ ...s, phase: 'done', artifacts: status.artifacts ?? {}, warnings: status.warnings ?? s.warnings }));
          }).catch(() => {
            setState(s => ({ ...s, phase: 'done' }));
          });
        } else if (data.type === 'failed') {
          source.close();
          setState(s => ({ ...s, phase: 'failed', error: 'Compile failed' }));
        }
      } catch { /* ignore malformed events */ }
    };

    source.onerror = () => {
      source.close();
      // Fallback: poll once
      api.getJobStatus(jobId).then(status => {
        setState(s => ({
          ...s,
          phase: status.status === 'done' ? 'done' : status.status === 'failed' ? 'failed' : 'compiling',
          artifacts: status.artifacts ?? {},
          warnings: status.warnings ?? s.warnings,
          messages: [...s.messages, ...status.messages.slice(s.messages.length)],
        }));
      }).catch(() => {
        setState(s => ({ ...s, phase: 'failed', error: 'Lost connection to gateway' }));
      });
    };
  }, []);

  const reset = useCallback(() => {
    es.current?.close();
    setState(IDLE);
  }, []);

  return { ...state, compile, reset };
}
