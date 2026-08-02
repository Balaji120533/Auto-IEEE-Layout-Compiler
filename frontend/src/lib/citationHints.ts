// Detects bracketed text that looks like an attempt at a citation but will not
// be recognised by the compiler. The engine (docx_builder.py) and the preview
// (parsePreview.ts) both match only /\[\s*CITE\s+(\d+)\s*\]/i — anything else
// is emitted into the document verbatim, which is silent and easy to miss.
//
// Kept deliberately narrow: only flag input that is unambiguously a malformed
// citation. Bracketed prose ("[see appendix]") and correct citations must not
// produce hints, or the warning becomes noise and gets ignored.

/** The one form the compiler accepts. */
const VALID_RE = /^\[\s*CITE\s+\d+\s*\]$/i;

/**
 * Near-misses, in the order we test them:
 *   [CITE1] [cite1]     — no space
 *   [CIT 1] [CT1]       — CITE misspelled or truncated
 *   [CITE]              — no number
 *   [1] [ 12 ]          — bare number, not linked to the reference list
 */
const CANDIDATE_RE = /\[\s*(?:c\s*i?\s*t?\s*e?\s*)?\d*\s*\]/gi;

export interface CitationHint {
  /** The exact text found, e.g. "[CIT1]". */
  found: string;
  /** What the user most likely meant, e.g. "[CITE 1]". Null when unguessable. */
  suggestion: string | null;
  /** Short reason, phrased for direct display. */
  reason: string;
}

/**
 * Returns one hint per distinct malformed citation in `text`.
 * Correct citations and non-citation brackets yield nothing.
 *
 * `refCount` gates the bare-number case only. "[1]" is ambiguous — it may be a
 * citation typed by hand, or ordinary notation like a matrix index — so it is
 * flagged only when a reference with that number actually exists. Misspellings
 * of CITE are unambiguous and always flagged.
 */
export function findCitationHints(text: string, refCount = 0): CitationHint[] {
  if (!text) return [];

  const hints: CitationHint[] = [];
  const seen = new Set<string>();

  // exec-loop rather than matchAll: the project's TS target predates
  // downlevel iteration of RegExp match iterators.
  CANDIDATE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CANDIDATE_RE.exec(text)) !== null) {
    const found = match[0];
    // Defensive: a zero-length match would never advance lastIndex.
    if (found.length === 0) { CANDIDATE_RE.lastIndex++; continue; }
    if (VALID_RE.test(found)) continue;
    if (seen.has(found.toLowerCase())) continue;

    const inner = found.slice(1, -1).trim();
    const digits = inner.match(/\d+/)?.[0] ?? null;
    const letters = inner.replace(/[\d\s]/g, '').toLowerCase();

    // Bare "[]" or stray brackets with neither letters nor digits.
    if (!digits && !letters) continue;

    let reason: string;
    if (!letters) {
      // "[1]" — a plain number. Only a likely citation if it points at a real
      // reference; otherwise it is probably notation and must be left alone.
      const n = Number(digits);
      if (!(n >= 1 && n <= refCount)) continue;
      reason = 'Plain numbers are not linked to your reference list';
    } else if (letters === 'cite') {
      // Letters are right, so the fault is spacing or a missing number.
      if (!digits) {
        hints.push({ found, suggestion: null, reason: 'Missing the reference number' });
        seen.add(found.toLowerCase());
        continue;
      }
      reason = 'Needs a space before the number';
    } else {
      // "cit", "ct", "cte" … — a misspelling of CITE.
      reason = 'Should be spelled CITE';
    }

    hints.push({
      found,
      suggestion: digits ? `[CITE ${digits}]` : null,
      reason,
    });
    seen.add(found.toLowerCase());
  }

  return hints;
}
