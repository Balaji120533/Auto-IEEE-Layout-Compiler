import * as yaml from 'js-yaml';
import type {
  DocumentModel,
  DocumentMetadata,
  Author,
  Affiliation,
  Reference,
  Block,
  HeadingBlock,
  FigureBlock,
  TableBlock,
  EquationBlock,
  ListBlock,
  ParagraphBlock,
  CompileOptions,
} from '../types/document-model';

// ── Roman numeral / letter helpers ────────────────────────────────────────────

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X',
               'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function toRoman(n: number): string { return ROMAN[n - 1] ?? String(n); }
function toAlpha(n: number): string { return ALPHA[n - 1] ?? String(n); }

// ── Author parsing ────────────────────────────────────────────────────────────

function parseAuthors(content: string): Author[] {
  return content.split('\n').flatMap(line => {
    const trimmed = line.trim();
    if (!trimmed) return [];
    const emailMatch = trimmed.match(/<([^>]+)>/);
    const affMatch = trimmed.match(/\[([^\]]+)\]$/);
    const name = trimmed
      .replace(/<[^>]+>/, '')
      .replace(/\[[^\]]+\]$/, '')
      .trim();
    return [{
      name,
      email: emailMatch?.[1],
      affiliation_refs: affMatch
        ? affMatch[1].split(',').map(s => s.trim())
        : [],
    }];
  });
}

// ── Affiliation parsing ───────────────────────────────────────────────────────

function parseAffiliations(content: string): Affiliation[] {
  return content.split('\n').flatMap(line => {
    const trimmed = line.trim();
    if (!trimmed) return [];
    const parts = trimmed.split('|').map(s => s.trim());
    const key = parts[0];
    switch (parts.length) {
      case 2: return [{ key, institution: parts[1] }];
      case 3: return [{ key, institution: parts[1], country: parts[2] }];
      case 4: return [{ key, institution: parts[1], city: parts[2], country: parts[3] }];
      default: return [{
        key,
        department: parts[1],
        institution: parts[2],
        city: parts[3],
        country: parts[4],
      }];
    }
  });
}

// ── Reference parsing ─────────────────────────────────────────────────────────

function parseReferences(content: string): Reference[] {
  try {
    const parsed = yaml.load(content);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r: any) => ({
      key: String(r.key),
      authors: Array.isArray(r.authors) ? r.authors : [],
      title: String(r.title ?? ''),
      venue: r.venue,
      year: Number(r.year ?? 0),
      volume: r.volume ? String(r.volume) : undefined,
      issue: r.issue ? String(r.issue) : undefined,
      pages: r.pages ? String(r.pages) : undefined,
      doi: r.doi,
      url: r.url,
    }));
  } catch {
    return [];
  }
}

// ── Equation block parsing ────────────────────────────────────────────────────

function parseEquation(
  lines: string[],
  startIndex: number,
  autoNum: number,
): { block: EquationBlock; nextIndex: number } {
  const firstLine = lines[startIndex].trim();

  // Single-line: $$latex$$ [EQ n]  OR  $$latex$$
  const singleMatch = firstLine.match(/^\$\$(.+)\$\$(?:\s*\[EQ\s*(\d+)\])?$/);
  if (singleMatch) {
    const latex = singleMatch[1].trim();
    const anchor = singleMatch[2] ? `EQ ${singleMatch[2]}` : `EQ ${autoNum}`;
    return { block: { type: 'equation', anchor, latex, inline: false }, nextIndex: startIndex + 1 };
  }

  // Opening $$ on its own line
  if (firstLine === '$$') {
    let i = startIndex + 1;
    const latexLines: string[] = [];
    while (i < lines.length && !lines[i].trim().startsWith('$$')) {
      latexLines.push(lines[i]);
      i++;
    }
    // Closing $$ line — may carry [EQ n]
    const closingLine = (lines[i] ?? '').trim();
    const closingMatch = closingLine.match(/^\$\$(?:\s*\[EQ\s*(\d+)\])?$/);
    let anchor = closingMatch?.[1] ? `EQ ${closingMatch[1]}` : null;
    i++;

    // [EQ n] on the line immediately after closing $$
    if (!anchor && i < lines.length) {
      const nextLine = lines[i].trim();
      const nextMatch = nextLine.match(/^\[EQ\s*(\d+)\]$/);
      if (nextMatch) {
        anchor = `EQ ${nextMatch[1]}`;
        i++;
      }
    }

    return {
      block: {
        type: 'equation',
        anchor: anchor ?? `EQ ${autoNum}`,
        latex: latexLines.join('\n'),
        inline: false,
      },
      nextIndex: i,
    };
  }

  // Fallback: treat the whole line as LaTeX
  return {
    block: { type: 'equation', anchor: `EQ ${autoNum}`, latex: firstLine, inline: false },
    nextIndex: startIndex + 1,
  };
}

// ── Block body parser ─────────────────────────────────────────────────────────

