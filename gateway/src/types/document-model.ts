/**
 * Gateway-side copy of the shared DocumentModel types.
 * Source of truth: /shared/schema/document_model.ts
 * Keep in sync manually (or via codegen in Milestone 6).
 */

export const SCHEMA_VERSION = '1.0' as const;

export interface Author {
  name: string;
  affiliation_refs: string[];
  email?: string;
}

export interface Affiliation {
  key: string;
  institution: string;
  department?: string;
  city?: string;
  country?: string;
}

export interface Reference {
  key: string;
  authors: string[];
  title: string;
  venue?: string;
  year: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
  indent: boolean;
}

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
  numbering?: string;
}

export interface FigureBlock {
  type: 'figure' | 'wide_figure';
  anchor: string;
  image_ref: string;
  caption: string;
}

export interface TableBlock {
  type: 'table' | 'wide_table';
  anchor: string;
  caption: string;
  rows: string[][];
  header_row: boolean;
  center?: boolean;
}

export interface EquationBlock {
  type: 'equation';
  anchor: string;
  latex: string;
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

export interface CompileOptions {
  math_backend: 'matplotlib' | 'katex' | 'omml';
  page_size: 'letter' | 'a4';
  column_sep_pt?: number;
}

export interface DocumentMetadata {
  title: string;
  authors: Author[];
  affiliations: Affiliation[];
  abstract: string;
  keywords: string[];
  conference?: string;
}

export interface DocumentModel {
  schema_version: typeof SCHEMA_VERSION;
  metadata: DocumentMetadata;
  blocks: Block[];
  references?: Reference[];
  compile_options: CompileOptions;
}
