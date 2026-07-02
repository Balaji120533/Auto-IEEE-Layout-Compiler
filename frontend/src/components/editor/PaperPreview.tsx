'use client';

import type { DocPreview, PreviewBlock } from '@/lib/parsePreview';
import MathBlock from './MathBlock';

interface Props {
  preview: DocPreview;
}

const HEADING_CLS: Record<1 | 2 | 3, string> = {
  1: 'text-[8.5px] font-bold uppercase tracking-wider text-center mt-4 mb-1',
  2: 'text-[8px] font-semibold italic mt-3 mb-0.5',
  3: 'text-[7.5px] italic mt-2 mb-0.5',
};

function headingText(b: Extract<PreviewBlock, { kind: 'heading' }>): string {
  if (!b.numbering) return b.text;
  if (b.level === 1) return `${b.numbering}. ${b.text.toUpperCase()}`;
  if (b.level === 2) return `${b.numbering}. ${b.text}`;
  return `${b.numbering}) ${b.text}`;
}

function Block({ block }: { block: PreviewBlock }) {
  switch (block.kind) {
    case 'heading':
      return <div className={`${HEADING_CLS[block.level]} break-inside-avoid`}>{headingText(block)}</div>;

    case 'paragraph':
      return (
        <p className="text-[7.5px] leading-relaxed text-justify text-gray-700 mb-1">
          {block.text.length > 600 ? block.text.slice(0, 600) + '…' : block.text}
        </p>
      );

    case 'equation':
      return (
        <div className="break-inside-avoid my-1.5 flex items-center justify-center gap-2">
          <MathBlock latex={block.latex} className="overflow-x-auto" />
          <span className="text-[7px] text-gray-400 flex-shrink-0">{block.label}</span>
        </div>
      );

    case 'figure':
      return (
        <figure className="break-inside-avoid my-2">
          {block.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.imageUrl}
              alt={block.caption || block.label}
              className="w-full object-contain border border-gray-100 bg-gray-50"
              style={{ maxHeight: 120 }}
            />
          ) : (
            <div
              className="border border-gray-200 bg-gray-50 flex items-center justify-center"
              style={{ height: 48 }}
            >
              <span className="text-[7px] text-gray-400">{block.label}</span>
            </div>
          )}
          {block.caption && (
            <figcaption className="text-[6.5px] text-gray-600 text-center mt-0.5 leading-tight">
              <span className="font-semibold">{block.label}.</span> {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'list':
      return (
        <ul className="text-[7.5px] text-gray-700 mb-1 pl-3 space-y-0.5">
          {block.items.map((it, i) => (
            <li key={i} className="leading-tight">
              <span className="text-gray-400 mr-1">{block.style === 'bullet' ? '•' : `${i + 1}.`}</span>
              {it}
            </li>
          ))}
        </ul>
      );

    default:
      return null;
  }
}

export default function PaperPreview({ preview }: Props) {
  if (!preview.hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-300 select-none gap-3 py-16">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="7" y1="8" x2="17" y2="8" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="7" y1="16" x2="13" y2="16" />
        </svg>
        <p className="text-xs text-gray-400">Fill in the form on the left to see a live preview</p>
      </div>
    );
  }

  // Wide figures span both columns; render them outside the column flow.
  const columnBlocks = preview.blocks.filter(b => !(b.kind === 'figure' && b.wide));
  const wideFigures  = preview.blocks.filter(b => b.kind === 'figure' && b.wide);

  return (
    <div
      className="bg-white shadow-lg mx-4 my-4 overflow-hidden text-gray-900 select-none"
      style={{ fontFamily: '"Times New Roman", Times, serif', maxWidth: 640, fontSize: 9 }}
    >
      {/* Header: single-column section */}
      <div className="px-8 pt-8 pb-3 border-b border-gray-200">
        <h1 className="text-[13px] font-bold text-center leading-tight mb-1 tracking-wide">
          {preview.title || 'Untitled Paper'}
        </h1>

        {preview.authors.length > 0 && (
          <p className="text-[8.5px] text-center text-gray-700 mb-0.5">
            {preview.authors.join(', ')}
          </p>
        )}

        {preview.abstract && (
          <div className="mt-3 mx-4 text-[7.5px] leading-relaxed text-justify">
            <em className="font-semibold not-italic">Abstract—</em>
            {preview.abstract.slice(0, 320)}{preview.abstract.length > 320 ? '…' : ''}
          </div>
        )}

        {preview.keywords.length > 0 && (
          <div className="mt-1 mx-4 text-[7px]">
            <span className="font-semibold italic">Index Terms—</span>
            {preview.keywords.join(', ')}
          </div>
        )}
      </div>

      {/* Wide figures — full width, above the columns */}
      {wideFigures.map((b, i) => (
        <div key={`wide-${i}`} className="px-6 pt-2">
          <Block block={b} />
        </div>
      ))}

      {/* Body: two-column section */}
      <div
        className="px-6 py-3"
        style={{ columns: 2, columnGap: '0.75rem', columnRule: '1px solid #e5e7eb' }}
      >
        {columnBlocks.length === 0 && (
          <p className="text-[8px] text-gray-400 italic">
            Add a section heading and some content on the left to see the structure.
          </p>
        )}

        {columnBlocks.map((b, i) => <Block key={i} block={b} />)}

        {/* References */}
        {preview.references.length > 0 && (
          <div className="break-inside-avoid mt-3">
            <p className="text-[8px] font-bold uppercase text-center mb-1">References</p>
            {preview.references.map(ref => (
              <p
                key={ref.key}
                className="text-[6.5px] text-gray-600 mb-0.5 leading-tight text-justify"
                style={{ paddingLeft: 10, textIndent: -10 }}
              >
                <span className="font-semibold">[{ref.key}]</span> {ref.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-6 pb-2 pt-1 border-t border-gray-100 flex gap-4 flex-wrap">
        {[
          { label: 'Sections', val: preview.sections.filter(s => s.level === 1).length },
          { label: 'Figures',  val: preview.figureCount },
          { label: 'Tables',   val: preview.tableCount },
          { label: 'Equations',val: preview.equationCount },
          { label: 'References', val: preview.referenceCount },
        ].map(({ label, val }) => (
          <div key={label} className="text-[7px] text-gray-400">
            <span className="font-semibold text-gray-600">{val}</span> {label}
          </div>
        ))}
      </div>
    </div>
  );
}
