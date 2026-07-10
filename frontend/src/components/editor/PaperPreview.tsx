'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { DocPreview, PreviewBlock } from '@/lib/parsePreview';
import MathBlock from './MathBlock';

interface Props {
  preview: DocPreview;
}

// Approximate one printed page's two-column content budget in preview pixels.
// A page holds two columns of this height, so the total "content budget" per
// page is 2x this — matches the column-fill box used to render each page.
const PAGE_COLUMN_HEIGHT = 760;

// Fixed page card width. Must be an exact px width (not max-width) so it can
// never be squeezed narrower by its flex container — the hidden measurement
// pass below computes column width from this same constant, so measured
// heights always match what actually renders. A mismatch here is what let
// text/images overflow past the visible page edge.
const PAGE_WIDTH = 640;
const PAGE_PADDING_X = 24; // px-6 on the two-column body
const COLUMN_GAP = 12;     // 0.75rem
// Small safety margin subtracted from the true column width so justified text
// wraps a little before the hard edge — sub-pixel rounding in the browser's
// justify algorithm can otherwise let the last word of a line bleed past the
// column boundary instead of breaking to the next line.
const COLUMN_SAFETY_MARGIN = 6;
const COLUMN_WIDTH = (PAGE_WIDTH - PAGE_PADDING_X * 2 - COLUMN_GAP) / 2 - COLUMN_SAFETY_MARGIN;

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
          {block.text}
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

    case 'table':
      return (
        <figure className="break-inside-avoid my-2">
          {/* Caption above the table — IEEE convention (mirrors the .docx). */}
          <figcaption className="text-[6.5px] text-gray-600 text-center mb-0.5 leading-tight">
            <span className="font-semibold uppercase">{block.label}.</span>{' '}
            {block.caption}
          </figcaption>
          <table
            className="w-full border-collapse"
            style={{ fontSize: '6.5px', tableLayout: 'fixed' }}
          >
            <tbody>
              {block.rows.map((row, r) => {
                const isHead = block.headerRow && r === 0;
                const align = block.center ?? true ? 'center' : 'left';
                return (
                  <tr key={r}>
                    {row.map((cell, c) => {
                      const CellTag = isHead ? 'th' : 'td';
                      return (
                        <CellTag
                          key={c}
                          className={`border border-gray-400 px-1 py-0.5 align-top ${
                            isHead ? 'font-semibold' : ''
                          }`}
                          style={{
                            textAlign: isHead ? 'center' : align,
                            // Preserve manual line breaks the user typed in a cell.
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                          }}
                        >
                          {cell}
                        </CellTag>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
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

// One flowable item in the column-fill stream. 'abstract' is always item 0
// when present; references are appended as the final item.
type FlowItem =
  | { kind: 'abstract'; abstract: string; keywords: string[] }
  | { kind: 'block'; block: PreviewBlock; index: number }
  | { kind: 'references'; refs: DocPreview['references'] };

function FlowItemView({ item }: { item: FlowItem }) {
  switch (item.kind) {
    case 'abstract':
      return (
        <div className="mb-1">
          {item.abstract && (
            <div className="text-[7.5px] leading-relaxed text-justify">
              <em className="font-bold italic">Abstract—</em>
              {item.abstract}
            </div>
          )}
          {item.keywords.length > 0 && (
            <div className="mt-1 text-[7px]">
              <span className="font-bold italic">Index Terms—</span>
              {item.keywords.join(', ')}
            </div>
          )}
        </div>
      );
    case 'block':
      return <Block block={item.block} />;
    case 'references':
      return (
        <div className="break-inside-avoid mt-3">
          <p className="text-[8px] font-bold uppercase text-center mb-1">References</p>
          {item.refs.map(ref => (
            <p
              key={ref.key}
              className="text-[6.5px] text-gray-600 mb-0.5 leading-tight text-justify"
              style={{ paddingLeft: 10, textIndent: -10 }}
            >
              <span className="font-semibold">[{ref.key}]</span> {ref.text}
            </p>
          ))}
        </div>
      );
  }
}

// A page's two explicit columns — content is placed directly, no CSS
// multi-column auto-flow, so a browser can never render an implicit 3rd
// column that bleeds past the visible page edge.
type PageColumns = { left: FlowItem[]; right: FlowItem[] };

export default function PaperPreview({ preview }: Props) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageColumns[] | null>(null);

  // Wide figures/tables span both columns; render them outside the column flow.
  const isWide = (b: PreviewBlock) =>
    (b.kind === 'figure' || b.kind === 'table') && b.wide;
  const columnBlocks = preview.blocks.filter(b => !isWide(b));
  const wideFigures  = preview.blocks.filter(isWide);

  const flowItems: FlowItem[] = [
    ...(preview.abstract || preview.keywords.length > 0
      ? [{ kind: 'abstract', abstract: preview.abstract, keywords: preview.keywords } as FlowItem]
      : []),
    ...columnBlocks.map((block, index) => ({ kind: 'block', block, index } as FlowItem)),
    ...(preview.references.length > 0
      ? [{ kind: 'references', refs: preview.references } as FlowItem]
      : []),
  ];

  // Measure each flow item's real rendered height (off-screen), then place
  // items one at a time into the current column until it's full, moving to
  // the next column (then the next page) — the same left-to-right,
  // top-to-bottom flow a real two-column document uses, but computed
  // explicitly instead of relying on CSS multi-column auto-flow (which can
  // render an implicit extra column that bleeds past the page edge when
  // content doesn't divide evenly into exactly two columns).
  const recomputePages = () => {
    const container = measureRef.current;
    if (!container) return;

    const heights = Array.from(container.children).map(
      child => (child as HTMLElement).getBoundingClientRect().height,
    );

    const bucketed: PageColumns[] = [];
    let left: FlowItem[] = [];
    let right: FlowItem[] = [];
    let col: 'left' | 'right' = 'left';
    let colHeight = 0;

    const pushPage = () => {
      bucketed.push({ left, right });
      left = [];
      right = [];
      col = 'left';
      colHeight = 0;
    };

    flowItems.forEach((item, i) => {
      const h = heights[i] ?? 0;
      const hasContent = col === 'left' ? left.length > 0 : right.length > 0;
      if (hasContent && colHeight + h > PAGE_COLUMN_HEIGHT) {
        if (col === 'left') {
          col = 'right';
          colHeight = 0;
        } else {
          pushPage();
        }
      }
      (col === 'left' ? left : right).push(item);
      colHeight += h;
    });
    if (left.length > 0 || right.length > 0) pushPage();
    if (bucketed.length === 0) bucketed.push({ left: [], right: [] });

    setPages(bucketed);
  };

  useLayoutEffect(() => {
    recomputePages();

    // Images load asynchronously after mount, so the first measurement pass
    // can undercount a figure's real height (browsers report ~0 height for
    // an <img> before its data arrives) — that produced wrong page splits
    // that only "corrected" on a later unrelated re-render, which looked
    // like the preview snapping back to a stale layout after refresh.
    // Re-measure once every image in the hidden pass has actually loaded.
    const container = measureRef.current;
    const imgs = container ? Array.from(container.querySelectorAll('img')) : [];
    const pending = imgs.filter(img => !img.complete);
    if (pending.length === 0) return;

    let remaining = pending.length;
    const onSettle = () => {
      remaining -= 1;
      if (remaining === 0) recomputePages();
    };
    pending.forEach(img => {
      img.addEventListener('load', onSettle, { once: true });
      img.addEventListener('error', onSettle, { once: true });
    });
    return () => {
      pending.forEach(img => {
        img.removeEventListener('load', onSettle);
        img.removeEventListener('error', onSettle);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

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

  // Before the first measurement pass completes, show everything in the left
  // column as a reasonable placeholder rather than blocking on layout.
  const displayPages = pages ?? [{ left: flowItems, right: [] }];

  return (
    <div className="select-none" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: 9 }}>
      {/* Hidden measurement pass: render every flow item once, off-screen, at
          the same width it will render at on a real page, to get true heights. */}
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          top: -99999,
          left: -99999,
          width: COLUMN_WIDTH,
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        {flowItems.map((item, i) => (
          <div key={i}>
            <FlowItemView item={item} />
          </div>
        ))}
      </div>

      {displayPages.map((cols, pageIndex) => (
        <div
          key={pageIndex}
          className="bg-white shadow-lg mx-4 my-4 overflow-hidden text-gray-900"
          style={{
            width: PAGE_WIDTH,
            flexShrink: 0,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {/* Header: single-column section (title/authors/affiliations only), page 1 only */}
          {pageIndex === 0 && (
            <div className="px-8 pt-8 pb-3 border-b border-gray-200">
              <h1 className="text-[13px] font-bold text-center leading-tight mb-1 tracking-wide">
                {preview.title || 'Untitled Paper'}
              </h1>

              {preview.authors.length > 0 && (
                <p className="text-[8.5px] text-center text-gray-700 mb-0.5">
                  {preview.authors.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Wide figures — full width, above the columns, page 1 only */}
          {pageIndex === 0 && wideFigures.map((b, i) => (
            <div key={`wide-${i}`} className="px-6 pt-2">
              <Block block={b} />
            </div>
          ))}

          {/* Body: two explicit columns per page, placed directly (no CSS
              multi-column auto-flow) so a browser can never spill an implicit
              extra column past the page's right edge. Abstract/Index Terms
              sit at the top of the left column so following content (e.g.
              Introduction) fills the rest of that column before overflowing
              into the right column — matching the Word table-in-2-col-section
              behavior. Each column has a hard width + clip as a backstop
              against any single line that's a sub-pixel too wide. */}
          <div
            className="px-6 py-3 flex"
            style={{ height: PAGE_COLUMN_HEIGHT, gap: COLUMN_GAP, boxSizing: 'border-box' }}
          >
            {pageIndex === 0 && cols.left.length === 0 && cols.right.length === 0 && (
              <p className="text-[8px] text-gray-400 italic">
                Add a section heading and some content on the left to see the structure.
              </p>
            )}

            <div
              style={{
                width: COLUMN_WIDTH,
                flexShrink: 0,
                overflow: 'hidden',
                borderRight: '1px solid #e5e7eb',
                paddingRight: COLUMN_GAP / 2,
              }}
            >
              {cols.left.map((item, i) => <FlowItemView key={i} item={item} />)}
            </div>
            <div style={{ width: COLUMN_WIDTH, flexShrink: 0, overflow: 'hidden' }}>
              {cols.right.map((item, i) => <FlowItemView key={i} item={item} />)}
            </div>
          </div>

          {/* Page number */}
          <div className="px-6 pb-2 pt-1 border-t border-gray-100 text-[7px] text-gray-400 text-center">
            Page {pageIndex + 1} of {displayPages.length}
          </div>
        </div>
      ))}

      {/* Footer stats */}
      <div className="mx-4 px-6 pb-3 pt-1 flex gap-4 flex-wrap">
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
