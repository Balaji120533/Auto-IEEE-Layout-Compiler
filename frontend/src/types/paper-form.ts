export interface AuthorEntry {
  id: string;
  name: string;
  email: string;
  affiliationKeys: string[];   // references to AffiliationEntry.id
}

export interface AffiliationEntry {
  id: string;                  // internal UI key (e.g. "1", "2")
  institution: string;
  department: string;
  city: string;
  country: string;
}

// A content item inside a section
export type ContentItem =
  | { id: string; kind: 'paragraph'; text: string }
  | { id: string; kind: 'figure';    imageRef: string; filename: string; caption: string; wide: boolean }
  | { id: string; kind: 'equation';  latex: string }
  | { id: string; kind: 'list';      style: 'bullet' | 'numbered'; items: string[] }
  | { id: string; kind: 'subsection'; level: 2 | 3; text: string };

export interface SectionEntry {
  id: string;
  heading: string;
  content: ContentItem[];
}

export interface ReferenceEntry {
  id: string;
  authors: string;    // comma-separated: "A. Smith, B. Jones"
  title: string;
  venue: string;
  year: string;
  doi: string;
  url: string;
}

export interface PaperForm {
  title: string;
  conference: string;
  abstract: string;
  keywords: string;           // comma-separated, split on save
  authors: AuthorEntry[];
  affiliations: AffiliationEntry[];
  sections: SectionEntry[];
  references: ReferenceEntry[];
}

export function emptyForm(): PaperForm {
  const aff1: AffiliationEntry = { id: '1', institution: '', department: '', city: '', country: '' };
  const author1: AuthorEntry   = { id: uid(), name: '', email: '', affiliationKeys: ['1'] };
  const section1: SectionEntry = { id: uid(), heading: 'Introduction', content: [{ id: uid(), kind: 'paragraph', text: '' }] };
  return {
    title: '', conference: '', abstract: '', keywords: '',
    authors: [author1],
    affiliations: [aff1],
    sections: [section1],
    references: [],
  };
}

export function uid(): string {
  // Works in browser (crypto.randomUUID) and Node (randomUUID from crypto)
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
