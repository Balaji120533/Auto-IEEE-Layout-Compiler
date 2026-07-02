/**
 * Gateway → Engine data contract.
 *
 * This file is the TypeScript source of truth.
 * Any change here MUST be reflected in document_model.py.
 * Both are validated against document_model.schema.json in CI.
 */

export const SCHEMA_VERSION = '1.0' as const;

// ── Metadata ──────────────────────────────────────────────────────────────────

export interface Author {
  name: string;
  affiliation_refs: string[];   // keys into DocumentMetadata.affiliations
  email?: string;
}

export interface Affiliation {
  key: string;                  // e.g. "1", "2" — matched by Author.affiliation_refs
  institution: string;
  department?: string;
  city?: string;
  country?: string;
}

export interface Reference {
  key: string;                  // citation label, e.g. "1"
  authors: string[];
  title: string;
  venue?: string;               // journal or conference name
  year: number;
  volume?: string;
  issue?: string;
  pages?: string;               // e.g. "123–130"
  doi?: string;
  url?: string;
}

// ── Block types ───────────────────────────────────────────────────────────────

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;                 // may contain inline [EQ n] refs
  indent: boolean;
}

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
  numbering?: string;           // e.g. "II", "II.A" — resolved by the gateway, not the engine
}

export interface FigureBlock {
  type: 'figure' | 'wide_figure';
  anchor: string;               // e.g. "FIG 1"
  image_ref: string;            // path relative to gateway/storage/
  caption: string;
}

export interface TableBlock {
  type: 'table' | 'wide_table';
  anchor: string;               // e.g. "TABLE 1"
  caption: string;
  rows: string[][];             // rows[row][col] — plain cell text
  header_row: boolean;
}

export interface EquationBlock {
  type: 'equation';
  anchor: string;               // e.g. "EQ 1"
  latex: string;                // passed verbatim to the math backend
  inline: boolean;
}

export interface ListBlock {
  type: 'list';
  style: 'bullet' | 'numbered';
  items: string[];
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | FigureBlock
  | TableBlock
  | EquationBlock
  | ListBlock;

// ── Compile options ───────────────────────────────────────────────────────────

export interface CompileOptions {
  math_backend: 'matplotlib' | 'katex' | 'omml';   // v1 default: matplotlib
  page_size: 'letter' | 'a4';
  column_sep_pt?: number;                           // column gutter in points; defaults to IEEE spec
}

// ── Root ──────────────────────────────────────────────────────────────────────

export interface DocumentMetadata {
  title: string;
  authors: Author[];
  affiliations: Affiliation[];
  abstract: string;
  keywords: string[];
  conference?: string;          // e.g. "IEEE ICASSP 2025"
}

export interface DocumentModel {
  schema_version: typeof SCHEMA_VERSION;
  metadata: DocumentMetadata;
  blocks: Block[];
  references?: Reference[];
  compile_options: CompileOptions;
}
