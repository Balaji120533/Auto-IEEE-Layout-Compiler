'use client';

import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface Props {
  latex: string;
  className?: string;
  /** Overrides the default preview-pane sizing; used by the equation editor,
   *  which renders at a readable size rather than at page scale. */
  style?: React.CSSProperties;
}

/** Renders a LaTeX string as display math using KaTeX. Falls back to raw
 *  monospace text if the expression can't be parsed, so the preview never
 *  crashes on a half-typed equation. */
export default function MathBlock({ latex, className, style }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      return null;
    }
  }, [latex]);

  if (html === null) {
    return (
      <code className={`text-[7px] text-red-400 font-mono ${className ?? ''}`}>{latex}</code>
    );
  }

  return (
    <span
      className={className}
      style={{ fontSize: '9px', ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
