'use client';

import { useEffect, useRef, useState } from 'react';
import MathBlock from '@/components/editor/MathBlock';

interface Props {
  latex: string;
  removeBtn: React.ReactNode;
  onPatch: (patch: Record<string, unknown>) => void;
}

/** Palette entries insert a LaTeX snippet into the math field. `#0` is
 *  MathLive's placeholder token — the cursor lands there after insertion, so
 *  the user can immediately type the numerator, the summand, etc. */
const PALETTE: { label: string; insert: string; title: string }[] = [
  { label: '¹⁄ₓ', insert: '\\frac{#0}{#?}',            title: 'Fraction' },
  { label: '√',   insert: '\\sqrt{#0}',                 title: 'Square root' },
  { label: 'xⁿ',  insert: '#@^{#0}',                    title: 'Superscript / power' },
  { label: 'xₙ',  insert: '#@_{#0}',                    title: 'Subscript' },
  { label: '∑',   insert: '\\sum_{#0}^{#?}',            title: 'Summation' },
  { label: '∏',   insert: '\\prod_{#0}^{#?}',           title: 'Product' },
  { label: '∫',   insert: '\\int_{#0}^{#?}',            title: 'Integral' },
  { label: '∂',   insert: '\\partial',                  title: 'Partial derivative' },
  { label: '∞',   insert: '\\infty',                    title: 'Infinity' },
  { label: 'α',   insert: '\\alpha',                    title: 'alpha' },
  { label: 'β',   insert: '\\beta',                     title: 'beta' },
  { label: 'θ',   insert: '\\theta',                    title: 'theta' },
  { label: 'λ',   insert: '\\lambda',                   title: 'lambda' },
  { label: 'μ',   insert: '\\mu',                       title: 'mu' },
  { label: 'σ',   insert: '\\sigma',                    title: 'sigma' },
  { label: 'π',   insert: '\\pi',                       title: 'pi' },
  { label: 'Ω',   insert: '\\Omega',                    title: 'Omega' },
  { label: '≤',   insert: '\\le',                       title: 'Less than or equal' },
  { label: '≥',   insert: '\\ge',                       title: 'Greater than or equal' },
  { label: '≠',   insert: '\\ne',                       title: 'Not equal' },
  { label: '≈',   insert: '\\approx',                   title: 'Approximately' },
  { label: '→',   insert: '\\to',                       title: 'Arrow' },
  { label: 'x̄',   insert: '\\bar{#0}',                  title: 'Bar / mean' },
  { label: 'x̂',   insert: '\\hat{#0}',                  title: 'Hat' },
  { label: '[ ]', insert: '\\begin{bmatrix}#0 & #? \\\\ #? & #?\\end{bmatrix}', title: 'Matrix' },
];

