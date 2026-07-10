import type { PaperForm } from '@/types/paper-form';
import type { DocumentModel, Block } from '@/types/document-model';

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X',
               'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII'];

export function formToModel(form: PaperForm): DocumentModel {
  const blocks: Block[] = [];
  let figCounter   = 0;
  let tableCounter = 0;
  let eqCounter    = 0;
  let subH2Counter = 0;
  let subH3Counter = 0;

  for (let si = 0; si < form.sections.length; si++) {
    const sec = form.sections[si];
    subH2Counter = 0;
    subH3Counter = 0;

    // Level-1 heading
    if (sec.heading.trim()) {
      blocks.push({
        type: 'heading',
        level: 1,
        text: sec.heading.trim(),
        numbering: ROMAN[si] ?? String(si + 1),
      });
    }

    for (let ci = 0; ci < sec.content.length; ci++) {
      const item = sec.content[ci];
      const isFirst = ci === 0;

      switch (item.kind) {
        case 'paragraph':
          if (item.text.trim()) {
            blocks.push({ type: 'paragraph', text: item.text.trim(), indent: isFirst });
          }
          break;

        case 'subsection':
          if (item.text.trim()) {
            if (item.level === 2) {
              subH2Counter++;
              subH3Counter = 0;
              const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[subH2Counter - 1] ?? String(subH2Counter);
              blocks.push({ type: 'heading', level: 2, text: item.text.trim(), numbering: letter });
            } else {
              subH3Counter++;
              blocks.push({ type: 'heading', level: 3, text: item.text.trim(), numbering: String(subH3Counter) });
            }
          }
          break;

        case 'figure':
          if (item.imageRef) {
            figCounter++;
            const wide = item.wide;
            blocks.push({
              type: wide ? 'wide_figure' : 'figure',
              anchor: `${wide ? 'WIDE-FIG' : 'FIG'} ${figCounter}`,
              image_ref: item.imageRef,
              caption: item.caption.trim() || `Figure ${figCounter}.`,
            });
          }
          break;

        case 'table': {
          // Drop fully-empty trailing rows/cols so stray blank grid cells the
          // user never filled don't render as empty table rows in the doc.
          const rows = item.rows
            .map(r => r.map(c => c.trim()))
            .filter(r => r.some(c => c !== ''));
          if (rows.length) {
            tableCounter++;
            const wide = item.wide;
            blocks.push({
              type: wide ? 'wide_table' : 'table',
              anchor: `${wide ? 'WIDE-TABLE' : 'TABLE'} ${tableCounter}`,
              caption: item.caption.trim() || `Table ${tableCounter}.`,
              rows,
              header_row: item.headerRow,
              center: item.center ?? true,
            });
          }
          break;
        }

        case 'equation':
          if (item.latex.trim()) {
            eqCounter++;
            blocks.push({ type: 'equation', anchor: `EQ ${eqCounter}`, latex: item.latex.trim(), inline: false });
          }
          break;

        case 'list':
          if (item.items.some(i => i.trim())) {
            blocks.push({
              type: 'list',
              style: item.style,
              items: item.items.filter(i => i.trim()),
            });
          }
          break;
      }
    }
  }

  const keywords = form.keywords
    ? form.keywords.split(',').map(k => k.trim()).filter(Boolean)
    : [];

  const references = form.references
    .filter(r => r.title.trim())
    .map((r, i) => ({
      key: String(i + 1),
      authors: r.authors.split(',').map(a => a.trim()).filter(Boolean),
      title: r.title.trim(),
      venue: r.venue.trim() || undefined,
      year: Number(r.year) || new Date().getFullYear(),
      doi: r.doi.trim() || undefined,
      url: r.url.trim() || undefined,
    }));

  return {
    schema_version: '1.0',
    metadata: {
      title: form.title.trim() || 'Untitled',
      authors: form.authors
        .filter(a => a.name.trim())
        .map(a => ({
          name: a.name.trim(),
          email: a.email.trim() || undefined,
          affiliation_refs: a.affiliationKeys,
        })),
      affiliations: form.affiliations
        .filter(af => af.institution.trim())
        .map(af => ({
          key: af.id,
          institution: af.institution.trim(),
          department: af.department.trim() || undefined,
          city: af.city.trim() || undefined,
          country: af.country.trim() || undefined,
        })),
      abstract: form.abstract.trim(),
      keywords,
      conference: form.conference.trim() || undefined,
    },
    blocks,
    references: references.length ? references : undefined,
    compile_options: { math_backend: 'matplotlib', page_size: 'a4' },
  };
}
