'use client';

import type { PaperForm, AuthorEntry, AffiliationEntry } from '@/types/paper-form';
import { uid } from '@/types/paper-form';

interface Props {
  form: PaperForm;
  onChange: (patch: Partial<PaperForm>) => void;
}

const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-colors bg-white';
const smallInput = 'flex-1 min-w-0 px-2 py-1.5 rounded-md border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors bg-white';
const label = 'block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1';

function updateItem<T extends { id: string }>(list: T[], id: string, patch: Partial<T>): T[] {
  return list.map(item => item.id === id ? { ...item, ...patch } : item);
}

export default function AuthorForm({ form, onChange }: Props) {
  const { authors, affiliations } = form;

  // ── Authors ───────────────────────────────────────────────────────────────

  const addAuthor = () => {
    const first = affiliations[0];
    onChange({
      authors: [...authors, {
        id: uid(),
        name: '',
        email: '',
        affiliationKeys: first ? [first.id] : [],
      }],
    });
  };

  const removeAuthor = (id: string) =>
    onChange({ authors: authors.filter(a => a.id !== id) });

  const updateAuthor = (id: string, patch: Partial<AuthorEntry>) =>
    onChange({ authors: updateItem(authors, id, patch) });

  const toggleAffiliation = (author: AuthorEntry, affId: string) => {
    const keys = author.affiliationKeys.includes(affId)
      ? author.affiliationKeys.filter(k => k !== affId)
      : [...author.affiliationKeys, affId];
    updateAuthor(author.id, { affiliationKeys: keys });
  };

  // ── Affiliations ──────────────────────────────────────────────────────────

  const addAffiliation = () => {
    const nextId = String(affiliations.length + 1);
    onChange({
      affiliations: [...affiliations, { id: nextId, institution: '', department: '', city: '', country: '' }],
    });
  };

  const removeAffiliation = (id: string) =>
    onChange({ affiliations: affiliations.filter(a => a.id !== id) });

  const updateAffiliation = (id: string, patch: Partial<AffiliationEntry>) =>
    onChange({ affiliations: updateItem(affiliations, id, patch) });

  return (
    <div className="space-y-6 px-1">

      {/* Authors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={label}>Authors</span>
          <button
            onClick={addAuthor}
            className="text-[11px] text-blue-500 hover:text-blue-700 font-medium"
          >
            + Add Author
          </button>
        </div>

        <div className="space-y-3">
          {authors.map((author, idx) => (
            <div key={author.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 w-4">{idx + 1}</span>
                <input
                  className={smallInput}
                  placeholder="Full name"
                  value={author.name}
                  onChange={e => updateAuthor(author.id, { name: e.target.value })}
                />
                {authors.length > 1 && (
                  <button
                    onClick={() => removeAuthor(author.id)}
                    className="text-gray-300 hover:text-red-400 text-sm px-1"
                    title="Remove author"
                  >
                    ✕
                  </button>
                )}
              </div>

              <input
                className={`${smallInput} ml-6`}
                placeholder="email@university.edu (optional)"
                value={author.email}
                onChange={e => updateAuthor(author.id, { email: e.target.value })}
              />

              {affiliations.length > 0 && (
                <div className="ml-6 flex flex-wrap gap-2">
                  {affiliations.map(aff => (
                    <label key={aff.id} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={author.affiliationKeys.includes(aff.id)}
                        onChange={() => toggleAffiliation(author, aff.id)}
                        className="w-3 h-3 rounded"
                      />
                      <span className="text-[11px] text-gray-500">
                        {aff.institution || `Affiliation ${aff.id}`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Affiliations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={label}>Affiliations / Institutions</span>
          <button
            onClick={addAffiliation}
            className="text-[11px] text-blue-500 hover:text-blue-700 font-medium"
          >
            + Add Affiliation
          </button>
        </div>

        <div className="space-y-3">
          {affiliations.map((aff, idx) => (
            <div key={aff.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 w-4">{idx + 1}</span>
                <input
                  className={smallInput}
                  placeholder="University or Company name *"
                  value={aff.institution}
                  onChange={e => updateAffiliation(aff.id, { institution: e.target.value })}
                />
                {affiliations.length > 1 && (
                  <button
                    onClick={() => removeAffiliation(aff.id)}
                    className="text-gray-300 hover:text-red-400 text-sm px-1"
                    title="Remove"
                  >
                    ✕
                  </button>
                )}
              </div>
              <input
                className={`${smallInput} ml-6`}
                placeholder="Department (optional)"
                value={aff.department}
                onChange={e => updateAffiliation(aff.id, { department: e.target.value })}
              />
              <div className="ml-6 flex gap-2">
                <input
                  className={smallInput}
                  placeholder="City"
                  value={aff.city}
                  onChange={e => updateAffiliation(aff.id, { city: e.target.value })}
                />
                <input
                  className={smallInput}
                  placeholder="Country"
                  value={aff.country}
                  onChange={e => updateAffiliation(aff.id, { country: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