export default function EquationEditor({ latex, removeBtn, onPatch }: Props) {
  const [mode, setMode] = useState<'visual' | 'latex'>('visual');
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLElement & {
    value: string;
    executeCommand: (cmd: string | [string, ...unknown[]]) => boolean;
    insert: (s: string, opts?: Record<string, unknown>) => void;
    focus: () => void;
  } | null>(null);

  // MathLive touches `window`/`document` at import time, so it can only load in
  // the browser — importing it lazily keeps Next's server render working. The
  // module's own auto-registration doesn't survive bundling here, so define the
  // custom element explicitly and only flip `ready` once it's actually upgraded;
  // otherwise <math-field> renders as an inert HTMLElement with no `.value`.
  useEffect(() => {
    let cancelled = false;
    import('mathlive')
      .then(({ MathfieldElement, initVirtualKeyboardInCurrentBrowsingContext }) => {
        // Served from /public/mathlive-fonts; without this MathLive resolves
        // fonts relative to the bundle URL and falls back to system glyphs.
        MathfieldElement.fontsDirectory = '/mathlive-fonts';
        MathfieldElement.soundsDirectory = null;
        // Installs window.mathVirtualKeyboard. MathLive normally does this in a
        // top-level module side effect, which this bundle drops — same reason
        // the custom element has to be registered by hand below.
        if (!('mathVirtualKeyboard' in window)) {
          initVirtualKeyboardInCurrentBrowsingContext();
        }
        if (!customElements.get('math-field')) {
          customElements.define('math-field', MathfieldElement);
        }
        return customElements.whenDefined('math-field');
      })
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setMode('latex'); });
    return () => { cancelled = true; };
  }, []);

  // The <math-field> element holds its own value, so pushes from React have to
  // be applied imperatively — and only when they actually differ, otherwise
  // assigning mid-edit would reset the cursor position on every keystroke.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field || !ready) return;
    if (field.value !== latex) field.value = latex;
  }, [latex, ready]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field || !ready) return;
    const handler = () => onPatch({ latex: field.value });
    field.addEventListener('input', handler);
    return () => field.removeEventListener('input', handler);
  }, [ready, onPatch]);

  // With a "manual" keyboard policy MathLive never dismisses the virtual
  // keyboard on its own, so it lingers over the page after the user moves on.
  // Close it on any pointer-down outside both this editor and the keyboard
  // itself — the keyboard is portalled to its own container near <body>, so
  // clicking its keys would otherwise read as an outside click and dismiss it
  // mid-input.
  useEffect(() => {
    if (!ready) return;
    const onPointerDown = (e: PointerEvent) => {
      const kbd = window.mathVirtualKeyboard;
      if (!kbd?.visible) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if ((target as Element).closest?.('.ML__keyboard, [class*="ML__keyboard"]')) return;
      kbd.hide();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [ready]);

  // Leaving visual mode (or unmounting the block entirely) removes the field
  // the keyboard types into, so don't leave it stranded on screen.
  useEffect(() => {
    if (mode === 'visual') return;
    window.mathVirtualKeyboard?.hide();
  }, [mode]);

  useEffect(() => () => window.mathVirtualKeyboard?.hide(), []);

  const insert = (snippet: string) => {
    const field = fieldRef.current;
    if (mode === 'visual' && field && ready) {
      field.insert(snippet, { focus: true });
      onPatch({ latex: field.value });
    } else {
      // LaTeX mode: append a plain-text form, stripping MathLive placeholders
      // that only mean something inside the visual field.
      onPatch({ latex: `${latex}${snippet.replace(/#[0@?]/g, '')}` });
    }
  };

  return (
    <div ref={rootRef} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Equation
        </span>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-gray-200 overflow-hidden bg-white">
            {(['visual', 'latex'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                disabled={m === 'visual' && !ready}
                className={`px-2 py-0.5 text-[10px] transition-colors disabled:opacity-40 ${
                  mode === m ? 'bg-black text-white' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {m === 'visual' ? 'Visual' : 'LaTeX'}
              </button>
            ))}
          </div>
          {removeBtn}
        </div>
      </div>

      {/* Symbol palette — clicking inserts at the cursor in visual mode. */}
      <div className="flex flex-wrap gap-1">
        {PALETTE.map(p => (
          <button
            key={p.label + p.insert}
            type="button"
            title={p.title}
            onMouseDown={e => e.preventDefault()} /* keep field focus/selection */
            onClick={() => insert(p.insert)}
            className="min-w-[26px] h-[26px] px-1.5 rounded border border-gray-200 bg-white text-[12px] text-gray-700 hover:border-black hover:text-black transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {mode === 'visual' ? (
        <>
          {/* @ts-expect-error — <math-field> is a custom element from MathLive */}
          <math-field
            ref={fieldRef}
            class="w-full px-2 py-2 rounded-md border border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-black"
            style={{ fontSize: '18px', display: 'block' }}
            math-virtual-keyboard-policy="manual"
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">
              Type naturally — <code className="font-mono">/</code> makes a fraction,{' '}
              <code className="font-mono">^</code> a power, <code className="font-mono">_</code> a
              subscript. Arrow keys move between slots.
            </p>
            <button
              type="button"
              onClick={() => fieldRef.current?.executeCommand('toggleVirtualKeyboard')}
              className="text-[10px] text-gray-500 hover:text-black underline underline-offset-2 flex-shrink-0 ml-2"
            >
              ⌨ Keyboard
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            className="w-full px-2 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-black bg-white font-mono"
            placeholder="\sum_{i=0}^{n} x_i = \frac{n(n+1)}{2}"
            value={latex}
            onChange={e => onPatch({ latex: e.target.value })}
          />
          {latex.trim() && (
            <div className="rounded-md border border-gray-200 bg-white px-2 py-2 flex justify-center">
              <MathBlock latex={latex} style={{ fontSize: '16px' }} />
            </div>
          )}
          <p className="text-[10px] text-gray-400">Enter LaTeX math — no need to add $$</p>
        </>
      )}
    </div>
  );
}
