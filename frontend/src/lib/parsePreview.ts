// Inline citation anchor "[CITE n]" → IEEE bracket "[n]" (case-insensitive,
// tolerant of extra spaces). Numbers outside 1..refCount render as "[?]" so a
// dangling citation is visible, matching the engine's docx behaviour.
const CITE_RE = /\[\s*CITE\s+(\d+)\s*\]/gi;

export function resolveCitations(text: string, refCount: number): string {
  return text.replace(CITE_RE, (_m, num: string) => {
    const n = Number(num);
    return n >= 1 && n <= refCount ? `[${n}]` : '[?]';
  });
}

export interface PreviewSection {
  level: 1 | 2 | 3;
  text: string;
  numbering?: string;
  paragraphs?: string[];   // snippet text shown in the live preview
}

/** Ordered, renderable blocks for the live preview — mirrors document order. */
export type PreviewBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string; numbering?: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'figure'; label: string; caption: string; imageUrl?: string; wide?: boolean }
  | { kind: 'table'; label: string; caption: string; rows: string[][]; headerRow: boolean; wide?: boolean; center?: boolean }
  | { kind: 'equation'; label: string; latex: string }
  | { kind: 'list'; style: 'bullet' | 'numbered'; items: string[] };

export interface PreviewReference {
  key: string;    // citation label, e.g. "1"
  text: string;   // fully formatted reference line
}

export interface DocPreview {
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  sections: PreviewSection[];
  blocks: PreviewBlock[];   // ordered content for rich rendering
  figureCount: number;
  tableCount: number;
  equationCount: number;
  referenceCount: number;
  references: PreviewReference[];
  warnings: string[];
  hasContent: boolean;
}

const EMPTY_PREVIEW: DocPreview = {
  title: '',
  authors: [],
  abstract: '',
  keywords: [],
  sections: [],
  blocks: [],
  figureCount: 0,
  tableCount: 0,
  equationCount: 0,
  referenceCount: 0,
  references: [],
  warnings: [],
  hasContent: false,
};

export function parsePreview(markdown: string): DocPreview {
  if (!markdown.trim()) return EMPTY_PREVIEW;

  const preview: DocPreview = { ...EMPTY_PREVIEW, hasContent: true };

  // Extract YAML front matter
  const fmMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (fmMatch) {
    const fm = fmMatch[1];

    const titleMatch = fm.match(/^title:\s*(.+)$/m);
    if (titleMatch) preview.title = titleMatch[1].trim().replace(/^['"]|['"]$/g, '');

    // Abstract (multi-line | or single line)
    const absBlockMatch = fm.match(/^abstract:\s*\|\r?\n((?:[ \t]+.+\r?\n?)+)/m);
    const absSingleMatch = fm.match(/^abstract:\s*(.+)$/m);
    if (absBlockMatch) {
      preview.abstract = absBlockMatch[1].replace(/^[ \t]+/gm, '').trim();
    } else if (absSingleMatch) {
      preview.abstract = absSingleMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }

    // Keywords (list or comma-separated)
    const kwListMatch = fm.match(/^keywords:\r?\n((?:[ \t]+-\s*.+\r?\n?)+)/m);
    const kwInlineMatch = fm.match(/^keywords:\s*(.+)$/m);
    if (kwListMatch) {
      preview.keywords = kwListMatch[1].trim().split('\n')
        .map(l => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
    } else if (kwInlineMatch) {
      preview.keywords = kwInlineMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  // Extract authors from :::authors block
  const authorBlock = markdown.match(/:::authors\r?\n([\s\S]*?):::/);
  if (authorBlock) {
    preview.authors = authorBlock[1].trim().split('\n')
      .map(l => l.replace(/<[^>]+>/, '').replace(/\[[^\]]+\]$/, '').trim())
      .filter(Boolean);
  }

  // References — parse each "- key: ..." entry's fields for a real preview line
  const refBlock = markdown.match(/:::references\r?\n([\s\S]*?):::/);
  if (refBlock) {
    const entries = refBlock[1].split(/\r?\n(?=\s*-\s*key:)/).filter(e => /\s*-\s*key:/.test(e));
    preview.referenceCount = entries.length;
    preview.references = entries.map((entry, i) => {
      const field = (name: string) => entry.match(new RegExp(`${name}:\\s*"?([^"\\n]+?)"?\\s*$`, 'm'))?.[1]?.trim();
      const key = field('key') ?? String(i + 1);
      const authorsRaw = entry.match(/authors:\s*\[([^\]]*)\]/)?.[1] ?? '';
      const authors = authorsRaw.split(',').map(a => a.replace(/["']/g, '').trim()).filter(Boolean);
      const title = field('title') ?? '';
      const venue = field('venue');
      const year = field('year');
      const parts = [authors.join(', '), title && `"${title}"`, venue && `in ${venue}`, year].filter(Boolean);
      return { key, text: parts.join(', ') + '.' };
    });
  }

  // Scan body lines
  let inEquation = false;
  for (const line of markdown.split('\n')) {
    // Headings
    const hMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length as 1 | 2 | 3;
      const raw = hMatch[2].trim();
      const numMatch = raw.match(/^([IVXivx]+|[A-Z]|\d+)\.\s+(.+)$/);
      preview.sections.push({
        level,
        text: numMatch ? numMatch[2] : raw,
        numbering: numMatch ? numMatch[1].toUpperCase() : undefined,
      });
    }

    // Figures
    if (/^\[(WIDE-FIG|FIG)\s+\d+\]/.test(line)) preview.figureCount++;

    // Tables
    if (/^\[(WIDE-TABLE|TABLE)\s+\d+\]/.test(line)) preview.tableCount++;

    // Equations (count $$ openings)
    const trimmed = line.trim();
    if (trimmed === '$$') {
      if (!inEquation) { preview.equationCount++; inEquation = true; }
      else inEquation = false;
    } else if (/^\$\$.+\$\$/.test(trimmed)) {
      preview.equationCount++;
    }
  }

  // Warnings
  if (!preview.title) preview.warnings.push('Missing title — add title: in front matter');
  if (preview.authors.length === 0) preview.warnings.push('Missing authors — add :::authors block');
  if (!preview.abstract) preview.warnings.push('Missing abstract — add abstract: in front matter');
  if (preview.keywords.length === 0) preview.warnings.push('Missing keywords — add keywords: in front matter');

  return preview;
}
