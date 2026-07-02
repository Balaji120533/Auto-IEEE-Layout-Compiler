'use client';

import type { PaperForm, ReferenceEntry } from '@/types/paper-form';
import { uid } from '@/types/paper-form';

interface Props {
  form: PaperForm;
  onChange: (patch: Partial<PaperForm>) => void;
}

const si = 'w-full px-2 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 bg-white';

function updateRef(refs: ReferenceEntry[], id: string, patch: Partial<ReferenceEntry>): ReferenceEntry[] {
  return refs.map(r => r.id === id ? { ...r, ...patch } : r);
}

export default function ReferenceForm({ form, onChange }: Props) {
  const refs = form.references;

  const addRef = () =>
    onChange({ references: [...refs, { id: uid(), authors: '', title: '', venue: '', year: String(new Date().getFullYear()), doi: '', url: '' }] });

  const removeRef = (id: string) =>
    onChange({ references: refs.filter(r => r.id !== id) });

  const update = (id: string, patch: Partial<ReferenceEntry>) =>
    onChange({ references: updateRef(refs, id, patch) });

  return (
    <div className="space-y-4 px-1">
      {refs.length === 0 && (
        <p className="text-xs text-gray-400 italic text-center py-4">
          No references yet. Click below to add.
        </p>
      )}

      {refs.map((ref, idx) => (
        <div key={ref.id} className="border border-gray-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400">[{idx + 1}]</span>
            <span className="flex-1 text-[11px] text-gray-500 truncate">
              {ref.title || 'New reference'}
            </span>
            <button type="button" onClick={() => removeRef(ref.id)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>
          </div>

          <input
            className={si}
            placeholder="Title of the paper / book *"
            value={ref.title}
            onChange={e => update(ref.id, { title: e.target.value })}
          />
          <input
            className={si}
            placeholder="Authors: A. Smith, B. Jones, C. Wang"
            value={ref.authors}
            onChange={e => update(ref.id, { authors: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              className={si}
              placeholder="Journal / Conference name"
              value={ref.venue}
              onChange={e => update(ref.id, { venue: e.target.value })}
            />
            <input
              className="w-20 px-2 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-gray-400 bg-white"
              placeholder="Year"
              type="number"
              min={1900}
              max={2099}
              value={ref.year}
              onChange={e => update(ref.id, { year: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <input
              className={si}
              placeholder="DOI: 10.xxxx/yyy (optional)"
              value={ref.doi}
              onChange={e => update(ref.id, { doi: e.target.value })}
            />
            <input
              className={si}
              placeholder="URL (optional)"
              value={ref.url}
              onChange={e => update(ref.id, { url: e.target.value })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRef}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
      >
        + Add Reference
      </button>
    </div>
  );
}