function parseBlocks(body: string): Block[] {
  const lines = body.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  let h1 = 0, h2 = 0, h3 = 0;
  let eqNum = 0;
  let afterHeading = false;

  while (i < lines.length) {
    const line = lines[i];

    // Blank lines
    if (/^\s*$/.test(line)) { i++; continue; }

    // ── Heading ──────────────────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      const raw = headingMatch[2].trim();

      // Detect explicit numbering prefix: "I. Text" / "A. Text" / "1. Text"
      const numMatch = raw.match(/^([IVXivx]+|[A-Z]|\d+)\.\s+(.+)$/);
      let numbering: string | undefined;
      let text = raw;

      if (numMatch) {
        numbering = numMatch[1].toUpperCase();
        text = numMatch[2];
      } else {
        // Auto-assign
        if (level === 1) { h1++; h2 = 0; h3 = 0; numbering = toRoman(h1); }
        else if (level === 2) { h2++; h3 = 0; numbering = toAlpha(h2); }
        else { h3++; numbering = String(h3); }
      }

      blocks.push({ type: 'heading', level, text, numbering } as HeadingBlock);
      afterHeading = true;
      i++;
      continue;
    }

    // ── Figure ────────────────────────────────────────────────────────────────
    // [FIG n](file): caption  or  [WIDE-FIG n](file): caption
    const figMatch = line.match(/^\[(WIDE-FIG|FIG)\s+(\d+)\]\(([^)]+)\):\s*(.+)$/);
    if (figMatch) {
      const wide = figMatch[1] === 'WIDE-FIG';
      blocks.push({
        type: wide ? 'wide_figure' : 'figure',
        anchor: `${figMatch[1]} ${figMatch[2]}`,
        image_ref: figMatch[3],
        caption: figMatch[4].trim(),
      } as FigureBlock);
      afterHeading = false;
      i++;
      continue;
    }

    // ── Table ─────────────────────────────────────────────────────────────────
    // [TABLE n]: caption  or  [WIDE-TABLE n]: caption
    const tableMatch = line.match(/^\[(WIDE-TABLE|TABLE)\s+(\d+)\]:\s*(.+)$/);
    if (tableMatch) {
      const wide = tableMatch[1] === 'WIDE-TABLE';
      const anchor = `${tableMatch[1]} ${tableMatch[2]}`;
      const caption = tableMatch[3].trim();
      i++;

      // Collect pipe rows until blank line or non-pipe line
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const rowLine = lines[i].trim();
        // Skip separator rows like |---|---|
        if (/^\|[\s\-|:]+\|$/.test(rowLine)) { i++; continue; }
        const cells = rowLine.replace(/^\|/, '').replace(/\|$/, '')
          .split('|').map(c => c.trim());
        if (cells.some(c => c !== '')) rows.push(cells);
        i++;
      }

      blocks.push({
        type: wide ? 'wide_table' : 'table',
        anchor,
        caption,
        rows,
        header_row: rows.length > 0,
      } as TableBlock);
      afterHeading = false;
      continue;
    }

    // ── Equation ──────────────────────────────────────────────────────────────
    if (line.trimStart().startsWith('$$')) {
      eqNum++;
      const result = parseEquation(lines, i, eqNum);
      blocks.push(result.block);
      i = result.nextIndex;
      afterHeading = false;
      continue;
    }

    // ── Bullet list ───────────────────────────────────────────────────────────
    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) {
        items.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push({ type: 'list', style: 'bullet', items } as ListBlock);
      afterHeading = false;
      continue;
    }

    // ── Numbered list ─────────────────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'list', style: 'numbered', items } as ListBlock);
      afterHeading = false;
      continue;
    }

    // ── Paragraph ─────────────────────────────────────────────────────────────
    const textLines: string[] = [];
    while (i < lines.length) {
      const cur = lines[i];
      if (/^\s*$/.test(cur)) break;
      // Stop at block-level elements
      if (
        /^#{1,3}\s/.test(cur) ||
        /^\[(WIDE-)?(?:FIG|TABLE)/.test(cur) ||
        cur.trimStart().startsWith('$$') ||
        /^- /.test(cur) ||
        /^\d+\.\s/.test(cur)
      ) break;
      textLines.push(cur.trim());
      i++;
    }
    if (textLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: textLines.join(' '),
        indent: afterHeading,
      } as ParagraphBlock);
      afterHeading = false;
    }
  }

  return blocks;
}

// ── Public entry point ────────────────────────────────────────────────────────

export function parseMarkdown(markdown: string): DocumentModel {
  // 1. Strip YAML front matter
  const fmMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  let fm: Record<string, any> = {};
  let body = markdown;
  if (fmMatch) {
    try { fm = (yaml.load(fmMatch[1]) as Record<string, any>) ?? {}; } catch { /* ignore */ }
    body = markdown.slice(fmMatch[0].length);
  }

  // 2. Extract fenced blocks (:::tag ... :::)
  let authors: Author[] = [];
  let affiliations: Affiliation[] = [];
  let references: Reference[] = [];

  body = body.replace(/:::authors\r?\n([\s\S]*?):::/g, (_, c) => {
    authors = parseAuthors(c.trim());
    return '';
  });
  body = body.replace(/:::affiliations\r?\n([\s\S]*?):::/g, (_, c) => {
    affiliations = parseAffiliations(c.trim());
    return '';
  });
  body = body.replace(/:::references\r?\n([\s\S]*?):::/g, (_, c) => {
    references = parseReferences(c.trim());
    return '';
  });

  // 3. Parse content blocks
  const blocks = parseBlocks(body.trim());

  // 4. Assemble DocumentModel
  const keywords: string[] = Array.isArray(fm.keywords)
    ? fm.keywords
    : typeof fm.keywords === 'string'
      ? fm.keywords.split(',').map((s: string) => s.trim())
      : [];

  const metadata: DocumentMetadata = {
    title: String(fm.title ?? 'Untitled'),
    authors,
    affiliations,
    abstract: String(fm.abstract ?? '').trim(),
    keywords,
    conference: fm.conference ? String(fm.conference) : undefined,
  };

  const compileOptions: CompileOptions = {
    math_backend: 'matplotlib',
    page_size: fm.page_size === 'letter' ? 'letter' : 'a4',
  };

  return {
    schema_version: '1.0',
    metadata,
    blocks,
    references: references.length > 0 ? references : undefined,
    compile_options: compileOptions,
  };
}
